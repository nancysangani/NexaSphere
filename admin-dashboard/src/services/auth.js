const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const TOKEN_KEY = 'ns_admin_token';
const EMAIL_KEY = 'ns_admin_email';

export const auth = {
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Always try the real Java backend first
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Invalid credentials');
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(EMAIL_KEY, cleanEmail);
      console.log('[Auth] Logged in via LIVE Java backend ✓');
      return data;
    } catch (err) {
      // Only fall back to mock if Java server is completely unreachable (network error)
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      if (isNetworkError && cleanEmail === 'nexasphere@glbajajgroup.org' && cleanPassword === 'Admin@123') {
        console.warn('[Auth] Java server unreachable — falling back to OFFLINE mock mode');
        const mockToken = 'mock-jwt-token-for-nexasphere-admin';
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(EMAIL_KEY, cleanEmail);
        return { token: mockToken, email: cleanEmail };
      }
      throw err;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },

  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getEmail() { return localStorage.getItem(EMAIL_KEY); },
  isAuthenticated() { return !!this.getToken(); },
};
