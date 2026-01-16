# 🚀 WordPress Auto-Deployment API

API Flask pour gérer le déploiement automatique de sites WordPress avec Docker et Cloudflare Tunnels depuis une interface web React.

## 📋 Prérequis

- Python 3.8+
- Docker installé et en cours d'exécution
- Compte Cloudflare avec API Token et Account ID
- Le script `deploiement.py` (système de déploiement principal)

## 📦 Installation

### 1. Installer les dépendances Python

```bash
cd api
pip install -r requirements.txt
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `api/` :

```bash
cp .env.example .env
nano .env
```

Remplissez avec vos credentials Cloudflare :

```env
CLOUDFLARE_API_TOKEN=votre_token_cloudflare
CLOUDFLARE_ACCOUNT_ID=votre_account_id
```

### 3. Placer le fichier deploiement.py

Assurez-vous que le fichier `deploiement.py` (votre script de déploiement existant) est dans le même répertoire que `app.py` :

```
api/
  ├── app.py
  ├── deploiement.py  ← Votre script existant
  ├── requirements.txt
  ├── .env
  └── README.md
```

## 🚀 Démarrage

### Lancer l'API

```bash
cd api
python app.py
```

L'API sera accessible sur `http://localhost:5000`

### En production

Pour un environnement de production, utilisez Gunicorn :

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📡 Endpoints API

### Vérification de santé

```http
GET /api/health
```

Vérifie que l'API fonctionne correctement.

**Réponse** :
```json
{
  "status": "ok",
  "message": "WordPress Deployment API is running",
  "cloudflare_configured": true,
  "deployer_available": true
}
```

---

### Vérifier les credentials Cloudflare

```http
POST /api/verify-credentials
```

Vérifie que les credentials Cloudflare sont valides.

**Réponse** :
```json
{
  "success": true,
  "message": "Credentials Cloudflare valides",
  "data": { ... }
}
```

---

### Lister toutes les installations

```http
GET /api/installations
```

Retourne la liste de toutes les installations WordPress.

**Réponse** :
```json
{
  "success": true,
  "count": 2,
  "installations": [
    {
      "username": "client1",
      "domain": "example.com",
      "email": "contact@example.com",
      "container_name": "docker_client1_20260116_120000",
      "status": "active",
      ...
    }
  ]
}
```

---

### Récupérer une installation spécifique

```http
GET /api/installations/<username>
```

Retourne les détails d'une installation.

**Exemple** :
```http
GET /api/installations/client1
```

**Réponse** :
```json
{
  "success": true,
  "installation": {
    "username": "client1",
    "domain": "example.com",
    "site_url": "https://example.com",
    "wp_admin_url": "https://example.com/wp-admin",
    ...
  }
}
```

---

### Déployer un nouveau site WordPress

```http
POST /api/deploy
Content-Type: application/json

{
  "username": "client1",
  "domain": "example.com",
  "email": "contact@example.com"
}
```

Déploie un nouveau site WordPress avec Docker + Cloudflare Tunnel.

**Réponse** :
```json
{
  "success": true,
  "message": "WordPress déployé avec succès",
  "data": {
    "username": "client1",
    "domain": "example.com",
    "container_name": "docker_client1_20260116_120000",
    "mysql_container": "mysql_client1_20260116_120000",
    "mysql_password": "xxxxxxxxxxxxx",
    "port": "32768",
    "tunnel_name": "tunnel_client1_20260116_120000",
    "nameservers": [
      "ns1.cloudflare.com",
      "ns2.cloudflare.com"
    ],
    "site_url": "https://example.com",
    "wp_admin_url": "https://example.com/wp-admin",
    "created_at": "2026-01-16T12:00:00",
    "status": "active"
  }
}
```

---

### Supprimer une installation

```http
DELETE /api/installations/<username>
```

Supprime complètement une installation (containers, tunnel, zone DNS).

**Exemple** :
```http
DELETE /api/installations/client1
```

**Réponse** :
```json
{
  "success": true,
  "message": "Installation \"client1\" supprimée avec succès"
}
```

---

### Récupérer le statut d'une installation

```http
GET /api/installations/<username>/status
```

Vérifie l'état des containers, réseau et tunnel.

**Réponse** :
```json
{
  "success": true,
  "username": "client1",
  "status": {
    "wp_container": "running",
    "mysql_container": "running",
    "network": "exists",
    "tunnel": "active"
  },
  "installation": { ... }
}
```

---

### Redémarrer une installation

```http
POST /api/installations/<username>/restart
```

Redémarre les containers WordPress et MySQL.

**Réponse** :
```json
{
  "success": true,
  "message": "Installation \"client1\" redémarrée"
}
```

---

### Récupérer les logs d'une installation

```http
GET /api/installations/<username>/logs
```

Retourne les logs des containers WordPress et MySQL.

**Réponse** :
```json
{
  "success": true,
  "logs": {
    "wordpress": "...",
    "mysql": "..."
  }
}
```

---

## 🔧 Intégration avec le frontend React

### Configuration

Dans le frontend React, créez un fichier `.env` :

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Utilisation du service API

```javascript
import api from './services/api';

// Lister les installations
const response = await api.listInstallations();
console.log(response.installations);

// Déployer un site
const deployment = await api.deployWordPress({
  username: 'client1',
  domain: 'example.com',
  email: 'contact@example.com'
});

// Supprimer une installation
await api.deleteInstallation('client1');
```

---

## 🛠️ Commandes utiles

### Tester l'API avec curl

```bash
# Health check
curl http://localhost:5000/api/health

# Lister les installations
curl http://localhost:5000/api/installations

# Déployer un site
curl -X POST http://localhost:5000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "domain": "test.com",
    "email": "test@test.com"
  }'

# Supprimer une installation
curl -X DELETE http://localhost:5000/api/installations/test
```

---

## 📁 Structure du projet

```
api/
├── app.py              # API Flask principale
├── deploiement.py      # Script de déploiement WordPress (existant)
├── requirements.txt    # Dépendances Python
├── .env               # Variables d'environnement
├── .env.example       # Template pour .env
└── README.md          # Documentation
```

---

## 🔐 Sécurité

### Pour la production

1. **Authentification** : Ajoutez un système d'authentification (JWT, OAuth)
2. **HTTPS** : Utilisez un reverse proxy (Nginx, Traefik) avec SSL
3. **Rate limiting** : Limitez le nombre de requêtes par IP
4. **Validation** : Validez tous les inputs utilisateur
5. **Secrets** : Ne commitez jamais le fichier `.env`

### Exemple avec authentification basique

```python
from functools import wraps
from flask import request

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != os.getenv('API_KEY'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/deploy', methods=['POST'])
@require_api_key
def deploy_wordpress():
    # ...
```

---

## 🐛 Debugging

### Activer les logs détaillés

```python
# Dans app.py
logging.basicConfig(level=logging.DEBUG)
```

### Voir les logs de l'API

```bash
tail -f api.log
```

### Tester les imports

```bash
python -c "from deploiement import WordPressDeployer; print('OK')"
```

---

## 📊 Monitoring

### Vérifier les installations actives

```bash
curl http://localhost:5000/api/installations | jq .
```

### Vérifier le statut d'une installation

```bash
curl http://localhost:5000/api/installations/client1/status | jq .
```

---

## 🚨 Gestion des erreurs

L'API retourne des codes HTTP appropriés :

- `200` : Succès
- `400` : Requête invalide (paramètres manquants)
- `404` : Installation non trouvée
- `409` : Conflit (installation existe déjà)
- `500` : Erreur serveur

Exemple de réponse d'erreur :

```json
{
  "success": false,
  "message": "Installation \"client1\" non trouvée",
  "error": "Details..."
}
```

---

## 📝 TODO / Améliorations futures

- [ ] Authentification JWT
- [ ] WebSockets pour les mises à jour en temps réel du déploiement
- [ ] Pagination pour la liste des installations
- [ ] Backup automatique des installations
- [ ] Métriques et analytics
- [ ] Support multi-utilisateurs
- [ ] API de gestion des thèmes/plugins WordPress
- [ ] Notifications par email/Slack

---

## 💡 Support

Pour toute question ou problème :

1. Vérifiez que Docker est en cours d'exécution
2. Vérifiez que les credentials Cloudflare sont corrects
3. Vérifiez les logs : `tail -f wordpress_deployment.log`
4. Testez l'API : `curl http://localhost:5000/api/health`

---

## 📄 Licence

MIT
