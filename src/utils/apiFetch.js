const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function apiFetch(url, options = {}) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const err = new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
    err.code = 'OFFLINE';
    throw err;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      // Erros de servidor (5xx): tenta novamente com backoff
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        if (attempt < MAX_RETRIES) { await sleep(1000 * 2 ** attempt); continue; }
        const e = new Error('Tempo limite atingido. Verifique sua conexão e tente novamente.');
        e.code = 'TIMEOUT';
        throw e;
      }

      if (attempt < MAX_RETRIES) { await sleep(1000 * 2 ** attempt); continue; }

      const e = new Error('Não foi possível conectar ao servidor. Tente novamente em instantes.');
      e.code = 'NETWORK_ERROR';
      throw e;
    }
  }
}
