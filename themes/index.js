// Catalogue des thèmes — utilisé par js/theme.js et par la page « Apparence » de l'admin (cartes).
// Un thème ne change QUE les couleurs : polices et formes sont communes à tous (css/tokens.css).
// Ajouter un thème : créer themes/<id>.css (mêmes tokens de couleur que noir-or.css) puis ajouter une entrée ici.
window.MB_THEMES = [
  {
    id: 'noir-or',
    nom: 'Noir & Or',
    ambiance: 'Noir pur, or champagne, touches bordeaux',
    modeConseille: 'dark',
    pastilles: ['#000000', '#3A0A0E', '#C8A86B', '#E6CF9C', '#F4EDE2'],
  },
  {
    id: 'bordeaux',
    nom: 'Bordeaux',
    ambiance: 'Bordeaux profond, or champagne',
    modeConseille: 'dark',
    pastilles: ['#3A0A0E', '#5E0B12', '#C8A86B', '#E9E0D2', '#000000'],
  },
  {
    id: 'emeraude',
    nom: 'Émeraude',
    ambiance: 'Vert émeraude, or champagne',
    modeConseille: 'dark',
    pastilles: ['#0E2A22', '#1B4436', '#C8A86B', '#F4EDE2', '#000000'],
  },
  {
    id: 'nuit-bleue',
    nom: 'Nuit bleue',
    ambiance: 'Bleu nuit, or pâle et argent',
    modeConseille: 'dark',
    pastilles: ['#0B1220', '#18243D', '#E6CF9C', '#C9CED8', '#F1EEE8'],
  },
  {
    id: 'ivoire',
    nom: 'Ivoire',
    ambiance: 'Lin et ivoire, taupe, or champagne',
    modeConseille: 'light',
    pastilles: ['#E9E0D2', '#F4EDE2', '#8B7A69', '#C8A86B', '#000000'],
  },
];
