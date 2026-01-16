#!/usr/bin/env python3
"""
WordPress Auto-Deployment API
API Flask qui wrappe le système de déploiement WordPress existant (deploiement.py)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import logging

# Importer la classe WordPressDeployer depuis deploiement.py
# Ajuster le chemin si nécessaire
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
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration Cloudflare
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')

# Base de données locale (fichier JSON)
CONFIG_DIR = Path.home() / '.wordpress_deployer'
INSTALLATIONS_FILE = CONFIG_DIR / 'installations.json'


# ========== Fonctions utilitaires ==========

def load_installations():
    """Charge la liste des installations depuis le fichier JSON"""
    try:
        if INSTALLATIONS_FILE.exists():
            with open(INSTALLATIONS_FILE, 'r') as f:
                data = json.load(f)
                # Convertir en liste si c'est un dict
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


def get_deployer():
    """Crée une instance du deployer avec gestion d'erreur"""
    try:
        # Import dynamique pour éviter les erreurs si deploiement.py n'est pas présent
        from deploiement import WordPressDeployer
        return WordPressDeployer()
    except ImportError as e:
        logger.error(f"Impossible d'importer WordPressDeployer: {e}")
        logger.error("Assurez-vous que deploiement.py est dans le même répertoire que app.py")
        raise Exception("Module de déploiement non disponible")
    except Exception as e:
        logger.error(f"Erreur création deployer: {e}")
        raise


# ========== Routes API ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    try:
        # Vérifier que deploiement.py est accessible
        deployer = get_deployer()

        return jsonify({
            'status': 'ok',
            'message': 'WordPress Deployment API is running',
            'cloudflare_configured': bool(CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID),
            'deployer_available': True
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'API running but deployer unavailable',
            'error': str(e),
            'cloudflare_configured': bool(CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID),
            'deployer_available': False
        }), 500


@app.route('/api/verify-credentials', methods=['POST'])
def verify_credentials():
    """Vérifie les credentials Cloudflare"""
    try:
        if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
            return jsonify({
                'success': False,
                'message': 'Credentials Cloudflare non configurés dans .env'
            }), 400

        deployer = get_deployer()

        # Tester une requête simple à l'API Cloudflare
        result = deployer._make_cf_request('GET', 'user/tokens/verify')

        return jsonify({
            'success': True,
            'message': 'Credentials Cloudflare valides',
            'data': result
        })
    except Exception as e:
        logger.error(f"Erreur vérification credentials: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la vérification',
            'error': str(e)
        }), 500


@app.route('/api/installations', methods=['GET'])
def list_installations():
    """Liste toutes les installations WordPress"""
    try:
        installations = load_installations()

        return jsonify({
            'success': True,
            'count': len(installations),
            'installations': installations
        })
    except Exception as e:
        logger.error(f"Erreur liste installations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/installations/<username>', methods=['GET'])
def get_installation(username):
    """Récupère les détails d'une installation spécifique"""
    try:
        installation = find_installation(username)

        if installation:
            return jsonify({
                'success': True,
                'installation': installation
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Installation "{username}" non trouvée'
            }), 404
    except Exception as e:
        logger.error(f"Erreur récupération installation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/deploy', methods=['POST'])
def deploy_wordpress():
    """Déploie une nouvelle installation WordPress"""
    try:
        data = request.json
        username = data.get('username')
        domain = data.get('domain')
        email = data.get('email')

        # Validation
        if not username or not domain or not email:
            return jsonify({
                'success': False,
                'message': 'Paramètres manquants: username, domain, email requis'
            }), 400

        # Vérifier si l'installation existe déjà
        if find_installation(username):
            return jsonify({
                'success': False,
                'message': f'Une installation existe déjà pour "{username}"'
            }), 409

        # Validation du domaine
        if '.' not in domain:
            return jsonify({
                'success': False,
                'message': 'Le domaine doit être valide (ex: example.com)'
            }), 400

        logger.info(f"Déploiement WordPress pour {username} - {domain}")

        # Utiliser le deployer existant
        deployer = get_deployer()
        result = deployer.deploy(username, domain, email)

        logger.info(f"Déploiement réussi pour {username}")

        return jsonify({
            'success': True,
            'message': 'WordPress déployé avec succès',
            'data': {
                'username': result['username'],
                'domain': result['domain'],
                'email': result['email'],
                'container_name': result['container_name'],
                'mysql_container': result['mysql_container'],
                'mysql_password': result['mysql_password'],
                'port': result['port'],
                'tunnel_name': result['tunnel_name'],
                'nameservers': result['nameservers'],
                'site_url': f"https://{result['domain']}",
                'wp_admin_url': f"https://{result['domain']}/wp-admin",
                'created_at': result['created_at'],
                'status': 'active'
            }
        })

    except Exception as e:
        logger.error(f"Erreur déploiement: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du déploiement',
            'error': str(e)
        }), 500


@app.route('/api/installations/<username>', methods=['DELETE'])
def delete_installation(username):
    """Supprime complètement une installation WordPress"""
    try:
        installation = find_installation(username)

        if not installation:
            return jsonify({
                'success': False,
                'message': f'Installation "{username}" non trouvée'
            }), 404

        logger.info(f"Suppression de l'installation: {username}")

        # Utiliser le deployer existant
        deployer = get_deployer()
        deployer.delete_installation(username)

        return jsonify({
            'success': True,
            'message': f'Installation "{username}" supprimée avec succès'
        })

    except Exception as e:
        logger.error(f"Erreur suppression: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression',
            'error': str(e)
        }), 500


@app.route('/api/installations/<username>/status', methods=['GET'])
def get_installation_status(username):
    """Récupère le statut d'une installation (containers, tunnel, etc.)"""
    try:
        installation = find_installation(username)

        if not installation:
            return jsonify({
                'success': False,
                'message': f'Installation "{username}" non trouvée'
            }), 404

        deployer = get_deployer()

        status = {
            'wp_container': 'unknown',
            'mysql_container': 'unknown',
            'network': 'unknown',
            'tunnel': 'unknown'
        }

        # Vérifier le container WordPress
        try:
            wp_container = deployer.docker_client.containers.get(installation['container_name'])
            status['wp_container'] = wp_container.status
        except:
            status['wp_container'] = 'not_found'

        # Vérifier le container MySQL
        try:
            mysql_container = deployer.docker_client.containers.get(installation['mysql_container'])
            status['mysql_container'] = mysql_container.status
        except:
            status['mysql_container'] = 'not_found'

        # Vérifier le réseau
        network_name = f"network_{username}_{installation.get('timestamp', '')}"
        try:
            deployer.docker_client.networks.get(network_name)
            status['network'] = 'exists'
        except:
            status['network'] = 'not_found'

        # Vérifier le tunnel Cloudflare
        try:
            tunnel_id = installation.get('tunnel_id')
            if tunnel_id:
                deployer._make_cf_request(
                    'GET',
                    f'accounts/{CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/{tunnel_id}'
                )
                status['tunnel'] = 'active'
        except:
            status['tunnel'] = 'not_found'

        return jsonify({
            'success': True,
            'username': username,
            'status': status,
            'installation': installation
        })

    except Exception as e:
        logger.error(f"Erreur statut: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/installations/<username>/restart', methods=['POST'])
def restart_installation(username):
    """Redémarre les containers d'une installation"""
    try:
        installation = find_installation(username)

        if not installation:
            return jsonify({
                'success': False,
                'message': f'Installation "{username}" non trouvée'
            }), 404

        logger.info(f"Redémarrage de l'installation: {username}")

        deployer = get_deployer()

        # Redémarrer MySQL
        mysql_container = deployer.docker_client.containers.get(installation['mysql_container'])
        mysql_container.restart()

        # Redémarrer WordPress
        wp_container = deployer.docker_client.containers.get(installation['container_name'])
        wp_container.restart()

        return jsonify({
            'success': True,
            'message': f'Installation "{username}" redémarrée'
        })

    except Exception as e:
        logger.error(f"Erreur redémarrage: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/installations/<username>/logs', methods=['GET'])
def get_installation_logs(username):
    """Récupère les logs d'une installation"""
    try:
        installation = find_installation(username)

        if not installation:
            return jsonify({
                'success': False,
                'message': f'Installation "{username}" non trouvée'
            }), 404

        deployer = get_deployer()

        # Récupérer les logs WordPress
        wp_logs = ""
        mysql_logs = ""

        try:
            wp_container = deployer.docker_client.containers.get(installation['container_name'])
            wp_logs = wp_container.logs(tail=100).decode('utf-8')
        except Exception as e:
            wp_logs = f"Erreur récupération logs: {str(e)}"

        try:
            mysql_container = deployer.docker_client.containers.get(installation['mysql_container'])
            mysql_logs = mysql_container.logs(tail=100).decode('utf-8')
        except Exception as e:
            mysql_logs = f"Erreur récupération logs: {str(e)}"

        return jsonify({
            'success': True,
            'logs': {
                'wordpress': wp_logs,
                'mysql': mysql_logs
            }
        })

    except Exception as e:
        logger.error(f"Erreur récupération logs: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== Point d'entrée ==========

if __name__ == '__main__':
    # Vérifier que les credentials sont configurés
    if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
        logger.warning("⚠️  CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID non configurés dans .env")
        logger.warning("⚠️  Créez un fichier .env avec vos credentials Cloudflare")

    logger.info("🚀 Démarrage de l'API WordPress Deployment")
    logger.info(f"📁 Base de données: {INSTALLATIONS_FILE}")
    logger.info(f"🌐 CORS activé pour: http://localhost:3000, http://localhost:3001")

    # Démarrer le serveur Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
