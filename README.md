# Template mariage luxe

Site de mariage haut de gamme + espace mariés (`/admin`) avec **thèmes**, **mode clair / sombre** et **aperçu en direct** avant publication.
Un seul code et un seul projet Supabase pour **tous les couples** (une ligne par mariage).

## Structure

```
index.html              Site public (+ script anti-flash du thème dans le <head>)
css/tokens.css          Contrat des design tokens (échelle typo, contextes nuit / jour / photo)
css/site.css            Composants du site — n'utilise que des variables
themes/<id>.css         Un fichier par thème : couleurs (sombre + clair), polices
themes/index.js         Catalogue des thèmes (cartes de la page Apparence)
js/theme.js             Thème + mode, commutateur clair / sombre de l'admin
js/default-content.js   Contenu par défaut = structure complète du contenu + bibliothèque de fonds
js/store.js             Accès aux données (Supabase multi-couples ou mode démo)
js/site.js              Rendu du site, compte à rebours, RSVP, calendrier, mode aperçu
js/config.js            ← Connexion Supabase (+ mariage par défaut)
admin/                  Espace mariés : éditeur + aperçu en direct
supabase/schema.sql     Base de données (à lancer une fois, relançable sans risque)
assets/                 Fonds d'en-tête, photos de démo, police Blasse
```

## Tester en local

```bash
python3 serve.py
```

- Site : http://127.0.0.1:4180 (un mariage précis : `?m=<slug>`)
- Admin : http://127.0.0.1:4180/admin/

Sans Supabase configuré, tout fonctionne en **mode démo** (données dans le navigateur ; `localStorage.clear()` pour repartir de zéro).

## Installer la base (une seule fois)

1. Supabase → **SQL Editor** → coller tout `supabase/schema.sql` → **Run**.
   - Si l'ancienne table `site` existe, son contenu devient automatiquement le premier mariage (slug fait des prénoms, ex. `alexandra-loic`), avec ses invités et ses réponses.
2. Supabase → **Authentication → Sign In / Providers** : garder le fournisseur **Email** activé, mais désactiver **« Allow new users to sign up »**.

## Ajouter un nouveau couple (≈ 5 minutes)

1. Supabase → **Authentication → Users → Add user** : email + mot de passe des mariés (cocher « Auto confirm »).
2. Supabase → **SQL Editor** :
   ```sql
   insert into public.mariages (slug, owner_id, content)
   values ('prenom-prenom', (select id from auth.users where email = 'email@des-maries.fr'), '{}'::jsonb);
   ```
3. Leur adresse : `https://votre-site/?m=prenom-prenom` — ou un nom de domaine dédié pointé sur le même site, renseigné dans la colonne `domaine` de leur ligne.
4. Envoyer aux mariés : l'adresse du site + `/admin/`, leur email et leur mot de passe. Ils remplissent tout eux-mêmes.

Chaque couple ne voit que **son** contenu, **ses** invités, **ses** réponses et **ses** photos (règles RLS + un dossier de photos par mariage).

## Fonctionnalités

- **Thèmes** (page *Apparence*) : Noir & Or, Bordeaux, Émeraude, Nuit bleue, Ivoire — chacun en sombre et en clair, contrastes AA. Le back-office prend le thème du couple.
- **Mode clair / sombre** choisi par le couple pour le site ; commutateur clair / sombre dans l'admin.
- **Aperçu en direct** : le vrai site à droite de l'éditeur (mobile / tablette / bureau, sombre / clair), mis à jour à chaque frappe ; les photos ne sont envoyées qu'à l'enregistrement ; « Annuler les modifications » ; point focal des photos.
- **Sections** : accueil + compte à rebours, notre histoire, programme, le grand jour, lieux, dress code, galerie, RSVP, footer — toutes masquables.
- **RSVP** : présent / absent, nombre de personnes, enfants, accompagnants, moments, régime, chanson, questions personnalisées, message ; date limite ; liens invités (`?invite=…`).
- **Tableau de bord** : couverts, oui / non / en attente, enfants, effectif par moment, régimes, export CSV (Excel).
- **Photos en noir et blanc** : toutes, ou photo par photo.

## Sécurité

- Le contenu publié est lisible par tous ; seul le compte propriétaire d'un mariage peut le modifier.
- Invités et réponses ne sont visibles que par les mariés concernés.
- Les réponses passent par la fonction `submit_rsvp` qui vérifie le mariage, la date limite et le nombre de places côté serveur.
- Les photos sont rangées dans `photos/<id du mariage>/` ; un couple ne peut ajouter ou supprimer que dans son dossier.

## Pistes

Email de notification à chaque réponse (fonction Supabase), mot de passe pour le site public, QR code du faire-part aux couleurs du thème, dépôt de photos par les invités, bilingue FR / EN.

## Licence des polices

Le thème Noir & Or utilise **Blasse** (licence « usage personnel ») : acheter une licence commerciale avant toute livraison à un client, ou remplacer la police dans `themes/noir-or.css`. Les autres thèmes utilisent des Google Fonts libres.
