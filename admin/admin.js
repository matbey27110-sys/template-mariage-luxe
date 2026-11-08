// Back-office « Espace mariés ».
// Principe : on travaille sur un BROUILLON (content). La version PUBLIÉE (published) n'est remplacée
// qu'au clic sur « Enregistrer ». Chaque modification est envoyée à l'aperçu en direct (iframe du vrai site).
// Les photos choisies restent sur l'ordinateur (adresse blob:) et ne sont envoyées à Supabase qu'à l'enregistrement.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };
  const clone = o => structuredClone(o);
  // Les chemins d'images du contenu sont relatifs à la racine du site
  const src = s => (!s || /^(https?:|data:|blob:|\/)/.test(s) ? s : '../' + s);
  const S = MariageStore;
  const root = document.documentElement;
  const ORIGIN = location.origin === 'null' ? '*' : location.origin; // fichier local : pas d'origine

  let content = null;      // brouillon en cours d'édition
  let published = null;    // dernière version enregistrée
  let dirty = false;
  let current = 'accueil';
  const pending = new Map(); // photos pas encore envoyées : adresse blob: → fichier

  // ---------- Description des écrans ----------
  // [chemin, libellé, type, aide, extra, modèle, condition]
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
    { id: 'apparence', label: 'Apparence', hint: 'Thème du site, mode clair / sombre et rendu des photos.', groups: [
      { title: 'Thème', fields: [['apparence.theme', '', 'themes']] },
      { title: 'Clair / sombre', fields: [
        ['apparence.modeParDefaut', 'Mode à l’ouverture du site', 'select', 'Le site s’affiche toujours dans ce mode pour tous les invités.',
          [['dark', 'Sombre'], ['light', 'Clair'], ['auto', 'Selon le réglage de l’appareil']]],
      ] },
      { title: 'Photos', fields: [
        ['photos.noirEtBlanc', 'Afficher toutes les photos en noir et blanc', 'toggle',
          'S’applique à toutes les photos du site, y compris celles que vous importez. Désactivé, chaque photo suit son propre réglage (bouton ◐ sur chaque photo). Vos fichiers restent en couleur.'],
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

  function setDirty(on) {
    dirty = on;
    $('.save').disabled = !on;
    $('.cancel').disabled = !on;
    $('.save-state').textContent = on ? 'Modifications non enregistrées' : '';
    $('.save-state').classList.toggle('dirty', on);
  }
  function markDirty() { setDirty(true); sendPreview(); }

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

  // Photo choisie : affichée tout de suite (adresse blob:) dans l'éditeur ET dans l'aperçu,
  // sans rien envoyer. L'envoi vers Supabase n'a lieu qu'au clic sur « Enregistrer ».
  function stage(files) {
    return files.filter(f => f.type.startsWith('image/')).map(f => {
      const url = URL.createObjectURL(f);
      pending.set(url, f);
      return url;
    });
  }

  // Remplace partout une adresse par une autre (valeurs, listes, et clés de photos.focus)
  function replaceUrl(obj, from, to) {
    if (Array.isArray(obj)) obj.forEach((v, i) => { if (v === from) obj[i] = to; else if (v && typeof v === 'object') replaceUrl(v, from, to); });
    else if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (obj[k] === from) obj[k] = to; else if (obj[k] && typeof obj[k] === 'object') replaceUrl(obj[k], from, to);
        if (k === from) { obj[to] = obj[k]; delete obj[k]; }
      }
    }
  }
  const usedStrings = obj => { const used = new Set(); const walk = v => { if (typeof v === 'string') used.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); }; walk(obj); return used; };

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
  const markReveal = (rootObj, path, from, to = from + 1) => { revealNext = { root: rootObj, path, from, to }; };
  // Appelé pendant le rendu : anime les éléments ajoutés une fois le panneau en place (avant l'affichage)
  function revealIn(rootObj, path, items, anim) {
    const r = revealNext;
    if (!r || r.root !== rootObj || r.path !== path) return;
    revealNext = null;
    queueMicrotask(() => items.slice(r.from, r.to).forEach(anim));
  }

  // ---------- Noir et blanc par photo ----------
  // Liste des photos à afficher en noir et blanc (content.photos.nb), repérées par leur adresse :
  // une photo garde son réglage si on la déplace. Le fichier lui-même reste en couleur.
  const nbList = () => ((content.photos ??= {}).nb ??= []);
  const isNb = url => !!url && nbList().includes(url);
  function nbButton(url, cls, label, i) {
    if (!url) return '';
    const on = isNb(url);
    return `<button type="button" class="${cls}" data-nb ${i != null ? `data-i="${i}"` : ''} aria-pressed="${on}" title="Afficher cette photo en noir et blanc">${label}</button>`;
  }
  function toggleNb(url, btn, img) {
    const list = nbList(), k = list.indexOf(url);
    if (k < 0) list.push(url); else list.splice(k, 1);
    const on = k < 0;
    btn?.setAttribute('aria-pressed', on);
    img?.classList.toggle('nb', on);
    markDirty();
  }

  // ---------- Point focal ----------
  // Un clic sur la photo choisit le point qui doit rester visible quand elle est recadrée (téléphone).
  const focusMap = () => ((content.photos ??= {}).focus ??= {});
  function focusPicker(url, imgHtml) {
    const f = focusMap()[url];
    const [x, y] = (f || '50% 50%').split(' ');
    return `<span class="focus-pick" data-focus-url="${esc(url)}" title="Cliquez pour choisir le point à garder visible">${imgHtml}<i class="focus-dot" style="left:${x};top:${y}"></i></span>`;
  }
  document.addEventListener('click', e => {
    const pick = e.target.closest('.focus-pick');
    if (!pick || e.target.closest('button')) return;
    const r = pick.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100), y = Math.round(((e.clientY - r.top) / r.height) * 100);
    const v = `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
    focusMap()[pick.dataset.focusUrl] = v;
    const dot = $('.focus-dot', pick); dot.style.left = `${x}%`; dot.style.top = `${y}%`;
    markDirty();
  });

  // À l'enregistrement : on oublie les réglages des photos qui ne sont plus utilisées nulle part
  function pruneSettings() {
    const used = usedStrings({ ...content, photos: { ...content.photos, nb: [], focus: {} } });
    content.photos.nb = nbList().filter(u => used.has(u));
    const f = focusMap();
    for (const k of Object.keys(f)) if (!used.has(k)) delete f[k];
  }

  // ---------- Champs ----------
  function field([path, label, type, help, extra, blank], rootObj = content, rerender) {
    const el = document.createElement('div');
    el.className = 'f' + (['textarea', 'images', 'background', 'list', 'colors', 'strings', 'themes'].includes(type) ? ' wide' : '');
    const val = get(rootObj, path);
    const update = v => {
      set(rootObj, path, v);
      if (path === 'couple.initiales') renderBrand();
      if (path === 'photos.noirEtBlanc') document.body.classList.toggle('photos-nb', !!v); // aperçu immédiat des vignettes
      if (path.startsWith('apparence.')) applyAppearance();
      markDirty();
    };
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
        el.innerHTML = `${head}<input type="range" min="0.2" max="0.95" step="0.05"><small>Plus fort = texte plus lisible. Le rendu s’affiche en direct dans l’aperçu.</small>`;
        const r = $('input', el); r.value = val ?? .7;
        r.addEventListener('input', () => update(Number(r.value)));
        break;
      }
      case 'image': {
        el.innerHTML = `${head}<div class="img-field">${val ? focusPicker(val, '<img class="thumb" alt="">') : '<img class="thumb" alt="">'}<div class="img-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-change>Changer la photo</button>
          ${nbButton(val, 'btn btn-ghost btn-sm nb-btn', '◐ Noir et blanc')}</div></div>
          ${val ? '<small>Cliquez sur la photo pour choisir le point à garder visible sur téléphone.</small>' : ''}${foot}`;
        const thumb = $('img', el);
        thumb.src = src(val) || ''; thumb.classList.toggle('nb', isNb(val));
        $('[data-change]', el).addEventListener('click', async () => {
          const [url] = stage(await pickFiles(false));
          if (url) { update(url); redraw(); }
        });
        $('[data-nb]', el)?.addEventListener('click', e => toggleNb(val, e.currentTarget, thumb));
        break;
      }
      case 'images': {
        const list = Array.isArray(val) ? val : [];
        const fixed = extra; // nombre fixe de photos (ex. trio)
        el.innerHTML = `${head}<div class="img-grid">${list.map((u, i) => `
          <div class="img-tile">${focusPicker(u, `<img alt="" src="${esc(src(u))}" class="${isNb(u) ? 'nb' : ''}">`)}
            <div class="tools">
              ${nbButton(u, '', '◐', i)}
              ${fixed ? '' : `<button type="button" data-a="left" data-i="${i}" title="Déplacer avant">←</button>`}
              <button type="button" data-a="swap" data-i="${i}" title="Remplacer">↻</button>
              ${fixed ? '' : `<button type="button" data-a="del" data-i="${i}" title="Supprimer">✕</button>`}
            </div></div>`).join('')}
          ${!fixed || list.length < fixed ? `<button type="button" class="add-tile"><b>+</b>Ajouter</button>` : ''}
          </div>${list.length ? '<small>Cliquez sur une photo pour choisir le point à garder visible.</small>' : ''}${foot}`;
        revealIn(rootObj, path, $$('.img-tile', el), popIn);
        el.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.hasAttribute('data-nb')) return toggleNb(list[Number(b.dataset.i)], b, $('img', b.closest('.img-tile')));
          const arr = [...list];
          if (b.classList.contains('add-tile')) {
            const urls = stage(await pickFiles(!fixed));
            if (!urls.length) return;
            const next = fixed ? arr.concat(urls).slice(0, fixed) : arr.concat(urls);
            markReveal(rootObj, path, arr.length, next.length);
            update(next);
          } else {
            const i = Number(b.dataset.i);
            if (b.dataset.a === 'del') { await popOut(b.closest('.img-tile')); arr.splice(i, 1); }
            if (b.dataset.a === 'left' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
            if (b.dataset.a === 'swap') {
              const [url] = stage(await pickFiles(false));
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
        </div>${val ? `<div>${nbButton(val, 'btn btn-ghost btn-sm nb-btn', '◐ Fond choisi en noir et blanc')}</div>` : ''}
        <small>Choisissez un fond de la bibliothèque ou envoyez votre propre photo.</small>`;
        $$('.bg-choice', el).forEach(t => $('img', t).classList.toggle('nb', isNb(t.dataset.url)));
        el.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.hasAttribute('data-nb')) return toggleNb(val, b, $('.bg-choice.selected img', el));
          if (b.hasAttribute('data-upload')) {
            const [url] = stage(await pickFiles(false));
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
        revealIn(rootObj, path, $$('.color', el), popIn);
        el.addEventListener('input', e => {
          if (e.target.type !== 'color') return;
          list[e.target.dataset.i] = e.target.value.toUpperCase();
          e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
          update([...list]);
        });
        el.addEventListener('click', async e => {
          if (e.target.closest('[data-add]')) { markReveal(rootObj, path, list.length); update([...list, '#C8A86B']); redraw(); }
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
        revealIn(rootObj, path, $$('.string-row', el), row => { unfold(row); $('input', row).focus({ preventScroll: true }); });
        el.addEventListener('input', e => { if (e.target.dataset.i != null) { list[e.target.dataset.i] = e.target.value; update([...list]); } });
        el.addEventListener('click', async e => {
          if (e.target.closest('[data-add]')) { markReveal(rootObj, path, list.length); update([...list, '']); redraw(); }
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
        revealIn(rootObj, path, $$(':scope > .item', el), card => {
          // Le nouvel élément reste visible : on le fait entrer dans l'écran s'il apparaît plus bas
          const r = card.getBoundingClientRect(); // mesuré avant l'animation (hauteur finale)
          unfold(card);
          if (r.bottom > innerHeight) scrollBy({ top: r.bottom - innerHeight + 40, behavior: reduce ? 'auto' : 'smooth' });
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'btn btn-ghost btn-sm'; add.textContent = '+ Ajouter';
        add.style.justifySelf = 'start';
        add.addEventListener('click', () => { list.push(clone(blank)); /* copie profonde : chaque élément a ses propres listes */ markReveal(rootObj, path, list.length - 1); update(list); redraw(); });
        el.append(add);
        set(rootObj, path, list);
        break;
      }
      case 'themes': {
        // Une carte par thème : miniature du hero (photo d'accueil réelle), nom, ambiance, pastilles, polices
        const hero = src(content.hero.fond) || '';
        const [p1, p2] = [content.couple.prenom1, content.couple.prenom2];
        el.innerHTML = `<div class="themes" role="radiogroup" aria-label="Thème du site">${MBTheme.THEMES.map(t => `
          <button type="button" class="theme-card" role="radio" aria-checked="${t.id === val}" data-theme-id="${esc(t.id)}">
            <span class="theme-thumb" style="--thumb-bg:url('${esc(hero)}');--thumb-accent:${t.pastilles[2]};--thumb-fade:${t.pastilles[0]}">
              <span><b style="font-family:'${esc(t.polices.titre)}',serif">${esc(p1)} <i>&amp;</i><br>${esc(p2)}</b><small>14 · 06</small></span>
            </span>
            <span class="theme-name">${esc(t.nom)}${t.modeConseille === 'light' ? '<em>Clair</em>' : ''}</span>
            <span class="theme-meta">${esc(t.ambiance)} · ${esc(t.polices.titre)} &amp; ${esc(t.polices.texte)}</span>
            <span class="swatch-row">${t.pastilles.map(c => `<span style="background:${c}"></span>`).join('')}</span>
          </button>`).join('')}</div>
          <small>Un clic applique le thème à l’aperçu et à cet espace. Rien n’est publié avant « Enregistrer ».</small>`;
        // Polices des miniatures
        MBTheme.THEMES.forEach(t => MBTheme.loadFonts(t.id));
        el.addEventListener('click', e => {
          const card = e.target.closest('.theme-card'); if (!card) return;
          const t = MBTheme.findTheme(card.dataset.themeId);
          // Thème clair par nature (Ivoire) : on propose son mode conseillé
          if (t.modeConseille && content.apparence.modeParDefaut !== 'auto') content.apparence.modeParDefaut = t.modeConseille;
          update(t.id);
          redraw();
        });
        break;
      }
    }
    return el;
  }

  // ---------- Apparence de l'admin (thème du couple + mode de l'admin) ----------
  function applyAppearance(fade = true) {
    const app = MBTheme.normalize(content.apparence);
    content.apparence = app;
    MBTheme.apply({ theme: app.theme, mode: MBTheme.resolveMode(app, 'admin') }, { fade }); // pas de fondu à l'ouverture
  }

  // =====================================================================
  // Aperçu en direct
  // =====================================================================
  const frame = $('.preview iframe');
  const device = $('.preview-device');
  const fit = $('.preview-fit');
  // Vraies largeurs d'écran (le site y applique ses points de rupture)
  const DEVICES = { mobile: 390, tablet: 820, desktop: 1440 };
  let previewReady = false;
  let previewQueued = false;

  // Envoie le brouillon à l'iframe (au plus une fois par image affichée)
  function sendPreview() {
    if (!previewReady || previewQueued || !content) return; // l'aperçu attend que le contenu soit chargé
    previewQueued = true;
    requestAnimationFrame(() => {
      previewQueued = false;
      frame.contentWindow?.postMessage({ type: 'mb:apercu', content, section: current }, ORIGIN); // le site applique le mode par défaut du thème
    });
  }
  addEventListener('message', e => {
    if (e.source !== frame.contentWindow || e.data?.type !== 'mb:apercu-pret') return;
    previewReady = true;
    sendPreview();
  });

  // Taille d'écran : l'appareil garde sa vraie largeur (le site y applique ses media queries)
  // et il est réduit pour tenir en entier dans la largeur du panneau, sans jamais être agrandi.
  // L'aperçu remplit toute la hauteur du panneau (on fait défiler le site dedans).
  const previewStage = $('.preview-stage');
  function fitDevice() {
    const avW = previewStage.clientWidth - 2, avH = previewStage.clientHeight - 2;   // 2 px : bordure du cadre
    if (avW <= 0 || avH <= 0) return;                                    // panneau masqué (onglet Modifier)
    const w = DEVICES[fit.dataset.device || 'mobile'];
    const scale = Math.min(1, avW / w);
    const devH = avH / scale;                                            // hauteur de l'appareil = hauteur du panneau
    device.style.setProperty('--dev-w', `${w}px`);
    device.style.setProperty('--dev-h', `${devH}px`);
    device.style.setProperty('--dev-scale', scale);
    fit.style.setProperty('--fit-w', `${w * scale}px`);
    fit.style.setProperty('--fit-h', `${devH * scale}px`);
  }
  new ResizeObserver(fitDevice).observe(previewStage);                          // fenêtre, colonne ou onglet qui change
  $$('[data-device]').forEach(b => b.addEventListener('click', () => {
    $$('[data-device]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    fit.dataset.device = b.dataset.device;
    fitDevice();
  }));
  addEventListener('resize', () => { measureBar(); fitDevice(); });
  const measureBar = () => document.body.style.setProperty('--bar-h', `${$('.bar').offsetHeight}px`);

  // Téléphone : onglets Modifier / Aperçu
  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    $$('[data-view]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('.workspace').dataset.view = b.dataset.view;
    if (b.dataset.view === 'preview') requestAnimationFrame(fitDevice);
  }));

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
    // Invités et Réponses ne modifient pas le site : pas d'aperçu
    const noPreview = tab.id === 'invites' || tab.id === 'reponses';
    $('.workspace').classList.toggle('no-preview', noPreview);
    document.body.classList.toggle('no-preview', noPreview);
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
    sendPreview(); // l'aperçu rejoint la section en cours d'édition
    requestAnimationFrame(fitDevice);
  }

  function inviteLink(slug) {
    const base = location.href.replace(/admin\/.*$/, '');
    const m = S.current.slug && !S.current.legacy ? `m=${encodeURIComponent(S.current.slug)}&` : ''; // site de ce mariage
    return `${base}?${m}invite=${encodeURIComponent(slug)}`;
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
    let rsvps, invites = [];
    try { [rsvps, invites] = await Promise.all([S.listRsvps(), S.listInvites().catch(() => [])]); }
    catch (e) { panel.innerHTML = `<p class="error">${esc(e.message)}</p>`; return; }
    const yes = rsvps.filter(r => r.present), no = rsvps.filter(r => !r.present);
    const guests = yes.reduce((n, r) => n + (r.nb_personnes || 0), 0);
    const kids = yes.reduce((n, r) => n + (r.enfants || 0), 0);
    const regimes = yes.filter(r => r.regime);
    const answeredInvites = new Set(rsvps.map(r => r.invite_id).filter(Boolean));
    const waiting = invites.filter(i => !answeredInvites.has(i.id)).length;
    const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    // Réponses aux questions personnalisées : [{ question, reponse }], seules les réponses remplies
    const answers = r => (Array.isArray(r.reponses) ? r.reponses : []).filter(a => a && a.question && String(a.reponse ?? '').trim());
    // Une colonne d'export par question (intitulés tels qu'ils étaient au moment de la réponse)
    const questionCols = [...new Set(rsvps.flatMap(r => answers(r).map(a => a.question)))];
    // Synthèse des moments (nombre de personnes attendues à chaque moment)
    const moments = {};
    yes.forEach(r => (r.moments || []).forEach(m => { moments[m] = (moments[m] || 0) + (r.nb_personnes || 0); }));

    panel.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${rsvps.length}</b><span>Réponses</span></div>
        <div class="stat gold"><b>${guests}</b><span>Couverts (présents)</span></div>
        <div class="stat"><b>${yes.length}</b><span>Oui</span></div>
        <div class="stat"><b>${no.length}</b><span>Non</span></div>
        <div class="stat"><b>${waiting}</b><span>En attente</span></div>
        <div class="stat"><b>${kids}</b><span>Dont enfants</span></div>
      </div>
      ${Object.keys(moments).length ? `<section class="group"><h2>Par moment</h2>
        ${Object.entries(moments).map(([m, n]) => `<p style="margin:0 0 6px">${esc(m)} — <b style="font-weight:500">${n}</b> personne${n > 1 ? 's' : ''}</p>`).join('')}</section>` : ''}
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

  // Enregistrer : envoi des photos en attente, remplacement de leurs adresses, puis publication
  async function save() {
    const btn = $('.save');
    btn.disabled = true; $('.cancel').disabled = true;
    try {
      const used = usedStrings(content);
      const toSend = [...pending.keys()].filter(u => used.has(u));
      for (let k = 0; k < toSend.length; k++) {
        btn.textContent = `Envoi des photos ${k + 1}/${toSend.length}…`;
        const blobUrl = toSend[k];
        const url = await S.uploadPhoto(await compress(pending.get(blobUrl)));
        replaceUrl(content, blobUrl, url);
      }
      btn.textContent = 'Enregistrement…';
      pruneSettings();
      await S.saveContent(content);
      pending.forEach((_, u) => URL.revokeObjectURL(u));
      pending.clear();
      published = clone(content);
      MBTheme.remember(content.apparence);
      setDirty(false);
      $('.save-state').textContent = 'Enregistré ✓';
      toast('Modifications publiées');
      renderTabs(); renderPanel();
    } catch (e) {
      btn.disabled = false; $('.cancel').disabled = false;
      toast(e.message || 'Enregistrement impossible', true);
    }
    btn.textContent = 'Enregistrer';
  }
  $('.save').addEventListener('click', save);

  // Annuler : retour à la version publiée (les photos en attente sont oubliées)
  $('.cancel').addEventListener('click', () => {
    if (!confirm('Annuler toutes les modifications non enregistrées ?')) return;
    content = clone(published);
    pending.forEach((_, u) => URL.revokeObjectURL(u));
    pending.clear();
    document.body.classList.toggle('photos-nb', !!content.photos?.noirEtBlanc);
    applyAppearance();
    setDirty(false);
    renderTabs(); renderPanel();
    sendPreview();
    toast('Modifications annulées');
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (dirty) save(); }
  });
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('.logout').addEventListener('click', async () => {
    if (dirty && !confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
    await S.logout(); location.reload();
  });

  // Commutateur clair / sombre de l'admin (mémorisé pour l'admin uniquement)
  MBTheme.bindSwitch($('.side .mode-switch'), { scope: 'admin' });

  // ---------- Démarrage ----------
  async function start() {
    content = await S.loadContent({ admin: true }); // le mariage dont ce compte est propriétaire
    content.apparence = MBTheme.normalize(content.apparence);
    // « Voir le site » et l'aperçu ouvrent bien le site de CE mariage
    const q = S.current.slug && !S.current.legacy ? `?m=${encodeURIComponent(S.current.slug)}` : '';
    $('.side-foot a.link').href = `../${q}`;
    published = clone(content);
    MBTheme.remember(content.apparence);
    document.body.classList.toggle('photos-nb', !!content.photos?.noirEtBlanc);
    $('.login').hidden = true;
    $('.app').hidden = false;
    $('.demo-banner').hidden = S.live;
    $('.logout').hidden = !S.live;
    $('.workspace').dataset.view = 'edit';
    applyAppearance(false);
    renderTabs(); renderPanel();
    measureBar(); fitDevice();
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
