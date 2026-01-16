"""
WordPress Auto-Deployment avec Cloudflare Tunnels
Crée automatiquement un container Docker WordPress + Tunnel Cloudflare + Configuration DNS
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import docker
import requests
from docker.errors import DockerException
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('wordpress_deployment.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

# Configuration
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN')
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACCOUNT_ID')
CONFIG_DIR = Path.home() / '.wordpress_deployer'
INSTALLATIONS_FILE = CONFIG_DIR / 'installations.json'

# URLs API Cloudflare
CF_API_BASE = 'https://api.cloudflare.com/client/v4'
CF_TUNNELS_API = f'{CF_API_BASE}/accounts/{CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel'


class CloudflareAPIError(Exception):
    """Exception pour les erreurs API Cloudflare"""
    pass


class DockerDeploymentError(Exception):
    """Exception pour les erreurs de déploiement Docker"""
    pass


class WordPressDeployer:
    """Classe principale pour déployer WordPress avec Cloudflare Tunnels"""

    def __init__(self):
        """Initialise le déployer avec les clients Docker et Cloudflare"""
        self._validate_environment()

        try:
            self.docker_client = docker.from_env()
            self.docker_client.ping()
            logger.info("✅ Connexion Docker établie")
        except DockerException as e:
            logger.error(f"❌ Erreur Docker : {e}")
            raise DockerDeploymentError("Docker n'est pas disponible. Vérifiez qu'il est installé et démarré.")

        self.cf_headers = {
            'Authorization': f'Bearer {CLOUDFLARE_API_TOKEN}',
            'Content-Type': 'application/json'
        }

        # Créer le répertoire de config si nécessaire
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def _validate_environment(self) -> None:
        """Valide que toutes les variables d'environnement sont présentes"""
        if not CLOUDFLARE_API_TOKEN:
            raise ValueError("CLOUDFLARE_API_TOKEN manquant dans .env")
        if not CLOUDFLARE_ACCOUNT_ID:
            raise ValueError("CLOUDFLARE_ACCOUNT_ID manquant dans .env")

    def _make_cf_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """
        Effectue une requête à l'API Cloudflare

        Args:
            method: Méthode HTTP (GET, POST, PUT, DELETE)
            endpoint: Endpoint de l'API
            data: Données JSON à envoyer
            params: Paramètres de requête

        Returns:
            Réponse JSON de l'API

        Raises:
            CloudflareAPIError: Si la requête échoue
        """
        url = f'{CF_API_BASE}/{endpoint}'

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.cf_headers,
                json=data,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()

            if not result.get('success', False):
                errors = result.get('errors', [])
                error_msg = ', '.join([e.get('message', str(e)) for e in errors])
                raise CloudflareAPIError(f"API Cloudflare error: {error_msg}")

            return result

        except requests.RequestException as e:
            logger.error(f"Erreur requête Cloudflare : {e}")
            raise CloudflareAPIError(f"Échec de la requête API : {e}")

    def create_docker_container(
        self,
        username: str,
        timestamp: str,
        domain: str,
        email: str
    ) -> Tuple[str, str]:
        """
        Crée un container Docker avec WordPress et MySQL

        Args:
            username: Nom d'utilisateur du client
            timestamp: Timestamp pour l'unicité
            domain: Nom de domaine
            email: Email du client

        Returns:
            Tuple (container_name, container_id)

        Raises:
            DockerDeploymentError: Si la création échoue
        """
        container_name = f"docker_{username}_{timestamp}"

        logger.info(f"🐳 Création du container Docker : {container_name}")

        try:
            # Créer un réseau Docker dédié
            network_name = f"network_{username}_{timestamp}"
            network = self.docker_client.networks.create(
                network_name,
                driver="bridge"
            )
            logger.info(f"📡 Réseau créé : {network_name}")

            # Créer le container MySQL
            mysql_container_name = f"mysql_{username}_{timestamp}"
            mysql_password = self._generate_password()

            mysql_container = self.docker_client.containers.run(
                "mysql:8.0",
                name=mysql_container_name,
                environment={
                    'MYSQL_ROOT_PASSWORD': mysql_password,
                    'MYSQL_DATABASE': 'wordpress',
                    'MYSQL_USER': 'wordpress',
                    'MYSQL_PASSWORD': mysql_password
                },
                network=network_name,
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )
            logger.info(f"🗄️  MySQL créé : {mysql_container_name}")

            # Attendre que MySQL soit prêt
            logger.info("⏳ Attente du démarrage de MySQL...")
            time.sleep(15)

            # Créer le container WordPress
            wordpress_container = self.docker_client.containers.run(
                "wordpress:latest",
                name=container_name,
                environment={
                    'WORDPRESS_DB_HOST': mysql_container_name,
                    'WORDPRESS_DB_USER': 'wordpress',
                    'WORDPRESS_DB_PASSWORD': mysql_password,
                    'WORDPRESS_DB_NAME': 'wordpress',
                    'WORDPRESS_CONFIG_EXTRA': f"""
                        define('WP_HOME', 'https://{domain}');
                        define('WP_SITEURL', 'https://{domain}');
                    """
                },
                ports={'80/tcp': None},  # Port assigné dynamiquement
                network=network_name,
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )

            # Récupérer le port mappé
            wordpress_container.reload()
            port = wordpress_container.ports['80/tcp'][0]['HostPort']

            logger.info(f"✅ WordPress créé : {container_name} (port {port})")

            return container_name, wordpress_container.id, mysql_container_name, mysql_container.id, port, mysql_password

        except DockerException as e:
            logger.error(f"❌ Erreur création Docker : {e}")
            # Cleanup en cas d'erreur
            self._cleanup_docker(container_name, username, timestamp)
            raise DockerDeploymentError(f"Échec de la création du container : {e}")

    def _generate_password(self, length: int = 20) -> str:
        """Génère un mot de passe sécurisé"""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def install_cloudflared(self, container_name: str) -> None:
        """
        Installe cloudflared dans le container WordPress

        Args:
            container_name: Nom du container

        Raises:
            DockerDeploymentError: Si l'installation échoue
        """
        logger.info(f"📦 Installation de cloudflared dans {container_name}")

        try:
            container = self.docker_client.containers.get(container_name)

            # Commandes d'installation
            commands = [
                "apt-get update",
                "apt-get install -y wget",
                "wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb",
                "dpkg -i cloudflared-linux-amd64.deb",
                "rm cloudflared-linux-amd64.deb"
            ]

            for cmd in commands:
                exit_code, output = container.exec_run(cmd)
                if exit_code != 0:
                    raise DockerDeploymentError(f"Échec de la commande : {cmd}")

            logger.info("✅ cloudflared installé avec succès")

        except DockerException as e:
            logger.error(f"❌ Erreur installation cloudflared : {e}")
            raise DockerDeploymentError(f"Échec de l'installation de cloudflared : {e}")

    def create_cloudflare_tunnel(
        self,
        username: str,
        timestamp: str
    ) -> Dict:
        """
        Crée un tunnel Cloudflare

        Args:
            username: Nom d'utilisateur du client
            timestamp: Timestamp pour l'unicité

        Returns:
            Informations du tunnel (id, name, credentials)

        Raises:
            CloudflareAPIError: Si la création échoue
        """
        tunnel_name = f"tunnel_{username}_{timestamp}"
        logger.info(f"🔗 Création du tunnel Cloudflare : {tunnel_name}")

        try:
            # Créer le tunnel
            result = self._make_cf_request(
                'POST',
                f'accounts/{CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel',
                data={
                    'name': tunnel_name,
                    'tunnel_secret': self._generate_tunnel_secret()
                }
            )

            tunnel_data = result['result']
            logger.info(f"✅ Tunnel créé : {tunnel_data['id']}")

            return {
                'id': tunnel_data['id'],
                'name': tunnel_name,
                'credentials': tunnel_data['credentials_file']
            }

        except CloudflareAPIError as e:
            logger.error(f"❌ Erreur création tunnel : {e}")
            raise

    def _generate_tunnel_secret(self) -> str:
        """Génère un secret pour le tunnel (32 bytes en base64)"""
        import base64
        import secrets
        return base64.b64encode(secrets.token_bytes(32)).decode('utf-8')

    def create_cloudflare_zone(self, domain: str) -> Dict:
        """
        Crée une zone Cloudflare pour le domaine

        Args:
            domain: Nom de domaine

        Returns:
            Informations de la zone (id, nameservers)

        Raises:
            CloudflareAPIError: Si la création échoue
        """
        logger.info(f"🌐 Création de la zone Cloudflare : {domain}")

        try:
            # Vérifier si la zone existe déjà
            existing = self._make_cf_request(
                'GET',
                'zones',
                params={'name': domain}
            )

            if existing['result']:
                zone = existing['result'][0]
                logger.info(f"ℹ️  Zone existante trouvée : {zone['id']}")
                return {
                    'id': zone['id'],
                    'nameservers': zone['name_servers']
                }

            # Créer la zone
            result = self._make_cf_request(
                'POST',
                'zones',
                data={
                    'name': domain,
                    'account': {'id': CLOUDFLARE_ACCOUNT_ID},
                    'jump_start': True  # Configuration automatique des DNS
                }
            )

            zone_data = result['result']
            logger.info(f"✅ Zone créée : {zone_data['id']}")

            return {
                'id': zone_data['id'],
                'nameservers': zone_data['name_servers']
            }

        except CloudflareAPIError as e:
            logger.error(f"❌ Erreur création zone : {e}")
            raise

    def configure_dns_records(
        self,
        zone_id: str,
        domain: str,
        tunnel_id: str
    ) -> None:
        """
        Configure les enregistrements DNS pour le tunnel

        Args:
            zone_id: ID de la zone Cloudflare
            domain: Nom de domaine
            tunnel_id: ID du tunnel

        Raises:
            CloudflareAPIError: Si la configuration échoue
        """
        logger.info(f"📝 Configuration des DNS pour {domain}")

        tunnel_target = f"{tunnel_id}.cfargotunnel.com"

        records = [
            {'name': '@', 'type': 'CNAME', 'content': tunnel_target},
            {'name': 'www', 'type': 'CNAME', 'content': tunnel_target}
        ]

        try:
            for record in records:
                # Vérifier si le record existe
                existing = self._make_cf_request(
                    'GET',
                    f'zones/{zone_id}/dns_records',
                    params={'name': f"{record['name']}.{domain}" if record['name'] != '@' else domain}
                )

                if existing['result']:
                    # Mettre à jour le record existant
                    record_id = existing['result'][0]['id']
                    self._make_cf_request(
                        'PUT',
                        f'zones/{zone_id}/dns_records/{record_id}',
                        data={
                            'type': record['type'],
                            'name': record['name'],
                            'content': record['content'],
                            'proxied': True,
                            'ttl': 1
                        }
                    )
                    logger.info(f"✅ DNS mis à jour : {record['name']}")
                else:
                    # Créer le record
                    self._make_cf_request(
                        'POST',
                        f'zones/{zone_id}/dns_records',
                        data={
                            'type': record['type'],
                            'name': record['name'],
                            'content': record['content'],
                            'proxied': True,
                            'ttl': 1
                        }
                    )
                    logger.info(f"✅ DNS créé : {record['name']}")

            logger.info("✅ Configuration DNS terminée")

        except CloudflareAPIError as e:
            logger.error(f"❌ Erreur configuration DNS : {e}")
            raise

    def configure_tunnel_routing(
        self,
        container_name: str,
        tunnel_id: str,
        domain: str,
        credentials: Dict
    ) -> None:
        """
        Configure le routing du tunnel vers WordPress

        Args:
            container_name: Nom du container Docker
            tunnel_id: ID du tunnel
            domain: Nom de domaine
            credentials: Credentials du tunnel

        Raises:
            DockerDeploymentError: Si la configuration échoue
        """
        logger.info(f"⚙️  Configuration du routing du tunnel")

        try:
            container = self.docker_client.containers.get(container_name)

            # Créer le répertoire de config
            container.exec_run("mkdir -p /etc/cloudflared")

            # Créer le fichier credentials
            credentials_json = json.dumps(credentials)
            container.exec_run(
                f"sh -c 'echo {repr(credentials_json)} > /etc/cloudflared/{tunnel_id}.json'"
            )

            # Créer le fichier config.yml
            config_content = f"""tunnel: {tunnel_id}
credentials-file: /etc/cloudflared/{tunnel_id}.json

ingress:
  - hostname: {domain}
    service: http://localhost:80
  - hostname: www.{domain}
    service: http://localhost:80
  - service: http_status:404
"""

            container.exec_run(
                f"sh -c 'echo {repr(config_content)} > /etc/cloudflared/config.yml'"
            )

            # Créer un service systemd-like avec supervisord ou démarrer le tunnel
            start_cmd = "nohup cloudflared tunnel --config /etc/cloudflared/config.yml run > /var/log/cloudflared.log 2>&1 &"
            container.exec_run(f"sh -c '{start_cmd}'")

            logger.info("✅ Tunnel configuré et démarré")

        except DockerException as e:
            logger.error(f"❌ Erreur configuration tunnel : {e}")
            raise DockerDeploymentError(f"Échec de la configuration du tunnel : {e}")

    def _cleanup_docker(self, container_name: str, username: str, timestamp: str) -> None:
        """Nettoie les ressources Docker en cas d'erreur"""
        try:
            # Supprimer le container WordPress
            try:
                container = self.docker_client.containers.get(container_name)
                container.stop()
                container.remove()
                logger.info(f"🧹 Container supprimé : {container_name}")
            except:
                pass

            # Supprimer le container MySQL
            mysql_name = f"mysql_{username}_{timestamp}"
            try:
                mysql = self.docker_client.containers.get(mysql_name)
                mysql.stop()
                mysql.remove()
                logger.info(f"🧹 MySQL supprimé : {mysql_name}")
            except:
                pass

            # Supprimer le réseau
            network_name = f"network_{username}_{timestamp}"
            try:
                network = self.docker_client.networks.get(network_name)
                network.remove()
                logger.info(f"🧹 Réseau supprimé : {network_name}")
            except:
                pass

        except Exception as e:
            logger.warning(f"⚠️  Erreur lors du cleanup : {e}")

    def _cleanup_cloudflare(self, tunnel_id: Optional[str], zone_id: Optional[str]) -> None:
        """Nettoie les ressources Cloudflare en cas d'erreur"""
        try:
            if tunnel_id:
                self._make_cf_request(
                    'DELETE',
                    f'accounts/{CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/{tunnel_id}'
                )
                logger.info(f"🧹 Tunnel supprimé : {tunnel_id}")
        except:
            pass

        try:
            if zone_id:
                self._make_cf_request('DELETE', f'zones/{zone_id}')
                logger.info(f"🧹 Zone supprimée : {zone_id}")
        except:
            pass

    def save_installation(self, installation_data: Dict) -> None:
        """Sauvegarde les informations d'installation"""
        installations = self.load_installations()
        installations[installation_data['username']] = installation_data

        with open(INSTALLATIONS_FILE, 'w') as f:
            json.dump(installations, f, indent=2)

        logger.info(f"💾 Installation sauvegardée")

    def load_installations(self) -> Dict:
        """Charge les installations existantes"""
        if INSTALLATIONS_FILE.exists():
            with open(INSTALLATIONS_FILE, 'r') as f:
                return json.load(f)
        return {}

    def deploy(
        self,
        username: str,
        domain: str,
        email: str
    ) -> Dict:
        """
        Déploie WordPress avec Cloudflare Tunnel

        Args:
            username: Nom d'utilisateur du client
            domain: Nom de domaine
            email: Email du client

        Returns:
            Informations de déploiement

        Raises:
            Exception: Si le déploiement échoue
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        container_name = None
        tunnel_id = None
        zone_id = None

        try:
            # 1. Créer le container Docker
            container_name, container_id, mysql_name, mysql_id, port, mysql_password = self.create_docker_container(
                username, timestamp, domain, email
            )

            # 2. Installer cloudflared
            self.install_cloudflared(container_name)

            # 3. Créer le tunnel Cloudflare
            tunnel_data = self.create_cloudflare_tunnel(username, timestamp)
            tunnel_id = tunnel_data['id']

            # 4. Créer la zone Cloudflare
            zone_data = self.create_cloudflare_zone(domain)
            zone_id = zone_data['id']

            # 5. Configurer les DNS
            self.configure_dns_records(zone_id, domain, tunnel_id)

            # 6. Configurer le routing du tunnel
            self.configure_tunnel_routing(
                container_name,
                tunnel_id,
                domain,
                tunnel_data['credentials']
            )

            # 7. Sauvegarder l'installation
            installation_data = {
                'username': username,
                'domain': domain,
                'email': email,
                'timestamp': timestamp,
                'container_name': container_name,
                'container_id': container_id,
                'mysql_container': mysql_name,
                'mysql_container_id': mysql_id,
                'mysql_password': mysql_password,
                'port': port,
                'tunnel_id': tunnel_id,
                'tunnel_name': tunnel_data['name'],
                'zone_id': zone_id,
                'nameservers': zone_data['nameservers'],
                'created_at': datetime.now().isoformat()
            }

            self.save_installation(installation_data)

            return installation_data

        except Exception as e:
            logger.error(f"❌ Erreur lors du déploiement : {e}")

            # Rollback
            logger.warning("🔄 Rollback en cours...")
            self._cleanup_docker(container_name or f"docker_{username}_{timestamp}", username, timestamp)
            self._cleanup_cloudflare(tunnel_id, zone_id)

            raise

    def list_installations(self) -> None:
        """Liste toutes les installations"""
        installations = self.load_installations()

        if not installations:
            print("\n📦 Aucune installation trouvée\n")
            return

        print("\n" + "="*80)
        print("📦 INSTALLATIONS WORDPRESS")
        print("="*80 + "\n")

        for username, data in installations.items():
            print(f"👤 Utilisateur : {username}")
            print(f"🌐 Domaine : {data['domain']}")
            print(f"🐳 Container : {data['container_name']}")
            print(f"🔗 Tunnel : {data['tunnel_name']}")
            print(f"📅 Créé le : {data['created_at']}")
            print(f"🔗 URL : https://{data['domain']}")
            print("-" * 80 + "\n")

    def delete_installation(self, username: str) -> None:
        """
        Supprime une installation complète

        Args:
            username: Nom d'utilisateur du client

        Raises:
            ValueError: Si l'installation n'existe pas
        """
        installations = self.load_installations()

        if username not in installations:
            raise ValueError(f"Installation '{username}' introuvable")

        data = installations[username]

        logger.info(f"🗑️  Suppression de l'installation : {username}")

        try:
            # Supprimer les containers Docker
            try:
                container = self.docker_client.containers.get(data['container_name'])
                container.stop()
                container.remove()
                logger.info(f"✅ Container supprimé : {data['container_name']}")
            except:
                logger.warning(f"⚠️  Container non trouvé : {data['container_name']}")

            try:
                mysql = self.docker_client.containers.get(data['mysql_container'])
                mysql.stop()
                mysql.remove()
                logger.info(f"✅ MySQL supprimé : {data['mysql_container']}")
            except:
                logger.warning(f"⚠️  MySQL non trouvé : {data['mysql_container']}")

            # Supprimer le réseau
            network_name = f"network_{username}_{data['timestamp']}"
            try:
                network = self.docker_client.networks.get(network_name)
                network.remove()
                logger.info(f"✅ Réseau supprimé : {network_name}")
            except:
                logger.warning(f"⚠️  Réseau non trouvé : {network_name}")

            # Supprimer le tunnel Cloudflare
            try:
                self._make_cf_request(
                    'DELETE',
                    f'accounts/{CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/{data["tunnel_id"]}'
                )
                logger.info(f"✅ Tunnel supprimé : {data['tunnel_id']}")
            except:
                logger.warning(f"⚠️  Tunnel non trouvé : {data['tunnel_id']}")

            # Supprimer la zone Cloudflare
            try:
                self._make_cf_request('DELETE', f'zones/{data["zone_id"]}')
                logger.info(f"✅ Zone supprimée : {data['zone_id']}")
            except:
                logger.warning(f"⚠️  Zone non trouvée : {data['zone_id']}")

            # Retirer de la liste des installations
            del installations[username]
            with open(INSTALLATIONS_FILE, 'w') as f:
                json.dump(installations, f, indent=2)

            print(f"\n✅ Installation '{username}' supprimée avec succès\n")

        except Exception as e:
            logger.error(f"❌ Erreur lors de la suppression : {e}")
            raise


def print_deployment_summary(data: Dict) -> None:
    """Affiche un résumé du déploiement"""
    print("\n" + "="*80)
    print("✅ DÉPLOIEMENT RÉUSSI")
    print("="*80 + "\n")

    print(f"✅ WordPress créé pour {data['username']}")
    print(f"🐳 Container : {data['container_name']}")
    print(f"🗄️  MySQL Container : {data['mysql_container']}")
    print(f"🔑 MySQL Password : {data['mysql_password']}")
    print(f"🌐 Domaine : {data['domain']}")
    print(f"🔗 Tunnel : {data['tunnel_name']}")

    print(f"\n📋 Nameservers à configurer chez le registrar :")
    for ns in data['nameservers']:
        print(f"   - {ns}")

    print(f"\n⏱️  Le site sera accessible sous 5-30 minutes après configuration DNS")
    print(f"🔗 URL : https://{data['domain']}")
    print(f"🔗 URL (www) : https://www.{data['domain']}")

    print("\n💡 Prochaines étapes :")
    print(f"   1. Configurer les nameservers chez le registrar du domaine")
    print(f"   2. Attendre la propagation DNS (5-30 minutes)")
    print(f"   3. Accéder à https://{data['domain']}/wp-admin pour configurer WordPress")

    print("\n" + "="*80 + "\n")


def main():
    """Point d'entrée principal du script"""
    parser = argparse.ArgumentParser(
        description='Déploiement automatique de WordPress avec Cloudflare Tunnels',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation:

  # Créer une nouvelle installation
  python create_wordpress.py --username "john_doe" --domain "clientsite.com" --email "client@email.com"

  # Lister toutes les installations
  python create_wordpress.py --list

  # Supprimer une installation
  python create_wordpress.py --delete "john_doe"
        """
    )

    # Arguments principaux
    parser.add_argument('--username', type=str, help='Nom d\'utilisateur du client')
    parser.add_argument('--domain', type=str, help='Nom de domaine (ex: clientsite.com)')
    parser.add_argument('--email', type=str, help='Email du client')

    # Actions alternatives
    parser.add_argument('--list', action='store_true', help='Lister toutes les installations')
    parser.add_argument('--delete', type=str, metavar='USERNAME', help='Supprimer une installation')

    args = parser.parse_args()

    try:
        deployer = WordPressDeployer()

        # Liste des installations
        if args.list:
            deployer.list_installations()
            return

        # Suppression d'une installation
        if args.delete:
            deployer.delete_installation(args.delete)
            return

        # Déploiement d'une nouvelle installation
        if not all([args.username, args.domain, args.email]):
            parser.error("--username, --domain et --email sont requis pour créer une installation")

        # Validation du domaine
        if not '.' in args.domain:
            parser.error("Le domaine doit être valide (ex: clientsite.com)")

        print("\n🚀 Démarrage du déploiement WordPress...")
        print(f"👤 Utilisateur : {args.username}")
        print(f"🌐 Domaine : {args.domain}")
        print(f"📧 Email : {args.email}\n")

        # Déploiement
        result = deployer.deploy(args.username, args.domain, args.email)

        # Afficher le résumé
        print_deployment_summary(result)

    except KeyboardInterrupt:
        print("\n\n⚠️  Déploiement annulé par l'utilisateur\n")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur fatale : {e}")
        print(f"\n❌ Erreur : {e}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()