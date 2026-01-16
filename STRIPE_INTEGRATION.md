# 💳 Intégration Stripe Complète

Guide complet pour l'intégration de Stripe avec webhooks et déploiement WordPress automatique.

---

## 🎯 Problèmes Corrigés

### 1. **L'API pointait sur localhost**
✅ **Corrigé** : Configuration mise à jour pour pointer vers l'IP du serveur `141.95.162.110`

### 2. **Pas de webhooks Stripe**
✅ **Corrigé** : Endpoint `/webhook/stripe` ajouté à l'API

### 3. **Pas d'obligation de connexion**
✅ **Corrigé** : La page Pricing force maintenant la connexion avant sélection de plan

### 4. **Pas d'intégration Stripe réelle**
✅ **Corrigé** : Workflow complet avec Checkout Session et webhooks

---

## 📁 Fichiers Modifiés/Créés

### 1. Configuration Frontend (`.env`)

**Fichier** : `.env`

```env
# URL de l'API - Pointage vers le serveur
REACT_APP_API_URL=http://141.95.162.110:5000/api

# URL publique du frontend pour les redirections Stripe
REACT_APP_PUBLIC_URL=http://141.95.162.110:3000
```

**Changement local → production** :
- Remplacez `141.95.162.110` par votre nom de domaine quand vous l'aurez configuré
- Exemple : `https://votre-domaine.com`

---

### 2. Configuration API (` api/.env`)

**Fichier** : `api/.env` (à créer à partir de `.env.example`)

```env
# Configuration Cloudflare
CLOUDFLARE_API_TOKEN=votre_token_cloudflare
CLOUDFLARE_ACCOUNT_ID=votre_account_id

# Configuration Flask
FLASK_ENV=production
FLASK_DEBUG=False

# Configuration Stripe
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# URL du serveur
SERVER_URL=http://141.95.162.110:5000
FRONTEND_URL=http://141.95.162.110:3000
```

**Où trouver les clés Stripe** :
1. Allez sur https://dashboard.stripe.com/test/apikeys (mode test) ou https://dashboard.stripe.com/apikeys (mode live)
2. **Secret Key** : `sk_test_...` ou `sk_live_...`
3. **Publishable Key** : `pk_test_...` ou `pk_live_...`
4. **Webhook Secret** : Créé automatiquement quand vous configurez un webhook (voir ci-dessous)

---

### 3. API avec Stripe (`api/app_with_stripe.py`)

Un nouveau fichier `app_with_stripe.py` a été créé avec :

**Nouvelles routes** :
- `POST /api/stripe/create-checkout-session` - Crée une session de paiement Stripe
- `POST /webhook/stripe` - Reçoit les webhooks de Stripe

**Événements Stripe gérés** :
- `checkout.session.completed` → Déploie WordPress après paiement
- `invoice.paid` → Prolonge l'accès (renouvellement)
- `invoice.payment_failed` → Alerte paiement échoué
- `customer.subscription.deleted` → Supprime le WordPress
- `customer.subscription.updated` → Met à jour les ressources

---

### 4. Page Pricing Modifiée (`src/pages/Pricing.js`)

**Changement** : Obligation de connexion avant sélection de plan

```javascript
const goStripe = (plan) => {
  // ⚠️ Forcer la connexion avant de choisir un plan
  if (!auth.user) {
    alert("Veuillez vous connecter ou créer un compte avant de choisir un plan.");
    nav("/login");
    return;
  }

  // Rediriger vers la page de création avec le plan sélectionné
  nav("/create", { state: { planId: plan.id } });
};
```

---

## 🚀 Workflow Complet

### Flux utilisateur

```
1. User clique sur "Pricing"
   ↓
2. Sélectionne un plan
   ↓
3. ❌ Pas connecté ? → Redirection vers /login
   ✅ Connecté ? → Redirection vers /create
   ↓
4. Entre son domaine
   ↓
5. Clique "Déployer WordPress"
   ↓
6. Frontend appelle POST /api/stripe/create-checkout-session
   ↓
7. API crée une Stripe Checkout Session
   ↓
8. User est redirigé vers Stripe pour payer
   ↓
9. User paie avec sa carte
   ↓
10. Stripe envoie un webhook à POST /webhook/stripe
   ↓
11. Événement "checkout.session.completed"
   ↓
12. API déploie WordPress automatiquement
   ↓
13. Stripe redirige vers /confirmation?success=1
   ↓
14. Page affiche les nameservers Cloudflare
   ↓
15. User configure son DNS
   ↓
16. Site WordPress accessible !
```

---

## 🔧 Configuration Stripe

### 1. Créer les produits et prix

Allez sur https://dashboard.stripe.com/test/products et créez vos produits :

**Exemple : Plan Basic**
```
Nom : WordPress Hébergement - Basic
Description : 1 Go de stockage
Prix : 4.00 EUR / mois (récurrent)
```

Copiez l'ID du prix (commence par `price_...`) et ajoutez-le dans `src/data/plans.js` :

```javascript
export const PLANS = [
  {
    id: "basic",
    name: "Stockage +1 Go",
    priceMonthly: 1.5,
    tagline: "Pour démarrer un site WordPress",
    perks: ["1 Go de stockage", "1 site WordPress"],
    stripePriceId: "price_1234567890ABC", // ← Ajoutez l'ID du prix Stripe ici
  },
  // ...
];
```

---

### 2. Configurer le Webhook Stripe

#### Étape 1 : Créer le Webhook

1. Allez sur https://dashboard.stripe.com/test/webhooks
2. Cliquez sur **"+ Add endpoint"**
3. **Endpoint URL** : `http://141.95.162.110:5000/webhook/stripe`
   (Remplacez par votre nom de domaine en production)
4. **Description** : `WordPress Deployment Webhook`
5. **Events to send** : Sélectionnez les événements suivants :
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
6. Cliquez sur **"Add endpoint"**

#### Étape 2 : Copier le Webhook Secret

1. Une fois créé, cliquez sur votre webhook
2. Cliquez sur **"Reveal"** à côté de "Signing secret"
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans `api/.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_...votre_secret
```

---

### 3. Tester les Webhooks Localement

Pour tester en développement local, utilisez **Stripe CLI** :

```bash
# Installer Stripe CLI (Linux)
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Se connecter à Stripe
stripe login

# Écouter les webhooks et les forwarder vers votre API locale
stripe listen --forward-to http://localhost:5000/webhook/stripe

# Dans un autre terminal, déclencher un événement de test
stripe trigger checkout.session.completed
```

---

## 🔄 Migration de l'ancien app.py

### Option 1 : Remplacer complètement

```bash
cd api
mv app.py app_old.py
mv app_with_stripe.py app.py
```

### Option 2 : Fusionner manuellement

Copiez les parties suivantes de `app_with_stripe.py` dans votre `app.py` actuel :

1. **Imports Stripe** (ligne 13)
```python
import stripe
```

2. **Configuration Stripe** (après ligne 42)
```python
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
SERVER_URL = os.getenv('SERVER_URL', 'http://141.95.162.110:5000')
```

3. **Nouvelle route `/api/stripe/create-checkout-session`** (lignes ~140-180)

4. **Nouvelle route `/webhook/stripe`** (lignes ~183-230)

5. **Fonctions de gestion des événements** (lignes ~233-330)

---

## 📊 Exemple de requête Frontend

### Créer une Checkout Session

```javascript
// Dans CreateServer.js ou un nouveau composant Checkout

const handlePayment = async () => {
  try {
    const response = await fetch('http://141.95.162.110:5000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: auth.user.email.split('@')[0],
        domain: domainInput,
        email: auth.user.email,
        price_id: 'price_1234567890ABC', // ID du prix Stripe
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Rediriger vers Stripe Checkout
      window.location.href = data.session_url;
    } else {
      alert('Erreur: ' + data.error);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de la session de paiement');
  }
};
```

---

## 🔐 Sécurité

### 1. Validation de la signature Webhook

**IMPORTANT** : L'API vérifie automatiquement la signature de chaque webhook avec :

```python
event = stripe.Webhook.construct_event(
    payload, sig_header, STRIPE_WEBHOOK_SECRET
)
```

Cela garantit que le webhook provient bien de Stripe et non d'un attaquant.

### 2. Mode Test vs Mode Live

**Mode Test** (développement) :
- Clés commençant par `sk_test_...` et `pk_test_...`
- Dashboard test : https://dashboard.stripe.com/test/
- Cartes de test : https://stripe.com/docs/testing

**Mode Live** (production) :
- Clés commençant par `sk_live_...` et `pk_live_...`
- Dashboard live : https://dashboard.stripe.com/
- Vraies cartes bancaires

**⚠️ Ne JAMAIS committer les clés secrètes** dans Git !

---

## 🧪 Tests

### 1. Tester la Checkout Session

```bash
curl -X POST http://141.95.162.110:5000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "domain": "test.com",
    "email": "test@test.com",
    "price_id": "price_VOTRE_PRIX_ID"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "session_id": "cs_test_...",
  "session_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### 2. Tester le Webhook

Avec Stripe CLI :

```bash
stripe trigger checkout.session.completed
```

Vous devriez voir dans les logs de l'API :
```
📨 Webhook Stripe reçu: checkout.session.completed
✅ Paiement confirmé pour testuser - Déploiement de test.com
✅ WordPress déployé avec succès pour testuser
```

### 3. Cartes de Test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 9995` | ❌ Carte déclinée |
| `4000 0025 0000 3155` | 🔐 Nécessite 3D Secure |

Toutes avec :
- **Expiration** : N'importe quelle date future
- **CVC** : N'importe quel 3 chiffres
- **ZIP** : N'importe quel code postal

---

## 📈 Monitoring

### 1. Logs Stripe

Allez sur https://dashboard.stripe.com/test/logs pour voir :
- Tous les événements webhook envoyés
- Succès/échecs des webhooks
- Détails des erreurs

### 2. Logs de l'API

```bash
tail -f api/wordpress_deployment.log
```

Vous verrez :
```
📨 Webhook Stripe reçu: checkout.session.completed
✅ Paiement confirmé pour client1 - Déploiement de monsite.com
✅ WordPress déployé avec succès pour client1
```

---

## 🚨 Dépannage

### Le webhook ne fonctionne pas

**1. Vérifier que le webhook est configuré dans Stripe**
- URL : `http://141.95.162.110:5000/webhook/stripe` (pas `/api/webhook/stripe` !)
- Événements sélectionnés

**2. Vérifier le secret webhook**
```bash
# Dans api/.env
echo $STRIPE_WEBHOOK_SECRET  # Doit commencer par whsec_
```

**3. Vérifier les logs Stripe**
- https://dashboard.stripe.com/test/webhooks
- Cliquez sur votre webhook
- Onglet "Attempts" → Voir les erreurs

**4. Tester en local avec Stripe CLI**
```bash
stripe listen --forward-to http://localhost:5000/webhook/stripe
```

### Le paiement fonctionne mais WordPress ne se déploie pas

**1. Vérifier que deploiement.py est présent**
```bash
ls -la api/deploiement.py
```

**2. Vérifier que Docker tourne**
```bash
docker ps
```

**3. Vérifier les logs**
```bash
tail -f api/wordpress_deployment.log
```

---

## ✅ Checklist de Déploiement

Avant de lancer en production :

- [ ] Créer les produits et prix dans Stripe (mode live)
- [ ] Configurer le webhook Stripe avec l'URL publique
- [ ] Mettre à jour `api/.env` avec les clés live
- [ ] Mettre à jour `.env` frontend avec l'URL publique
- [ ] Tester un paiement complet de bout en bout
- [ ] Vérifier que WordPress se déploie après paiement
- [ ] Vérifier les logs webhook dans Stripe Dashboard
- [ ] Tester l'annulation d'abonnement
- [ ] Configurer les emails de confirmation Stripe

---

## 📚 Ressources

- **Documentation Stripe Checkout** : https://stripe.com/docs/payments/checkout
- **Documentation Webhooks** : https://stripe.com/docs/webhooks
- **Événements Stripe** : https://stripe.com/docs/api/events/types
- **Cartes de test** : https://stripe.com/docs/testing
- **Stripe CLI** : https://stripe.com/docs/stripe-cli

---

**🎉 Votre plateforme est maintenant prête avec Stripe !**
