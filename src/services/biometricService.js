// Serviço de biometria para PWA usando Credential Management API
// Compatível com Safari/iOS (Face ID / Touch ID) e Chrome/Android (fingerprint)

const CRED_KEY  = 'barbeiroon_biometric_enabled';
const TOKEN_KEY = 'barbeiroon_biometric_token';

export const BiometricService = {
  // Verifica se o dispositivo é mobile
  isMobile() {
    return typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  // Verifica se o navegador suporta autenticação com biometria.
  // Restrito a dispositivos móveis que usam biometria no sistema operacional.
  isSupported() {
    return typeof window !== 'undefined' &&
      this.isMobile() &&
      'credentials' in navigator &&
      typeof window.PasswordCredential !== 'undefined' &&
      window.location.protocol === 'https:';
  },

  // Salva as credenciais após login bem-sucedido para acesso biométrico futuro
  async saveCredentials({ email, password, name, token }) {
    if (!this.isSupported()) return false;
    try {
      const cred = new window.PasswordCredential({
        id:       email,
        password: password,
        name:     name || email,
      });
      await navigator.credentials.store(cred);
      // Marca como habilitado e guarda o token para verificação rápida
      localStorage.setItem(CRED_KEY,  'true');
      localStorage.setItem(TOKEN_KEY, token || '');
      return true;
    } catch (e) {
      console.warn('[Biometric] saveCredentials error:', e);
      return false;
    }
  },

  // Verifica se o usuário habilitou biometria anteriormente
  isEnabled() {
    return localStorage.getItem(CRED_KEY) === 'true';
  },

  // Tenta autenticar com biometria — retorna {email, password} ou null
  async authenticate() {
    if (!this.isSupported()) return null;
    try {
      const cred = await navigator.credentials.get({
        password: true,
        mediation: 'optional',
      });
      if (cred && cred.id && cred.password) {
        return { email: cred.id, password: cred.password };
      }
      return null;
    } catch (e) {
      console.warn('[Biometric] authenticate error:', e);
      return null;
    }
  },

  // Remove dados de biometria (logout ou desativação)
  clear() {
    localStorage.removeItem(CRED_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // Revoga a credencial do browser se suportado
    if ('credentials' in navigator && navigator.credentials.preventSilentAccess) {
      navigator.credentials.preventSilentAccess();
    }
  },
};
