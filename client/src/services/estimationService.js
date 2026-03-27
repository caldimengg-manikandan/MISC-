/**
 * estimationService.js
 *
 * STRICT RULE: PURE API CLIENT ONLY.
 * ❌ NO calculations, ❌ NO formula logic, ❌ NO unit conversions.
 * All math happens on the backend via Excel Digital Twin engine.
 */

import API_BASE_URL from '../config/api';

const FULL_CALC_ENDPOINT = `${API_BASE_URL}/api/calculate/full`;

/**
 * Enhanced Debounce Utility
 * Ensures only the last request in a burst is processed.
 */
export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Unified Calculation API Client
 * 
 * @param {Object} payload - { rails: [], platforms: [], stairs: [] }
 * @param {Boolean} debug - If true, appends ?debug=true for formula tracing
 * @returns {Object} { success: true, breakdown, subtotal, tax, totalEstimatedCost }
 */
export async function calculateFull(payload, debug = false) {
  try {
    // 📊 DEBUG LOGGING (MANDATORY)
    console.log("📤 Payload:", payload);

    const url = new URL(FULL_CALC_ENDPOINT);
    if (debug) url.searchParams.append('debug', 'true');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();

    // 📊 DEBUG LOGGING (MANDATORY)
    console.log("📥 Response:", data);

    // 📦 STRICT RESPONSE VALIDATION
    if (
      !data || 
      !data.success ||
      !data.breakdown ||
      !Array.isArray(data.breakdown.stairs) ||
      !Array.isArray(data.breakdown.rails) ||
      !Array.isArray(data.breakdown.platforms)
    ) {
      console.error("❌ Invalid calculation response", data);
      return {
        success: false,
        error: "Invalid calculation response structure"
      };
    }

    // 📐 STANDARD RESPONSE FORMAT (SUCCESS)
    return {
      success: true,
      breakdown: data.breakdown,
      subtotal: data.costs?.subtotal || 0,
      tax: data.costs?.tax || 0,
      totalEstimatedCost: data.costs?.totalEstimatedCost || 0,
      totalSteelWeight: data.breakdown?.totals?.totalSteelWeight || 0
    };

  } catch (error) {
    console.error("❌ Calculation API Failure:", error.message);
    
    // 📐 STANDARD RESPONSE FORMAT (FAILURE)
    return {
      success: false,
      error: error.message || "Calculation failed"
    };
  }
}
