// Moteur de thèmes — partagé par le site invités et le back-office.
// - applique un thème (data-theme) et un mode (data-mode) sur <html> ;
// - charge les polices du thème (catalogue themes/index.js) ;
// - gère le commutateur clair / sombre (role="switch") et la mémorisation du choix ;
// - met en cache l'apparence pour que le script anti-flash du <head> l'applique avant le premier rendu.
//
// Réglages du couple, enregistrés dans Supabase avec le contenu :
//   content.apparence = { theme: 'noir-or', modeParDefaut: 'dark' | 'light' | 'auto', afficherCommutateur: true }
(function () {
  const root = document.documentElement;
  const THEMES = window.MB_THEMES || [];
  const DEFAULT = { theme: 'noir-or', modeParDefaut: 'dark', afficherCommutateur: true };
  const KEY_CACHE = 'mb.apparence';                 // dernière apparence vue (pour le script anti-flash)
  const keyMode = scope => `mb.mode.${scope}`;       // choix du visiteur : 'site' ou 'admin'

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const prefersDark = () => !window.matchMedia || matchMedia('(prefers-color-scheme: dark)').matches;
  const findTheme = id => THEMES.find(t => t.id === id) || THEMES[0] || { id: DEFAULT.theme };

  function normalize(app) {
    const a = { ...DEFAULT, ...(app || {}) };
    if (!THEMES.some(t => t.id === a.theme)) a.theme = DEFAULT.theme;
    if (!['dark', 'light', 'auto'].includes(a.modeParDefaut)) a.modeParDefaut = DEFAULT.modeParDefaut;
    a.afficherCommutateur = a.afficherCommutateur !== false;
    return a;
  }

  // Mode à afficher : choix mémorisé du visiteur (si le commutateur est proposé), sinon le défaut du couple
  function resolveMode(app, scope) {
    const a = normalize(app);
    const saved = store.get(keyMode(scope));
    if ((a.afficherCommutateur || scope === 'admin') && (saved === 'dark' || saved === 'light')) return saved;
    if (a.modeParDefaut === 'auto') return prefersDark() ? 'dark' : 'light';
    return a.modeParDefaut;
  }

  // Polices du thème : une seule feuille Google Fonts, ajoutée une fois
  function loadFonts(themeId) {
    const t = findTheme(themeId);
    if (!t.fontsUrl || document.querySelector(`link[data-theme-fonts="${t.id}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = t.fontsUrl; l.dataset.themeFonts = t.id;
    document.head.appendChild(l);
  }

  // Applique thème + mode. fade : transition douce des couleurs (~300 ms) pendant la bascule.
  function apply({ theme, mode }, { fade = false } = {}) {
    if (fade && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-fading');
      clearTimeout(apply._t);
      apply._t = setTimeout(() => root.classList.remove('theme-fading'), 400);
    }
    if (theme) { root.dataset.theme = findTheme(theme).id; loadFonts(root.dataset.theme); }
    if (mode) root.dataset.mode = mode;
    // Couleur de la barre du navigateur : celle du thème (token --theme-color)
    requestAnimationFrame(() => {
      const c = getComputedStyle(root).getPropertyValue('--theme-color').trim();
      const meta = document.querySelector('meta[name="theme-color"]');
      if (c && meta) meta.setAttribute('content', c);
    });
    document.querySelectorAll('.mode-switch').forEach(syncSwitch);
  }

  function syncSwitch(btn) {
    const dark = root.dataset.mode !== 'light';
    btn.setAttribute('aria-checked', String(dark));
    btn.title = dark ? 'Passer en mode clair' : 'Passer en mode sombre';
  }

  // Commutateur : clic ou clavier (Espace / Entrée, natif sur <button>) → bascule et mémorise
  function bindSwitch(btn, { scope, persist = true, onChange } = {}) {
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    syncSwitch(btn);
    btn.addEventListener('click', () => {
      const mode = root.dataset.mode === 'light' ? 'dark' : 'light';
      apply({ mode }, { fade: true });
      if (persist) store.set(keyMode(scope), mode);
      onChange?.(mode);
    });
  }

  // Le site garde en cache l'apparence publiée : le script du <head> l'applique dès la visite suivante
  function remember(app) {
    const a = normalize(app);
    store.set(KEY_CACHE, JSON.stringify({ theme: a.theme, modeParDefaut: a.modeParDefaut, afficherCommutateur: a.afficherCommutateur }));
  }

  window.MBTheme = { THEMES, DEFAULT, normalize, resolveMode, apply, bindSwitch, remember, findTheme, loadFonts };
})();
