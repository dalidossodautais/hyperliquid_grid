#!/bin/bash

echo "Vérification du code avant commit..."

# Exécuter le linting
echo "Exécution du linting..."
pnpm lint:check
LINT_RESULT=$?

# Exécuter les tests
echo "Exécution des tests..."
pnpm test
TEST_RESULT=$?

# Vérifier les résultats
if [ $LINT_RESULT -ne 0 ] || [ $TEST_RESULT -ne 0 ]; then
    echo -e "\033[0;31m❌ Des erreurs ont été détectées. Veuillez les corriger avant de committer.\033[0m"
    exit 1
else
    echo -e "\033[0;32m✅ Tout est bon ! Vous pouvez committer vos changements.\033[0m"
    exit 0
fi
