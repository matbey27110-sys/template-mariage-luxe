// Couche de données partagée par le site et l'admin.
// Avec Supabase configuré : base multi-couples (table « mariages ») + stockage des photos par mariage.
// Sans Supabase : mode démo (localStorage du navigateur).
//
// Quel mariage afficher ? Dans l'ordre :
//   1. ?m=<slug> dans l'adresse (ex. site.fr/?m=alexandra-loic) ;
//   2. le nom de domaine, s'il est renseigné dans la colonne « domaine » ;
//   3. le slug par défaut de js/config.js (MARIAGE_CONFIG.mariage) ;
//   4. s'il n'existe qu'un seul mariage, celui-là.
// Dans l'admin : le mariage dont le compte connecté est propriétaire.
//
// Compatibilité : tant que le nouveau schéma (supabase/schema.sql) n'a pas été lancé,
// l'ancienne table « site » à une seule ligne est utilisée automatiquement.
(function () {
  const cfg = window.MARIAGE_CONFIG || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const KEYS = { content: 'mariage.content', invites: 'mariage.invites', rsvps: 'mariage.rsvps' };

  // Mariage courant (rempli au chargement du contenu)
  const current = { id: null, slug: null, legacy: false };
  const slugParam = () => (new URLSearchParams(location.search).get('m') || '').toLowerCase();

  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('Stockage du navigateur plein : en mode démo, utilisez des photos plus légères.'); }
  }

  // Les nouvelles clés du modèle apparaissent même si le client a un ancien contenu enregistré
  function merge(base, over) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return over ?? base;
    const out = { ...base };
    for (const k in over || {}) out[k] = merge(base[k], over[k]);
    return out;
  }

  function slugify(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  // La table « mariages » n'existe pas encore (ancien schéma) ?
  const missingTable = error => error && (error.code === '42P01' || error.code === 'PGRST205' || /mariages/.test(error.message || '') && /exist|find/i.test(error.message || ''));

  // Allège les photos avant l'envoi (une photo de téléphone fait souvent 4 à 8 Mo) :
  // 2400 px maximum sur le grand côté, JPEG qualité 0,82. Assez net pour un plein écran Retina.
  // Les PNG (transparence possible) et les fichiers déjà légers ne sont pas touchés.
  async function shrinkPhoto(file, max = 2400, quality = .82) {
    if (!/^image\/(jpeg|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
    try {
      const bmp = await createImageBitmap(file); // respecte l'orientation de la photo
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 700 * 1024) return file;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch { return file; } // en cas de souci, on envoie l'original
  }

  // Favicon (icône d'onglet) aux initiales des mariés — partagé par le site et l'admin.
  // Couleurs reprises du thème actif (tokens), pour rester cohérent avec le site.
  function faviconFor(initiales) {
    const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const css = getComputedStyle(document.documentElement);
    const tok = (n, d) => (css.getPropertyValue(n).trim() || d).replace(/'/g, '');
    const bg = tok('--nuit-bg', '#000000'), ink = tok('--nuit-ink', '#F4EDE2'), accent = tok('--nuit-accent', '#C8A86B');
    const [a, b] = String(initiales || '').split('|').map(s => s.trim());
    const font = `font-family='Blasse,Didot,Georgia,serif' fill='${ink}' text-anchor='middle'`;
    const inner = b !== undefined
      ? `<g ${font} font-size='30'><text x='19' y='42'>${e(a)}</text><text x='45' y='42'>${e(b)}</text></g><rect x='31.5' y='18' width='1' height='27' fill='${accent}'/>`
      : `<text x='32' y='42' ${font} font-size='${String(initiales || '').length > 2 ? 20 : 28}'>${e(initiales)}</text>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${bg}'/>${inner}</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  function setFavicon(initiales) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/svg+xml';
    link.href = faviconFor(initiales);
  }

  // ---------- Chargement du mariage ----------
  async function loadPublic() {
    const cols = 'id, slug, content';
    const tries = [];
    if (slugParam()) tries.push(q => q.eq('slug', slugParam()));
    tries.push(q => q.eq('domaine', location.hostname));
    if (cfg.mariage) tries.push(q => q.eq('slug', String(cfg.mariage).toLowerCase()));
    for (const t of tries) {
      const { data, error } = await t(sb.from('mariages').select(cols)).limit(1);
      if (missingTable(error)) return null;            // ancien schéma
      if (error) throw error;
      if (data && data[0]) return data[0];
    }
    // Un seul mariage dans la base : c'est forcément lui
    const { data, error } = await sb.from('mariages').select(cols).limit(2);
    if (missingTable(error)) return null;
    if (error) throw error;
    if (data && data.length === 1) return data[0];
    throw new Error('Mariage introuvable : vérifiez l’adresse du site (?m=…).');
  }

  async function loadOwned() {
    const { data: u } = await sb.auth.getUser();
    const { data, error } = await sb.from('mariages').select('id, slug, content').eq('owner_id', u.user?.id).limit(1);
    if (missingTable(error)) return null;
    if (error) throw error;
    if (!data || !data[0]) throw new Error('Aucun mariage n’est rattaché à ce compte. Contactez MB Design.');
    return data[0];
  }

  async function legacyLoad() {
    current.legacy = true;
    const { data, error } = await sb.from('site').select('content').eq('id', 1).single();
    if (error) throw error;
    return data.content || {};
  }

  window.MariageStore = {
    live,
    slugify,
    setFavicon,
    current,

    // Paramètre d'adresse à ajouter aux liens (ex. liens invités) quand le mariage est choisi par ?m=
    siteQuery() { return slugParam() ? `m=${encodeURIComponent(slugParam())}` : ''; },

    async loadContent({ admin = false } = {}) {
      if (!live) return merge(window.MARIAGE_DEFAULT, readLocal(KEYS.content, {}));
      const row = admin ? await loadOwned() : await loadPublic();
      if (!row) return merge(window.MARIAGE_DEFAULT, await legacyLoad());
      Object.assign(current, { id: row.id, slug: row.slug, legacy: false });
      return merge(window.MARIAGE_DEFAULT, row.content || {});
    },

    async saveContent(content) {
      if (!live) return writeLocal(KEYS.content, content);
      const now = new Date().toISOString();
      const { error } = current.legacy
        ? await sb.from('site').update({ content, updated_at: now }).eq('id', 1)
        : await sb.from('mariages').update({ content, updated_at: now }).eq('id', current.id);
      if (error) throw error;
    },

    async getInvite(slug) {
      if (!slug) return null;
      if (!live) return readLocal(KEYS.invites, []).find(i => i.slug === slug.toLowerCase()) || null;
      const { data } = current.legacy
        ? await sb.rpc('get_invite', { p_slug: slug })
        : await sb.rpc('get_invite', { p_mariage: current.slug, p_slug: slug });
      return data && data[0] || null;
    },

    async submitRsvp(payload, content) {
      if (live) {
        const { error } = await sb.rpc('submit_rsvp', { p: { ...payload, mariage: current.slug } });
        if (error) throw new Error(error.message);
        return;
      }
      const limite = content.rsvp.dateLimite;
      if (limite && new Date() > new Date(limite + 'T23:59:59')) throw new Error('La date limite de réponse est dépassée.');
      const list = readLocal(KEYS.rsvps, []);
      list.unshift({ ...payload, id: uid(), created_at: new Date().toISOString() });
      writeLocal(KEYS.rsvps, list);
    },

    // ---------- Admin ----------
    async session() {
      if (!live) return { demo: true };
      const { data } = await sb.auth.getSession();
      return data.session;
    },
    async login(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (!error) return;
      const messages = {
        invalid_credentials: 'Email ou mot de passe incorrect.',
        email_not_confirmed: 'Ce compte n’est pas confirmé (Supabase > Authentication > Users).',
        email_provider_disabled: 'La connexion par email est désactivée dans Supabase (Authentication > Sign In / Providers > Email).',
      };
      throw new Error(messages[error.code] || `Connexion impossible : ${error.message}`);
    },
    async logout() { if (live) await sb.auth.signOut(); },

    async uploadPhoto(file) {
      file = await shrinkPhoto(file);
      if (!live) {
        return new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      }
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = current.legacy ? name : `${current.id}/${name}`; // un dossier par mariage
      const { error } = await sb.storage.from('photos').upload(path, file, { cacheControl: '31536000' });
      if (error) throw error;
      return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
    },

    async listInvites() {
      if (!live) return readLocal(KEYS.invites, []);
      let q = sb.from('invites').select('*').order('nom');
      if (!current.legacy) q = q.eq('mariage_id', current.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async addInvite(nom, max) {
      const base = slugify(nom) || 'invite';
      const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const row = { nom, slug, max_personnes: max };
      if (!live) {
        const list = readLocal(KEYS.invites, []);
        list.push({ ...row, id: uid() });
        return writeLocal(KEYS.invites, list);
      }
      const { error } = await sb.from('invites').insert(current.legacy ? row : { ...row, mariage_id: current.id });
      if (error) throw error;
    },
    async deleteInvite(id) {
      if (!live) return writeLocal(KEYS.invites, readLocal(KEYS.invites, []).filter(i => i.id !== id));
      const { error } = await sb.from('invites').delete().eq('id', id);
      if (error) throw error;
    },

    async listRsvps() {
      if (!live) return readLocal(KEYS.rsvps, []);
      let q = sb.from('rsvps').select('*').order('created_at', { ascending: false });
      if (!current.legacy) q = q.eq('mariage_id', current.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async deleteRsvp(id) {
      if (!live) return writeLocal(KEYS.rsvps, readLocal(KEYS.rsvps, []).filter(r => r.id !== id));
      const { error } = await sb.from('rsvps').delete().eq('id', id);
      if (error) throw error;
    },
  };
})();
