// Site invités.
// - Mode normal : le contenu publié est lu dans Supabase (js/store.js), puis affiché par render().
// - Mode aperçu (index.html?apercu=1, dans l'iframe de l'admin) : rien n'est lu ni envoyé ;
//   l'admin envoie son brouillon par postMessage à chaque modification et render() est rappelé.
(async function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const PREVIEW = /[?&]apercu=1/.test(location.search);

  let C = null;          // contenu affiché (publié, ou brouillon en aperçu)
  let derived = {};      // valeurs calculées (dates formatées)
  let invite = null;     // invité du lien personnel (?invite=…)
  let countdownTimer = null;

  // =====================================================================
  // Mise en place unique (indépendante du contenu)
  // =====================================================================

  // ---------- Menu ----------
  const burger = $('.burger'), menu = $('.menu');
  // Apparition : le voile arrive, puis les liens montent un à un, puis la date.
  // Disparition : les liens repartent vers le haut (cascade inversée), puis le voile s'efface et le menu est retiré.
  const menuLinks = $$('a', menu);
  let menuTimer;
  function toggleMenu(open) {
    if (open === menu.classList.contains('open')) return;
    clearTimeout(menuTimer);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    const shown = menuLinks.filter(a => !a.closest('[hidden]')); // liens des sections affichées
    if (open) {
      menu.classList.remove('closing');
      menu.classList.add('is-visible');
      shown.forEach((a, i) => { a.style.transitionDelay = `${.15 + i * .06}s`; });
      void menu.offsetWidth; // le menu est affiché avant de lancer l'animation
      menu.classList.add('open');
      // Entrée terminée : on retire les délais pour que le survol des liens reste immédiat
      menuTimer = setTimeout(() => shown.forEach(a => { a.style.transitionDelay = ''; }), 1400);
    } else {
      shown.forEach((a, i) => { a.style.transitionDelay = `${(shown.length - 1 - i) * .05}s`; });
      menu.classList.add('closing');
      menu.classList.remove('open');
      // Retiré une fois le voile effacé (liens ≈ 1,1 s, voile 0,8 s + 0,7 s)
      menuTimer = setTimeout(() => menu.classList.remove('is-visible', 'closing'), reduce ? 0 : 1600);
    }
  }
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  menuLinks.forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  // ---------- Visionneuse ----------
  const lb = $('.lightbox');
  $('.gallery').addEventListener('click', e => {
    const img = e.target.closest('button')?.querySelector('img');
    if (!img) return;
    $('img', lb).src = img.src;
    $('img', lb).classList.toggle('nb', img.classList.contains('nb')); // la visionneuse respecte le noir et blanc
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  });
  const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
  lb.addEventListener('click', e => { if (e.target !== $('img', lb)) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLb(); toggleMenu(false); } });

  // ---------- Défilement doux vers les ancres (#rsvp, #programme…) ----------
  // Plus lent et plus souple que le défilement natif : accélération et décélération douces,
  // durée proportionnelle à la distance. Un geste de l'utilisateur (molette, doigt, clavier) l'interrompt.
  const easeInOutCubic = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let scrollAnim = null;
  const stopScroll = () => { if (scrollAnim) cancelAnimationFrame(scrollAnim); scrollAnim = null; };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, stopScroll, { passive: true }));

  function smoothScrollTo(target, maxDuration = 2200) {
    stopScroll();
    const from = scrollY;
    const to = Math.min(target.getBoundingClientRect().top + from, document.documentElement.scrollHeight - innerHeight);
    const dist = to - from;
    if (Math.abs(dist) < 2) return;
    const duration = Math.min(maxDuration, 900 + Math.abs(dist) * .25); // 0,9 s à 2,2 s
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      scrollTo(0, from + dist * easeInOutCubic(t));
      scrollAnim = t < 1 ? requestAnimationFrame(step) : null;
    };
    scrollAnim = requestAnimationFrame(step);
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (!PREVIEW) history.pushState(null, '', `#${id}`);
    if (reduce) target.scrollIntoView();
    else requestAnimationFrame(() => smoothScrollTo(target)); // laisse le menu se fermer avant de partir
  });

  // ---------- Défilement : en-tête, bouton flottant, parallax ----------
  const topbar = $('.topbar'), toTopBtn = $('.to-top'), hero = $('.hero');
  const parallax = $$('.parallax');
  const toTopDark = $('.to-top-dark');
  const lightSections = $$('section.ivory');                                           // fonds clairs en mode sombre
  const lightSectionsLightMode = $$('main > section:not(.hero):not(.fullbleed), .marquee'); // fonds clairs en mode clair
  // Une seule mise à jour par image affichée (le scroll peut déclencher des dizaines d'événements par image)
  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const sy = scrollY;
      topbar.classList.toggle('scrolled', sy > 40);
      // Retour en haut : visible dès qu'on a quitté l'accueil
      toTopBtn.classList.toggle('show', sy > hero.offsetHeight * .8);
      // Partie du bouton au-dessus d'un fond clair → jumeau noir visible sur cette bande seulement.
      // Fonds clairs : sections ivoire, et en mode clair toutes les sections sauf les photos plein écran.
      const b = toTopBtn.getBoundingClientRect();
      const zones = root.dataset.mode === 'light' ? lightSectionsLightMode : lightSections;
      let top = Infinity, bottom = -Infinity; // union des zones claires sous le bouton (souvent contiguës)
      for (const s of zones) {
        const r = s.getBoundingClientRect();
        const t = Math.max(r.top, b.top), bo = Math.min(r.bottom, b.bottom);
        if (bo > t) { top = Math.min(top, t); bottom = Math.max(bottom, bo); }
      }
      toTopDark.style.clipPath = bottom > top ? `inset(${top - b.top}px 0 ${b.bottom - bottom}px 0)` : 'inset(0 0 100% 0)';
      if (!reduce) parallax.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -0.12}px, 0)`;
      });
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true }); // rotation du téléphone : bouton recalculé

  // ---------- Apparitions au défilement ----------
  // Chaque élément reçoit un mouvement selon sa nature (voir « Apparitions » dans site.css)
  const motionOf = el =>
    el.matches('.title, .display, .names') ? 'rv-title' :
    el.matches('.frame, .gallery button') ? 'rv-img' :
    el.matches('.ornament, .flourish') ? 'rv-line' :
    el.matches('.swatches span') ? 'rv-pop' : '';
  // Le délai ne sert qu'à l'entrée : on le retire ensuite pour ne pas ralentir les survols
  const reveal = (el, delay) => {
    el.style.transitionDelay = `${delay}s`;
    el.classList.add('in');
    setTimeout(() => { el.style.transitionDelay = ''; }, (delay + 2.4) * 1000);
  };
  // Les éléments qui entrent ensemble à l'écran apparaissent en cascade (label → titre → texte, photos une à une)
  const io = new IntersectionObserver(entries => {
    let k = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      reveal(e.target, Math.min(k++, 6) * .14);
      io.unobserve(e.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -8% 0px' });
  // Observe les éléments pas encore apparus (appelé après chaque rendu : de nouveaux éléments peuvent arriver)
  let heroIndex = 0;
  function watchReveals() {
    $$('.reveal:not(.in):not([data-rv])').forEach(el => {
      el.dataset.rv = '1';
      const m = motionOf(el);
      if (m) el.classList.add(m);
      if (PREVIEW) return el.classList.add('in'); // aperçu : tout est visible tout de suite
      if (!el.closest('.hero')) return io.observe(el);
      const i = heroIndex++;
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(el, .2 + i * .12)));
    });
  }

  // ---------- Ajouter au calendrier (.ics) ----------
  $('[data-ics]').addEventListener('click', () => {
    if (!C) return;
    const [y, m, d] = (C.hero.date || '').split('-').map(Number);
    if (!y) return;
    const pad = n => String(n).padStart(2, '0');
    const ymd = `${y}${pad(m)}${pad(d)}`;
    const [hh, mm] = (C.hero.heure || '').split(':');
    const start = C.hero.heure ? `DTSTART:${ymd}T${hh}${mm}00` : `DTSTART;VALUE=DATE:${ymd}`;
    const endDate = new Date(y, m - 1, d + 1);
    const end = C.hero.heure ? `DTEND:${ymd}T235900` : `DTEND;VALUE=DATE:${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MB Design//Mariage//FR', 'BEGIN:VEVENT',
      `UID:${ymd}-${Date.now()}@mariage`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      start, end, `SUMMARY:Mariage de ${C.couple.prenom1} & ${C.couple.prenom2}`, `LOCATION:${C.hero.lieu}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `mariage-${C.couple.prenom1}-${C.couple.prenom2}.ics`.toLowerCase();
    a.click();
  });

  // =====================================================================
  // Rendu (rappelé à chaque modification dans l'aperçu)
  // =====================================================================
  const value = path => (path in derived ? derived[path] : get(C, path));

  function render(content) {
    C = content;
    const [y, m, d] = (C.hero.date || '').split('-').map(Number);
    derived = {
      datePoints: y ? `${String(d).padStart(2, '0')} · ${String(m).padStart(2, '0')} · ${y}` : '',
      dateLongue: y ? `${d} ${MOIS[m - 1]} ${y}` : '',
    };
    document.title = `${C.couple.prenom1} & ${C.couple.prenom2}${derived.dateLongue ? ` — ${derived.dateLongue}` : ''}`;

    // ---------- Apparence : thème et mode choisis par le couple ----------
    const app = MBTheme.normalize(C.apparence);
    MBTheme.apply({ theme: app.theme, mode: MBTheme.resolveMode(app, 'site') }, { fade: PREVIEW });
    if (!PREVIEW) MBTheme.remember(app);

    // ---------- Textes et photos ----------
    const nbPhotos = new Set(C.photos?.nb || []);      // noir et blanc photo par photo (admin : bouton ◐)
    const focus = C.photos?.focus || {};               // point focal par photo (« 50% 30% »)
    const photo = (el, url) => {
      el.classList.toggle('nb', nbPhotos.has(url));
      if (focus[url]) el.style.setProperty('--focus', focus[url]); else el.style.removeProperty('--focus');
    };
    $$('[data-c]').forEach(el => { el.textContent = value(el.dataset.c) ?? ''; });
    $$('[data-src]').forEach(el => { const v = value(el.dataset.src); if (v) { if (el.getAttribute('src') !== v) el.src = v; photo(el, v); } });
    $$('[data-bg]').forEach(el => { const v = value(el.dataset.bg); if (v) { el.style.backgroundImage = `url("${v}")`; photo(el, v); } });
    $('.hero-veil').style.setProperty('--veil', C.hero.assombrissement ?? .6);
    root.classList.toggle('photos-nb', !!C.photos?.noirEtBlanc); // toutes les photos en noir et blanc
    // Mémorise la photo d'accueil : à la prochaine visite, index.html la précharge avant même d'avoir le contenu
    if (!PREVIEW) try { if (C.hero.fond && !/^(data|blob):/.test(C.hero.fond)) localStorage.setItem('mariage.heroFond', C.hero.fond); } catch {}

    // ---------- Identité : monogramme, sceau, favicon ----------
    const [i1, i2] = (C.couple.initiales || '').split('|').map(s => s.trim());
    const pair = i2 !== undefined;
    $$('[data-mono]').forEach(el => {
      el.innerHTML = `<span class="mono">${pair ? `${esc(i1)}<i aria-hidden="true"></i>${esc(i2)}` : esc(C.couple.initiales)}</span>`;
    });
    // Logo du footer : initiales croisées par un filet doré, posées sur le cercle de verre
    const seal = $('[data-seal]');
    if (seal) {
      const center = pair
        ? `<text class="initial" x="112" y="150" text-anchor="middle">${esc(i1)}</text>
           <line class="rule" x1="118" y1="212" x2="182" y2="88"/>
           <text class="initial" x="189" y="210" text-anchor="middle">${esc(i2)}</text>`
        : `<text class="initial" x="150" y="180" text-anchor="middle">${esc(C.couple.initiales)}</text>`;
      seal.innerHTML = `<svg class="seal" viewBox="0 0 300 300" role="img" aria-label="${esc(`${C.couple.prenom1} & ${C.couple.prenom2}`)}">${center}</svg>`;
    }
    MariageStore.setFavicon(C.couple.initiales); // favicon aux initiales (même fonction que l'admin)

    // ---------- Sections activées dans l'admin ----------
    $$('[data-section]').forEach(el => el.classList.toggle('is-off', !(C[el.dataset.section] || {}).active));
    $$('[data-section-link]').forEach(el => { el.hidden = !(C[el.dataset.sectionLink] || {}).active; });
    $$('[data-rsvp-link]').forEach(el => { el.hidden = !C.rsvp.active; });

    // ---------- Bandeau défilant ----------
    const item = `<span>${esc(C.couple.prenom1)} <em>&amp;</em> ${esc(C.couple.prenom2)}</span><span class="dot"></span><span class="date">${esc(derived.datePoints)}</span><span class="dot"></span>`;
    const track = $('.marquee-track');
    if (track.dataset.item !== item) {
      track.dataset.item = item;
      track.innerHTML = item.repeat(8);
      // Démarrage une fois le texte en place et la police chargée : la distance (-50 %) est alors la bonne,
      // et la durée suit la longueur des prénoms pour garder une vitesse constante (≈ 40 px/s)
      const startMarquee = () => {
        track.classList.remove('is-on');
        track.style.setProperty('--marquee-dur', `${Math.max(20, track.scrollWidth / 2 / 40)}s`);
        void track.offsetWidth; // relance propre de l'animation
        track.classList.add('is-on');
      };
      requestAnimationFrame(startMarquee);
      if (document.fonts) document.fonts.ready.then(startMarquee);
    }

    // ---------- Programme ----------
    $('.timeline').innerHTML = (C.programme.items || []).map(it => `
      <li class="reveal"><time>${esc(it.heure)}</time><div><h3>${esc(it.titre)}</h3><p>${esc(it.description)}</p></div></li>`).join('');

    // ---------- Lieux ----------
    $('.places').innerHTML = (C.lieux.items || []).map(it => `
      <article class="place reveal">
        <p class="label">${esc(it.type)}</p>
        <h3>${esc(it.nom)}</h3>
        <address>${esc(it.adresse)}</address>
        ${it.info ? `<p class="info">${esc(it.info)}</p>` : ''}
        <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.nom + ' ' + it.adresse)}">Itinéraire</a>
      </article>`).join('');

    // ---------- Dress code ----------
    $('.swatches').innerHTML = (C.dressCode.couleurs || []).map(c => `<span class="reveal" style="background:${esc(c)}" title="${esc(c)}"></span>`).join('');
    $('.swatches').classList.remove('reveal'); // ce sont les pastilles qui apparaissent une à une

    // ---------- Galerie ----------
    $('.gallery').innerHTML = (C.galerie.photos || []).map(src =>
      `<button type="button" class="reveal"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"${nbPhotos.has(src) ? ' class="nb"' : ''}${focus[src] ? ` style="--focus:${esc(focus[src])}"` : ''}></button>`).join('');

    renderCountdown(y);
    renderRsvp();
    watchReveals();
    onScroll();
  }

  // ---------- Compte à rebours ----------
  function renderCountdown(y) {
    clearInterval(countdownTimer);
    const cd = $('.countdown');
    cd.innerHTML = '';
    if (!C.hero.compteARebours || !y) return;
    const withTime = !!C.hero.heure;
    const target = new Date(`${C.hero.date}T${withTime ? C.hero.heure : '00:00'}:00`);
    const dayEnd = new Date(`${C.hero.date}T23:59:59`);
    const unit = (n, l) => `<div class="unit"><b>${n}</b><small>${l}</small></div>`;
    const tick = () => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        cd.innerHTML = `<p class="msg">${now <= dayEnd ? 'C’est aujourd’hui !' : 'Merci d’avoir partagé ce jour avec nous'}</p>`;
        return false;
      }
      const s = Math.floor(diff / 1000);
      const days = Math.floor(s / 86400);
      if (!withTime) {
        cd.innerHTML = unit(days + 1, days + 1 > 1 ? 'Jours' : 'Jour');
        return true;
      }
      const p = n => String(n).padStart(2, '0');
      cd.innerHTML = [
        unit(days, days > 1 ? 'Jours' : 'Jour'), '<span class="sep"></span>',
        unit(p(Math.floor(s % 86400 / 3600)), 'Heures'), '<span class="sep"></span>',
        unit(p(Math.floor(s % 3600 / 60)), 'Minutes'), '<span class="sep"></span>',
        unit(p(s % 60), 'Secondes'),
      ].join('');
      return true;
    };
    if (tick()) countdownTimer = setInterval(() => { if (!tick()) clearInterval(countdownTimer); }, 1000);
  }

  // ---------- RSVP ----------
  function renderRsvp() {
    const body = $('.rsvp-body');
    const R = C.rsvp;
    const max = invite ? invite.max_personnes : (R.maxParDefaut || 2);
    const closed = R.dateLimite && new Date() > new Date(R.dateLimite + 'T23:59:59');

    if (closed) {
      body.innerHTML = `<div class="rsvp-closed"><h3>Les réponses sont closes</h3><p>Pour toute question, contactez directement les mariés.</p></div>`;
      return;
    }
    const opts = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'personnes' : 'personne'}</option>`).join('');
    const moments = (R.moments || []).map(mo => `<label class="choice"><input type="checkbox" name="moments" value="${esc(mo)}" checked><span>${esc(mo)}</span></label>`).join('');
    // Questions personnalisées (admin > Formulaire RSVP) : texte libre ou liste déroulante
    const questions = (R.questions || []).map((q, i) => ({ ...q, i, options: (q.options || []).filter(o => String(o).trim()) }))
      .filter(q => String(q.question || '').trim() && (q.type !== 'liste' || q.options.length));
    const questionHtml = q => {
      const label = `<span>${esc(q.question)}</span>`; // comme les autres champs : pas de marque, le message d'erreur guide
      return q.type === 'liste'
        ? `<label class="field">${label}<select data-q="${q.i}"><option value="">Choisir…</option>${q.options.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>`
        : `<label class="field">${label}<input type="text" data-q="${q.i}" maxlength="500"></label>`;
    };
    const qPresents = questions.filter(q => !q.pourTous).map(questionHtml).join('');
    const qTous = questions.filter(q => q.pourTous).map(questionHtml).join('');
    body.innerHTML = `
      ${invite ? `<p class="hello">Chère, cher <em>${esc(invite.nom)}</em></p>` : ''}
      <form class="form" novalidate>
        <label class="field"><span>Nom et prénom</span><input type="text" name="nom" required autocomplete="name" value="${esc(invite?.nom || '')}"></label>
        <fieldset class="field"><legend>Serez-vous présent·e ?</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="present" value="oui" required><span>Avec joie</span></label>
            <label class="choice"><input type="radio" name="present" value="non"><span>À regret</span></label>
          </div>
        </fieldset>
        <div class="attending fold is-closed" inert><div class="fold-in">
          <div class="cols">
            <label class="field"><span>Nombre de personnes (vous inclus)</span><select name="nb_personnes">${opts}</select></label>
            ${R.demanderEnfants ? `<label class="field"><span>Dont enfants</span><input type="number" name="enfants" min="0" max="${max}" value="0"></label>` : ''}
          </div>
          <div class="accomp fold is-closed" inert><div class="fold-in"><label class="field"><span>Prénoms des accompagnants</span><input type="text" name="accompagnants" placeholder="Ex. Marie, Paul"></label></div></div>
          ${moments ? `<fieldset class="field"><legend>Vous serez là pour</legend><div class="checks">${moments}</div></fieldset>` : ''}
          <label class="field"><span>Régime alimentaire / allergies</span><input type="text" name="regime" placeholder="Végétarien, sans gluten…"></label>
          ${R.demanderChanson ? `<label class="field"><span>Une chanson pour la piste de danse</span><input type="text" name="chanson" placeholder="Titre — artiste"></label>` : ''}
          ${qPresents}
        </div></div>
        ${qTous}
        <div class="cols">
          <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email"></label>
          <label class="field"><span>Téléphone</span><input type="tel" name="telephone" autocomplete="tel"></label>
        </div>
        <label class="field"><span>Un mot pour les mariés</span><textarea name="message" rows="3"></textarea></label>
        <p class="form-error" role="alert"></p>
        <button class="btn btn-solid" type="submit">Envoyer ma réponse</button>
        ${PREVIEW ? '<p class="preview-note">Aperçu : le formulaire n’envoie rien.</p>' : ''}
      </form>`;

    const form = $('form', body), att = $('.attending', form), err = $('.form-error', form);
    // Volet : le bloc s'ouvre / se referme en douceur (voir .fold dans site.css) ;
    // fermé, il est « inert » : ni clavier ni lecteur d'écran n'y entrent
    const fold = (el, open) => {
      if (open === !el.classList.contains('is-closed')) return;
      el.inert = !open;
      el.classList.remove('is-done');
      if (reduce) { el.classList.toggle('is-closed', !open); el.style.height = ''; if (open) el.classList.add('is-done'); return; }
      if (open) { el.classList.remove('is-closed'); el.style.height = '0px'; void el.offsetHeight; el.style.height = el.scrollHeight + 'px'; }
      else { el.style.height = el.scrollHeight + 'px'; void el.offsetHeight; el.classList.add('is-closed'); el.style.height = '0px'; }
    };
    // Une fois ouvert, le volet reprend une hauteur libre (son contenu peut encore changer : accompagnants…)
    $$('.fold', form).forEach(el => el.addEventListener('transitionend', e => {
      if (e.target !== el || e.propertyName !== 'height' || el.classList.contains('is-closed')) return;
      el.style.height = ''; el.classList.add('is-done');
    }));
    form.addEventListener('change', () => {
      fold(att, form.present.value === 'oui');
      fold($('.accomp', form), Number(form.nb_personnes.value) >= 2);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.textContent = '';
      if (PREVIEW) return (err.textContent = 'Aperçu : rien n’est envoyé.');
      if (form.nom.value.trim().length < 2) return (err.textContent = 'Merci d’indiquer votre nom.');
      if (!form.present.value) return (err.textContent = 'Merci de nous dire si vous serez présent·e.');
      const yes = form.present.value === 'oui';
      // Seules les questions visibles comptent (celles réservées aux présents sont masquées si « À regret »)
      const asked = questions.filter(q => yes || q.pourTous);
      const valueOf = q => $(`[data-q="${q.i}"]`, form).value.trim();
      const missing = asked.find(q => q.obligatoire && !valueOf(q));
      if (missing) return (err.textContent = `Merci de répondre à : « ${missing.question} »`);
      const payload = {
        invite_id: invite?.id || null,
        nom: form.nom.value.trim(),
        email: form.email.value.trim(),
        telephone: form.telephone.value.trim(),
        present: yes,
        nb_personnes: yes ? Number(form.nb_personnes.value) : 0,
        accompagnants: yes && form.accompagnants ? form.accompagnants.value.trim() : '',
        enfants: yes && form.enfants ? Number(form.enfants.value) || 0 : 0,
        regime: yes ? form.regime.value.trim() : '',
        moments: yes ? $$('input[name="moments"]:checked', form).map(i => i.value) : [],
        chanson: yes && form.chanson ? form.chanson.value.trim() : '',
        message: form.message.value.trim(),
        reponses: asked.map(q => ({ question: q.question.trim(), reponse: valueOf(q) })).filter(a => a.reponse),
      };
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.textContent = 'Envoi…';
      try {
        await MariageStore.submitRsvp(payload, C);
        body.innerHTML = yes
          ? `<div class="rsvp-done"><h3>Merci, à très bientôt !</h3><p>Votre réponse a bien été enregistrée. Nous avons hâte de célébrer avec vous.</p></div>`
          : `<div class="rsvp-done"><h3>Merci de nous avoir répondu</h3><p>Vous nous manquerez. Nous penserons à vous ce jour-là.</p></div>`;
        onScroll();
      } catch (ex) {
        err.textContent = ex.message || 'Une erreur est survenue, merci de réessayer.';
        btn.disabled = false; btn.textContent = 'Envoyer ma réponse';
      }
    });
  }

  // =====================================================================
  // Démarrage
  // =====================================================================
  if (PREVIEW) {
    // Aperçu : l'admin (même origine) envoie son brouillon ; la section en cours d'édition est amenée à l'écran
    const SECTIONS = { accueil: '#accueil', histoire: '#histoire', grandJour: '[data-section="grandJour"]', programme: '#programme',
      lieux: '#lieux', dressCode: '#dresscode', galerie: '#galerie', rsvp: '#rsvp', footer: '.footer' };
    let lastSection = null;
    addEventListener('message', e => {
      if (e.origin !== location.origin || e.data?.type !== 'mb:apercu') return;
      render(e.data.content);
      if (e.data.mode === 'dark' || e.data.mode === 'light') MBTheme.apply({ mode: e.data.mode }, { fade: true }); // mode choisi dans l'admin
      document.body.classList.remove('is-loading');
      if (e.data.section && e.data.section !== lastSection) {
        lastSection = e.data.section;
        const target = SECTIONS[e.data.section] && $(SECTIONS[e.data.section]);
        if (target) requestAnimationFrame(() => (reduce ? target.scrollIntoView() : smoothScrollTo(target, 900)));
      }
    });
    parent.postMessage({ type: 'mb:apercu-pret' }, location.origin === 'null' ? '*' : location.origin); // fichier local : pas d'origine
    return;
  }

  let content;
  try { content = await MariageStore.loadContent(); }
  catch (e) { console.error(e); content = window.MARIAGE_DEFAULT; }
  invite = await MariageStore.getInvite(new URLSearchParams(location.search).get('invite')).catch(() => null);
  render(content);

  document.body.classList.remove('is-loading');
  // Le contenu est injecté après le chargement : on rejoint l'ancre une fois la page construite
  const anchor = location.hash && document.getElementById(location.hash.slice(1));
  if (anchor) anchor.scrollIntoView({ behavior: 'instant' });
  onScroll();
})();
