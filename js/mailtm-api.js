/**
 * Mail.tm API Client
 * Wraps all communication with https://api.mail.tm
 */

class MailTmAPI {
  constructor() {
    this.baseUrl = 'https://api.mail.tm';
  }

  /**
   * Fetch list of active public domains
   */
  async getDomains() {
    try {
      const response = await fetch(`${this.baseUrl}/domains?page=1`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // hydra:member contains domain objects
      const domains = data['hydra:member'] || data['member'] || [];
      return domains.filter(d => d.isActive).map(d => d.domain);
    } catch (error) {
      console.error('Error fetching domains:', error);
      // Fallback domain if API call fails
      return ['web-library.net'];
    }
  }

  /**
   * Create a new temporary email account
   * @param {string} address - full email address (e.g. username@domain.com)
   * @param {string} password - account password
   */
  async createAccount(address, password) {
    const response = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, password })
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data['hydra:description'] || data.detail || 'فشل إنشاء الحساب';
      throw new Error(msg);
    }
    return data;
  }

  /**
   * Authenticate and get JWT Bearer token
   * @param {string} address 
   * @param {string} password 
   */
  async getToken(address, password) {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address, password })
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data['hydra:description'] || data.detail || 'فشل المصادقة الحصول على التوكن';
      throw new Error(msg);
    }
    return data.token;
  }

  /**
   * Get list of messages for current account
   * @param {string} token - JWT Token
   * @param {number} page 
   */
  async getMessages(token, page = 1) {
    const response = await fetch(`${this.baseUrl}/messages?page=${page}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data['hydra:member'] || data['member'] || [];
  }

  /**
   * Fetch complete message payload by message ID
   * @param {string} token 
   * @param {string} messageId 
   */
  async getMessageDetail(token, messageId) {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Delete a message by ID
   * @param {string} token 
   * @param {string} messageId 
   */
  async deleteMessage(token, messageId) {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  }

  /**
   * Delete account by ID
   * @param {string} token 
   * @param {string} accountId 
   */
  async deleteAccount(token, accountId) {
    const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  }
}

window.mailTmAPI = new MailTmAPI();
