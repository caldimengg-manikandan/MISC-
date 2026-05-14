// client/src/services/configManager.js
import API_BASE_URL from '../config/api';

class ConfigManager {
  constructor() {
    this.config = {};
    this.initialized = false;
  }

  async load(force = false) {
    if (this.initialized && !force) return;

    const token = localStorage.getItem('steel_token');
    if (!token) return; // Skip fetch on public pages to avoid 401 noise

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/config`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        this.config = data.data;
        this.initialized = true;
      }
    } catch (err) {
      console.warn("ConfigManager: Operating with defaults (Auth required for custom rates)");
    }
  }

  get(key) {
    return this.config[key] !== undefined ? this.config[key] : 0;
  }
}

const configManager = new ConfigManager();
export default configManager;

