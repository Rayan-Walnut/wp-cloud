#!/usr/bin/env python3
"""
WordPress Auto-Deployment API avec intégration Stripe
API Flask qui wrappe le système de déploiement WordPress + Gestion paiements Stripe
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import logging
import stripe

# Importer la classe WordPressDeployer depuis deploiement.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Charger les variables d'environnement
load_dotenv()

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration Flask
app = Flask(__name__)

# Configuration CORS - Autoriser les URLs du serveur
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://141.95.162.110:3000')
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001",
            FRONTEND_URL,
            "http://141.95.162.110:3000"
        ],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Stripe-Signature"]
    }
})

# Configuration Cloudflare
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
SERVER_URL = os.getenv('SERVER_URL', 'http://141.95.162.110:5000')

# Base de données locale (fichier JSON)
CONFIG_DIR = Path.home() / '.wordpress_deployer'
INSTALLATIONS_FILE = CONFIG_DIR / 'installations.json'
PENDING_DEPLOYMENTS_FILE = CONFIG_DIR / 'pending_deployments.json'

# Créer les fichiers si nécessaire
CONFIG_DIR.mkdir(exist_ok=True)
if not PENDING_DEPLOYMENTS_FILE.exists():
    PENDING_DEPLOYMENTS_FILE.write_text('{}')


# ========== Fonctions utilitaires ==========

def load_installations():
    """Charge la liste des installations depuis le fichier JSON"""
    try:
        if INSTALLATIONS_FILE.exists():
            with open(INSTALLATIONS_FILE, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return [{"username": k, **v} for k, v in data.items()]
                return data
        return []
    except Exception as e:
        logger.error(f"Erreur chargement installations: {e}")
        return []


def find_installation(username):
    """Trouve une installation par nom d'utilisateur"""
    installations = load_installations()
    for inst in installations:
        if inst.get('username') == username:
            return inst
    return None


def load_pending_deployments():
    """Charge les déploiements en attente de paiement"""
    try:
        return json.loads(PENDING_DEPLOYMENTS_FILE.read_text())
    except:
        return {}


def save_pending_deployment(session_id, data):
    """Sauvegarde un déploiement en attente"""
    pending = load_pending_deployments()
    pending[session_id] = data
    PENDING_DEPLOYMENTS_FILE.write_text(json.dumps(pending, indent=2))


def get_pending_deployment(session_id):
    """Récupère un déploiement en attente"""
    pending = load_pending_deployments()
    return pending.get(session_id)


def remove_pending_deployment(session_id):
    """Supprime un déploiement en attente"""
    pending = load_pending_deployments()
    if session_id in pending:
        del pending[session_id]
        PENDING_DEPLOYMENTS_FILE.write_text(json.dumps(pending, indent=2))


def get_deployer():
    """Crée une instance du deployer avec gestion d'erreur"""
    try:
        from deploiement import WordPressDeployer
        return WordPressDeployer()
    except ImportError as e:
        logger.error(f"Impossible d'importer WordPressDeployer: {e}")
        raise Exception("Module de déploiement non disponible")
    except Exception as e:
        logger.error(f"Erreur création deployer: {e}")
        raise


# ========== Routes Stripe ==========

@app.route('/api/stripe/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Crée une session Stripe Checkout"""
    try:
        data = request.json
        username = data.get('username')
        domain = data.get('domain')
        email = data.get('email')
        price_id = data.get('price_id')  # ID du prix Stripe

        if not all([username, domain, email, price_id]):
            return jsonify({
                'success': False,
                'message': 'Paramètres manquants'
            }), 400

        # Créer une session Stripe Checkout
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='subscription',
            customer_email=email,
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            success_url=f'{FRONTEND_URL}/confirmation?session_id={{CHECKOUT_SESSION_ID}}&success=1',
            cancel_url=f'{FRONTEND_URL}/create?canceled=1',
            metadata={
                'username': username,
                'domain': domain,
                'email': email
            }
        )

        # Sauvegarder les infos en attente de paiement
        save_pending_deployment(session.id, {
            'username': username,
            'domain': domain,
            'email': email,
            'created_at': datetime.now().isoformat()
        })

        return jsonify({
            'success': True,
            'session_id': session.id,
            'session_url': session.url
        })

    except Exception as e:
        logger.error(f"Erreur création session Stripe: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    """Endpoint pour recevoir les webhooks Stripe"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        # Vérifier la signature du webhook
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Payload invalide: {e}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Signature invalide: {e}")
        return jsonify({'error': 'Invalid signature'}), 400

    event_type = event['type']
    data = event['data']['object']

    logger.info(f"📨 Webhook Stripe reçu: {event_type}")

    # Gérer les différents événements
    if event_type == 'checkout.session.completed':
        # ✅ Paiement initial réussi
        handle_checkout_completed(data)

    elif event_type == 'invoice.paid':
        # ✅ Facture payée (renouvellement)
        handle_invoice_paid(data)

    elif event_type == 'invoice.payment_failed':
        # ❌ Paiement échoué
        handle_payment_failed(data)

    elif event_type == 'customer.subscription.deleted':
        # 🗑️ Abonnement annulé
        handle_subscription_deleted(data)

    elif event_type == 'customer.subscription.updated':
        # 🔄 Abonnement modifié
        handle_subscription_updated(data)

    return jsonify({'status': 'success'}), 200


def handle_checkout_completed(session):
    """Gère la finalisation d'un checkout (premier paiement)"""
    try:
        session_id = session['id']
        customer_id = session['customer']
        subscription_id = session.get('subscription')

        # Récupérer les infos du déploiement en attente
        deployment_data = get_pending_deployment(session_id)

        if not deployment_data:
            logger.error(f"Aucun déploiement en attente pour session {session_id}")
            return

        username = deployment_data['username']
        domain = deployment_data['domain']
        email = deployment_data['email']

        logger.info(f"✅ Paiement confirmé pour {username} - Déploiement de {domain}")

        # Déployer WordPress
        deployer = get_deployer()
        result = deployer.deploy(username, domain, email)

        logger.info(f"✅ WordPress déployé avec succès pour {username}")

        # Supprimer de la liste d'attente
        remove_pending_deployment(session_id)

        # TODO: Envoyer un email de confirmation au client

    except Exception as e:
        logger.error(f"❌ Erreur déploiement après paiement: {e}")


def handle_invoice_paid(invoice):
    """Gère le paiement d'une facture (renouvellement)"""
    customer_id = invoice['customer']
    subscription_id = invoice['subscription']

    logger.info(f"💰 Facture payée pour customer {customer_id}")
    # TODO: Prolonger l'accès du client


def handle_payment_failed(invoice):
    """Gère l'échec d'un paiement"""
    customer_id = invoice['customer']

    logger.warning(f"❌ Paiement échoué pour customer {customer_id}")
    # TODO: Envoyer un email d'alerte


def handle_subscription_deleted(subscription):
    """Gère l'annulation d'un abonnement"""
    customer_id = subscription['customer']
    metadata = subscription.get('metadata', {})
    username = metadata.get('username')

    logger.info(f"🗑️ Abonnement annulé pour {customer_id}")

    if username:
        try:
            deployer = get_deployer()
            deployer.delete_installation(username)
            logger.info(f"✅ WordPress supprimé pour {username}")
        except Exception as e:
            logger.error(f"❌ Erreur suppression WordPress: {e}")


def handle_subscription_updated(subscription):
    """Gère la modification d'un abonnement"""
    customer_id = subscription['customer']

    logger.info(f"🔄 Abonnement modifié pour {customer_id}")
    # TODO: Mettre à jour les ressources


# ========== Routes API (déjà existantes) ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    try:
        deployer = get_deployer()

        return jsonify({
            'status': 'ok',
            'message': 'WordPress Deployment API is running',
            'cloudflare_configured': bool(CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID),
            'stripe_configured': bool(stripe.api_key),
            'deployer_available': True
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'API running but deployer unavailable',
            'error': str(e),
            'cloudflare_configured': bool(CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID),
            'stripe_configured': bool(stripe.api_key),
            'deployer_available': False
        }), 500


# ... (toutes les autres routes existantes restent identiques)
# Copier les routes depuis l'ancien app.py :
# - /api/verify-credentials
# - /api/installations
# - /api/installations/<username>
# - /api/deploy
# - /api/installations/<username> DELETE
# - /api/installations/<username>/status
# - /api/installations/<username>/restart
# - /api/installations/<username>/logs


if __name__ == '__main__':
    if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
        logger.warning("⚠️  CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID non configurés")

    if not stripe.api_key:
        logger.warning("⚠️  STRIPE_SECRET_KEY non configuré")

    logger.info("🚀 Démarrage de l'API WordPress Deployment avec Stripe")
    logger.info(f"📁 Base de données: {INSTALLATIONS_FILE}")
    logger.info(f"🌐 CORS activé pour: {FRONTEND_URL}")
    logger.info(f"💳 Stripe configuré: {bool(stripe.api_key)}")

    app.run(host='0.0.0.0', port=5000, debug=True)
