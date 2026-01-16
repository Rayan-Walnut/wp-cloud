@echo off
REM WordPress Cloud Platform - Script de démarrage Windows

echo ================================================================================
echo   🚀 WordPress Cloud Platform - Démarrage
echo ================================================================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou n'est pas dans le PATH
    echo    Téléchargez Python depuis https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo    Téléchargez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si Docker est en cours d'exécution
docker ps >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker ne semble pas être en cours d'exécution
    echo    Lancez Docker Desktop
    pause
)

echo ✅ Prérequis vérifiés
echo.

REM Créer le fichier .env frontend si nécessaire
if not exist ".env" (
    echo ⚙️  Création du fichier .env frontend...
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo ✅ Fichier .env créé
)

REM Vérifier si deploiement.py existe
if not exist "api\deploiement.py" (
    echo ❌ Le fichier api\deploiement.py est manquant
    echo    Copiez votre script deploiement.py dans le dossier api\
    pause
    exit /b 1
)

REM Vérifier si api/.env existe
if not exist "api\.env" (
    echo ⚠️  Le fichier api\.env est manquant
    echo    Créez-le avec vos credentials Cloudflare:
    echo.
    echo    CLOUDFLARE_API_TOKEN=votre_token
    echo    CLOUDFLARE_ACCOUNT_ID=votre_account_id
    echo.
    pause
)

echo.
echo 🔧 Démarrage de l'API Flask...
echo.

REM Démarrer l'API Flask dans une nouvelle fenêtre
start "WordPress API" cmd /k "cd api && python app.py"

REM Attendre que l'API démarre
timeout /t 3 /nobreak >nul

echo.
echo 🎨 Démarrage du Frontend React...
echo.

REM Démarrer le Frontend React dans une nouvelle fenêtre
start "WordPress Frontend" cmd /k "npm start"

echo.
echo ================================================================================
echo   ✅ WordPress Cloud Platform est prêt !
echo ================================================================================
echo.
echo 📍 URLs :
echo    Frontend : http://localhost:3000
echo    API      : http://localhost:5000
echo.
echo 🛑 Pour arrêter :
echo    Fermez les fenêtres de commande ou exécutez stop.bat
echo.
echo 📚 Documentation : INSTALLATION.md
echo.
echo ================================================================================
echo.

pause
