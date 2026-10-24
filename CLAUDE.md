# Instructions pour Claude

Site familial « Notre gîte d'été ». Le contexte complet (données, décisions, comptes) est dans le document
`claude/notre-gite-contexte.md` du Projet claude.ai « Choix gîte » : lis-le avant toute modification.

- Site statique servi par GitHub Pages depuis `main` (racine) : chaque push le met en ligne en 1-2 minutes.
- Données dans Supabase (projet `tgphzzdzupylkftxbljc`) via la table `docs` ; règles d'accès dans `supabase/setup.sql`.
- Après une modification : `node --check app.js`, test si besoin, puis commit et push sur `main`.
- Tout changement de base : migration via le connecteur Supabase, contrôle des avis de sécurité, puis mise à jour de `supabase/setup.sql`.
- Ne jamais mettre de clé secrète (service_role) dans le dépôt : il est public.
- Interface et réponses en français, tutoiement.
