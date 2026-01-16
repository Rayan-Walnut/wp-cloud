/**
 * Service API pour communiquer avec le backend Flask
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  /**
   * Effectue une requête HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ========== Endpoints spécifiques ==========

  /**
   * Vérifier la santé de l'API
   */
  async healthCheck() {
    return this.get('/health');
  }

  /**
   * Vérifier les credentials Cloudflare
   */
  async verifyCredentials() {
    return this.post('/verify-credentials', {});
  }

  /**
   * Lister toutes les installations WordPress
   */
  async listInstallations() {
    return this.get('/installations');
  }

  /**
   * Récupérer une installation spécifique
   */
  async getInstallation(username) {
    return this.get(`/installations/${username}`);
  }

  /**
   * Déployer un nouveau site WordPress
   * @param {Object} data - { username, domain, email }
   */
  async deployWordPress(data) {
    return this.post('/deploy', data);
  }

  /**
   * Supprimer une installation WordPress
   */
  async deleteInstallation(username) {
    return this.delete(`/installations/${username}`);
  }

  /**
   * Récupérer le statut d'une installation
   */
  async getInstallationStatus(username) {
    return this.get(`/installations/${username}/status`);
  }

  /**
   * Redémarrer une installation
   */
  async restartInstallation(username) {
    return this.post(`/installations/${username}/restart`, {});
  }
}

export default new ApiService();
