# Template site mariage — Luxe

Template de site de mariage haut de gamme, revendu / livré à des clients.
Chaque couple peut modifier ses photos, ses textes, **son thème**, et gérer ses RSVP depuis un back-office simple, **avec un aperçu en direct avant d'enregistrer**.

Références : `references/1.jpg` (hero sombre, chandelier), `references/2.webp` (Maison Rouge, bordeaux), `references/3.jpg` (Leo Spin, photos plein écran + sections crème).

> ⚠️ **Nouveautés de cette version du brief** (prioritaires, détaillées en §7, §8, §9) :
> 1. **Noir pur `#000000`** partout (site invités + back-office).
> 2. **Commutateur clair / sombre** (toggle switch) à la place du bouton noir et blanc.
> 3. **Système de thèmes** choisi par le couple dans le back-office ; le back-office prend le thème choisi.
> 4. **Aperçu en direct** dans le back-office avant d'enregistrer (photos, textes, thème).

---

## 1. Ce que tu m'as demandé (récap)

### Hero (inspiré de l'image 1)
- Photo plein écran sombre, voile dégradé noir pour la lisibilité.
- Textes en français :
  - « BIENVENUE À NOTRE CÉLÉBRATION »
  - **PRÉNOM & PRÉNOM** (le « & » en doré)
  - date `14 · 06 · 2027`
  - lieu `LAC DE CÔME, ITALIE`
  - petit ornement doré + « DÉFILER » avec une fine ligne animée.
- **Compte à rebours** sous la date (jours / heures / minutes / secondes).
  - Activable / désactivable dans le back-office.
  - Date obligatoire, heure facultative (sans heure → compte jusqu'à minuit du jour J, et on n'affiche que les jours).
  - Le jour J : message « C'est aujourd'hui ! » ; après : « Merci d'avoir partagé ce jour avec nous ».
- **Image de fond au choix** dans le back-office : une bibliothèque de fonds fournis (salle de bal, roses, chandelles, jardin…) **ou** upload de leur propre photo. Réglage de l'assombrissement (curseur) — **visible en direct dans l'aperçu**.
- Bouton **« Confirmer ma présence »** (voir recommandation §3).
- Monogramme en haut à gauche (`A|L`) + menu burger.
- **Commutateur clair / sombre** dans le header, à côté du burger (voir §8).
- Bouton flottant (téléphone / contact) en bas à droite — optionnel.

### Photos plein écran des mariés (inspiré de l'image 3)
- Section(s) photo pleine largeur avec titre superposé (ex. « NOTRE *Histoire* », « LE *Grand* JOUR »), mélange capitales + italique.
- Grille de 3 photos encadrées (petit liseré) façon « Timeless Elegance ».
- Les photos sont toutes remplaçables depuis le back-office.

### Footer (inspiré de l'image 1, partie basse)
- Grande photo de fond avec un **flou au centre** (effet verre dépoli en cercle / ovale) et le **monogramme des initiales** posé dessus.
- Dessous : date, merci, liens rapides, mention « Site réalisé par MB Design ».

### Back-office
- Changer textes, photos, date/heure, activer/désactiver les sections.
- **Choisir le thème du site** (page *Apparence*, voir §9).
- **Aperçu en direct** de chaque modification avant enregistrement (voir §7).
- **Formulaire RSVP** : présent / absent, accompagné ou non, **sélection du nombre de personnes** (limite fixée par le couple, éventuellement par invité).
- Tableau des réponses + export CSV / Excel.
- Éléments utiles pour les futurs mariés (voir §4).

---

## 2. Direction artistique — « Nuit de Gala »

Sombre, chaud, éclairé à la bougie. On alterne des sections **nuit** (noir pur / couleur signature du thème) et des sections **ivoire** (respiration, comme Leo Spin) pour éviter un site entièrement noir et fatigant à lire.

### Couleurs — thème par défaut « Noir & Or »

| Rôle | Nom | Hex |
|---|---|---|
| Fond principal sombre | **Noir pur** | **`#000000`** |
| Fond secondaire sombre (touches) | Bordeaux nuit | `#3A0A0E` |
| Couleur signature (touches) | Bordeaux Maison | `#5E0B12` |
| Accent / survol | Grenat | `#8A1C24` |
| Accent luxe (&, filets, boutons) | Or champagne | `#C8A86B` |
| Or clair (reflets, dégradé) | Or pâle | `#E6CF9C` |
| Texte sur fond sombre / sections claires | Ivoire | `#F4EDE2` |
| Fond section claire | Lin | `#E9E0D2` |
| Texte secondaire | Taupe | `#8B7A69` |

Règles :
- **Tout ce qui est noir est `#000000`** — sur le site invités ET dans le back-office. Pas de `#0F0B0C`, `#111`, `#1a1a1a` ni de gris très foncé « presque noir ». La profondeur entre sections vient des photos, des filets dorés, du grain et de la couleur signature, pas d'un deuxième noir.
- L'or ne sert **que** pour les accents (jamais en gros aplat) ; couleur signature = surfaces secondaires et touches ; ivoire = texte et respiration.
- Les voiles sur photos utilisent `rgba(0,0,0,…)` (noir pur à opacité variable).

Les autres thèmes (Bordeaux, Émeraude, Nuit bleue, Ivoire) sont définis en §9.

### Typographies — ✅ Option A choisie (Google Fonts)
- Noms / grands titres : **Bodoni Moda** — ou **Italiana** pour le côté haut et étroit de l'image 1.
- Accents italiques (« *Elegance* », « *Histoire* ») : **Cormorant Garamond Italic**.
- Petites capitales espacées (BIENVENUE…, menus, boutons) : **Jost** 400–500, `letter-spacing: 0.3em`.
- Monogramme / « & » calligraphié (optionnel) : **Pinyon Script**.

(Options B et C conservées pour mémoire : B = DM Serif Display / Playfair + Inter / Manrope ; C = Ivy Presto, Canela, Ogg, Editorial New, Gilda Display.)

`apercu.html` montre les trois options avec la palette (moodboard initial en bordeaux — le site final est en noir & or).

---

## 3. RSVP : bouton → ancre ou pop-up ?

**Recommandation : bouton qui fait défiler en douceur jusqu'à la section RSVP** (+ lien partageable `site.com/#rsvp`).
- Sur mobile, un pop-up avec un long formulaire (nombre de personnes, allergies…) est pénible à scroller et se ferme par erreur.
- La section reste visible même pour ceux qui scrollent sans cliquer.
- Bonus : un **bouton flottant « RSVP »** discret apparaît après le hero, et disparaît une fois la réponse envoyée.

### Champs du formulaire
1. Nom et prénom (ou code invité, voir §4)
2. Je serai présent·e : Oui / Non
3. Accompagné·e ? → nombre de personnes (menu 1 à N, N fixé par le couple)
4. Prénoms des accompagnants
5. Enfants (nombre) — optionnel
6. Régime / allergies (végétarien, sans gluten, halal…)
7. Participation : cérémonie / cocktail / dîner / brunch du lendemain (cases à cocher, configurables)
8. Une chanson pour la piste de danse 🎶
9. Un petit mot pour les mariés
10. Email / téléphone pour recevoir la confirmation

---

## 4. Ce que je propose en plus

### Sections du site (toutes activables dans le back-office)
1. **Hero** + compte à rebours
2. **Notre histoire** — photo plein écran + texte, ou timeline (rencontre, demande…)
3. **Le programme** — déroulé de la journée avec heures et icônes fines dorées
4. **Les lieux** — carte, adresse, bouton « Itinéraire » (Google Maps / Waze), parking
5. **Dress code** — palette de couleurs souhaitées en pastilles + exemples
6. **Hébergements** — hôtels à proximité, codes de réduction
7. **Liste de mariage / urne** — lien externe ou RIB/Lydia/PayPal (avec message élégant)
8. **Galerie** — photos du couple (avant) puis photos du mariage (après)
9. **FAQ** — enfants acceptés ? photos pendant la cérémonie ? etc.
10. **RSVP**
11. **Footer** monogramme flouté

### Fonctions utiles pour les mariés
- **Code d'accès / mot de passe** pour le site (mariage privé).
- **Liste d'invités pré-remplie** : chaque invité a un lien perso (`/?invite=dupont`) → son nom est déjà rempli et le nombre max de personnes est limité à ce qui est prévu pour lui.
- **Date limite de réponse** : le formulaire se ferme automatiquement.
- **Notification email** aux mariés à chaque nouvelle réponse + email de confirmation à l'invité.
- **Tableau de bord** : total oui / non / en attente, nombre de couverts, régimes alimentaires, export CSV.
- **Ajouter au calendrier** (Google / Apple / Outlook) en un clic.
- **QR code** généré automatiquement à imprimer sur les faire-part (aux couleurs du thème).
- **Après le mariage** : les invités peuvent **déposer leurs photos** dans une galerie partagée.
- **Bilingue** FR / EN (et autre langue si besoin, ex. malgache) — V2.
- **Musique d'ambiance** discrète avec bouton on/off (désactivée par défaut).
- **Intro animée** : enveloppe ou rideau qui s'ouvre (déjà fait sur le site Valisoa & Sitraka, réutilisable).

### Détails « luxe » qui font la différence
- Légère texture grain sur les fonds sombres.
- Apparition des textes en fondu lent au scroll, effet parallax doux sur les photos.
- Particules de lumière / bokeh doré très subtiles sur le hero (désactivable).
- Filets dorés fins, ornements typographiques (❦) entre les sections.
- Bandeau défilant avec les prénoms (comme le marquee de Maison Rouge).
- Curseur personnalisé discret sur desktop.
- Respect de `prefers-reduced-motion` : animations réduites si l'utilisateur l'a demandé.

---

## 5. Back-end — proposition technique

**Retenu : site statique + Supabase**
- Front : HTML / CSS / JS (ou Astro) hébergé sur Netlify ou Vercel (gratuit).
- **Supabase** : base de données (contenus + RSVP + **thème choisi**), stockage des photos, connexion sécurisée des mariés.
- Page **`/admin`** faite sur mesure, **aux couleurs du thème choisi par le couple**, simple : onglets *Contenus · Photos · Apparence · Réglages · Invités · Réponses*.
- Pour un nouveau client : je crée son compte, je lui envoie l'accès → il remplit tout seul.
  - À étudier à l'étape d'architecture : **un seul code pour tous les mariages** (une ligne « mariage » par couple dans Supabase, sous-domaine ou slug par couple) plutôt que dupliquer le projet à chaque client. Plus simple à maintenir et à corriger.

Alternatives (écartées) : Decap CMS / Sanity / TinaCMS (moins sur mesure), WordPress (lourd).

---

## 6. Points décidés / à décider

1. ~~Typo~~ → **Option A** (Bodoni Moda · Cormorant Garamond Italic · Jost · Pinyon Script)
2. ~~Thème par défaut~~ → **Noir & Or**, noir pur `#000000`, bordeaux seulement en touches
3. ~~Back-end~~ → **Supabase sur mesure** (page `/admin` aux couleurs du thème)
4. ~~Langues~~ → **Français seul** pour la V1
5. ~~Mode clair / sombre~~ → **commutateur (toggle switch)** sur le site et dans l'admin
6. ~~Thèmes~~ → **5 thèmes** au choix du couple, chacun en clair + sombre (§9)
7. ~~Aperçu~~ → **aperçu en direct avant enregistrement** dans l'admin (§7)
8. Fonctions V1 (conseillé) : hero + compte à rebours, histoire, programme, lieux, dress code, RSVP avec liens invités, galerie, footer, back-office contenus / photos / apparence / RSVP, aperçu en direct, commutateur.
9. À trancher à l'architecture : un code partagé pour tous les couples ou un projet par couple (§5).

---

## 7. Aperçu en direct dans le back-office

**Objectif :** le couple voit exactement le rendu de sa modification **avant** d'enregistrer. Zéro aller-retour « enregistrer → aller voir le site → revenir corriger ».

- **Disposition :** formulaire d'édition à gauche, aperçu à droite. Sur mobile : onglets *Modifier* / *Aperçu*.
- **Vrai rendu :** l'aperçu affiche le **vrai site** (iframe de la page publique en mode aperçu, ou mêmes composants), pas une maquette approximative.
- **Mise à jour instantanée** à chaque frappe ou changement (texte, date, curseur d'assombrissement, section activée/désactivée, thème).
- **Photos :** quand le couple choisit une nouvelle photo, elle apparaît tout de suite dans l'aperçu via `URL.createObjectURL()` — **sans upload vers Supabase tant que ce n'est pas enregistré**. Upload seulement au clic sur « Enregistrer ».
- **Recadrage / point focal** de la photo réglable dans l'aperçu (pour qu'un visage ne soit pas coupé sur mobile).
- **Boutons d'appareil :** bureau / tablette / **mobile** (la plupart des invités ouvriront le site sur téléphone depuis le faire-part).
- **Défilement auto :** quand on édite une section (ex. Programme), l'aperçu défile jusqu'à cette section.
- **Actions :**
  - « **Enregistrer** » → publie sur le site.
  - « **Annuler les modifications** » → revient à la version publiée.
- **Indicateur** « Modifications non enregistrées » + alerte si le couple quitte la page sans enregistrer (`beforeunload`).
- Technique suggérée : un état « brouillon » côté admin, envoyé à l'iframe par `postMessage` ; la version publiée n'est modifiée qu'à l'enregistrement.

---

## 8. Commutateur clair / sombre

Remplace l'ancien bouton noir et blanc par un **vrai commutateur (toggle switch)**.

- **Design :** petit interrupteur fin aux couleurs du thème (piste avec filet or, pastille qui glisse), icônes soleil / lune très fines, transition douce (~300 ms). Doit avoir l'air d'un bijou, pas d'un composant système.
- **Où :** dans le header du site (à côté du burger) **et** dans le back-office.
- **Mode sombre :** fonds noir pur `#000000` + couleur signature du thème, texte ivoire, accents or.
- **Mode clair :** fonds ivoire / lin dominants, texte **noir pur `#000000`**, accents or légèrement plus foncé pour rester lisible (ex. `#A8884B`), couleur signature en touches. Les photos plein écran gardent leur voile sombre.
- **Mémorisation :** choix du visiteur dans `localStorage`. À la première visite : le mode par défaut choisi par le couple dans l'admin (sinon `prefers-color-scheme`).
- **Pas de flash** de la mauvaise couleur au chargement : mode appliqué via un petit script inline dans le `<head>` avant le premier rendu.
- **Accessibilité :** `role="switch"`, `aria-checked`, libellé « Mode sombre », utilisable au clavier, focus visible, contrastes WCAG AA dans les deux modes.
- Le couple peut aussi **masquer le commutateur** dans l'admin (site forcé en sombre ou en clair).

---

## 9. Système de thèmes (choisi par le couple)

- Basé sur des **design tokens** (variables CSS) : couleurs, typographies, rayons, espacements, style des boutons, ornements, intensité du grain.
- **Un fichier par thème** (ex. `themes/noir-or.css`) ; ajouter un thème = ajouter un fichier, sans toucher aux composants.
- Chaque thème existe en **version sombre et claire** (compatible avec le commutateur §8).
- **Le noir reste `#000000` dans tous les thèmes** ; c'est la couleur signature qui change.

| Thème | Couleur signature (sombre) | Accent | Fond clair | Ambiance |
|---|---|---|---|---|
| **Noir & Or** (défaut) | `#000000` + touches bordeaux `#3A0A0E` | Or champagne `#C8A86B` | Ivoire `#F4EDE2` | Gala, chandelles |
| **Bordeaux** | Bordeaux nuit `#3A0A0E` / `#5E0B12` | Or champagne | Lin `#E9E0D2` | Maison Rouge, velours |
| **Émeraude** | `#0E2A22` | Or champagne | Ivoire | Jardin, palais italien |
| **Nuit bleue** | `#0B1220` | Or pâle `#E6CF9C` / argent | Ivoire froid | Soirée étoilée |
| **Ivoire** (clair par défaut) | Taupe `#8B7A69` | Or champagne | Lin | Cérémonie de jour, épuré |

### Page « Apparence » dans le back-office
- Une **carte par thème** : miniature du hero, nom, pastilles de couleurs, aperçu des typos.
- Un clic applique le thème **dans l'aperçu en direct** (§7) ; rien n'est publié avant « Enregistrer ».
- Réglage du **mode par défaut** (sombre / clair) et option « afficher le commutateur aux invités ».
- **Le back-office adopte le thème choisi** (mêmes couleurs, typos, ornements) : le couple ressent l'ambiance de son site pendant qu'il travaille. Le back-office a aussi son propre commutateur clair / sombre.
- Le thème est **enregistré dans Supabase** (pas seulement dans le navigateur) et appliqué au site pour tous les invités.

---

## 10. Méthode de travail (pour Claude Code)

- Commencer en **mode plan** : présenter l'architecture (structure des fichiers, tables Supabase, stockage du thème, fonctionnement de l'aperçu, un code pour tous les couples ou non) et **attendre ma validation** avant de coder.
- Ordre des étapes :
  1. Tokens + thème Noir & Or + noir pur `#000000`
  2. Commutateur clair / sombre
  3. Système de thèmes (5 fichiers) + page *Apparence*
  4. Admin `/admin` + Supabase (connexion, contenus, photos)
  5. Aperçu en direct
  6. RSVP + tableau de bord + export
- **Avant chaque étape, me rappeler de faire un commit Git.** À la fin, proposer un message de commit et me dire quoi tester.
- Fournir des **fichiers complets**, pas des extraits à insérer.
- **Ne jamais écraser mes modifications.** Si un fichier que j'ai modifié doit être touché, le signaler d'abord.
- Le contenu (noms, date, lieux, textes, photos) ne doit **jamais** être codé en dur : tout vient de Supabase ou d'un fichier de données.
- Mobile d'abord : tester chaque section à 375 px de large.