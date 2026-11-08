// Catalogue des thèmes — utilisé par js/theme.js (polices) et par la page « Apparence » de l'admin (cartes).
// Ajouter un thème : créer themes/<id>.css (mêmes tokens que noir-or.css) puis ajouter une entrée ici.
window.MB_THEMES = [
  {
    id: 'noir-or',
    nom: 'Noir & Or',
    ambiance: 'Gala, chandelles',
    modeConseille: 'dark',
    pastilles: ['#000000', '#3A0A0E', '#C8A86B', '#E6CF9C', '#F4EDE2'],
    polices: { titre: 'Blasse', texte: 'Afacad Flux' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Afacad+Flux:slnt,wght@-14..14,100..1000&display=swap',
  },
  {
    id: 'bordeaux',
    nom: 'Bordeaux',
    ambiance: 'Maison Rouge, velours',
    modeConseille: 'dark',
    pastilles: ['#3A0A0E', '#5E0B12', '#C8A86B', '#E9E0D2', '#000000'],
    polices: { titre: 'Bodoni Moda', texte: 'Jost' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500&display=swap',
  },
  {
    id: 'emeraude',
    nom: 'Émeraude',
    ambiance: 'Jardin, palais italien',
    modeConseille: 'dark',
    pastilles: ['#0E2A22', '#1B4436', '#C8A86B', '#F4EDE2', '#000000'],
    polices: { titre: 'Gilda Display', texte: 'Jost' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Gilda+Display&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500&display=swap',
  },
  {
    id: 'nuit-bleue',
    nom: 'Nuit bleue',
    ambiance: 'Soirée étoilée',
    modeConseille: 'dark',
    pastilles: ['#0B1220', '#18243D', '#E6CF9C', '#C9CED8', '#F1EEE8'],
    polices: { titre: 'Italiana', texte: 'Jost' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Italiana&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500&display=swap',
  },
  {
    id: 'ivoire',
    nom: 'Ivoire',
    ambiance: 'Cérémonie de jour, épuré',
    modeConseille: 'light',
    pastilles: ['#E9E0D2', '#F4EDE2', '#8B7A69', '#C8A86B', '#000000'],
    polices: { titre: 'Cormorant Garamond', texte: 'Afacad Flux' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Afacad+Flux:slnt,wght@-14..14,100..1000&display=swap',
  },
];
