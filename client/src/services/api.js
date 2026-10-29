const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
export async function api(path, { caseId, token, ...options } = {}) {
  const headers = { ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(token ? { 'X-Case-Token':token } : {}), ...options.headers };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error?.message || 'The request could not be completed.');
  return data;
}
export function saveCaseAccess(caseId, token) { localStorage.setItem(`mystery-access:${caseId}`, token); }
export function getCaseToken(caseId) { return localStorage.getItem(`mystery-access:${caseId}`); }
