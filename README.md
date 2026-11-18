# Pi Games — Pi Master & Pi Chess

Mini-jeux en ligne : mémoire des décimales de π, échecs, bots, puzzles, profils, titres et classements.

## Publication GitHub Pages

Le site est dans `index.html` à la racine. Pour activer GitHub Pages :
1. Ouvrir [Settings → Pages](https://github.com/GodshadoxV1/mini-game/settings/pages).
2. Dans **Build and deployment**, choisir **Deploy from a branch**.
3. Choisir **main** et **/(root)**, puis enregistrer.

L'adresse du site, **une fois Pages activé et le déploiement terminé**, sera :
https://godshadoxv1.github.io/mini-game/

## ⚠️ Important : les données joueurs ne sont pas encore partagées

La version actuelle conserve ses utilisateurs, leurs mots de passe hachés, les Elo et les classements dans le **localStorage du navigateur**. GitHub Pages ne fournit **ni base de données, ni serveur d'authentification**.

- Les utilisateurs de différents appareils ne verront **pas** les mêmes comptes ou classements.
- Effacer les données du navigateur peut effacer les comptes de ce navigateur.
- L'administration et les scores gérés par JavaScript dans le navigateur peuvent être contournés.
- **Ne pas utiliser un mot de passe personnel ou réutilisé pour créer un compte sur cette version de démonstration.**

Pour ouvrir le site à de vrais joueurs, il faut migrer vers une authentification et une base sécurisées (Firebase Authentication, Cloud Firestore, fonctions côté serveur). La validation des résultats et le calcul Elo doivent se faire côté serveur.

Les bibliothèques d'échecs, Stockfish et certaines images sont chargées en ligne.

Voir aussi [FIREBASE_A_CONFIGURER.md](FIREBASE_A_CONFIGURER.md).
