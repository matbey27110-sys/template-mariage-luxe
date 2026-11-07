(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };
  // Les chemins d'images du contenu sont relatifs à la racine du site
  const src = s => (!s || /^(https?:|data:|blob:|\/)/.test(s) ? s : '../' + s);
  const S = MariageStore;

  let content = null;
  let dirty = false;
  let current = 'accueil';

  // ---------- Description des écrans ----------
  // [chemin, libellé, type, aide]
  const TABS = [
    { id: 'accueil', label: 'Accueil', hint: 'Prénoms, date, compte à rebours et image d’en-tête.', groups: [
      { title: 'Les mariés', fields: [
        ['couple.prenom1', 'Prénom 1', 'text'],
        ['couple.prenom2', 'Prénom 2', 'text'],
        ['couple.initiales', 'Monogramme', 'text', 'Séparez les initiales par | (ex. A|L)'],
      ] },
      { title: 'Le jour J', fields: [
        ['hero.date', 'Date du mariage', 'date'],
        ['hero.heure', 'Heure de début', 'time', 'Facultatif : sans heure, seul le nombre de jours s’affiche'],
        ['hero.lieu', 'Lieu', 'text'],
        ['hero.compteARebours', 'Afficher le compte à rebours', 'toggle'],
      ] },
      { title: 'En-tête', fields: [
        ['hero.surtitre', 'Phrase au-dessus des prénoms', 'text'],
        ['hero.bouton', 'Texte du bouton RSVP', 'text'],
        ['hero.fond', 'Image de fond', 'background'],
        ['hero.assombrissement', 'Assombrissement de l’image', 'range'],
      ] },
    ] },
    { id: 'histoire', label: 'Notre histoire', toggle: 'histoire.active', hint: 'Photo plein écran, texte et trio de photos.', groups: [
      { title: 'Photo plein écran', fields: [
        ['histoire.surtitre', 'Petit titre', 'text'],
        ['histoire.titre', 'Titre', 'text'],
        ['histoire.titreItalique', 'Mot en italique', 'text'],
        ['histoire.photoPleinEcran', 'Photo', 'image'],
      ] },
      { title: 'Texte et photos', fields: [
        ['histoire.texte', 'Votre histoire', 'textarea'],
        ['histoire.photos', 'Trois photos (celle du milieu est mise en avant)', 'images', '', 3],
      ] },
    ] },
    { id: 'grandJour', label: 'Le grand jour', toggle: 'grandJour.active', hint: 'Deuxième grande photo, entre le programme et les lieux.', groups: [
      { title: 'Photo plein écran', fields: [
        ['grandJour.surtitre', 'Petit titre', 'text'],
        ['grandJour.titre', 'Titre', 'text'],
        ['grandJour.titreItalique', 'Mot en italique', 'text'],
        ['grandJour.texte', 'Phrase', 'textarea'],
        ['grandJour.photo', 'Photo', 'image'],
      ] },
    ] },
    { id: 'programme', label: 'Programme', toggle: 'programme.active', hint: 'Le déroulé de la journée.', groups: [
      { title: 'Titre', fields: [['programme.titre', 'Titre de la section', 'text']] },
      { title: 'Étapes', fields: [['programme.items', '', 'list', '', [
        ['heure', 'Heure', 'time'], ['titre', 'Titre', 'text'], ['description', 'Description', 'text'],
      ], { heure: '', titre: 'Nouvelle étape', description: '' }]] },
    ] },
    { id: 'lieux', label: 'Lieux', toggle: 'lieux.active', hint: 'Adresses avec bouton « Itinéraire » automatique.', groups: [
      { title: 'Titre', fields: [['lieux.titre', 'Titre de la section', 'text']] },
      { title: 'Adresses', fields: [['lieux.items', '', 'list', '', [
        ['type', 'Type (ex. Cérémonie)', 'text'], ['nom', 'Nom du lieu', 'text'],
        ['adresse', 'Adresse complète', 'text'], ['info', 'Info pratique', 'text'],
      ], { type: '', nom: 'Nouveau lieu', adresse: '', info: '' }]] },
    ] },
    { id: 'dressCode', label: 'Dress code', toggle: 'dressCode.active', hint: 'Tenue souhaitée et palette de couleurs.', groups: [
      { title: 'Dress code', fields: [
        ['dressCode.titre', 'Petit titre', 'text'],
        ['dressCode.sousTitre', 'Style (ex. Black tie)', 'text'],
        ['dressCode.texte', 'Description', 'textarea'],
        ['dressCode.couleurs', 'Couleurs suggérées', 'colors'],
      ] },
    ] },
    { id: 'galerie', label: 'Galerie', toggle: 'galerie.active', hint: 'Vos photos préférées.', groups: [
      { title: 'Galerie', fields: [
        ['galerie.titre', 'Titre', 'text'],
        ['galerie.photos', 'Photos', 'images'],
      ] },
    ] },
    { id: 'rsvp', label: 'Formulaire RSVP', toggle: 'rsvp.active', hint: 'Réglages du formulaire de réponse.', groups: [
      { title: 'Textes', fields: [
        ['rsvp.titre', 'Titre', 'text'],
        ['rsvp.texte', 'Phrase d’introduction', 'text'],
      ] },
      { title: 'Règles', fields: [
        ['rsvp.dateLimite', 'Date limite de réponse', 'date', 'Le formulaire se ferme automatiquement après cette date'],
        ['rsvp.maxParDefaut', 'Personnes max. (sans lien personnalisé)', 'number', 'Avec un lien invité, c’est le maximum de l’invité qui s’applique'],
        ['rsvp.demanderEnfants', 'Demander le nombre d’enfants', 'toggle'],
        ['rsvp.demanderChanson', 'Demander une chanson', 'toggle'],
        ['rsvp.moments', 'Moments proposés (cases à cocher)', 'strings'],
      ] },
      { title: 'Questions personnalisées', fields: [['rsvp.questions', '', 'list', '', [
        ['question', 'Question', 'text', 'Ex. Aurez-vous besoin de la navette ?'],
        ['type', 'Type de réponse', 'select', '', [['texte', 'Texte libre'], ['liste', 'Liste déroulante']]],
        ['options', 'Choix de la liste', 'strings', 'Un champ par choix proposé à l’invité', null, null, it => it.type === 'liste'],
        ['obligatoire', 'Réponse obligatoire', 'toggle'],
        ['pourTous', 'Poser aussi aux personnes absentes', 'toggle', 'Sinon, la question n’apparaît que si l’invité répond « Avec joie »'],
      ], { question: 'Nouvelle question', type: 'texte', options: [], obligatoire: false, pourTous: false }]] },
    ] },
    { id: 'footer', label: 'Pied de page', hint: 'Photo floutée derrière le monogramme.', groups: [
      { title: 'Pied de page', fields: [
        ['footer.message', 'Message', 'text'],
        ['footer.photo', 'Photo de fond', 'image'],
      ] },
    ] },
    { sep: true },
    { id: 'invites', label: 'Invités', hint: 'Un lien personnel par invité : nom pré-rempli et nombre de places limité.' },
    { id: 'reponses', label: 'Réponses', hint: 'Toutes les réponses reçues.' },
  ];

  // ---------- Utilitaires ----------
  function toast(msg, err) {
    const t = $('.toast');
    t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function markDirty() {
    dirty = true;
    $('.save').disabled = false;
    $('.save-state').textContent = 'Modifications non enregistrées';
    $('.save-state').classList.add('dirty');
  }

  // Redimensionne avant envoi : photos plus légères, site plus rapide
  function compress(file) {
    const maxW = S.live ? 2400 : 1400, q = S.live ? .84 : .72;
    return new Promise(resolve => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, maxW / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => resolve(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', q);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  function pickFiles(multiple) {
    return new Promise(resolve => {
      const input = $('.file-picker');
      input.multiple = !!multiple; input.value = '';
      input.onchange = () => resolve([...input.files]);
      input.click();
    });
  }

  async function upload(files, host) {
    host?.classList.add('uploading');
    try {
      const urls = [];
      for (const f of files) urls.push(await S.uploadPhoto(await compress(f)));
      return urls;
    } catch (e) {
      toast(e.message || 'Envoi de la photo impossible', true);
      return [];
    } finally { host?.classList.remove('uploading'); }
  }

  // ---------- Animations d'ajout / suppression ----------
  // Même esprit que le formulaire du site : un élément ajouté se déplie comme un volet,
  // un élément supprimé se replie avant de disparaître. Vignettes (photos, couleurs) : léger zoom.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const closedFrame = { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginBottom: '0px', opacity: 0, transform: 'translateY(-8px)' };
  const openFrame = el => {
    const cs = getComputedStyle(el);
    return { height: el.offsetHeight + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginBottom: cs.marginBottom, opacity: 1, transform: 'none' };
  };
  function unfold(el) {
    if (reduce || !el) return;
    el.style.overflow = 'hidden';
    el.animate([closedFrame, openFrame(el)], { duration: 700, easing: EASE }).onfinish = () => { el.style.overflow = ''; };
  }
  // Fermeture : courbe progressive (accélère puis freine) et plus longue que l'ouverture,
  // sinon le repli est fini avant qu'on ait pu le voir. Le contenu s'efface pendant que le volet se ferme.
  const EASE_CLOSE = 'cubic-bezier(.45, 0, .25, 1)';
  function foldAway(el) {
    if (reduce || !el) return Promise.resolve();
    el.style.overflow = 'hidden';
    return el.animate([openFrame(el), { opacity: .55, offset: .45 }, closedFrame],
      { duration: 650, easing: EASE_CLOSE, fill: 'forwards' }).finished;
  }
  function popIn(el) {
    if (!reduce && el) el.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: EASE });
  }
  function popOut(el) {
    if (reduce || !el) return Promise.resolve();
    return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.8)' }], { duration: 450, easing: EASE_CLOSE, fill: 'forwards' }).finished;
  }
  // Élément(s) à animer au prochain rendu : même objet parent, même chemin, indices [from, to[
  let revealNext = null;
  const markReveal = (root, path, from, to = from + 1) => { revealNext = { root, path, from, to }; };
  // Appelé pendant le rendu : anime les éléments ajoutés une fois le panneau en place (avant l'affichage)
  function revealIn(root, path, items, anim) {
    const r = revealNext;
    if (!r || r.root !== root || r.path !== path) return;
    revealNext = null;
    queueMicrotask(() => items.slice(r.from, r.to).forEach(anim));
  }

  // ---------- Champs ----------
  function field([path, label, type, help, extra, blank], root = content, rerender) {
    const el = document.createElement('div');
    el.className = 'f' + (['textarea', 'images', 'background', 'list', 'colors', 'strings'].includes(type) ? ' wide' : '');
    const val = get(root, path);
    const update = v => { set(root, path, v); markDirty(); if (path === 'couple.initiales') renderBrand(); };
    const redraw = rerender || renderPanel;
    const head = label ? `<span>${esc(label)}</span>` : '';
    const foot = help ? `<small>${esc(help)}</small>` : '';

    switch (type) {
      case 'text': case 'date': case 'time': case 'number': {
        el.innerHTML = `${head}<input type="${type}" ${type === 'number' ? 'min="1" max="20"' : ''}>${foot}`;
        const i = $('input', el); i.value = val ?? '';
        i.addEventListener('input', () => update(type === 'number' ? Number(i.value) || 1 : i.value));
        break;
      }
      case 'select': {
        el.innerHTML = `${head}<select>${extra.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>${foot}`;
        const s = $('select', el); s.value = val ?? extra[0][0];
        s.addEventListener('change', () => { update(s.value); redraw(); }); // affiche / masque les champs qui en dépendent
        break;
      }
      case 'textarea': {
        el.innerHTML = `${head}<textarea></textarea>${foot}`;
        const t = $('textarea', el); t.value = val ?? '';
        t.addEventListener('input', () => update(t.value));
        break;
      }
      case 'toggle': {
        el.innerHTML = `<label class="toggle"><input type="checkbox"><i></i>${esc(label)}</label>${foot}`;
        const c = $('input', el); c.checked = !!val;
        c.addEventListener('change', () => update(c.checked));
        break;
      }
      case 'range': {
        el.innerHTML = `${head}<input type="range" min="0.2" max="0.95" step="0.05"><small>Plus fort = texte plus lisible</small>`;
        const r = $('input', el); r.value = val ?? .7;
        r.addEventListener('input', () => update(Number(r.value)));
        break;
      }
      case 'image': {
        el.innerHTML = `${head}<div class="img-field"><img class="thumb" alt=""><div class="img-actions"><button type="button" class="btn btn-ghost btn-sm">Changer la photo</button></div></div>${foot}`;
        $('img', el).src = src(val) || '';
        $('button', el).addEventListener('click', async () => {
          const [url] = await upload(await pickFiles(false), el);
          if (url) { update(url); $('img', el).src = src(url); }
        });
        break;
      }
      case 'images': {
        const list = Array.isArray(val) ? val : [];
        const fixed = extra; // nombre fixe de photos (ex. trio)
        el.innerHTML = `${head}<div class="img-grid">${list.map((u, i) => `
          <div class="img-tile"><img alt="" src="${esc(src(u))}">
            <div class="tools">
              ${fixed ? '' : `<button type="button" data-a="left" data-i="${i}" title="Déplacer avant">←</button>`}
              <button type="button" data-a="swap" data-i="${i}" title="Remplacer">↻</button>
              ${fixed ? '' : `<button type="button" data-a="del" data-i="${i}" title="Supprimer">✕</button>`}
            </div></div>`).join('')}
          ${!fixed || list.length < fixed ? `<button type="button" class="add-tile"><b>+</b>Ajouter</button>` : ''}
          </div>${foot}`;
        revealIn(root, path, $$('.img-tile', el), popIn);
        el.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          const arr = [...list];
          if (b.classList.contains('add-tile')) {
            const urls = await upload(await pickFiles(!fixed), el);
            if (!urls.length) return;
            const next = fixed ? arr.concat(urls).slice(0, fixed) : arr.concat(urls);
            markReveal(root, path, arr.length, next.length);
            update(next);
          } else {
            const i = Number(b.dataset.i);
            if (b.dataset.a === 'del') { await popOut(b.closest('.img-tile')); arr.splice(i, 1); }
            if (b.dataset.a === 'left' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
            if (b.dataset.a === 'swap') {
              const [url] = await upload(await pickFiles(false), el);
              if (!url) return;
              arr[i] = url;
            }
            update(arr);
          }
          redraw();
        });
        break;
      }
      case 'background': {
        const isLib = MARIAGE_FONDS.some(f => f.url === val);
        el.innerHTML = `${head}<div class="img-grid">
          ${MARIAGE_FONDS.map(f => `<button type="button" class="img-tile bg-choice ${f.url === val ? 'selected' : ''}" data-url="${esc(f.url)}"><img alt="" src="${esc(src(f.url))}"><span>${esc(f.nom)}</span></button>`).join('')}
          ${!isLib && val ? `<button type="button" class="img-tile bg-choice selected" data-url="${esc(val)}"><img alt="" src="${esc(src(val))}"><span>Votre photo</span></button>` : ''}
          <button type="button" class="add-tile" data-upload><b>+</b>Votre photo</button>
        </div><small>Choisissez un fond de la bibliothèque ou envoyez votre propre photo.</small>`;
        el.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.hasAttribute('data-upload')) {
            const [url] = await upload(await pickFiles(false), el);
            if (!url) return;
            update(url);
          } else update(b.dataset.url);
          redraw();
        });
        break;
      }
      case 'colors': {
        const list = Array.isArray(val) ? val : [];
        el.innerHTML = `${head}<div class="colors">${list.map((c, i) => `
          <label class="color"><input type="color" value="${esc(c)}" data-i="${i}"><code>${esc(c)}</code>
          <button type="button" class="icon-btn danger" data-del="${i}" aria-label="Supprimer">✕</button></label>`).join('')}
          <button type="button" class="btn btn-ghost btn-sm" data-add>+ Couleur</button></div>`;
        revealIn(root, path, $$('.color', el), popIn);
        el.addEventListener('input', e => {
          if (e.target.type !== 'color') return;
          list[e.target.dataset.i] = e.target.value.toUpperCase();
          e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
          update([...list]);
        });
        el.addEventListener('click', async e => {
          if (e.target.closest('[data-add]')) { markReveal(root, path, list.length); update([...list, '#C8A86B']); redraw(); }
          const d = e.target.closest('[data-del]');
          if (d) { e.preventDefault(); await popOut(d.closest('.color')); list.splice(Number(d.dataset.del), 1); update([...list]); redraw(); }
        });
        break;
      }
      case 'strings': {
        const list = Array.isArray(val) ? val : [];
        el.innerHTML = `${head}<div class="strings">${list.map((s, i) => `
          <div class="string-row"><input type="text" data-i="${i}" value="${esc(s)}" style="flex:1">
          <button type="button" class="icon-btn danger" data-del="${i}" aria-label="Supprimer">✕</button></div>`).join('')}
          <div><button type="button" class="btn btn-ghost btn-sm" data-add>+ Ajouter</button></div></div>${foot}`;
        // Nouvelle ligne : se déplie et reçoit directement le curseur
        revealIn(root, path, $$('.string-row', el), row => { unfold(row); $('input', row).focus({ preventScroll: true }); });
        el.addEventListener('input', e => { if (e.target.dataset.i != null) { list[e.target.dataset.i] = e.target.value; update([...list]); } });
        el.addEventListener('click', async e => {
          if (e.target.closest('[data-add]')) { markReveal(root, path, list.length); update([...list, '']); redraw(); }
          const d = e.target.closest('[data-del]');
          if (d) { await foldAway(d.closest('.string-row')); list.splice(Number(d.dataset.del), 1); update([...list]); redraw(); }
        });
        break;
      }
      case 'list': {
        const list = Array.isArray(val) ? val : [];
        const sub = extra;
        list.forEach((item, i) => {
          const card = document.createElement('div');
          card.className = 'item';
          card.innerHTML = `<div class="item-head">N° ${i + 1}<div class="item-tools">
            <button type="button" class="icon-btn" data-a="up" title="Monter">↑</button>
            <button type="button" class="icon-btn" data-a="down" title="Descendre">↓</button>
            <button type="button" class="icon-btn danger" data-a="del" title="Supprimer">✕</button></div></div><div class="fields"></div>`;
          // 7e élément facultatif d'une définition : condition d'affichage selon l'élément (ex. choix d'une liste)
          sub.forEach(def => { if (!def[6] || def[6](item)) $('.fields', card).append(field(def, item, redraw)); });
          card.querySelector('.item-tools').addEventListener('click', async e => {
            const a = e.target.closest('button')?.dataset.a; if (!a) return;
            if (a === 'del' && !confirm('Supprimer cet élément ?')) return;
            if (a === 'del') { await foldAway(card); list.splice(i, 1); }
            if (a === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
            if (a === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
            update(list); redraw();
          });
          el.append(card);
        });
        revealIn(root, path, $$(':scope > .item', el), card => {
          // Le nouvel élément reste visible : on le fait entrer dans l'écran s'il apparaît plus bas
          const r = card.getBoundingClientRect(); // mesuré avant l'animation (hauteur finale)
          unfold(card);
          if (r.bottom > innerHeight) scrollBy({ top: r.bottom - innerHeight + 40, behavior: reduce ? 'auto' : 'smooth' });
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'btn btn-ghost btn-sm'; add.textContent = '+ Ajouter';
        add.style.justifySelf = 'start';
        add.addEventListener('click', () => { list.push(structuredClone(blank)); /* copie profonde : chaque élément a ses propres listes */ markReveal(root, path, list.length - 1); update(list); redraw(); });
        el.append(add);
        set(root, path, list);
        break;
      }
    }
    return el;
  }

  // ---------- Rendu ----------
  function renderTabs() {
    $('.tabs').innerHTML = TABS.map(t => t.sep ? '<div class="sep"></div>' : `
      <button type="button" data-tab="${t.id}" class="${t.id === current ? 'active' : ''}">
        <span>${esc(t.label)}</span>${t.toggle && !get(content, t.toggle) ? '<span class="off">masqué</span>' : ''}
      </button>`).join('');
    renderBrand();
  }

  // Logo de l'admin + icône d'onglet, mis à jour en direct quand on modifie les initiales
  function renderBrand() {
    const ini = content.couple.initiales || '';
    const [a, b] = ini.split('|');
    $('.brand-mono').innerHTML = b !== undefined ? `${esc(a.trim())}<i aria-hidden="true"></i>${esc(b.trim())}` : esc(ini);
    MariageStore.setFavicon(ini);
  }

  function renderPanel() {
    const tab = TABS.find(t => t.id === current);
    $('.bar-title').textContent = tab.label;
    $('.bar-hint').textContent = tab.hint || '';
    const panel = $('.panel');
    panel.innerHTML = '';
    panel.onclick = null;
    if (tab.id === 'invites') return renderInvites(panel);
    if (tab.id === 'reponses') return renderReponses(panel);

    if (tab.toggle) {
      const sw = document.createElement('div');
      sw.className = 'section-switch';
      sw.innerHTML = `<label class="toggle"><input type="checkbox"><i></i>Afficher cette section sur le site</label>`;
      const c = $('input', sw); c.checked = !!get(content, tab.toggle);
      c.addEventListener('change', () => { set(content, tab.toggle, c.checked); markDirty(); renderTabs(); });
      panel.append(sw);
    }
    tab.groups.forEach(g => {
      const box = document.createElement('section');
      box.className = 'group';
      box.innerHTML = `<h2>${esc(g.title)}</h2><div class="fields"></div>`;
      g.fields.forEach(def => $('.fields', box).append(field(def)));
      panel.append(box);
    });
  }

  function inviteLink(slug) {
    const base = location.href.replace(/admin\/.*$/, '');
    return `${base}?invite=${encodeURIComponent(slug)}`;
  }

  async function renderInvites(panel) {
    panel.innerHTML = '<p class="muted">Chargement…</p>';
    let invites, rsvps;
    try { [invites, rsvps] = await Promise.all([S.listInvites(), S.listRsvps()]); }
    catch (e) { panel.innerHTML = `<p class="error">${esc(e.message)}</p>`; return; }
    const answered = new Set(rsvps.map(r => r.invite_id).filter(Boolean));
    const places = invites.reduce((n, i) => n + i.max_personnes, 0);

    panel.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${invites.length}</b><span>Invitations</span></div>
        <div class="stat"><b>${places}</b><span>Places prévues</span></div>
        <div class="stat gold"><b>${answered.size}</b><span>Ont répondu</span></div>
        <div class="stat"><b>${invites.length - answered.size}</b><span>En attente</span></div>
      </div>
      <section class="group">
        <h2>Ajouter un invité</h2>
        <form class="inline-form" data-add>
          <label class="f"><span>Nom (famille, couple…)</span><input type="text" name="nom" required placeholder="Famille Martin"></label>
          <label class="f"><span>Places</span><input type="number" name="max" min="1" max="20" value="2"></label>
          <button class="btn btn-gold" type="submit">Ajouter</button>
        </form>
        <details style="margin-top:18px">
          <summary class="muted" style="cursor:pointer">Ajouter une liste d’un coup</summary>
          <form data-bulk style="display:grid;gap:12px;margin-top:12px">
            <label class="f"><span>Un invité par ligne : Nom ; places</span>
              <textarea name="liste" placeholder="Famille Martin ; 4&#10;Julie Dupont ; 1&#10;Paul et Léa ; 2"></textarea></label>
            <button class="btn btn-ghost btn-sm" type="submit" style="justify-self:start">Importer la liste</button>
          </form>
        </details>
      </section>
      ${invites.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Invité</th><th>Places</th><th>Statut</th><th>Lien personnel</th><th></th></tr></thead>
        <tbody>${invites.map(i => `<tr>
          <td>${esc(i.nom)}</td><td>${i.max_personnes}</td>
          <td>${answered.has(i.id) ? '<span class="pill yes">Répondu</span>' : '<span class="pill wait">En attente</span>'}</td>
          <td class="link-cell" title="${esc(inviteLink(i.slug))}">${esc(inviteLink(i.slug))}</td>
          <td><div class="row-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(i.slug)}">Copier le lien</button>
            <button type="button" class="icon-btn danger" data-del="${esc(i.id)}" title="Supprimer">✕</button>
          </div></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty">Aucun invité pour l’instant. Sans liste, le formulaire reste ouvert à tous avec le nombre de places par défaut.</div>'}`;

    $('[data-add]', panel).addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      try { await S.addInvite(f.nom.value.trim(), Number(f.max.value) || 1); toast('Invité ajouté'); renderInvites(panel); }
      catch (ex) { toast(ex.message, true); }
    });
    $('[data-bulk]', panel).addEventListener('submit', async e => {
      e.preventDefault();
      const lines = e.target.liste.value.split('\n').map(l => l.trim()).filter(Boolean);
      let n = 0;
      for (const l of lines) {
        const [nom, max] = l.split(/[;,\t]/).map(s => s.trim());
        if (!nom) continue;
        try { await S.addInvite(nom, Math.min(20, Math.max(1, Number(max) || 1))); n++; } catch (ex) { toast(ex.message, true); }
      }
      toast(`${n} invité${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}`);
      renderInvites(panel);
    });
    panel.onclick = async e => {
      const c = e.target.closest('[data-copy]');
      if (c) {
        try { await navigator.clipboard.writeText(inviteLink(c.dataset.copy)); toast('Lien copié'); }
        catch { prompt('Copiez ce lien :', inviteLink(c.dataset.copy)); }
      }
      const d = e.target.closest('[data-del]');
      if (d && confirm('Supprimer cet invité ? Sa réponse éventuelle sera conservée.')) {
        try { await S.deleteInvite(d.dataset.del); renderInvites(panel); } catch (ex) { toast(ex.message, true); }
      }
    };
  }

  async function renderReponses(panel) {
    panel.innerHTML = '<p class="muted">Chargement…</p>';
    let rsvps;
    try { rsvps = await S.listRsvps(); }
    catch (e) { panel.innerHTML = `<p class="error">${esc(e.message)}</p>`; return; }
    const yes = rsvps.filter(r => r.present), no = rsvps.filter(r => !r.present);
    const guests = yes.reduce((n, r) => n + (r.nb_personnes || 0), 0);
    const kids = yes.reduce((n, r) => n + (r.enfants || 0), 0);
    const regimes = yes.filter(r => r.regime);
    const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    // Réponses aux questions personnalisées : [{ question, reponse }], seules les réponses remplies
    const answers = r => (Array.isArray(r.reponses) ? r.reponses : []).filter(a => a && a.question && String(a.reponse ?? '').trim());
    // Une colonne d'export par question (intitulés tels qu'ils étaient au moment de la réponse)
    const questionCols = [...new Set(rsvps.flatMap(r => answers(r).map(a => a.question)))];

    panel.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${rsvps.length}</b><span>Réponses</span></div>
        <div class="stat gold"><b>${guests}</b><span>Personnes présentes</span></div>
        <div class="stat"><b>${kids}</b><span>Dont enfants</span></div>
        <div class="stat"><b>${no.length}</b><span>Absents</span></div>
      </div>
      ${regimes.length ? `<section class="group"><h2>Régimes et allergies</h2>
        ${regimes.map(r => `<p style="margin:0 0 6px"><b style="font-weight:500">${esc(r.nom)}</b> — ${esc(r.regime)}</p>`).join('')}</section>` : ''}
      <div class="toolbar"><span class="muted">${rsvps.length} réponse${rsvps.length > 1 ? 's' : ''}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-csv ${rsvps.length ? '' : 'disabled'}>Exporter (Excel / CSV)</button></div>
      ${rsvps.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Nom</th><th>Réponse</th><th>Pers.</th><th>Détails</th><th>Message</th><th></th></tr></thead>
        <tbody>${rsvps.map(r => `<tr>
          <td class="muted">${fmt(r.created_at)}</td>
          <td>${esc(r.nom)}<br><span class="muted">${esc([r.email, r.telephone].filter(Boolean).join(' · '))}</span></td>
          <td>${r.present ? '<span class="pill yes">Présent</span>' : '<span class="pill no">Absent</span>'}</td>
          <td>${r.present ? r.nb_personnes + (r.enfants ? `<br><span class="muted">dont ${r.enfants} enf.</span>` : '') : '—'}</td>
          <td class="muted">${[r.accompagnants && 'Avec : ' + esc(r.accompagnants), r.moments?.length && esc(r.moments.join(', ')), r.chanson && '♪ ' + esc(r.chanson),
            ...answers(r).map(a => `<b style="font-weight:500">${esc(a.question)}</b> : ${esc(a.reponse)}`)].filter(Boolean).join('<br>') || '—'}</td>
          <td style="max-width:240px">${esc(r.message) || '<span class="muted">—</span>'}</td>
          <td><button type="button" class="icon-btn danger" data-del="${esc(r.id)}" title="Supprimer">✕</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aucune réponse pour le moment.</div>'}`;

    $('[data-csv]', panel).addEventListener('click', () => {
      const cols = [['Date', r => new Date(r.created_at).toLocaleString('fr-FR')], ['Nom', r => r.nom], ['Présent', r => r.present ? 'Oui' : 'Non'],
        ['Personnes', r => r.nb_personnes], ['Enfants', r => r.enfants], ['Accompagnants', r => r.accompagnants],
        ['Moments', r => (r.moments || []).join(', ')], ['Régime', r => r.regime], ['Chanson', r => r.chanson],
        ...questionCols.map(q => [q, r => answers(r).find(a => a.question === q)?.reponse]),
        ['Email', r => r.email], ['Téléphone', r => r.telephone], ['Message', r => r.message]];
      const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = '﻿' + [cols.map(c => cell(c[0])).join(';'), ...rsvps.map(r => cols.map(c => cell(c[1](r))).join(';'))].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `reponses-mariage-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    });
    panel.onclick = async e => {
      const d = e.target.closest('[data-del]');
      if (d && confirm('Supprimer définitivement cette réponse ?')) {
        try { await S.deleteRsvp(d.dataset.del); renderReponses(panel); } catch (ex) { toast(ex.message, true); }
      }
    };
  }

  // ---------- Actions globales ----------
  $('.tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    current = b.dataset.tab;
    renderTabs(); renderPanel();
    scrollTo({ top: 0 });
  });

  async function save() {
    const btn = $('.save');
    btn.disabled = true; btn.textContent = 'Enregistrement…';
    try {
      await S.saveContent(content);
      dirty = false;
      $('.save-state').textContent = 'Enregistré ✓';
      $('.save-state').classList.remove('dirty');
      toast('Modifications enregistrées');
    } catch (e) {
      btn.disabled = false;
      toast(e.message || 'Enregistrement impossible', true);
    }
    btn.textContent = 'Enregistrer';
  }
  $('.save').addEventListener('click', save);
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (dirty) save(); }
  });
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('.logout').addEventListener('click', async () => {
    if (dirty && !confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
    await S.logout(); location.reload();
  });

  // ---------- Démarrage ----------
  async function start() {
    content = await S.loadContent();
    $('.login').hidden = true;
    $('.app').hidden = false;
    $('.demo-banner').hidden = S.live;
    $('.logout').hidden = !S.live;
    renderTabs(); renderPanel();
  }

  (async () => {
    if (await S.session()) return start();
    $('.login').hidden = false;
    $('.login-card').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target, err = $('.error', f);
      err.textContent = '';
      try { await S.login(f.email.value, f.password.value); await start(); }
      catch (ex) { err.textContent = ex.message; }
    });
  })();
})();
