import { useAuth } from './useAuth';

export function useApi() {
  const { token } = useAuth();

  async function get(url) {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Pode adicionar POST, PUT, DELETE conforme necessário

  return { get };
}
