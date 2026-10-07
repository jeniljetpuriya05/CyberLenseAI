const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

export function getStoredUser() {
  const raw = localStorage.getItem('cyberlens_user');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem('cyberlens_token');
}

export function clearSession() {
  localStorage.removeItem('cyberlens_token');
  localStorage.removeItem('cyberlens_user');
}

function expireSession() {
  clearSession();
  window.dispatchEvent(new CustomEvent('cyberlens:auth-expired'));
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      expireSession();
      throw new Error('Session expired. Please sign in again.');
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  register(payload) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  async login(payload) {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('cyberlens_token', data.access_token);
    localStorage.setItem('cyberlens_user', JSON.stringify(data.user));
    return data;
  },
  updateCase(caseId, payload) {
    return request(`/cases/${caseId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteCase(caseId) {
    return request(`/cases/${caseId}`, { method: 'DELETE' });
  },
  dashboardStats() {
    return request('/cases/stats/dashboard');
  },
  listCases() {
    return request('/cases/');
  },
  createCase(payload) {
    return request('/cases/', { method: 'POST', body: JSON.stringify(payload) });
  },
  getCase(caseId) {
    return request(`/cases/${caseId}`);
  },
  getCaseStats(caseId) {
    return request(`/cases/${caseId}/stats`);
  },
  /**
   * Fetch analysis summary + first page of ML flow results (50 per page).
   * The response includes pagination metadata: flows_page, flows_per_page,
   * flows_total, flows_total_pages.
   */
  getCaseAnalysis(caseId) {
    return request(`/cases/${caseId}/analysis?flows_page=1&flows_per_page=50`);
  },
  /**
   * Fetch a specific page of ML flow results for lazy loading.
   * @param {number|string} caseId
   * @param {number} page - 1-based page number
   * @param {number} perPage - results per page (max 200, backend-enforced)
   */
  getCaseAnalysisPage(caseId, page = 1, perPage = 50) {
    return request(`/cases/${caseId}/analysis?flows_page=${page}&flows_per_page=${perPage}`);
  },
  uploadPcap(caseId, file) {
    const body = new FormData();
    body.append('case_id', caseId);
    body.append('file', file);
    return request('/pcap/upload', { method: 'POST', body });
  },
  listPcaps() {
    return request('/pcap/');
  },
  /**
   * Get PCAP file parse status.
   * Response includes: parse_status, packet_count, filename, file_size,
   * uploaded_at, and parse_progress (0–100 integer).
   */
  getPcapStatus(pcapId) {
    return request(`/pcap/${pcapId}/status`);
  },
  generateReport(caseId) {
    return request(`/cases/${caseId}/report/generate`, { method: 'POST' });
  },
  getReport(caseId) {
    return request(`/cases/${caseId}/report`);
  },
  listAllReports() {
    return request('/reports/all');
  },
};
