#!/bin/bash

echo "Vérification du linting..."

# Exécuter le linting
pnpm lint:check
LINT_RESULT=$?

# Vérifier les résultats
if [ $LINT_RESULT -ne 0 ]; then
    echo -e "\033[0;31m❌ Des erreurs de linting ont été détectées. Veuillez les corriger.\033[0m"
    exit 1
else
    echo -e "\033[0;32m✅ Aucune erreur de linting détectée !\033[0m"
    exit 0
fi
