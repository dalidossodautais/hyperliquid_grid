#!/bin/bash

# Fonction pour nettoyer les processus
cleanup() {
    echo "Nettoyage des processus..."

    # Arrêter uniquement le serveur Next.js que nous avons démarré
    if [ ! -z "$SERVER_PID" ]; then
        echo "Arrêt du serveur Next.js (PID: $SERVER_PID)..."
        kill -9 $SERVER_PID 2>/dev/null || true
    fi

    # Tuer tous les processus Playwright
    pkill -9 -f "playwright" || true
    pkill -9 -f "chromium" || true
    pkill -9 -f "firefox" || true
    pkill -9 -f "webkit" || true

    echo "Nettoyage terminé."
}

# Fonction pour forcer la terminaison après un délai
force_exit() {
    echo "Forçage de la terminaison..."
    kill -9 $$ 2>/dev/null
}

# Nettoyer les processus Playwright avant de commencer
echo "Nettoyage des processus Playwright..."
pkill -9 -f "playwright" || true
pkill -9 -f "chromium" || true
pkill -9 -f "firefox" || true
pkill -9 -f "webkit" || true

# Démarrer le serveur Next.js en arrière-plan
echo "Démarrage du serveur Next.js..."
pnpm run dev &
SERVER_PID=$!
echo "Serveur Next.js démarré avec PID: $SERVER_PID"

# Attendre que le serveur soit prêt (5 secondes)
echo "Attente du démarrage du serveur..."
sleep 5

# Exécuter les tests Playwright avec l'option --reporter=list pour éviter le rapport HTML
echo "Exécution des tests Playwright..."
npx playwright test --reporter=list "$@"
TEST_RESULT=$?

# Nettoyer à la fin
cleanup

# Sortir avec le code de résultat des tests
echo "Tests terminés avec le code: $TEST_RESULT"

# Programmer une terminaison forcée après 3 secondes
(sleep 3 && force_exit) &

exit $TEST_RESULT
