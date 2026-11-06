(async function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let C;
  try { C = await MariageStore.loadContent(); }
  catch (e) { console.error(e); C = window.MARIAGE_DEFAULT; }

  // ---------- Valeurs calculées ----------
  const [y, m, d] = (C.hero.date || '').split('-').map(Number);
  const derived = {
    datePoints: y ? `${String(d).padStart(2, '0')} · ${String(m).padStart(2, '0')} · ${y}` : '',
    dateLongue: y ? `${d} ${MOIS[m - 1]} ${y}` : '',
  };
  const value = path => (path in derived ? derived[path] : get(C, path));

  document.title = `${C.couple.prenom1} & ${C.couple.prenom2} — ${derived.dateLongue}`;

  // ---------- Remplissage ----------
  $$('[data-c]').forEach(el => { el.textContent = value(el.dataset.c) ?? ''; });
  $$('[data-src]').forEach(el => { const v = value(el.dataset.src); if (v) el.src = v; });
  $$('[data-bg]').forEach(el => { const v = value(el.dataset.bg); if (v) el.style.backgroundImage = `url("${v}")`; });
  $('.hero-veil').style.setProperty('--veil', C.hero.assombrissement ?? .6);
  // Mémorise la photo d'accueil : à la prochaine visite, index.html la précharge avant même d'avoir le contenu
  try { if (C.hero.fond && !C.hero.fond.startsWith('data:')) localStorage.setItem('mariage.heroFond', C.hero.fond); } catch {}

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
    seal.innerHTML = `
      <svg class="seal" viewBox="0 0 300 300" role="img" aria-label="${esc(`${C.couple.prenom1} & ${C.couple.prenom2}`)}">
        ${center}
      </svg>`;
  }

  // Favicon aux initiales (même fonction que l'admin, dans store.js)
  MariageStore.setFavicon(C.couple.initiales);

  // Sections désactivées dans l'admin
  $$('[data-section]').forEach(el => el.classList.toggle('is-off', !(C[el.dataset.section] || {}).active));
  $$('[data-section-link]').forEach(el => { el.hidden = !(C[el.dataset.sectionLink] || {}).active; });
  if (!C.rsvp.active) $$('[data-rsvp-link]').forEach(el => el.remove());

  // Bandeau défilant
  const item = `<span>${esc(C.couple.prenom1)} <em>&amp;</em> ${esc(C.couple.prenom2)}</span><span class="dot"></span><span class="date">${esc(derived.datePoints)}</span><span class="dot"></span>`;
  $('.marquee-track').innerHTML = item.repeat(8);

  // Programme
  $('.timeline').innerHTML = (C.programme.items || []).map(it => `
    <li class="reveal"><time>${esc(it.heure)}</time><div><h3>${esc(it.titre)}</h3><p>${esc(it.description)}</p></div></li>`).join('');

  // Lieux
  $('.places').innerHTML = (C.lieux.items || []).map(it => `
    <article class="place reveal">
      <p class="label">${esc(it.type)}</p>
      <h3>${esc(it.nom)}</h3>
      <address>${esc(it.adresse)}</address>
      ${it.info ? `<p class="info">${esc(it.info)}</p>` : ''}
      <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.nom + ' ' + it.adresse)}">Itinéraire</a>
    </article>`).join('');

  // Dress code
  $('.swatches').innerHTML = (C.dressCode.couleurs || []).map(c => `<span class="reveal" style="background:${esc(c)}" title="${esc(c)}"></span>`).join('');
  $('.swatches').classList.remove('reveal'); // ce sont les pastilles qui apparaissent une à une

  // Galerie + visionneuse
  $('.gallery').innerHTML = (C.galerie.photos || []).map(src => `<button type="button" class="reveal"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></button>`).join('');
  const lb = $('.lightbox');
  $('.gallery').addEventListener('click', e => {
    const img = e.target.closest('button')?.querySelector('img');
    if (!img) return;
    $('img', lb).src = img.src;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  });
  const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
  lb.addEventListener('click', e => { if (e.target !== $('img', lb)) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLb(); toggleMenu(false); } });

  // ---------- Compte à rebours ----------
  const cd = $('.countdown');
  if (C.hero.compteARebours && y) {
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
    if (tick()) { const t = setInterval(() => { if (!tick()) clearInterval(t); }, 1000); }
  }

  // ---------- Menu ----------
  const burger = $('.burger'), menu = $('.menu');
  function toggleMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach((a, i) => { a.style.transitionDelay = `${.08 + i * .05}s`; a.addEventListener('click', () => toggleMenu(false)); });

  // ---------- Défilement doux vers les ancres (#rsvp, #programme…) ----------
  // Plus lent et plus souple que le défilement natif : accélération et décélération douces,
  // durée proportionnelle à la distance. Un geste de l'utilisateur (molette, doigt, clavier) l'interrompt.
  const easeInOutCubic = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let scrollAnim = null;
  const stopScroll = () => { if (scrollAnim) cancelAnimationFrame(scrollAnim); scrollAnim = null; };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, stopScroll, { passive: true }));

  function smoothScrollTo(target) {
    stopScroll();
    const from = scrollY;
    const to = Math.min(target.getBoundingClientRect().top + from, document.documentElement.scrollHeight - innerHeight);
    const dist = to - from;
    if (Math.abs(dist) < 2) return;
    const duration = Math.min(2200, 900 + Math.abs(dist) * .25); // 0,9 s à 2,2 s
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
    history.pushState(null, '', `#${id}`);
    if (reduce) target.scrollIntoView();
    else requestAnimationFrame(() => smoothScrollTo(target)); // laisse le menu se fermer avant de partir
  });

  // ---------- Défilement : en-tête, bouton flottant, parallax ----------
  const topbar = $('.topbar'), floatBtn = $('.float-rsvp'), hero = $('.hero');
  const rsvpSection = $('#rsvp');
  const parallax = $$('.parallax');
  let answered = false;
  try { answered = localStorage.getItem('mariage.repondu') === '1'; } catch {}
  // Une seule mise à jour par image affichée (le scroll peut déclencher des dizaines d'événements par image)
  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const sy = scrollY;
      topbar.classList.toggle('scrolled', sy > 40);
      if (floatBtn) {
        const rr = rsvpSection.getBoundingClientRect();
        const rsvpVisible = rr.top < innerHeight * .85 && rr.bottom > innerHeight * .15;
        floatBtn.classList.toggle('show', sy > hero.offsetHeight * .8 && !rsvpVisible && !answered);
      }
      if (!reduce) parallax.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -0.12}px, 0)`;
      });
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

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
  $$('.reveal').forEach((el, i) => {
    const m = motionOf(el);
    if (m) el.classList.add(m);
    if (!el.closest('.hero')) return io.observe(el);
    requestAnimationFrame(() => requestAnimationFrame(() => reveal(el, .2 + i * .12)));
  });

  // ---------- Ajouter au calendrier (.ics) ----------
  $('[data-ics]').addEventListener('click', () => {
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

  // ---------- RSVP ----------
  const body = $('.rsvp-body');
  const R = C.rsvp;
  const params = new URLSearchParams(location.search);
  const invite = await MariageStore.getInvite(params.get('invite')).catch(() => null);
  const max = invite ? invite.max_personnes : (R.maxParDefaut || 2);
  const closed = R.dateLimite && new Date() > new Date(R.dateLimite + 'T23:59:59');

  if (closed) {
    body.innerHTML = `<div class="rsvp-closed"><h3>Les réponses sont closes</h3><p>Pour toute question, contactez directement les mariés.</p></div>`;
  } else {
    const opts = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'personnes' : 'personne'}</option>`).join('');
    const moments = (R.moments || []).map(mo => `<label class="choice"><input type="checkbox" name="moments" value="${esc(mo)}" checked><span>${esc(mo)}</span></label>`).join('');
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
        <div class="attending" hidden>
          <div class="cols">
            <label class="field"><span>Nombre de personnes (vous inclus)</span><select name="nb_personnes">${opts}</select></label>
            ${R.demanderEnfants ? `<label class="field"><span>Dont enfants</span><input type="number" name="enfants" min="0" max="${max}" value="0"></label>` : ''}
          </div>
          <label class="field accomp" hidden><span>Prénoms des accompagnants</span><input type="text" name="accompagnants" placeholder="Ex. Marie, Paul"></label>
          ${moments ? `<fieldset class="field"><legend>Vous serez là pour</legend><div class="checks">${moments}</div></fieldset>` : ''}
          <label class="field"><span>Régime alimentaire / allergies</span><input type="text" name="regime" placeholder="Végétarien, sans gluten…"></label>
          ${R.demanderChanson ? `<label class="field"><span>Une chanson pour la piste de danse</span><input type="text" name="chanson" placeholder="Titre — artiste"></label>` : ''}
        </div>
        <div class="cols">
          <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email"></label>
          <label class="field"><span>Téléphone</span><input type="tel" name="telephone" autocomplete="tel"></label>
        </div>
        <label class="field"><span>Un mot pour les mariés</span><textarea name="message" rows="3"></textarea></label>
        <p class="form-error" role="alert"></p>
        <button class="btn btn-solid" type="submit">Envoyer ma réponse</button>
      </form>`;

    const form = $('form', body), att = $('.attending', form), err = $('.form-error', form);
    const sync = () => {
      att.hidden = form.present.value !== 'oui';
      $('.accomp', form).hidden = Number(form.nb_personnes.value) < 2;
    };
    form.addEventListener('change', sync);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.textContent = '';
      if (form.nom.value.trim().length < 2) return (err.textContent = 'Merci d’indiquer votre nom.');
      if (!form.present.value) return (err.textContent = 'Merci de nous dire si vous serez présent·e.');
      const yes = form.present.value === 'oui';
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
      };
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.textContent = 'Envoi…';
      try {
        await MariageStore.submitRsvp(payload, C);
        answered = true;
        try { localStorage.setItem('mariage.repondu', '1'); } catch {}
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

  document.body.classList.remove('is-loading');
  // Le contenu est injecté après le chargement : on rejoint l'ancre une fois la page construite
  const anchor = location.hash && document.getElementById(location.hash.slice(1));
  if (anchor) anchor.scrollIntoView({ behavior: 'instant' });
  onScroll();
})();
