# Mode démonstration (données fictives)

Pour filmer ou capturer le site sans toucher à la vraie base ni montrer de vrais prénoms.

```
node demo/serve.mjs          # puis ouvrir http://127.0.0.1:8200/index.html?sc=full&h=21
```

Le serveur sert le site tel quel, sauf la bibliothèque Supabase, remplacée par `demo/supabase-demo.js` :
une fausse base en mémoire (6 personnes fictives, 9 logements d'exemple, notes, coup de cœur, veto, un commentaire).
Les actions (voter, ajouter, modifier) marchent, mais rien n'est enregistré : un rechargement remet tout à zéro.

| Dans l'adresse | Effet |
|---|---|
| `sc=full` | carnet complet, tout le monde a voté (défaut) |
| `sc=partial` | la personne connectée n'a pas encore noté les 3 derniers logements |
| `sc=empty` | carnet vide (première ouverture) |
| `sc=closed` | votes clos, podium définitif |
| `sc=login` | écran de connexion (le bouton Google « connecte » après 0,7 s) |
| `h=21` | heure forcée du décor : 21 = soir, 14 = plein jour (0 à 24) |
| `pend=1` | écran « demande envoyée, en attente de validation » |
| `slow=800` | ralentit le chargement (ms) |

Limites : les photos des logements sont des illustrations générées (pas de vraies photos) ; la lecture d'une capture d'écran
(ajout d'un logement) charge l'outil de lecture de texte depuis Internet, il faut donc être en ligne.
