#!/bin/bash

# 🛑 Script d'Arrêt - WordPress Cloud Platform

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛑 WordPress Cloud Platform - Arrêt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Arrêter les processus Python (API Flask)
echo -e "${YELLOW}⚙️  Arrêt de l'API Flask...${NC}"
pkill -f "python.*app.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API arrêtée${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun processus API trouvé${NC}"
fi

# Arrêter les processus Node (React)
echo -e "${YELLOW}⚙️  Arrêt du Frontend React...${NC}"
pkill -f "react-scripts start" 2>/dev/null
pkill -f "node.*react" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend arrêté${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun processus Frontend trouvé${NC}"
fi

echo ""
echo -e "${GREEN}✅ Plateforme arrêtée${NC}"
echo ""
