const API_BASE = import.meta.env.VITE_API_URL || '';

export default function apiFetch(path, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = API_BASE.replace(/\/$/, '');
  const url = isAbsolute ? path : `${base}${path}`;
  return fetch(url, options);
}
