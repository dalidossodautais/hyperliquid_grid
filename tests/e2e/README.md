# Tests End-to-End (E2E)

Ce répertoire contient les tests end-to-end (E2E) pour l'application Hyperliquid Grid, utilisant Playwright.

## Structure

- `utils.ts` - Fonctions utilitaires communes pour les tests
- `signin.spec.ts` - Tests pour la page de connexion
- `signup.spec.ts` - Tests pour la page d'inscription
- `language-selector.spec.ts` - Tests pour le sélecteur de langue

## Exécution des tests

### Méthode recommandée

Utilisez le script shell qui gère correctement le démarrage et l'arrêt du serveur :

```bash
./scripts/run-e2e-tests.sh
```

### Autres commandes

```bash
# Exécuter tous les tests e2e
pnpm test:e2e

# Exécuter les tests avec l'interface utilisateur de Playwright
pnpm test:e2e:ui

# Exécuter les tests en mode debug
pnpm test:e2e:debug

# Afficher le rapport des tests
pnpm test:e2e:report
```

## Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant des autres tests.
2. **Idempotence** : Les tests doivent pouvoir être exécutés plusieurs fois sans changer de comportement.
3. **Assertions claires** : Utilisez des assertions explicites pour vérifier le comportement attendu.
4. **Timeouts raisonnables** : Définissez des timeouts appropriés pour éviter les faux négatifs.
5. **Nettoyage** : Assurez-vous que les tests nettoient après eux-mêmes.

## Résolution des problèmes

Si les tests se bloquent à la fin, essayez les solutions suivantes :

1. Utilisez le script `./scripts/run-e2e-tests.sh` qui gère correctement le nettoyage.
2. Vérifiez les processus bloqués avec `ps aux | grep -E 'playwright|chromium'`.
3. Tuez manuellement les processus bloqués avec `pkill -f "playwright"` ou `pkill -f "chromium"`.
4. Redémarrez votre machine si les problèmes persistent.
