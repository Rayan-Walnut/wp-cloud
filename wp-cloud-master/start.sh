#!/bin/bash

# 🚀 Script de Démarrage Rapide - WordPress Cloud Platform
# Ce script lance automatiquement l'API Flask et le Frontend React

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 WordPress Cloud Platform - Démarrage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    echo -e "${BLUE}📋 Vérification des prérequis...${NC}"
    echo ""

    # Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
        echo -e "${GREEN}✅ Python:${NC} $PYTHON_VERSION"
    else
        echo -e "${RED}❌ Python 3 n'est pas installé${NC}"
        exit 1
    fi

    # Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js:${NC} $NODE_VERSION"
    else
        echo -e "${RED}❌ Node.js n'est pas installé${NC}"
        exit 1
    fi

    # Docker
    if command_exists docker; then
        if docker ps >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker:${NC} En cours d'exécution"
        else
            echo -e "${YELLOW}⚠️  Docker est installé mais ne semble pas démarré${NC}"
            echo -e "${YELLOW}   Lancez Docker Desktop ou démarrez le daemon Docker${NC}"
        fi
    else
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        exit 1
    fi

    echo ""
}

# Fonction pour vérifier la configuration
check_config() {
    echo -e "${BLUE}🔧 Vérification de la configuration...${NC}"
    echo ""

    # Vérifier .env frontend
    if [ -f ".env" ]; then
        echo -e "${GREEN}✅ Frontend .env trouvé${NC}"
    else
        echo -e "${YELLOW}⚠️  Fichier .env frontend manquant${NC}"
        echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
        echo -e "${GREEN}✅ Fichier .env créé${NC}"
    fi

    # Vérifier .env API
    if [ -f "api/.env" ]; then
        echo -e "${GREEN}✅ API .env trouvé${NC}"
    else
        echo -e "${YELLOW}⚠️  Fichier api/.env manquant${NC}"
        echo -e "${YELLOW}   Créez-le avec vos credentials Cloudflare${NC}"
        echo -e "${YELLOW}   Exemple:${NC}"
        echo -e "${YELLOW}   CLOUDFLARE_API_TOKEN=votre_token${NC}"
        echo -e "${YELLOW}   CLOUDFLARE_ACCOUNT_ID=votre_account_id${NC}"
    fi

    # Vérifier deploiement.py
    if [ -f "api/deploiement.py" ]; then
        echo -e "${GREEN}✅ deploiement.py trouvé${NC}"
    else
        echo -e "${RED}❌ api/deploiement.py manquant${NC}"
        echo -e "${RED}   Copiez votre script de déploiement dans api/${NC}"
        exit 1
    fi

    echo ""
}

# Fonction pour installer les dépendances si nécessaire
install_dependencies() {
    echo -e "${BLUE}📦 Vérification des dépendances...${NC}"
    echo ""

    # Dépendances Python
    if [ ! -d "api/venv" ]; then
        echo -e "${YELLOW}⚙️  Installation des dépendances Python...${NC}"
        cd api
        python3 -m venv venv
        source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
        pip install -r requirements.txt --quiet
        deactivate 2>/dev/null
        cd ..
        echo -e "${GREEN}✅ Dépendances Python installées${NC}"
    else
        echo -e "${GREEN}✅ Dépendances Python déjà installées${NC}"
    fi

    # Dépendances Node.js
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚙️  Installation des dépendances Node.js...${NC}"
        npm install --silent
        echo -e "${GREEN}✅ Dépendances Node.js installées${NC}"
    else
        echo -e "${GREEN}✅ Dépendances Node.js déjà installées${NC}"
    fi

    echo ""
}

# Fonction pour lancer l'API
start_api() {
    echo -e "${BLUE}🔧 Démarrage de l'API Flask...${NC}"

    cd api

    # Activer le virtualenv si existant
    if [ -d "venv" ]; then
        source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
    fi

    # Lancer l'API en arrière-plan
    python app.py > ../api.log 2>&1 &
    API_PID=$!

    # Attendre que l'API démarre
    echo -n "   Attente du démarrage de l'API"
    for i in {1..10}; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✅ API Flask démarrée (PID: $API_PID)${NC}"
            echo -e "${GREEN}   URL: http://localhost:5000${NC}"
            cd ..
            return 0
        fi
        echo -n "."
        sleep 1
    done

    echo ""
    echo -e "${RED}❌ L'API n'a pas pu démarrer${NC}"
    echo -e "${RED}   Vérifiez les logs: tail -f api.log${NC}"
    cd ..
    exit 1
}

# Fonction pour lancer le frontend
start_frontend() {
    echo -e "${BLUE}🎨 Démarrage du Frontend React...${NC}"

    # Lancer le frontend
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!

    echo -e "${GREEN}✅ Frontend React démarré (PID: $FRONTEND_PID)${NC}"
    echo -e "${GREEN}   URL: http://localhost:3000${NC}"
}

# Fonction pour afficher les informations finales
show_info() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}  ✅ WordPress Cloud Platform est prêt !${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}📍 URLs :${NC}"
    echo -e "   Frontend : ${GREEN}http://localhost:3000${NC}"
    echo -e "   API      : ${GREEN}http://localhost:5000${NC}"
    echo ""
    echo -e "${BLUE}📊 Logs :${NC}"
    echo -e "   API      : ${YELLOW}tail -f api.log${NC}"
    echo -e "   Frontend : ${YELLOW}tail -f frontend.log${NC}"
    echo ""
    echo -e "${BLUE}🛑 Arrêter :${NC}"
    echo -e "   ${YELLOW}Ctrl+C ou ./stop.sh${NC}"
    echo ""
    echo -e "${BLUE}📚 Documentation :${NC}"
    echo -e "   ${YELLOW}Voir INSTALLATION.md${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Fonction de nettoyage à la sortie
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠️  Arrêt de la plateforme...${NC}"

    # Tuer les processus si encore en cours
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null
        echo -e "${GREEN}✅ API arrêtée${NC}"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend arrêté${NC}"
    fi

    echo ""
    echo -e "${GREEN}👋 À bientôt !${NC}"
    exit 0
}

# Piège pour nettoyer à la sortie
trap cleanup INT TERM

# Programme principal
main() {
    check_prerequisites
    check_config
    install_dependencies
    start_api
    start_frontend
    show_info

    # Garder le script en cours d'exécution
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter la plateforme${NC}"
    echo ""

    # Attendre indéfiniment
    while true; do
        sleep 1
    done
}

# Lancer le programme principal
main
