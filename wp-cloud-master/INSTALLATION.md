# 🚀 Guide d'Installation Complet - WordPress Cloud Platform

Ce guide vous explique comment installer et configurer la plateforme complète (Frontend React + API Flask + Système de déploiement).

---

## 📋 Prérequis

### Système
- **Python 3.8+** (pour l'API et le système de déploiement)
- **Node.js 16+** et **npm** (pour le frontend React)
- **Docker** installé et en cours d'exécution
- **Git** (optionnel, pour cloner le projet)

### Comptes externes
- **Compte Cloudflare** avec :
  - API Token avec permissions DNS et Tunnel
  - Account ID
- **Compte Stripe** (optionnel, pour les paiements - déjà configuré en mode test)

---

## 📦 Structure du Projet

```
wp-cloud-master/
├── api/                      # API Flask
│   ├── app.py               # API principale
│   ├── deploiement.py       # Script de déploiement WordPress
│   ├── requirements.txt     # Dépendances Python
│   ├── .env                 # Variables d'environnement (à créer)
│   └── README.md           # Documentation API
│
├── src/                     # Frontend React
│   ├── components/         # Composants UI
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services API
│   │   └── api.js         # Service pour communiquer avec l'API Flask
│   └── context/           # Context React
│       └── AppContext.js  # Gestion d'état global
│
├── public/                 # Fichiers statiques
├── .env                    # Config frontend (à créer)
├── package.json           # Dépendances Node.js
└── README.md             # Documentation principale
```

---

## 🔧 Installation Étape par Étape

### 1️⃣ Installation de l'API Backend

#### 1.1 Aller dans le dossier API

```bash
cd api
```

#### 1.2 Copier le script deploiement.py

Assurez-vous que votre fichier `deploiement.py` (le script de déploiement WordPress que vous avez déjà) est dans le dossier `api/`.

```bash
# Si deploiement.py est ailleurs
cp /chemin/vers/deploiement.py .
```

#### 1.3 Installer les dépendances Python

```bash
pip install -r requirements.txt
```

Ou avec pip3 :
```bash
pip3 install -r requirements.txt
```

#### 1.4 Créer le fichier .env

Créez un fichier `.env` dans le dossier `api/` :

```bash
cp .env.example .env
nano .env
```

Remplissez avec vos credentials Cloudflare :

```env
CLOUDFLARE_API_TOKEN=votre_token_cloudflare_ici
CLOUDFLARE_ACCOUNT_ID=votre_account_id_ici
FLASK_ENV=development
FLASK_DEBUG=True
```

**Comment obtenir ces informations :**

1. **CLOUDFLARE_API_TOKEN** :
   - Allez sur https://dash.cloudflare.com/profile/api-tokens
   - Créez un token avec les permissions :
     - Zone:DNS:Edit
     - Account:Cloudflare Tunnel:Edit
     - Zone:Zone:Edit

2. **CLOUDFLARE_ACCOUNT_ID** :
   - Allez sur https://dash.cloudflare.com
   - Sélectionnez n'importe quel domaine
   - L'Account ID est visible dans la barre latérale

#### 1.5 Tester l'API

```bash
# Lancer l'API
python app.py
```

L'API sera accessible sur `http://localhost:5000`

Testez avec :
```bash
curl http://localhost:5000/api/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "message": "WordPress Deployment API is running",
  "cloudflare_configured": true,
  "deployer_available": true
}
```

---

### 2️⃣ Installation du Frontend React

#### 2.1 Retourner à la racine du projet

```bash
cd ..
```

#### 2.2 Installer les dépendances Node.js

```bash
npm install
```

#### 2.3 Créer le fichier .env

Le fichier `.env` devrait déjà exister à la racine. Vérifiez son contenu :

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Si le fichier n'existe pas, créez-le :

```bash
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

#### 2.4 Lancer le frontend

```bash
npm start
```

Le site sera accessible sur `http://localhost:3000`

---

## 🚀 Utilisation

### Flux complet de déploiement

1. **Ouvrir le site** : `http://localhost:3000`

2. **S'inscrire / Se connecter**
   - Créez un compte (stocké localement)
   - Les données sont mockées pour le prototype

3. **Créer un site WordPress**
   - Cliquez sur "Créer mon site"
   - Entrez votre nom de domaine (ex: `monsite.com`)
   - Cliquez sur "Déployer WordPress maintenant"

4. **Attendre le déploiement**
   - L'API va créer :
     - Un container Docker WordPress
     - Un container MySQL
     - Un tunnel Cloudflare
     - Une zone DNS Cloudflare
   - Cela prend environ 30-60 secondes

5. **Configurer les nameservers**
   - Après le déploiement, vous serez redirigé vers la page de confirmation
   - Notez le **mot de passe MySQL** (important !)
   - Copiez les **nameservers Cloudflare** affichés
   - Allez chez votre registrar de domaine
   - Remplacez les nameservers actuels par ceux de Cloudflare

6. **Attendre la propagation DNS**
   - La propagation DNS prend 5 à 30 minutes
   - Vérifiez avec : `dig NS votre-domaine.com`

7. **Accéder à WordPress**
   - Frontend : `https://votre-domaine.com`
   - Admin : `https://votre-domaine.com/wp-admin`
   - Configurez WordPress avec vos informations

---

## 🧪 Tests

### Tester l'API directement

```bash
# Health check
curl http://localhost:5000/api/health

# Lister les installations
curl http://localhost:5000/api/installations

# Déployer un site (remplacez les valeurs)
curl -X POST http://localhost:5000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "domain": "test.com",
    "email": "test@test.com"
  }'

# Vérifier le statut d'une installation
curl http://localhost:5000/api/installations/testuser/status

# Supprimer une installation
curl -X DELETE http://localhost:5000/api/installations/testuser
```

---

## 🔍 Dépannage

### L'API ne démarre pas

**Erreur : "Module deploiement not found"**
```bash
# Vérifiez que deploiement.py est dans api/
ls -la api/deploiement.py
```

**Erreur : "Docker not available"**
```bash
# Vérifiez que Docker est en cours d'exécution
docker ps
```

**Erreur : "Cloudflare credentials invalides"**
```bash
# Testez vos credentials
cd api
python -c "from deploiement import WordPressDeployer; d = WordPressDeployer(); print('OK')"
```

### Le frontend ne se connecte pas à l'API

**Erreur CORS**
- Vérifiez que l'API est lancée sur le port 5000
- Vérifiez le fichier `.env` : `REACT_APP_API_URL=http://localhost:5000/api`
- Redémarrez le serveur React après avoir modifié `.env`

**L'API n'est pas accessible**
```bash
# Vérifiez que l'API tourne
curl http://localhost:5000/api/health

# Vérifiez les logs de l'API
cd api
tail -f wordpress_deployment.log
```

### Le déploiement échoue

**Vérifier les logs Docker**
```bash
# Lister les containers
docker ps -a

# Voir les logs d'un container
docker logs nom_du_container
```

**Vérifier les logs de l'API**
```bash
cd api
tail -f wordpress_deployment.log
```

**Nettoyer une installation échouée**
```bash
# Via l'API
curl -X DELETE http://localhost:5000/api/installations/username

# Ou manuellement
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
```

---

## 🌐 Déploiement en Production

### Backend (API Flask)

#### Option 1 : Gunicorn

```bash
cd api
pip install gunicorn

# Production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Option 2 : Docker

Créez un `Dockerfile` dans `api/` :

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Lancez :
```bash
docker build -t wordpress-api .
docker run -p 5000:5000 --env-file .env wordpress-api
```

### Frontend (React)

```bash
# Build de production
npm run build

# Servir avec un serveur statique
npx serve -s build -p 3000
```

#### Déployer sur Vercel/Netlify

1. Commitez votre code sur GitHub
2. Connectez le repo à Vercel/Netlify
3. Configurez la variable d'environnement :
   - `REACT_APP_API_URL=https://votre-api.com/api`

---

## 📊 Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │ ◄─────► │  React App   │ ◄─────► │   Flask API     │
│             │  HTTP   │  (Frontend)  │  REST   │   (Backend)     │
└─────────────┘         └──────────────┘         └─────────────────┘
                                                          │
                                                          ▼
                                    ┌─────────────────────────────────┐
                                    │      deploiement.py             │
                                    │  (Système de déploiement)       │
                                    └─────────────────────────────────┘
                                                  │
                                ┌─────────────────┼─────────────────┐
                                ▼                 ▼                 ▼
                          ┌──────────┐     ┌──────────┐     ┌──────────┐
                          │  Docker  │     │Cloudflare│     │   DNS    │
                          │Container │     │  Tunnel  │     │   Zone   │
                          └──────────┘     └──────────┘     └──────────┘
```

---

## 🔐 Sécurité

### Pour la production

1. **Authentification API**
   - Ajoutez JWT ou API Keys
   - Exemple dans `api/README.md`

2. **HTTPS**
   - Utilisez un reverse proxy (Nginx, Traefik)
   - Obtenez un certificat SSL (Let's Encrypt)

3. **Rate Limiting**
   - Limitez les requêtes par IP
   - Utilisez Flask-Limiter

4. **Validation**
   - Validez tous les inputs
   - Sanitisez les données utilisateur

5. **Secrets**
   - Ne commitez JAMAIS `.env`
   - Utilisez des secrets managers en production

---

## 📝 Commandes Utiles

### Backend

```bash
# Lancer l'API
cd api && python app.py

# Voir les installations
curl http://localhost:5000/api/installations | jq .

# Logs
tail -f api/wordpress_deployment.log
```

### Frontend

```bash
# Développement
npm start

# Build
npm run build

# Tests
npm test
```

### Docker

```bash
# Voir tous les containers
docker ps -a

# Voir les logs
docker logs nom_container

# Nettoyer
docker system prune -a
```

---

## 🆘 Support

### Problèmes courants

1. **"Port 5000 already in use"**
   - Changez le port dans `api/app.py` : `app.run(port=5001)`
   - Mettez à jour `.env` : `REACT_APP_API_URL=http://localhost:5001/api`

2. **"Cannot connect to Docker daemon"**
   - Lancez Docker Desktop
   - Ou : `sudo systemctl start docker` (Linux)

3. **"Module not found: api"**
   - Vérifiez `src/services/api.js` existe
   - Redémarrez le serveur React

### Logs à vérifier

1. API Flask : `api/wordpress_deployment.log`
2. Docker containers : `docker logs nom_container`
3. Frontend React : Console du navigateur (F12)

---

## ✅ Checklist de Vérification

Avant de déployer votre premier site :

- [ ] Python 3.8+ installé : `python --version`
- [ ] Node.js 16+ installé : `node --version`
- [ ] Docker en cours d'exécution : `docker ps`
- [ ] API Flask accessible : `curl http://localhost:5000/api/health`
- [ ] Frontend React accessible : Ouvrir `http://localhost:3000`
- [ ] Credentials Cloudflare configurés dans `api/.env`
- [ ] Le fichier `deploiement.py` est dans `api/`
- [ ] Les dépendances Python installées : `pip list | grep Flask`
- [ ] Les dépendances Node installées : `ls node_modules`

---

## 📚 Ressources

- [Documentation Flask](https://flask.palletsprojects.com/)
- [Documentation React](https://react.dev/)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation Cloudflare API](https://developers.cloudflare.com/api/)
- [Guide Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

## 🎯 Prochaines Étapes

Une fois la plateforme installée et fonctionnelle :

1. Testez un déploiement complet de A à Z
2. Configurez un vrai domaine
3. Ajoutez l'authentification API
4. Déployez en production (VPS, Cloud, etc.)
5. Configurez la surveillance (logs, alertes)
6. Ajoutez des backups automatiques

---

**Bon déploiement ! 🚀**
