# 🚀 WordPress Cloud Platform

Plateforme SaaS complète pour déployer automatiquement des sites WordPress avec Docker et Cloudflare Tunnels via une interface web moderne.

![React](https://img.shields.io/badge/React-18-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![Docker](https://img.shields.io/badge/Docker-Required-blue)
![Python](https://img.shields.io/badge/Python-3.8+-yellow)

---

## ✨ Fonctionnalités

### 🎯 Déploiement Automatisé
- ✅ Déploiement WordPress en un clic
- ✅ Containers Docker isolés (WordPress + MySQL)
- ✅ Tunnels Cloudflare automatiques
- ✅ Configuration DNS Cloudflare
- ✅ HTTPS automatique via Cloudflare

### 🎨 Interface Moderne
- ✅ Dashboard intuitif avec React
- ✅ Gestion complète du cycle de vie
- ✅ Visualisation en temps réel
- ✅ Design responsive (Tailwind CSS)

### 🔧 Gestion Complète
- ✅ Créer / Lister / Supprimer des installations
- ✅ Redémarrer les containers
- ✅ Visualiser les logs
- ✅ Vérifier le statut des services

---

## 🏗️ Architecture

```
┌──────────────┐
│   Frontend   │  React + Tailwind CSS
│   (Port 3000)│  Interface utilisateur moderne
└──────┬───────┘
       │ REST API
┌──────▼───────┐
│   Backend    │  Flask API
│   (Port 5000)│  Gestion des requêtes
└──────┬───────┘
       │
┌──────▼───────┐
│  Deployer    │  deploiement.py
│              │  Orchestration Docker + Cloudflare
└──────┬───────┘
       │
       ├─────► Docker (WordPress + MySQL)
       └─────► Cloudflare (Tunnels + DNS)
```

---

## 📋 Prérequis

- **Python 3.8+**
- **Node.js 16+** et npm
- **Docker** (installé et en cours d'exécution)
- **Compte Cloudflare** avec API Token et Account ID

---

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Linux/Mac)

```bash
# Rendre le script exécutable
chmod +x start.sh

# Lancer la plateforme
./start.sh
```

### Option 2 : Manuel

#### 1. Installer les dépendances

```bash
# Backend (API Flask)
cd api
pip install -r requirements.txt
cd ..

# Frontend (React)
npm install
```

#### 2. Configuration

**Créer `api/.env` :**
```env
CLOUDFLARE_API_TOKEN=votre_token_cloudflare
CLOUDFLARE_ACCOUNT_ID=votre_account_id
```

**Le fichier `.env` à la racine existe déjà :**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Copier `deploiement.py` dans `api/` :**
```bash
cp /chemin/vers/deploiement.py api/
```

#### 3. Lancer

**Terminal 1 - API :**
```bash
cd api
python app.py
```

**Terminal 2 - Frontend :**
```bash
npm start
```

#### 4. Accéder

- **Frontend** : http://localhost:3000
- **API** : http://localhost:5000

---

## 📖 Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** - Guide d'installation complet
- **[CHANGES.md](./CHANGES.md)** - Modifications apportées au projet
- **[api/README.md](./api/README.md)** - Documentation de l'API

---

## 🎯 Utilisation

### 1. Créer un site WordPress

1. Ouvrir http://localhost:3000
2. S'inscrire / Se connecter
3. Cliquer sur "Créer mon site"
4. Entrer votre domaine (ex: `monsite.com`)
5. Cliquer sur "Déployer WordPress maintenant"

### 2. Configurer le DNS

1. Après le déploiement, noter le **mot de passe MySQL**
2. Copier les **nameservers Cloudflare** affichés
3. Aller chez votre registrar de domaine
4. Remplacer les nameservers par ceux de Cloudflare
5. Attendre 5-30 minutes pour la propagation DNS

### 3. Accéder à WordPress

- **Frontend** : `https://votre-domaine.com`
- **Admin** : `https://votre-domaine.com/wp-admin`

---

## 🔧 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | Vérification santé |
| `/api/installations` | GET | Lister installations |
| `/api/installations/:username` | GET | Détails installation |
| `/api/deploy` | POST | Déployer WordPress |
| `/api/installations/:username` | DELETE | Supprimer |
| `/api/installations/:username/status` | GET | Statut |
| `/api/installations/:username/restart` | POST | Redémarrer |
| `/api/installations/:username/logs` | GET | Logs |

Voir [api/README.md](./api/README.md) pour plus de détails.

---

## 🧪 Tests

### Tester l'API

```bash
# Health check
curl http://localhost:5000/api/health

# Lister installations
curl http://localhost:5000/api/installations

# Déployer
curl -X POST http://localhost:5000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"username":"test","domain":"test.com","email":"test@test.com"}'
```

### Tester le Frontend

```bash
npm test
```

---

## 📁 Structure du Projet

```
wp-cloud-master/
├── api/                      # API Flask
│   ├── app.py               # API principale
│   ├── deploiement.py       # Déploiement WordPress
│   ├── requirements.txt     # Dépendances Python
│   ├── .env                 # Config (à créer)
│   └── README.md
│
├── src/                     # Frontend React
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   └── api.js          # Service API
│   └── context/
│       └── AppContext.js   # State global
│
├── public/
├── .env                     # Config frontend
├── package.json
├── INSTALLATION.md         # Guide complet
├── CHANGES.md             # Modifications
├── start.sh               # Script démarrage
└── README.md              # Ce fichier
```

---

## 🛠️ Commandes Utiles

### Développement

```bash
# Lancer tout
./start.sh

# Lancer API seulement
cd api && python app.py

# Lancer Frontend seulement
npm start

# Arrêter tout
./stop.sh
```

### Debug

```bash
# Logs API
tail -f api.log

# Logs Frontend
tail -f frontend.log

# Logs Docker
docker logs nom_container

# Lister installations
curl http://localhost:5000/api/installations | jq .
```

### Docker

```bash
# Voir containers
docker ps -a

# Logs container
docker logs container_name

# Nettoyer
docker system prune -a
```

---

## 🚨 Dépannage

### L'API ne démarre pas

```bash
# Vérifier Python
python3 --version

# Vérifier les dépendances
cd api && pip install -r requirements.txt

# Vérifier deploiement.py
ls -la api/deploiement.py
```

### Docker ne fonctionne pas

```bash
# Vérifier Docker
docker ps

# Démarrer Docker (Linux)
sudo systemctl start docker

# Sur Windows/Mac : Lancer Docker Desktop
```

### Le frontend ne se connecte pas

```bash
# Vérifier l'API
curl http://localhost:5000/api/health

# Vérifier .env
cat .env

# Redémarrer React
npm start
```

---

## 🔐 Sécurité

### Pour la Production

1. **Authentification API** : Ajoutez JWT ou API Keys
2. **HTTPS** : Utilisez un reverse proxy (Nginx)
3. **Rate Limiting** : Limitez les requêtes
4. **Validation** : Validez tous les inputs
5. **Secrets** : Ne commitez jamais `.env`

---

## 📊 Technologies Utilisées

### Frontend
- React 18
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- Flask 3.0
- Flask-CORS
- Python-dotenv

### Infrastructure
- Docker
- Cloudflare API
- Cloudflare Tunnels

---

## 🎯 Roadmap

### ✅ Fait
- [x] API Flask complète
- [x] Interface React moderne
- [x] Déploiement WordPress automatique
- [x] Gestion Cloudflare Tunnels
- [x] Configuration DNS automatique

### 🚧 En Cours
- [ ] Authentification API (JWT)
- [ ] WebSockets temps réel
- [ ] Tests unitaires
- [ ] CI/CD

### 📋 Prévu
- [ ] Multi-utilisateurs avec BDD
- [ ] Gestion thèmes/plugins WordPress
- [ ] Backup automatique
- [ ] Métriques et monitoring
- [ ] Scaling automatique

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

---

## 👨‍💻 Auteur

Votre Nom - [@votre_twitter](https://twitter.com/votre_twitter)

Lien du projet : [https://github.com/votre-username/wp-cloud](https://github.com/votre-username/wp-cloud)

---

## 🙏 Remerciements

- [Create React App](https://create-react-app.dev/)
- [Flask](https://flask.palletsprojects.com/)
- [Docker](https://www.docker.com/)
- [Cloudflare](https://www.cloudflare.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

Pour toute question ou problème :

1. Consultez [INSTALLATION.md](./INSTALLATION.md)
2. Vérifiez les logs : `tail -f api.log`
3. Ouvrez une issue sur GitHub

---

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile !**
