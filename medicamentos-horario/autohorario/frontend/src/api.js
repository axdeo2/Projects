const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function getMedications() {
  const res = await fetch(`${BASE}/medications`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch medications');
  return res.json();
}

export async function addMedication(data) {
  const res = await fetch(`${BASE}/medications`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to add medication');
  return res.json();
}

export async function updateMedication(id, data) {
  const res = await fetch(`${BASE}/medications/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update medication');
  return res.json();
}

export async function deleteMedication(id) {
  const res = await fetch(`${BASE}/medications/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to delete medication');
}

export async function takeDose(id) {
  const res = await fetch(`${BASE}/medications/${id}/take`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to take dose');
  }
  return res.json();
}

export async function getSuggestedSchedule() {
  const res = await fetch(`${BASE}/medications/suggest`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get suggestions');
  return res.json();
}
