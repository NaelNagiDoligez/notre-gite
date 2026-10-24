# Notre gîte d'été

Carnet partagé pour proposer des locations de vacances, les noter ensemble et choisir où partir.

- **Galerie, Comparateur, Podium, Carte, Dates** : les logements proposés, leurs notes sur 6 critères, le classement, la carte de France et le sondage des semaines d'été.
- **Ajout d'un logement** : on colle le lien de l'annonce et des captures d'écran ; le site lit le texte des captures (sans IA, gratuitement) et remplit la fiche.
- **Votes** : notes de 1 à 10, un coup de cœur et un veto par personne, avec une raison facultative.

Le site est hébergé par **GitHub Pages** et ses données sont dans **Supabase** (offre gratuite).

## Installation (une seule fois)

### 1. Créer la base de données (déjà fait)

1. Sur [supabase.com](https://supabase.com), ouvre le projet `notre-gite`.
2. Menu de gauche : **SQL Editor** → **New query**.
3. Copie tout le contenu du fichier [`supabase/setup.sql`](supabase/setup.sql), colle-le, puis clique sur **Run**.
   Le message « Success. No rows returned » est normal.

### 2. Fermer les inscriptions libres

Pour que seules les personnes que tu crées puissent entrer :
**Authentication** → **Sign In / Providers** (ou **Providers** → **Email**) → désactive **Allow new users to sign up**, puis enregistre.

### 3. Créer les comptes (prénom + code)

Pour chaque personne : **Authentication** → **Users** → **Add user** → **Create new user**.

| Champ | À mettre |
|---|---|
| Email | le prénom en minuscules, sans accent, puis `@notre-gite.example.com` — ex. `lea@notre-gite.example.com`, `jean-marc@notre-gite.example.com` |
| Password | le **code** de la personne, **6 caractères minimum** |
| Auto Confirm User | **coché** |

La personne se connecte ensuite sur le site avec son **prénom** (accents et majuscules acceptés) et son **code**.
Un compte créé avec une vraie adresse e-mail fonctionne aussi : la personne tape alors son **adresse e-mail** à la place du prénom.
Aucun e-mail n'est envoyé : l'adresse `example.com` n'existe pas, elle sert seulement d'identifiant.

### 4. Te déclarer organisateur

Dans **SQL Editor**, lance cette ligne en remplaçant `ton-prenom` par ton prénom (comme dans l'adresse de ton compte) :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'ton-prenom@notre-gite.example.com';
```

### 5. Relier le site à la base (déjà fait)

**Project Settings** → **API** (ou **Data API**) : copie l'**URL du projet** et la **clé publique** (« anon public » ou « publishable key »), puis colle-les dans [`config.js`](config.js).
Ne mets **jamais** la clé « service_role » ou « secret » dans ce fichier.

### 6. Mettre le site en ligne

Sur GitHub, dans ce dépôt : **Settings** → **Pages** → *Source* : **Deploy from a branch**, branche **main**, dossier **/ (root)** → **Save**.
Le site est alors disponible à l'adresse `https://<ton-compte>.github.io/notre-gite/` (une à deux minutes après chaque modification).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | la page et ses styles |
| `app.js` | toute l'application |
| `motion.js` | le motion design (GSAP) : intro, transitions d'onglets, entrée des cartes, podium, carte, révélation du gagnant |
| `scene.js` | le décor dessiné en fond (montagnes, mer, plage, animaux, silhouettes) et le ciel qui suit l'heure (soleil, lune, étoiles, thème clair/sombre) ; `?h=14.5` à la fin de l'adresse pour tester une heure |
| `vendor/gsap/` | GSAP 3.15.0 et ses plugins (ScrollTrigger, SplitText, DrawSVG, CustomEase, Physics2D), gratuits depuis 2025, copiés ici pour ne dépendre d'aucun CDN |
| `france.js` | les contours des départements pour la carte |
| `config.js` | l'adresse et la clé publique Supabase |
| `supabase/setup.sql` | création de la base, des règles d'accès et du stockage des photos |

## Animations et décor

La **roue crantée** en haut à droite ouvre les réglages : animations, décor illustré, thème (selon l'heure, clair, sombre, comme l'appareil), profil et déconnexion. Ces réglages ne valent que pour la personne (ils sont gardés dans son navigateur).

- **Ciel selon l'heure** : le soleil, la lune, les étoiles et les couleurs suivent l'heure de l'appareil ; la nuit (de 20 h 30 à 6 h 30), le thème sombre se met tout seul si le thème est sur « Selon l'heure ».
- **Tampon « Retenu »** : il claque quand l'organisateur retient une semaine ou passe un logement en « Réservé ».
- **Carte qui se retourne** (bouton rond sur la photo) : le dos montre les notes par critère, cachées tant qu'on n'a pas noté le logement.
- **Gestes courants** : notes qui se colorent du bleu à l'orange, cœur qui bat, veto qui « dit non », photo en parallaxe dans la fiche, onde et colonnes qui se rééquilibrent dans Dates, meilleure et pire note de chaque ligne dans le comparateur.

Les gestes fréquents restent discrets ; les grandes séquences sont réservées aux moments rares. Si `motion.js` ou GSAP ne se charge pas, le site retombe sur les animations CSS d'origine.
