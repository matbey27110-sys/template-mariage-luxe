# Template mariage luxe — V1

Site de mariage « Noir & or » + espace mariés (`/admin`) pour modifier textes, photos et suivre les RSVP.

## Structure

```
index.html            Site public
css/site.css          Style du site (couleurs dans :root)
js/default-content.js Contenu de démo = structure complète du contenu + bibliothèque de fonds
js/store.js           Accès aux données (Supabase ou mode démo)
js/site.js            Affichage, compte à rebours, RSVP, calendrier
js/config.js          ← Connexion Supabase du client
admin/                Espace mariés
supabase/schema.sql   Base de données à installer une fois par client
assets/fonds/         Fonds d'en-tête proposés aux clients
assets/demo/          Photos de démonstration (Unsplash)
serve.py              Prévisualisation locale
```

## Tester en local

```bash
python3 serve.py
```

- Site : http://127.0.0.1:4180
- Admin : http://127.0.0.1:4180/admin/

Sans Supabase configuré, tout fonctionne en **mode démo** : les modifications et réponses sont stockées dans le navigateur.
Pour repartir de zéro : dans la console du navigateur, `localStorage.clear()`.

## Mettre en ligne pour un nouveau client

1. **Dupliquer** le dossier `luxe` → `clients/prenom-prenom`.
2. **Créer un projet Supabase** (gratuit) sur supabase.com.
3. Dans Supabase → **SQL Editor** → coller tout `supabase/schema.sql` → **Run**.
4. Supabase → **Authentication → Users → Add user** : email + mot de passe des mariés (cocher « Auto confirm »).
5. Supabase → **Authentication → Sign In / Providers** : laisser le fournisseur **Email activé**, mais désactiver **« Allow new users to sign up »** dans la partie *User Signups* (personne d'autre ne peut créer de compte). Attention à ne pas couper le fournisseur Email lui-même, sinon les mariés ne peuvent plus se connecter.
6. Supabase → **Project Settings → API** : copier `Project URL` et la clé `anon public` dans `js/config.js`.
7. **Héberger** le dossier sur Netlify (glisser-déposer sur app.netlify.com/drop) ou Vercel, puis brancher le nom de domaine.
8. Envoyer aux mariés : l'adresse du site + `/admin/`, leur email et leur mot de passe.

Les mariés remplissent ensuite tout eux-mêmes : textes, photos, fond d'en-tête, invités, réglages du RSVP.

## Ce que contient la V1

- **Accueil** : prénoms, date, lieu, compte à rebours (heure facultative ; « C'est aujourd'hui ! » le jour J), fond au choix (bibliothèque ou photo perso) avec réglage d'assombrissement, bouton vers le RSVP.
- **Notre histoire** : photo plein écran + titre, trio de photos encadrées, texte.
- **Programme**, **Le grand jour** (photo plein écran), **Lieux** (bouton itinéraire Google Maps), **Dress code** (pastilles de couleurs), **Galerie** (visionneuse).
- **RSVP** : présent / absent, nombre de personnes, enfants, prénoms des accompagnants, moments, régime, chanson, message ; date limite ; bouton RSVP flottant.
- **Liens invités** : `site.fr/?invite=famille-martin-ab12` → nom pré-rempli, nombre de places limité. Import d'une liste en une fois.
- **Réponses** : compteurs, régimes alimentaires, tableau, export CSV (Excel).
- **Footer** : photo, monogramme sur verre dépoli, « Ajouter à mon calendrier » (.ics).
- Chaque section peut être masquée depuis l'admin.

## Sécurité

- Le contenu est lisible par tous, modifiable seulement par les mariés connectés.
- La liste des invités et les réponses ne sont visibles que dans l'admin.
- Les réponses passent par la fonction `submit_rsvp` qui vérifie la date limite et le nombre de places côté serveur.

## Pistes V2

Email de notification à chaque réponse, mot de passe pour le site public, QR code du faire-part, dépôt de photos par les invités après le mariage, intro enveloppe animée, thèmes Bordeaux / Émeraude au choix.
