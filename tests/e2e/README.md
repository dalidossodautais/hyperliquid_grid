# Tests End-to-End (E2E)

Ce répertoire contient les tests end-to-end (e2e) pour l'application, utilisant [Playwright](https://playwright.dev/).

## Structure des tests

Les tests sont organisés par fonctionnalité :

- `language-selector.spec.ts` : Tests pour le sélecteur de langue
- `signin.spec.ts` : Tests pour la page de connexion
- `signup.spec.ts` : Tests pour la page d'inscription
- `forgot-password.spec.ts` : Tests pour la page de mot de passe oublié
- `reset-password.spec.ts` : Tests pour la page de réinitialisation de mot de passe
- `dashboard.spec.ts` : Tests pour le tableau de bord (nécessite une authentification)

## Utilitaires de test

Le répertoire contient également des utilitaires pour faciliter les tests :

- `utils.ts` : Fonctions utilitaires pour les tests, notamment pour mocker l'authentification
- `fixtures.ts` : Fixtures Playwright personnalisées, notamment pour l'authentification

### Authentification mockée

Pour les tests qui nécessitent un utilisateur authentifié, nous utilisons un système de mock d'authentification qui simule un utilisateur connecté sans avoir à passer par le processus de connexion manuel.

#### Utilisation de la fixture d'authentification

```typescript
// Importer depuis fixtures.ts au lieu de @playwright/test
import { test, expect } from "./fixtures";

test("mon test avec authentification", async ({ authenticatedPage }) => {
  const { page, userData } = authenticatedPage;

  // page est maintenant authentifiée avec les données utilisateur par défaut
  await page.goto("/dashboard");

  // Vérifier que le nom d'utilisateur est affiché
  await expect(page.getByText(`Welcome, ${userData.name}`)).toBeVisible();
});
```

#### Utilisation directe de la fonction mockAuthentication

Si vous avez besoin de plus de contrôle sur l'authentification, vous pouvez utiliser directement la fonction `mockAuthentication` :

```typescript
import { test, expect } from "@playwright/test";
import { mockAuthentication } from "./utils";

test("mon test avec authentification personnalisée", async ({ page }) => {
  // Authentifier avec des données utilisateur personnalisées
  await mockAuthentication(page, {
    id: "custom-user-id",
    name: "Custom User",
    email: "custom@example.com",
  });

  await page.goto("/dashboard");

  // Vérifier que le nom d'utilisateur personnalisé est affiché
  await expect(page.getByText("Welcome, Custom User")).toBeVisible();
});
```

## Exécution des tests

### Prérequis

Assurez-vous d'avoir installé les dépendances du projet :

```bash
pnpm install
```

### Exécuter tous les tests

Pour exécuter tous les tests e2e :

```bash
pnpm test:e2e
```

### Exécuter un test spécifique

Pour exécuter un test spécifique :

```bash
pnpm test:e2e -- e2e/signin.spec.ts
```

### Exécuter les tests en mode UI

Pour exécuter les tests avec l'interface utilisateur de Playwright :

```bash
pnpm test:e2e:ui
```

### Exécuter les tests sur un navigateur spécifique

Pour exécuter les tests sur un navigateur spécifique :

```bash
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
pnpm test:e2e -- --project=webkit
```

## Génération de rapports

Après l'exécution des tests, un rapport HTML est généré dans le répertoire `playwright-report/`. Vous pouvez le visualiser en exécutant :

```bash
pnpm playwright show-report
```

## Déboguer les tests

Pour déboguer les tests, vous pouvez utiliser le mode debug de Playwright :

```bash
pnpm test:e2e:debug
```

## CI/CD

Les tests e2e sont configurés pour s'exécuter dans un environnement CI/CD. La configuration se trouve dans le fichier `playwright.config.ts` à la racine du projet.
