// Connexion Supabase (un seul projet pour tous les mariages).
// Laisser supabaseUrl / supabaseAnonKey vides = mode démo : le contenu et les RSVP sont enregistrés dans le navigateur.
window.MARIAGE_CONFIG = {
  supabaseUrl: 'https://bwyjxezixqviwawgbckp.supabase.co',
  supabaseAnonKey: 'sb_publishable_-L4Mr1SrttVFDv_7mALaLw_DaJD09l3',
  // Mariage affiché par défaut à la racine du site (slug de la table « mariages »).
  // Vide : on utilise ?m=<slug> dans l'adresse, ou le nom de domaine, ou le seul mariage existant.
  mariage: '',
};
