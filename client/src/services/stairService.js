import API_BASE_URL from '../config/api';

/**
 * stairService.js
 * 
 * CORE REQUIREMENT: This service acts as a thin client for the stair estimation API.
 * NO engineering calculations are performed on the frontend.
 */

export async function calculateStair(input) {
  const token = localStorage.getItem('steel_token');

  // 1. ROBUST MAPPING: UI Fields -> Backend Expected Fields
  const payload = {
    stairCategory: input.stairCategory || 'Commercial',
    riseIn:        Number(input.rise || 0),
    runIn:         Number(input.run || 0),
    totalHeightFt: Number(input.totalHeight || 0),
    widthFt:       Number(input.stairWidth || 0), // Note: stairWidth in UI to widthFt in API
    extBotNS:      Number(input.nsStringerBot || 0),
    extBotFS:      Number(input.fsStringerBot || 0),
    extTopNS:      Number(input.nsStringerTop || 0),
    extTopFS:      Number(input.fsStringerTop || 0)
  };

  console.log("DEBUG: Final Payload sent to API:", payload);
  
  const response = await fetch(`${API_BASE_URL}/api/stairs/calculate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
