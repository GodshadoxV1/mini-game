# Sauvegarde partagée — à mettre en place

La publication sur GitHub Pages ne sauvegarde pas les comptes joueurs dans une base commune.

Étapes requises pour la mise en production :

1. Créer un projet Firebase appartenant au propriétaire de Pi Games.
2. Activer **Firebase Authentication** (e-mail/mot de passe ou Google), puis supprimer la gestion locale des mots de passe de la page.
3. Utiliser **Cloud Firestore** pour les profils, historiques de parties, puzzles, scores, Elo, RD Glicko, titres, badges, classements et exclusions.
4. Configurer les **règles de sécurité Firestore** : seules les préférences non sensibles peuvent être modifiées par le joueur ; aucun client ne doit écrire directement son Elo, ses badges ou ses sanctions.
5. Utiliser des **Cloud Functions** ou un serveur pour confirmer les parties, empêcher les résultats falsifiés, calculer l'Elo, attribuer les distinctions et gérer l'administration.
6. Tester les règles avec l'émulateur, vérifier les coûts, migrer les anciennes données, puis mettre en production.

**Statut actuel : non configuré.** Aucun accès Firebase ni connexion Firestore n'est encore présent dans le HTML déployé.
