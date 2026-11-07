// Contenu de démonstration : c'est aussi la structure complète éditée dans /admin.
window.MARIAGE_FONDS = [
  { nom: 'Salle illuminée', url: 'assets/fonds/salle-illuminee.jpg' },
  { nom: 'Salle de bal', url: 'assets/fonds/salle-de-bal.jpg' },
  { nom: 'Chandelles', url: 'assets/fonds/chandelles.jpg' },
  { nom: 'Roses', url: 'assets/fonds/roses.jpg' },
  { nom: 'Plage noire', url: 'assets/fonds/plage-noire.jpg' },
];

window.MARIAGE_DEFAULT = {
  couple: {
    prenom1: 'Alessandra',
    prenom2: 'Lorenzo',
    initiales: 'A|L',
  },
  hero: {
    surtitre: 'Bienvenue à notre célébration',
    date: '2027-06-14',
    heure: '16:00',
    lieu: 'Lac de Côme, Italie',
    fond: 'assets/fonds/salle-illuminee.jpg',
    assombrissement: 0.7,
    compteARebours: true,
    bouton: 'Confirmer ma présence',
  },
  histoire: {
    active: true,
    surtitre: 'Notre histoire',
    titre: 'Une rencontre',
    titreItalique: 'inoubliable',
    photoPleinEcran: 'assets/demo/histoire.jpg',
    texte: "Tout a commencé un soir d'été, au détour d'une terrasse à Milan. Un regard, un rire partagé, puis des milliers d'autres. Sept ans plus tard, nous avons choisi de nous dire oui, entourés de celles et ceux qui comptent le plus pour nous.",
    photos: ['assets/demo/duo-1.jpg', 'assets/demo/duo-2.jpg', 'assets/demo/duo-3.jpg'],
  },
  grandJour: {
    active: true,
    surtitre: 'Le 14 juin 2027',
    titre: 'Le grand',
    titreItalique: 'jour',
    texte: 'Une journée pour célébrer l’amour, la famille et l’amitié, sur les rives du lac de Côme.',
    photo: 'assets/demo/grand-jour.jpg',
  },
  programme: {
    active: true,
    titre: 'Le programme',
    items: [
      { heure: '15:30', titre: 'Accueil des invités', description: 'Rafraîchissements dans les jardins de la villa.' },
      { heure: '16:00', titre: 'Cérémonie', description: 'Sur la terrasse face au lac.' },
      { heure: '17:30', titre: 'Cocktail', description: 'Champagne, musique live et coucher de soleil.' },
      { heure: '20:00', titre: 'Dîner de gala', description: 'Dans la grande salle illuminée.' },
      { heure: '23:00', titre: 'Ouverture du bal', description: 'Jusqu’au bout de la nuit.' },
    ],
  },
  lieux: {
    active: true,
    titre: 'Les lieux',
    items: [
      { type: 'Cérémonie & réception', nom: 'Villa del Balbianello', adresse: 'Via Comoedia 5, 22016 Tremezzina CO, Italie', info: 'Navette depuis Côme à 14:45.' },
      { type: 'Hébergement conseillé', nom: 'Grand Hotel Tremezzo', adresse: 'Via Regina 8, 22016 Tremezzina CO, Italie', info: 'Code « AL2027 » pour un tarif préférentiel.' },
    ],
  },
  dressCode: {
    active: true,
    titre: 'Dress code',
    sousTitre: 'Black tie',
    texte: 'Smoking ou costume sombre pour ces messieurs, robe longue pour ces dames. Nous vous invitons à jouer avec ces teintes.',
    couleurs: ['#0B0A09', '#5E0B12', '#C8A86B', '#E6CF9C', '#F4EDE2'],
  },
  galerie: {
    active: true,
    titre: 'Galerie',
    photos: [
      'assets/demo/galerie-1.jpg', 'assets/demo/galerie-2.jpg', 'assets/demo/galerie-3.jpg',
      'assets/demo/galerie-4.jpg', 'assets/demo/galerie-5.jpg', 'assets/demo/galerie-6.jpg',
    ],
  },
  rsvp: {
    active: true,
    titre: 'Serez-vous des nôtres ?',
    texte: 'Merci de nous répondre avant le 1er avril 2027.',
    dateLimite: '2027-04-01',
    maxParDefaut: 2,
    moments: ['Cérémonie', 'Cocktail', 'Dîner', 'Brunch du lendemain'],
    demanderEnfants: true,
    demanderChanson: true,
    // Questions ajoutées par les mariés : { question, type: 'texte' | 'liste', options: [], obligatoire, pourTous }
    questions: [],
  },
  footer: {
    photo: 'assets/demo/footer.jpg',
    message: 'Merci de faire partie de notre histoire',
  },
};
