/**
 * libraryApi.js
 * All client-side API calls for the Library Management Module.
 */

import { API_BASE_URL } from '../config/api';

const getToken = () => localStorage.getItem('steel_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const BASE = `${API_BASE_URL}/api/v1/library`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
}

// ── Category Data ─────────────────────────────────────────────────────────────

/**
 * Fetch all rows for a category.
 * @param {string} category
 * @param {boolean} [showAll] - include inactive rows
 */
export async function fetchCategory(category, showAll = false) {
  const url = `${BASE}/${category}${showAll ? '?all=true' : ''}`;
  const res = await fetch(url, { headers: headers() });
  return handleResponse(res);
}

/**
 * Fetch sidebar summary (row counts per category).
 */
export async function fetchCategorySummary() {
  const res = await fetch(`${BASE}/all/summary`, { headers: headers() });
  return handleResponse(res);
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Create a new row in the category.
 */
export async function createRow(category, rowData) {
  const res = await fetch(`${BASE}/${category}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(rowData),
  });
  return handleResponse(res);
}

/**
 * Update an existing row.
 */
export async function updateRow(category, id, rowData) {
  const res = await fetch(`${BASE}/${category}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(rowData),
  });
  return handleResponse(res);
}

/**
 * Delete a row (blocked server-side for system defaults).
 */
export async function deleteRow(category, id) {
  const res = await fetch(`${BASE}/${category}/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse(res);
}

/**
 * Add a new custom column to a category.
 */
export async function addColumn(category, { header, type }) {
  const res = await fetch(`${BASE}/${encodeURIComponent(category)}/columns`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ header, type }),
  });
  return handleResponse(res);
}

/**
 * Update an existing custom column metadata.
 */
export async function updateColumn(category, key, { header, type }) {
  const res = await fetch(`${BASE}/${encodeURIComponent(category)}/columns/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ header, type }),
  });
  return handleResponse(res);
}

/**
 * Remove a custom column definition.
 */
export async function deleteColumn(category, key) {
  const res = await fetch(`${BASE}/${encodeURIComponent(category)}/columns/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse(res);
}

// ── Excel ─────────────────────────────────────────────────────────────────────

/**
 * Download a category as an Excel template.
 * Returns a Blob.
 */
export async function downloadTemplate(category) {
  const res = await fetch(`${BASE}/${category}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Download failed (${res.status})`);
  }
  return res.blob();
}

/**
 * Validate an uploaded Excel file.
 * @param {string} category
 * @param {File} file
 */
export async function validateUpload(category, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/${category}/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Commit an import with conflict resolution decisions.
 * @param {string} category
 * @param {File} file
 * @param {Array} conflictResolutions - array of { rowIndex, action, targetId? }
 */
export async function commitImport(category, file, conflictResolutions = []) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conflictResolution', JSON.stringify(conflictResolutions));
  const res = await fetch(`${BASE}/${category}/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

/**
 * Fetch paginated audit log entries.
 */
export async function fetchAuditLog({ module, action, limit = 20, offset = 0, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();
  if (module) params.set('module', module);
  if (action) params.set('action', action);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const res = await fetch(`${BASE}/audit-log?${params.toString()}`, {
    headers: headers(),
  });
  return handleResponse(res);
}
