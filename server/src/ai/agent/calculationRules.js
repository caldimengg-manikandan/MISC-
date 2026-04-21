/**
 * calculationRules.js
 * Registry for MISC Estimation logic, required parameters, and response templates.
 */

const CALCULATION_RULES = {
  SCRAP: {
    intent: 'calculate_scrap',
    description: 'Calculates extra material accounting for cutting or wastage.',
    required_params: ['weight'],
    defaults: { scrapPct: 10 },
    explanation: "Scrap is the extra material we account for to cover wastage during cutting and fabrication. We calculate it by taking a small percentage (usually 10%) of the total material weight.",
    logic_steps: [
      "Gather total material weight (Stringers + Pans)",
      "Apply the scrap factor percentage",
      "Calculate the final weight and its cost"
    ],
    formula: "Scrap Lbs = Total Weight (lbs) * (Scrap % / 100)"
  },
  STRINGER: {
    intent: 'calculate_stringer',
    description: 'Calculates the weight and length of stair stringers.',
    required_params: ['length'],
    explanation: "Stringers are the structural sides of a stair. Because stairs go up at an angle, we use a 'Diagonal Factor' to find the actual length of the steel needed.",
    logic_steps: [
      "Determine the horizontal run of the stair",
      "Apply the Diagonal Factor of 1.414",
      "Multiply by the weight per foot of the selected steel section"
    ],
    formula: "Actual Length = Horizontal Run * 1.414\nTotal Weight = Actual Length * lbs/LF"
  },
  TREAD_PAN: {
    intent: 'calculate_tread',
    description: 'Calculates weight/area for stair treads or pans.',
    required_params: ['width', 'numRisers'],
    explanation: "Pans or treads account for the walking surface of the stair. We use a 'Projection Factor' to ensure we have enough material for the rise and run of each step.",
    logic_steps: [
      "Multiply width by number of risers to get surface count",
      "Apply the Projection Factor (0.833 for standard pans)",
      "Calculate total surface area and total weight"
    ],
    formula: "Surface Area = Width * Riser Count * 0.833"
  }
};

module.exports = CALCULATION_RULES;
