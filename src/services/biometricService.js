// Biometria para PWA via Web Authentication API (WebAuthn)
// Compatível com: Chrome/Android (fingerprint), Safari/iOS 14+ (Face ID / Touch ID),
// Edge/Windows (Windows Hello). Detecta autenticadores biométricos de plataforma.
//
// Fluxo:
// 1. isSupported()  → PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
// 2. saveCredentials() → navigator.credentials.create() — mostra o diálogo biométrico
//    e salva credentialId + token JWT no localStorage
// 3. authenticate() → navigator.credentials.get() — exige biometria para liberar o token
// 4. updateToken()  → atualiza só o token sem re-registrar a credencial
// 5. clear()        → remove todos os dados locais

const S = {
  enabled: 'barbeiroon_biometric_enabled',
  credId:  'barbeiroon_webauthn_cred_id',
  token:   'barbeiroon_biometric_token',
  email:   'barbeiroon_biometric_email',
  slug:    'barbeiroon_biometric_slug',
};

export const BiometricService = {
  // Verifica se o dispositivo tem autenticador biométrico de plataforma.
  // Retorna Promise<boolean>.
  async isSupported() {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  // Verifica se o usuário ativou biometria anteriormente.
  isEnabled() {
    return localStorage.getItem(S.enabled) === 'true';
  },

  // Registra credencial WebAuthn após login bem-sucedido com senha.
  // O diálogo de biometria do sistema é exibido durante o registro.
  // Retorna true em sucesso, false se cancelado ou não suportado.
  async saveCredentials({ email, token, name, slug }) {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId    = new TextEncoder().encode(email);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp:   { name: 'Barbeiro ON', id: window.location.hostname },
          user: { id: userId, name: email, displayName: name || email },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7   }, // ES256
            { type: 'public-key', alg: -257  }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      });

      if (!credential) return false;

      localStorage.setItem(S.enabled, 'true');
      localStorage.setItem(S.credId,  credential.id);
      localStorage.setItem(S.token,   token || '');
      localStorage.setItem(S.email,   email || '');
      localStorage.setItem(S.slug,    slug  || '');
      return true;
    } catch (e) {
      // NotAllowedError = usuário cancelou o diálogo biométrico
      console.warn('[Biometric] saveCredentials:', e.name, e.message);
      return false;
    }
  },

  // Atualiza apenas o token armazenado sem exibir diálogo biométrico novamente.
  // Chamado quando o usuário faz login com senha e já tem biometria ativa.
  updateToken({ token, slug }) {
    if (!this.isEnabled()) return;
    localStorage.setItem(S.token, token || '');
    if (slug) localStorage.setItem(S.slug, slug);
  },

  // Autentica com biometria — exibe diálogo de fingerprint/Face ID.
  // Retorna { email, token, slug } em sucesso ou null se cancelado/falha.
  async authenticate() {
    const credId = localStorage.getItem(S.credId);
    if (!credId) return null;

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credIdBuf = _base64urlToBuffer(credId);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: credIdBuf, transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) return null;

      return {
        email: localStorage.getItem(S.email) || '',
        token: localStorage.getItem(S.token) || '',
        slug:  localStorage.getItem(S.slug)  || '',
      };
    } catch (e) {
      // NotAllowedError = usuário cancelou ou timeout
      if (e.name === 'NotAllowedError') return null;
      console.warn('[Biometric] authenticate:', e.name, e.message);
      return null;
    }
  },

  // Remove todos os dados de biometria (logout ou desativação).
  clear() {
    Object.values(S).forEach(k => localStorage.removeItem(k));
  },
};

function _base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer;
}
