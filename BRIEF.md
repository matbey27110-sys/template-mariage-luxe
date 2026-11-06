# Template site mariage — Luxe

Template de site de mariage haut de gamme, revendu / livré à des clients.
Chaque couple peut modifier ses photos, ses textes et gérer ses RSVP depuis un back-office simple.

Références : `references/1.jpg` (hero sombre, chandelier), `references/2.webp` (Maison Rouge, bordeaux), `references/3.jpg` (Leo Spin, photos plein écran + sections crème).

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
- **Image de fond au choix** dans le back-office : une bibliothèque de fonds fournis (salle de bal, roses, chandelles, jardin…) **ou** upload de leur propre photo. Réglage de l'assombrissement (curseur).
- Bouton **« Confirmer ma présence »** (voir recommandation §3).
- Monogramme en haut à gauche (`A|L`) + menu burger.
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
- **Formulaire RSVP** : présent / absent, accompagné ou non, **sélection du nombre de personnes** (limite fixée par le couple, éventuellement par invité).
- Tableau des réponses + export CSV / Excel.
- Éléments utiles pour les futurs mariés (voir §4).

---

## 2. Direction artistique proposée — « Nuit de Gala »

Sombre, chaud, éclairé à la bougie. On alterne des sections **nuit** (noir / bordeaux) et des sections **ivoire** (respiration, comme Leo Spin) pour éviter un site entièrement noir et fatigant à lire.

### Couleurs

| Rôle | Nom | Hex |
|---|---|---|
| Fond principal sombre | Noir velours | `#0F0B0C` |
| Fond secondaire sombre | Bordeaux nuit | `#3A0A0E` |
| Couleur signature | Bordeaux Maison | `#5E0B12` |
| Accent / survol | Grenat | `#8A1C24` |
| Accent luxe (&, filets, boutons) | Or champagne | `#C8A86B` |
| Or clair (reflets, dégradé) | Or pâle | `#E6CF9C` |
| Texte sur fond sombre / sections claires | Ivoire | `#F4EDE2` |
| Fond section claire | Lin | `#E9E0D2` |
| Texte secondaire | Taupe | `#8B7A69` |

Règles : l'or ne sert **que** pour les accents (jamais en gros aplat) ; bordeaux = surfaces ; ivoire = texte et respiration.
Le back-office pourra proposer 3 variantes de thème : **Bordeaux** (par défaut), **Émeraude** (`#0E2A22` + or), **Nuit bleue** (`#0B1220` + or).

### Typographies

**Option A — ✅ CHOISIE (gratuites, Google Fonts)**
- Noms / grands titres : **Bodoni Moda** (fins contrastes, très « haute couture ») — ou **Italiana** si tu veux le côté haut et étroit de l'image 1.
- Accents italiques (« *Elegance* », « *Histoire* ») : **Cormorant Garamond Italic**.
- Petites capitales espacées (BIENVENUE…, menus, boutons) : **Jost** ou **Montserrat** 400–500, `letter-spacing: 0.3em`.
- Monogramme / « & » calligraphié (optionnel) : **Pinyon Script**.

**Option B — plus éditorial, style Maison Rouge**
- Titres : **DM Serif Display** / **Playfair Display**
- Texte : **Inter** ou **Manrope**

**Option C — premium payantes (si tu veux te démarquer)**
- **Ivy Presto Display** / **Ivy Mode** (ce que l'image 3 évoque), **Canela**, **Ogg**, **Editorial New** (Pangram Pangram, gratuit en perso), **Gilda Display** (gratuite, bon équivalent).
- Avec Adobe Fonts (si tu as Creative Cloud) : *Ivy Presto*, *Bodoni URW*, *Orpheus Pro* sont incluses.

`apercu.html` montre les trois options avec la palette (moodboard initial, en bordeaux — le site final est en noir & or).

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
- **Liste d'invités pré-remplie** : chaque invité a un lien perso (`/?invite=dupont`) → son nom est déjà rempli et le nombre max de personnes est limité à ce qui est prévu pour lui. Évite les « +3 » surprises.
- **Date limite de réponse** : le formulaire se ferme automatiquement.
- **Notification email** aux mariés à chaque nouvelle réponse + email de confirmation à l'invité.
- **Tableau de bord** : total oui / non / en attente, nombre de couverts, régimes alimentaires, export CSV.
- **Ajouter au calendrier** (Google / Apple / Outlook) en un clic.
- **QR code** généré automatiquement à imprimer sur les faire-part.
- **Après le mariage** : les invités peuvent **déposer leurs photos** dans une galerie partagée.
- **Bilingue** FR / EN (et autre langue si besoin, ex. malgache) — utile pour les familles à l'étranger.
- **Musique d'ambiance** discrète avec bouton on/off (désactivée par défaut).
- **Intro animée** : enveloppe ou rideau qui s'ouvre (déjà fait sur le site Valisoa & Sitraka, réutilisable).

### Détails « luxe » qui font la différence
- Légère texture grain sur les fonds sombres.
- Apparition des textes en fondu lent au scroll, effet parallax doux sur les photos.
- Particules de lumière / bokeh doré très subtiles sur le hero (désactivable).
- Filets dorés fins, ornements typographiques (❦) entre les sections.
- Bandeau défilant avec les prénoms (comme le marquee de Maison Rouge).
- Curseur personnalisé discret sur desktop.

---

## 5. Back-end — proposition technique

**Recommandé : site statique + Supabase**
- Front : HTML / CSS / JS (ou Astro) hébergé sur Netlify ou Vercel (gratuit).
- **Supabase** : base de données (contenus + RSVP), stockage des photos, connexion sécurisée des mariés.
- Page **`/admin`** faite sur mesure, aux couleurs du template, simple : onglets *Contenus · Photos · Réglages · Invités · Réponses*.
- Pour un nouveau client : je duplique le projet, je crée son compte, je lui envoie l'accès → il remplit tout seul.

Alternatives :
- **Décap CMS / Sanity / TinaCMS** : back-office tout fait, plus rapide à mettre en place mais moins « sur mesure » visuellement.
- **WordPress** : plus lourd, mais connu des clients.

---

## 6. Points à décider

1. ~~Typo : option A, B ou C ?~~ → **Option A** (Bodoni Moda · Cormorant Garamond Italic · Jost · Pinyon Script)
2. ~~Thème par défaut~~ → **Noir & or** (comme l'image 1, bordeaux seulement en touches)
3. ~~Back-end~~ → **Supabase sur mesure** (page `/admin` aux couleurs du site)
4. ~~Langues~~ → **Français seul** pour la V1
5. Fonctions à garder pour la V1 (je conseille : hero + compte à rebours, histoire, programme, lieux, dress code, RSVP avec liens invités, galerie, footer, back-office contenus/photos/RSVP).
