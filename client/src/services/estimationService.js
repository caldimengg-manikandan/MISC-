/**
 * estimationService.js
 *
 * STRICT RULE: NO calculations are done here.
 * All math happens on the backend via POST /api/calculate
 * This service only formats payloads and returns API results.
 */

import API_BASE_URL from '../config/api';

const CALC_ENDPOINT = `${API_BASE_URL}/api/calculate`;

// ── Debounce utility ────────────────────────────────────────────────────────
export function debounce(fn, delay = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Core API caller ─────────────────────────────────────────────────────────
async function callCalculateAPI(payload) {
  try {
    const res = await fetch(CALC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[estimationService] API error:', err.message);
    // Return a safe zero-state so the UI never crashes
    return {
      success: false,
      error: err.message,
      totalSteel: 0,
      totalLaborHours: 0,
      totalLaborCost: 0,
      totalSteelCost: 0,
      finishCost: 0,
      subtotal: 0,
      tax: 0,
      totalEstimatedCost: 0,
      breakdown: { rail: {}, platform: {}, stairGeometry: [], stringer: {} }
    };
  }
}

// ── 1. Rail Calculation ─────────────────────────────────────────────────────
/**
 * Sends a single rail to the backend and returns:
 *   { steelWeight, shopLabor, fieldLabor, postQty }
 *
 * @param {object} railData   - { rail_type_id, length, spacing }
 * @param {object} options    - { pricing_map, labor_rates }
 */
export async function calculateRail(railData, options = {}) {
  const payload = {
    rails: [railData],
    platforms: [],
    stringers: [],
    pricing_map: options.pricing_map || {},
    labor_rates: options.labor_rates || {},
    finish_rate_per_lb: 0,
  };

  const result = await callCalculateAPI(payload);
  const item = result.breakdown?.rail?.items?.[0] || {};

  return {
    success: result.success,
    steelWeight: item.steelWeight ?? 0,
    shopLabor: item.shopLabor ?? 0,
    fieldLabor: item.fieldLabor ?? 0,
    postQty: item.postQty ?? 0,
  };
}

// ── 2. Platform Calculation ─────────────────────────────────────────────────
/**
 * @param {object} platformData - { platform_type_id, length, width }
 * @param {object} options
 */
export async function calculatePlatform(platformData, options = {}) {
  const payload = {
    rails: [],
    platforms: [platformData],
    stringers: [],
    pricing_map: options.pricing_map || {},
    labor_rates: options.labor_rates || {},
    finish_rate_per_lb: 0,
  };

  const result = await callCalculateAPI(payload);
  const item = result.breakdown?.platform?.items?.[0] || {};

  return {
    success: result.success,
    area: item.area ?? 0,
    steelWeight: item.steelWeight ?? 0,
    shopLabor: item.shopLabor ?? 0,
    fieldLabor: item.fieldLabor ?? 0,
  };
}

// ── 4. Full Estimation (All Components) ─────────────────────────────────────
/**
 * Sends the complete estimation payload to get J53/J54/J55 totals.
 *
 * @param {object} payload - { rails, platforms, stringers, stairs, pricing_map, labor_rates, finish_rate_per_lb }
 */
export async function calculateFull(payload) {
  return callCalculateAPI(payload);
}
