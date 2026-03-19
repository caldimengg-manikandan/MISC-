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

// ── 3. Stair Geometry Calculation ───────────────────────────────────────────
/**
 * Sends rise/run/height to the backend and receives:
 *   { risers, slope, angle }
 * NO math is done in the frontend.
 *
 * @param {object} stairData - { height, rise, run }
 */
export async function calculateStairGeometry(stairData) {
  const payload = {
    rails: [],
    platforms: [],
    stringers: [],
    stairs: [stairData],
    pricing_map: {},
    labor_rates: {},
    finish_rate_per_lb: 0,
  };

  const result = await callCalculateAPI(payload);
  const geo = result.breakdown?.stairGeometry?.[0] || {};

  return {
    success: result.success,
    risers: geo.risers ?? 0,
    slope: geo.slope ?? 0,
    angle: geo.angle ?? 0,
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

// ── 5. Stair Flight Full Calculation ────────────────────────────────────────
/**
 * Maps StairConfig UI fields → backend /api/calculate/stair-flight
 * and returns the complete breakdown (geometry, stringer, pan plate, labor, cost).
 *
 * UI Field              → API Field
 * ──────────────────────────────────────────────────────────────
 * stair.stairWidth      → stairWidthFt        (already in ft)
 * stair.rise            → riseIn              (in inches)
 * stair.run             → runIn               (in inches)
 * stair.numRisers       → numRisers
 * stair.stringerSize    → stringerProfileId   (e.g. "W8x31")
 * stair.stairType       → stairType           (e.g. "pan-concrete")
 * stair.nsStringerBot   → extentBotNSIn       (in inches)
 * stair.fsStringerBot   → extentBotFSIn       (in inches)
 * stair.nsStringerTop   → extentTopNSIn       (in inches)
 * stair.fsStringerTop   → extentTopFSIn       (in inches)
 * stair.nsStringerConnBot → connectionTypeBot
 * stair.nsStringerConnTop → connectionTypeTop
 * stair.finish          → finish
 *
 * @param {object} stair      - The stair state object from the UI
 * @param {number} [estimateId] - Optional: saves row to takeoff_items
 */
export async function calculateStairFlight(stair, estimateId = null) {
  const toIn = (v) => parseFloat(v) || 0;    // already inches
  const toFt = (v) => parseFloat(v) || 0;    // already feet

  const payload = {
    stairWidthFt:      toFt(stair.stairWidth),
    riseIn:            toIn(stair.rise),
    runIn:             toIn(stair.run),
    numRisers:         parseInt(stair.numRisers) || 0,
    stringerProfileId: stair.stringerSize || '',
    stairType:         stair.stairType   || 'pan-concrete',
    extentBotNSIn:     toIn(stair.nsStringerBot),
    extentBotFSIn:     toIn(stair.fsStringerBot),
    extentTopNSIn:     toIn(stair.nsStringerTop),
    extentTopFSIn:     toIn(stair.fsStringerTop),
    connectionTypeBot: stair.nsStringerConnBot || 'WELDED',
    connectionTypeTop: stair.nsStringerConnTop || 'WELDED',
    finish:            stair.finish || 'PRIMER',
    estimateId,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/calculate/stair-flight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[estimationService] stair-flight API error:', err.message);
    return { success: false, error: err.message };
  }
}
