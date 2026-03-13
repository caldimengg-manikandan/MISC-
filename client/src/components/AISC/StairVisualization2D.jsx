import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import {
  inchesToFeetInchesFraction,
  inchesToSpelledOut,
  parseArchitecturalInput,
  stairTypeConfigs,
  quickPresets,
  CALCULATION_CONSTANTS,
  AISC_STANDARDS
} from '../../utils/conversionUtils';
import TreadStringerVisualizer from "./TreadStringerVisualizer";

const StairVisualization2D = ({ 
  horizontalDistance, 
  verticalDistance, 
  numberOfRisers,
  stairWidth,
  onDimensionChange,
  readOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(null);
  const [selectedStairType, setSelectedStairType] = useState('commercial'); // Default to AISC compliant
  
  // State to hold the raw string values from input fields (what the user sees)
  const [inputValues, setInputValues] = useState({
    horizontal: '',
    vertical: '',
    risers: '',
    width: '',
    riserHeight: '7"'
  });
const [isRehydrating, setIsRehydrating] = useState(false);

  // State to hold the parsed numeric values for calculations
  const [calculatedGeometry, setCalculatedGeometry] = useState({
    horizontal: 0,
    vertical: 0,
    risers: 0,
    width: 0,
    riserHeight: 7.0,
    treadDepth: 0,
    stringerLength: 0,
    angle: 0,
    twoRPlusT: 0
  });
// 🔥 STEP A — REHYDRATE GEOMETRY FROM PROPS (MANDATORY)
useEffect(() => {
  setIsRehydrating(true);

  // Construct new geometry from props
  const newGeo = {
    horizontal: horizontalDistance ?? 0,
    vertical: verticalDistance ?? 0,
    risers: numberOfRisers ?? 0,
    width: stairWidth ?? 0,
    riserHeight: 0,
    treadDepth: 0,
    stringerLength: 0,
    angle: 0,
    twoRPlusT: 0
  };

  // Calculate derived values if we have valid inputs from props
  if (newGeo.horizontal > 0 && newGeo.vertical > 0 && newGeo.risers > 0) {
    newGeo.riserHeight = parseFloat((newGeo.vertical / newGeo.risers).toFixed(3));
    
    if (newGeo.risers > 1) {
      newGeo.treadDepth = parseFloat((newGeo.horizontal / (newGeo.risers - 1)).toFixed(3));
    }
    
    newGeo.stringerLength = parseFloat(Math.sqrt(newGeo.horizontal ** 2 + newGeo.vertical ** 2).toFixed(2));
    newGeo.angle = parseFloat((Math.atan2(newGeo.vertical, newGeo.horizontal) * (180 / Math.PI)).toFixed(1));
    newGeo.twoRPlusT = parseFloat((2 * newGeo.riserHeight + newGeo.treadDepth).toFixed(1));
  }

  setCalculatedGeometry(newGeo);

  setInputValues(prev => ({
    horizontal: (horizontalDistance && parseFloat(horizontalDistance) !== 0) ? inchesToFeetInchesFraction(horizontalDistance) : "",
    vertical: (verticalDistance && parseFloat(verticalDistance) !== 0) ? inchesToFeetInchesFraction(verticalDistance) : "",
    risers: (numberOfRisers && parseInt(numberOfRisers) !== 0) ? String(numberOfRisers) : "",
    width: (stairWidth && parseFloat(stairWidth) !== 0) ? inchesToFeetInchesFraction(stairWidth) : "",
    riserHeight: prev.riserHeight || '7"'
  }));

  // If we have valid data coming in from props (e.g. from DB or after calculation), 
  // automatically show the visualization.
  const hasValidData = newGeo.horizontal > 0 && newGeo.vertical > 0 && newGeo.risers > 0 && newGeo.width > 0;
  
  if (hasValidData) {
    setShowCalculations(true);
  } else {
    setShowCalculations(false);
  }

  setLastChanged(null);
  setToastShown(false);
  setUserSetRisers(false);
  setUserSetRiserHeight(false);

  // ⏳ allow one render cycle before enabling updates
  setTimeout(() => setIsRehydrating(false), 0);
}, [horizontalDistance, verticalDistance, numberOfRisers, stairWidth]);


  // Track last changed field for hybrid logic
  const [lastChanged, setLastChanged] = useState(null);
  const [showCalculations, setShowCalculations] = useState(false);
  const [toastShown, setToastShown] = useState(false); // For one-time riser height warning
// --- USER-SET FLAGS (place with other useState declarations) ---
const [userSetRisers, setUserSetRisers] = useState(false);
const [userSetRiserHeight, setUserSetRiserHeight] = useState(false);

  // Helper: detect unfinished architectural input while typing
  const isUnfinishedArchitectural = (str) => {
    if (!str || typeof str !== 'string') return false;
    const patterns = [
      /.*'$/,
      /.*-$/,
      /.*\s$/,
      /.*\d+\/$/,
      /.*\d+\s+\d+\/$/,
      /.*\d+\s+\d+\/\d$/
    ];
    return patterns.some((p) => p.test(str));
  };

  const selectOptimizedRisers = (verticalInches, minRH, maxRH, idealRH) => {
    if (!verticalInches || verticalInches <= 0) return 0;
    const minN = Math.max(2, Math.ceil(verticalInches / maxRH));
    const maxN = Math.max(minN, Math.floor(verticalInches / minRH));
    let best = 0;
    let bestDiff = Infinity;
    for (let n = minN; n <= maxN; n++) {
      const h = verticalInches / n;
      const diff = Math.abs(h - idealRH);
      if (diff < bestDiff) { bestDiff = diff; best = n; }
    }
    if (best === 0) best = Math.max(2, Math.ceil(verticalInches / maxRH));
    return best;
  };

  const selectClosestRisersTo = (verticalInches, targetRH, minRH, maxRH) => {
    if (!verticalInches || verticalInches <= 0 || !targetRH || targetRH <= 0) return 0;
    const minN = Math.max(2, Math.ceil(verticalInches / maxRH));
    const maxN = Math.max(minN, Math.floor(verticalInches / minRH));
    let best = 0;
    let bestDiff = Infinity;
    for (let n = minN; n <= maxN; n++) {
      const h = verticalInches / n;
      const diff = Math.abs(h - targetRH);
      if (diff < bestDiff) { bestDiff = diff; best = n; }
    }
    if (best === 0) best = Math.max(2, Math.ceil(verticalInches / maxRH));
    return best;
  };


  // Destructure constants
  const { idealRiserHeight, minTreadDepth, scale, vizWidth, vizHeight } = CALCULATION_CONSTANTS;
  const { minRiserHeight, maxRiserHeight } = AISC_STANDARDS;

  // Helper function to perform all calculations based on current `calculatedGeometry` state
  const performCalculations = (currentGeometry) => {
    const { horizontal, vertical, risers, riserHeight, width } = currentGeometry;
    let newCalculatedGeometry = { ...currentGeometry };

    // Ensure risers is at least 1 for division, or 0 if invalid
    const effectiveRisers = risers > 0 ? risers : 0;

    // Recalculate riserHeight or vertical based on which is available
    if (vertical > 0 && effectiveRisers > 0) {
      newCalculatedGeometry.riserHeight = parseFloat((vertical / effectiveRisers).toFixed(3));
    } else if (riserHeight > 0 && effectiveRisers > 0) {
      newCalculatedGeometry.vertical = parseFloat((effectiveRisers * riserHeight).toFixed(3));
    } else if (vertical > 0 && effectiveRisers === 0) {
      // If only vertical is known, and risers are 0, reset riserHeight
      newCalculatedGeometry.riserHeight = 0;
    } else if (riserHeight > 0 && effectiveRisers === 0) {
      // If only riserHeight is known, and risers are 0, reset vertical
      newCalculatedGeometry.vertical = 0;
    }

    // Calculate treadDepth
    if (horizontal > 0 && effectiveRisers > 1) {
      newCalculatedGeometry.treadDepth = parseFloat((horizontal / (effectiveRisers - 1)).toFixed(3));
    } else {
      newCalculatedGeometry.treadDepth = 0;
    }

    // Calculate stringerLength and angle
    if (newCalculatedGeometry.horizontal > 0 && newCalculatedGeometry.vertical > 0) {
      newCalculatedGeometry.stringerLength = Math.sqrt(newCalculatedGeometry.horizontal ** 2 + newCalculatedGeometry.vertical ** 2);
      newCalculatedGeometry.angle = Math.atan2(newCalculatedGeometry.vertical, newCalculatedGeometry.horizontal) * (180 / Math.PI);
    } else {
      newCalculatedGeometry.stringerLength = 0;
      newCalculatedGeometry.angle = 0;
    }

    // Calculate 2R + T
    if (newCalculatedGeometry.riserHeight > 0 && newCalculatedGeometry.treadDepth > 0) {
      newCalculatedGeometry.twoRPlusT = (2 * newCalculatedGeometry.riserHeight) + newCalculatedGeometry.treadDepth;
    } else {
      newCalculatedGeometry.twoRPlusT = 0;
    }

    return newCalculatedGeometry;
  };

  // Check AISC compliance and show toast if needed
  const checkAISCCompliance = (riserHeight) => {
    if (riserHeight > 0 && !toastShown) {
      if (riserHeight < minRiserHeight) {
        toast.warn(`⚠️ AISC VIOLATION: Riser height ${riserHeight.toFixed(2)}" is BELOW minimum (${minRiserHeight}")`);
        setToastShown(true);
      } else if (riserHeight > maxRiserHeight) {
        toast.warn(`⚠️ AISC VIOLATION: Riser height ${riserHeight.toFixed(2)}" EXCEEDS maximum (${maxRiserHeight}")`);
        setToastShown(true);
      }
    }
  };


const updateCalculatedGeometry = (field, parsedValue, source = "input") => {
  setCalculatedGeometry(prev => {
    let newGeometry = { ...prev };

    // ✅ CASE: WIDTH — isolate logic and exit early
    if (field === "width") {
      newGeometry.width = parsedValue;
      return newGeometry; // ⬅️ important: exit before derived calculations
    }

    // ✅ CASE: VERTICAL DISTANCE
    if (field === "vertical") {
      if (parsedValue > 0) {
        // 1. Get Ideal Riser Height (Default 7" or User Input)
        let ideal = 7.0;
        const parsedIdeal = parseArchitecturalInput(inputValues.riserHeight);
        if (parsedIdeal > 0) ideal = parsedIdeal;

        // 2. Calculate Risers = Ceil(Vertical / Ideal)
        let n = Math.ceil(parsedValue / ideal);
        if (n < 1) n = 1; // Safety check

        // 3. Calculate Actual Riser Height
        const actualRH = parsedValue / n;

        // Update Geometry
        newGeometry.vertical = parsedValue;
        newGeometry.risers = n;
        newGeometry.riserHeight = parseFloat(actualRH.toFixed(3));
      } else {
        newGeometry.vertical = 0;
        newGeometry.risers = 0;
        newGeometry.riserHeight = 0;
      }
      setUserSetRiserHeight(false);
      setUserSetRisers(false);
    }

    // ✅ CASE: RISERS
    if (field === "risers") {
      // Logic: vertical = risers * riser_height
      // We use the "target" riser height from input (e.g. 7") rather than the calculated fraction
      // because the user wants to drive the vertical dimension.
      
      let targetRH = 7.0;
      const parsedTarget = parseArchitecturalInput(inputValues.riserHeight);
      if (parsedTarget > 0) targetRH = parsedTarget;

      if (parsedValue > 0) {
        newGeometry.risers = parsedValue;
        newGeometry.riserHeight = targetRH; // The actual height is now exactly the target
        newGeometry.vertical = parseFloat((parsedValue * targetRH).toFixed(3));
      } else {
        newGeometry.risers = 0;
        newGeometry.vertical = 0;
      }
      setUserSetRisers(true);
      // We don't unset RiserHeight flag here necessarily, but consistent with prior logic:
      setUserSetRiserHeight(false); 
    }

    // ✅ CASE: RISER HEIGHT
    if (field === "riserHeight") {
      // Logic: vertical = risers * riser_height
      if (parsedValue > 0) {
        newGeometry.riserHeight = parsedValue;
        if (prev.risers > 0) {
          newGeometry.vertical = parseFloat((prev.risers * parsedValue).toFixed(3));
        } 
        // If risers are 0, we can't calculate vertical yet, just store the height
      }
      setUserSetRiserHeight(true);
      setUserSetRisers(false);
    }

    // ✅ CASE: HORIZONTAL
    if (field === "horizontal") {
      newGeometry.horizontal = parsedValue;
      if (newGeometry.risers > 1) {
        newGeometry.treadDepth = parseFloat((parsedValue / (newGeometry.risers - 1)).toFixed(3));
      }
    }

    // ----- DERIVED CALCULATIONS -----
    const vertical = newGeometry.vertical || 0;
    const horizontal = newGeometry.horizontal || 0;
    const riserHeight = newGeometry.riserHeight || 0;
    const treadDepth = newGeometry.treadDepth || 0;

    newGeometry.stringerLength = parseFloat(Math.sqrt(vertical ** 2 + horizontal ** 2).toFixed(2));
    newGeometry.angle = horizontal > 0 ? parseFloat((Math.atan(vertical / horizontal) * (180 / Math.PI)).toFixed(1)) : 0;
    newGeometry.twoRPlusT = parseFloat((2 * riserHeight + treadDepth).toFixed(1));

    // ✅ Always recalc treadDepth at the end
    if (newGeometry.horizontal > 0 && newGeometry.risers > 1) {
      newGeometry.treadDepth = parseFloat((newGeometry.horizontal / (newGeometry.risers - 1)).toFixed(3));
    } else {
      newGeometry.treadDepth = 0;
    }

    if (
      !isRehydrating &&
      onDimensionChange &&
      newGeometry.horizontal > 0 &&
      newGeometry.vertical > 0 &&
      newGeometry.risers > 0 &&
      newGeometry.width > 0
    ) {
      onDimensionChange({
        horizontal: newGeometry.horizontal,
        vertical: newGeometry.vertical,
        risers: newGeometry.risers,
        width: newGeometry.width
      });
    }

    return newGeometry;
  });

  setLastChanged(field);
  setShowCalculations(false);
};

  // Handle stair type change
const handleStairTypeChange = (type) => {
  // set stair type but do NOT inject preset numeric values into inputs
  setSelectedStairType(type);

  // Reset toast / warnings
  setToastShown(false);
  setShowCalculations(false);

  // Clear input fields so user must type values manually
  setInputValues({
    horizontal: "",
    vertical: "",
    risers: "",
    riserHeight: '7"',
    width: ""
  });

  // Clear calculated geometry
  setCalculatedGeometry({
    horizontal: 0,
    vertical: 0,
    risers: 0,
    width: 0,
    riserHeight: 7.0,
    treadDepth: 0,
    stringerLength: 0,
    angle: 0,
    twoRPlusT: 0
  });

  // Reset user-set flags because current values are not typed by user
  setUserSetRisers(false);
  setUserSetRiserHeight(false);
};


  // Apply stair type defaults on component mount
  useEffect(() => {
    handleStairTypeChange(selectedStairType);
  }, []);

  // Update local dimensions when props change
useEffect(() => {
  // Sync UI fields with latest calculated values
  // Do not override the vertical input while the user is actively typing it
  setInputValues(prev => ({
    ...prev,
    risers: calculatedGeometry.risers ? String(calculatedGeometry.risers) : "",
    // DO NOT overwrite riserHeight with calculated value, as it represents the MAX/Target
    vertical:
      calculatedGeometry.vertical && lastChanged !== 'vertical' && !isUnfinishedArchitectural(prev.vertical)
        ? inchesToFeetInchesFraction(calculatedGeometry.vertical)
        : prev.vertical,
  }));
}, [calculatedGeometry, lastChanged]);

// --- FIX: Enable global drag tracking ---
useEffect(() => {
  if (!isDragging) return;

  const handleMove = (e) => {
    handleMouseMove(e);
  };

  const handleUp = () => {
    handleMouseUp();
  };

  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseup", handleUp);

  return () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleUp);
  };
}, [isDragging]);

  // Input change handler
const handleInputChange = (field, value) => {
  setInputValues(prev => ({ ...prev, [field]: value }));

  // RISERS input (explicit integer)
  if (field === "risers") {
    // Mark as user-set only when they actually type digits (not when clearing)
    const integerValue = value.replace(/[^0-9]/g, "");
    setInputValues(prev => ({ ...prev, [field]: integerValue }));
    const parsed = parseInt(integerValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // User explicitly typed risers
      setUserSetRisers(true);
      updateCalculatedGeometry(field, parsed);
    } else {
      // cleared or invalid → treat as not set
      setUserSetRisers(false);
      updateCalculatedGeometry(field, 0);
    }
    return;
  }

  // RISER HEIGHT input — mark flag when user types a value
if (field === "riserHeight") {
  // Always allow user to freely type text
  setInputValues(prev => ({ ...prev, riserHeight: value }));

  // User cleared the field → don't calculate until blur
  if (value.trim() === "") {
    setUserSetRiserHeight(false);
    return;
  }

  // Parse the value (supports imperial, decimal, fractions)
  const parsed = parseArchitecturalInput(value);

  // If parser returns a valid number → update geometry
  if (!isNaN(parsed) && parsed !== "") {
    setUserSetRiserHeight(true);
    updateCalculatedGeometry("riserHeight", parsed);
  }

  return;
}
  // For other fields: allow parser to handle imperial/decimal formats
  const unfinishedPatterns = [
    /.*'$/, /.*-$/, /.*\s$/, /.*\d+\/$/, /.*\d+\s+\d+\/$/, /.*\d+\s+\d+\/\d$/, /^[-\d'"\s\/.]+$/
  ];

  if (unfinishedPatterns.some(p => p.test(value)) || value === "'" || value === "-") {
    const parsed = parseArchitecturalInput(value);
    if (!isNaN(parsed) && parsed !== "") {
      updateCalculatedGeometry(field, parsed);
    } else {
      updateCalculatedGeometry(field, 0);
    }
    return; 
  }

 let parsed = parseArchitecturalInput(value);

 // PURE NUMBER RULE: treat plain numbers as inches for all fields
 if (/^\d+$/.test(value)) {
   parsed = parseFloat(value);
 }
  updateCalculatedGeometry(field, parsed);
};


  // Handle TAB key specifically
const handleKeyDown = (e, field) => {
  if (e.key === "Tab") {
    e.preventDefault();

    const raw = inputValues[field];
    if (!raw || raw.trim() === "") return;

    let parsed = parseArchitecturalInput(raw);

    // Handle pure numbers (feet -> inches for some fields)
    if (/^\d+$/.test(raw)) {
      parsed = parseFloat(raw); // treat plain numbers as inches
    }

    if (parsed === "" || isNaN(parsed)) return;

    let normalized = "";

    // -------------------------------
    // SPECIAL CASE: RISER HEIGHT
    // -------------------------------
    if (field === "riserHeight") {
      // Normalize to architectural (feet-inches-fraction)
      normalized = inchesToFeetInchesFraction(parsed);
      setInputValues(prev => ({ ...prev, riserHeight: normalized }));
      updateCalculatedGeometry("riserHeight", parsed);

      focusNext(field);
      return;
    }

    // -------------------------------
    // OTHER FIELDS (horizontal, vertical, width)
    // Normalize to imperial feet-inches-fraction
    // -------------------------------
    normalized = inchesToFeetInchesFraction(parsed);

    setInputValues(prev => ({ ...prev, [field]: normalized }));
    updateCalculatedGeometry(field, parsed);

    focusNext(field);
  }
};

const focusNext = (field) => {
  const fields = ["horizontal", "vertical", "risers", "riserHeight", "width"];
  const currentIndex = fields.indexOf(field);
  if (currentIndex < fields.length - 1) {
    const nextField = fields[currentIndex + 1];
    document.querySelector(`input[data-field="${nextField}"]`)?.focus();
  }
};


  // Auto-normalize on blur - only update calculations, not display format
const handleInputBlur = (field) => {
  if (field === "risers") {
    const integerValue = inputValues.risers.replace(/[^0-9]/g, "");
    const parsed = parseInt(integerValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setUserSetRisers(true);
      updateCalculatedGeometry('risers', parsed);
    } else {
      setUserSetRisers(false);
      updateCalculatedGeometry('risers', 0);
      setInputValues(prev => ({ ...prev, risers: '' }));
    }
    return;
  }

  if (field === "riserHeight") {
    const raw = inputValues.riserHeight;
    if (!raw || raw.trim() === "") {
      setUserSetRiserHeight(false);
      updateCalculatedGeometry('riserHeight', 0);
      return;
    }
    const parsed = parseArchitecturalInput(raw);
    if (parsed === "" || isNaN(parsed)) {
      setUserSetRiserHeight(false);
      updateCalculatedGeometry('riserHeight', 0);
      return;
    }
    setUserSetRiserHeight(true);
    updateCalculatedGeometry('riserHeight', parsed);
    return;
  }

  // other fields
  const raw = inputValues[field];
  if (!raw || raw.trim() === "") {
    updateCalculatedGeometry(field, 0);
    return;
  }
  const parsed = parseArchitecturalInput(raw);
  if (parsed === "" || isNaN(parsed)) {
    updateCalculatedGeometry(field, 0);
    return;
  }
  updateCalculatedGeometry(field, parsed);
};

  // Right-click → Convert to decimal inches in the input field
// Track format state per field
const [inputFormats, setInputFormats] = useState({
  horizontal: "imperial",
  vertical: "imperial",
  risers: "imperial",
  riserHeight: "imperial",
  width: "imperial"
});

const handleRightClick = (e, field) => {
  e.preventDefault();

  const raw = inputValues[field];
  if (!raw || raw.trim() === "") return;

  let parsed = parseArchitecturalInput(raw);
  if (/^\d+$/.test(raw)) {
    parsed = parseFloat(raw); // plain numbers are inches
  }
  if (parsed === "" || isNaN(parsed)) return;

  // Toggle format
  const newFormat = inputFormats[field] === "imperial" ? "decimal" : "imperial";

  let formatted;
  if (newFormat === "decimal") {
    formatted = parseFloat(parsed.toFixed(3)).toString(); // 134.5
  } else {
    formatted = inchesToFeetInchesFraction(parsed);       // 11'-2 1/2"
  }

  setInputValues(prev => ({ ...prev, [field]: formatted }));
  setInputFormats(prev => ({ ...prev, [field]: newFormat }));
  updateCalculatedGeometry(field, parsed);
};

  // Check if we have enough data for visualization and calculation
  const hasValidDimensions = 
    calculatedGeometry.horizontal > 0 && 
    calculatedGeometry.vertical > 0 && 
    calculatedGeometry.risers > 0 && 
    calculatedGeometry.width > 0;

  // Warning messages
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const newWarnings = [];
    
    if (calculatedGeometry.riserHeight && calculatedGeometry.riserHeight < minRiserHeight && showCalculations) {
      newWarnings.push(`Riser height (${calculatedGeometry.riserHeight.toFixed(2)}") is below AISC minimum (${minRiserHeight}")`);
    }
    
    if (calculatedGeometry.riserHeight && calculatedGeometry.riserHeight > maxRiserHeight && showCalculations) {
      newWarnings.push(`Riser height (${calculatedGeometry.riserHeight.toFixed(2)}") exceeds AISC maximum (${maxRiserHeight}")`);
    }
    
    if (calculatedGeometry.treadDepth && calculatedGeometry.treadDepth < minTreadDepth && hasValidDimensions && showCalculations) {
      newWarnings.push(`Tread depth (${calculatedGeometry.treadDepth.toFixed(2)}") is too small (min ${minTreadDepth}")`);
    }
    
    if (calculatedGeometry.risers && calculatedGeometry.risers < 3 && showCalculations) {
      newWarnings.push('Minimum 3 risers required');
    }
    
    if (calculatedGeometry.risers && calculatedGeometry.risers > 50 && showCalculations) {
      newWarnings.push('Maximum 50 risers recommended');
    }
    
    // Skip 2R+T ideal range warnings — only warn on min/max violations
    
    setWarnings(newWarnings);
  }, [calculatedGeometry, hasValidDimensions, showCalculations]);

  const handleCalculate = () => {
    if (!hasValidDimensions) {
      alert("Please fill in all required dimensions.");
      return;
    }

    if (calculatedGeometry.risers <= 1) {
      alert("Risers must be at least 2 for stair geometry.");
      return;
    }

    if (calculatedGeometry.horizontal <= 0 || calculatedGeometry.vertical <= 0) {
      alert("Distances must be greater than zero.");
      return;
    }

    setShowCalculations(true);

    if (
      onDimensionChange &&
      calculatedGeometry.horizontal > 0 &&
      calculatedGeometry.vertical > 0 &&
      calculatedGeometry.risers > 0 &&
      calculatedGeometry.width > 0
    ) {
      onDimensionChange({
        horizontal: calculatedGeometry.horizontal,
        vertical: calculatedGeometry.vertical,
        risers: calculatedGeometry.risers,
        width: calculatedGeometry.width
      });
    }
  };

  // Scale for visualization (pixels per inch)
  const scaledHorizontal = calculatedGeometry.horizontal ? calculatedGeometry.horizontal * scale : 0;
  const scaledVertical = calculatedGeometry.vertical ? calculatedGeometry.vertical * scale : 0;
  const scaledWidth = (isDragging?.type === "width" ? dragGeometry.width : calculatedGeometry.width) * scale;


  // Elevation view coordinates
  const elevationCenterX = vizWidth / 2;
  const elevationBaseY = vizHeight - 40;

  // Plan view coordinates
  const planCenterX = vizWidth / 2;
  const planCenterY = vizHeight / 2;

  const handleMouseDown = (type, view) => {
    if (readOnly) return;
    setIsDragging({ type, view });
  };

// Track temporary drag geometry separately
// Track temporary drag geometry separately
const [dragGeometry, setDragGeometry] = useState({
  horizontal: 0,
  vertical: 0,
  width: 0,
});

const handleMouseMove = (e) => {
  if (!isDragging) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  let newValue = 0;
  let field = "";

  if (isDragging.type === "horizontal") {
    newValue = Math.max(
      40,
      Math.min(400, (x - (elevationCenterX - scaledHorizontal / 2)) / scale)
    );
    field = "horizontal";
  } else if (isDragging.type === "vertical") {
    newValue = Math.max(
      40,
      Math.min(200, (elevationBaseY - y) / scale)
    );
    field = "vertical";
  } else if (isDragging.type === "width") {
    newValue = Math.max(
      24,
      Math.min(96, (x - (planCenterX - scaledWidth / 2)) / scale)
    );
    field = "width";
  }

  if (!field) return;

  // ✅ Only update dragGeometry for live preview
  setDragGeometry((prev) => ({ ...prev, [field]: newValue }));
};

const handleMouseUp = () => {
  if (!isDragging) return;

  const field = isDragging.type;
  const value = dragGeometry[field];

  if (value > 0) {
    if (field === "width") {
      // ✅ Commit width only, do not recalc risers/vertical/riserHeight
      setCalculatedGeometry(prev => ({ ...prev, width: value }));
      setInputValues(prev => ({
        ...prev,
        width: inchesToFeetInchesFraction(value),
      }));
    } else if (field === "horizontal" || field === "vertical") {
      // ✅ For horizontal/vertical, use full geometry update
      updateCalculatedGeometry(field, value);
      setInputValues(prev => ({
        ...prev,
        [field]: inchesToFeetInchesFraction(value),
      }));
    }
  }

  // Notify parent of dimension changes
if (!isRehydrating && onDimensionChange) {
  onDimensionChange({
    horizontal: calculatedGeometry.horizontal,
    vertical: calculatedGeometry.vertical,
    risers: calculatedGeometry.risers,
    width: calculatedGeometry.width,
  });
}
  setIsDragging(null);
};

  const applyQuickPreset = (presetType) => {
    handleStairTypeChange(presetType);
  };

  // Rest of the component remains the same for visualization rendering...
const renderElevationView = () => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4 shadow-lg">
    <h4 className="font-bold text-gray-800 mb-3 text-center text-sm uppercase tracking-wide">
      Stair Elevation
    </h4>
    <div 
      className="relative border-2 border-blue-300 rounded-lg bg-white mx-auto shadow-inner"
      style={{ width: vizWidth, height: vizHeight }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >

      {/* 🔎 Debug Overlay */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-0 left-0 bg-yellow-100 border border-yellow-400 text-yellow-800 text-xs p-2 rounded z-50">
          <div>hasValidDimensions: {String(hasValidDimensions)}</div>
          <div>showCalculations: {String(showCalculations)}</div>
          <div>treadDepth: {calculatedGeometry.treadDepth}</div>
          <div>risers: {calculatedGeometry.risers}</div>
          <div>width: {calculatedGeometry.width}</div>
          <div>vertical: {calculatedGeometry.vertical}</div>
          <div>horizontal: {calculatedGeometry.horizontal}</div>
        </div>
      )}

      {/* Grid Background */}
      <svg width={vizWidth} height={vizHeight} className="absolute inset-0 opacity-40">
        {Array.from({ length: Math.floor(vizWidth / 20) }).map((_, i) => (
          <line key={`elev-v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={vizHeight} stroke="#93c5fd" strokeWidth={0.5} />
        ))}
        {Array.from({ length: Math.floor(vizHeight / 20) }).map((_, i) => (
          <line key={`elev-h-${i}`} x1={0} y1={i * 20} x2={vizWidth} y2={i * 20} stroke="#93c5fd" strokeWidth={0.5} />
        ))}
      </svg>

      {hasValidDimensions && showCalculations && calculatedGeometry.treadDepth > 0 && calculatedGeometry.risers > 1 ? (
        <svg width={vizWidth} height={vizHeight} className="absolute inset-0">
          {/* Stringer with gradient */}
          <defs>
            <linearGradient id="stringerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          
          <line
            x1={elevationCenterX - scaledHorizontal / 2}
            y1={elevationBaseY}
            x2={elevationCenterX + scaledHorizontal / 2}
            y2={elevationBaseY - scaledVertical}
            stroke="url(#stringerGradient)"
            strokeWidth={3}
          />
          <line
            x1={elevationCenterX - scaledHorizontal / 2}
            y1={elevationBaseY}
            x2={elevationCenterX + scaledHorizontal / 2}
            y2={elevationBaseY - scaledVertical}
            stroke="url(#stringerGradient)"
            strokeWidth={3}
            transform={`translate(0, 12)`}
          />

          {/* Steps with 3D effect */}
          {Array.from({ length: calculatedGeometry.risers - 1 }).map((_, i) => {
            const stepX = elevationCenterX - scaledHorizontal / 2 + (i * calculatedGeometry.treadDepth * scale);
            const stepY = elevationBaseY - ((i + 1) * calculatedGeometry.riserHeight * scale);
            
            return (
              <g key={i}>
                {/* Tread with shadow */}
                <rect
                  x={stepX}
                  y={stepY}
                  width={calculatedGeometry.treadDepth * scale}
                  height={4}
                  fill="#4b5563"
                  stroke="#374151"
                  strokeWidth={0.5}
                />
                {/* Riser with depth */}
                <rect
                  x={stepX}
                  y={stepY - calculatedGeometry.riserHeight * scale}
                  width={4}
                  height={calculatedGeometry.riserHeight * scale}
                  fill="#6b7280"
                  stroke="#4b5563"
                  strokeWidth={0.5}
                />
              </g>
            );
          })}

          {/* Last riser */}
          <rect
            x={elevationCenterX + scaledHorizontal / 2 - 4}
            y={elevationBaseY - scaledVertical}
            width={4}
            height={scaledVertical}
            fill="#6b7280"
            stroke="#4b5563"
            strokeWidth={0.5}
          />

          {/* Dimension lines with arrows */}
          <g>
            <line
              x1={elevationCenterX - scaledHorizontal / 2}
              y1={elevationBaseY + 15}
              x2={elevationCenterX + scaledHorizontal / 2}
              y2={elevationBaseY + 15}
              stroke="#1f2937"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
            <text
              x={elevationCenterX}
              y={elevationBaseY + 30}
              textAnchor="middle"
              className="text-xs font-bold fill-gray-800"
            >
              {inchesToFeetInchesFraction(calculatedGeometry.horizontal)}
            </text>
          </g>

          <g>
            <line
              x1={elevationCenterX + scaledHorizontal / 2 + 15}
              y1={elevationBaseY}
              x2={elevationCenterX + scaledHorizontal / 2 + 15}
              y2={elevationBaseY - scaledVertical}
              stroke="#1f2937"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
            <text
              x={elevationCenterX + scaledHorizontal / 2 + 30}
              y={elevationBaseY - scaledVertical / 2}
              textAnchor="middle"
              className="text-xs font-bold fill-gray-800"
              transform={`rotate(-90, ${elevationCenterX + scaledHorizontal / 2 + 30}, ${elevationBaseY - scaledVertical / 2})`}
            >
              {inchesToFeetInchesFraction(calculatedGeometry.vertical)}
            </text>
          </g>

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#1f2937" />
            </marker>
          </defs>

          {/* Drag handles */}
          <circle
            cx={elevationCenterX + scaledHorizontal / 2}
            cy={elevationBaseY + 15}
            r={6}
            fill="#ef4444"
            className="cursor-col-resize hover:fill-red-600 transition-all duration-200"
            stroke="white"
            strokeWidth={2}
            onMouseDown={() => handleMouseDown('horizontal', 'elevation')}
          />
          
          <circle
            cx={elevationCenterX + scaledHorizontal / 2 + 15}
            cy={elevationBaseY - scaledVertical}
            r={6}
            fill="#10b981"
            className="cursor-row-resize hover:fill-green-600 transition-all duration-200"
            stroke="white"
            strokeWidth={2}
            onMouseDown={() => handleMouseDown('vertical', 'elevation')}
          />
        </svg>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
          Enter values & Click Calculate
        </div>
      )}
    </div>
  </div>
);


  const renderPlanView = () => (
    
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4 shadow-lg">
      <h4 className="font-bold text-gray-800 mb-3 text-center text-sm uppercase tracking-wide">Stair Plan</h4>
      <div 
        className="relative border-2 border-green-300 rounded-lg bg-white mx-auto shadow-inner"
        style={{ width: vizWidth, height: vizHeight }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Background */}
        <svg width={vizWidth} height={vizHeight} className="absolute inset-0 opacity-40">
          {Array.from({ length: Math.floor(vizWidth / 20) }).map((_, i) => (
            <line key={`plan-v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={vizHeight} stroke="#86efac" strokeWidth={0.5} />
          ))}
          {Array.from({ length: Math.floor(vizHeight / 20) }).map((_, i) => (
            <line key={`plan-h-${i}`} x1={0} y1={i * 20} x2={vizWidth} y2={i * 20} stroke="#86efac" strokeWidth={0.5} />
          ))}
        </svg>

        {hasValidDimensions && showCalculations && calculatedGeometry.treadDepth > 0 && calculatedGeometry.risers > 1 ? (
          <svg width={vizWidth} height={vizHeight} className="absolute inset-0">
            {/* Stair outline with gradient */}
            <defs>
              <linearGradient id="planGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#9ca3af" />
              </linearGradient>
            </defs>

            <rect
              x={planCenterX - scaledHorizontal / 2}
              y={planCenterY - scaledWidth / 2}
              width={scaledHorizontal}
              height={scaledWidth}
              fill="url(#planGradient)"
              stroke="#6b7280"
              strokeWidth={2}
            />

            {/* Steps in plan view */}
            {Array.from({ length: calculatedGeometry.risers - 1 }).map((_, i) => {
              const stepX = planCenterX - scaledHorizontal / 2 + (i * calculatedGeometry.treadDepth * scale);
              
              return (
                <line
                  key={i}
                  x1={stepX}
                  y1={planCenterY - scaledWidth / 2}
                  x2={stepX}
                  y2={planCenterY + scaledWidth / 2}
                  stroke="#4b5563"
                  strokeWidth={1.5}
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Last step line */}
            <line
              x1={planCenterX + scaledHorizontal / 2}
              y1={planCenterY - scaledWidth / 2}
              x2={planCenterX + scaledHorizontal / 2}
              y2={planCenterY + scaledWidth / 2}
              stroke="#4b5563"
              strokeWidth={1.5}
            />

            {/* Dimension lines with arrows */}
            <g>
              <line
                x1={planCenterX - scaledHorizontal / 2}
                y1={planCenterY + scaledWidth / 2 + 12}
                x2={planCenterX + scaledHorizontal / 2}
                y2={planCenterY + scaledWidth / 2 + 12}
                stroke="#1f2937"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
              <text x={planCenterX} y={planCenterY + scaledWidth / 2 + 25} textAnchor="middle" className="text-xs font-bold fill-gray-800">
                {inchesToFeetInchesFraction(calculatedGeometry.horizontal)}
              </text>
            </g>

            <g>
              <line
                x1={planCenterX + scaledHorizontal / 2 + 12}
                y1={planCenterY - scaledWidth / 2}
                x2={planCenterX + scaledHorizontal / 2 + 12}
                y2={planCenterY + scaledWidth / 2}
                stroke="#1f2937"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
              <text
                x={planCenterX + scaledHorizontal / 2 + 25}
                y={planCenterY}
                textAnchor="middle"
                className="text-xs font-bold fill-gray-800"
              >
                {inchesToFeetInchesFraction(calculatedGeometry.width)}
              </text>
            </g>

            {/* Drag handles */}
            <circle
              cx={planCenterX + scaledHorizontal / 2}
              cy={planCenterY + scaledWidth / 2 + 12}
              r={6}
              fill="#ef4444"
              className="cursor-col-resize hover:fill-red-600 transition-all duration-200"
              stroke="white"
              strokeWidth={2}
              onMouseDown={() => handleMouseDown('horizontal', 'plan')}
            />
            
            <circle
              cx={planCenterX + scaledHorizontal / 2 + 12}
              cy={planCenterY + scaledWidth / 2}
              r={6}
              fill="#f59e0b"
              className="cursor-col-resize hover:fill-yellow-600 transition-all duration-200"
              stroke="white"
              strokeWidth={2}
              onMouseDown={() => handleMouseDown('width', 'plan')}
            />
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
            Enter values & Click Calculate
          </div>
        )}
      </div>

    </div>
  );

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border-2 border-blue-100 p-8 shadow-2xl">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Interactive Stair Geometry Calculator
      </h3>
      
      {/* Main Layout - Visualizations on left, Configuration on right */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - Visualizations stacked vertically */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Elevation View */}
            <div className="space-y-4">
              {renderElevationView()}
            </div>

            {/* Plan View */}
            <div className="space-y-4">
              {renderPlanView()}
            </div>
          </div>
    {/* ⭐ Full-width SVG visualizer here */}
<div className="mt-6">
  <TreadStringerVisualizer
    calculatedGeometry={calculatedGeometry}
    scale={scale}
    formatFn={inchesToFeetInchesFraction}
  />
</div>
          {/* Calculations Panel below visualizations */}
          <div className="mt-6 bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Calculated Values
              </h4>
              <button
                onClick={handleCalculate}
                disabled={!hasValidDimensions || readOnly}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  hasValidDimensions && !readOnly
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Calculate
              </button>
            </div>
            
            {showCalculations && hasValidDimensions ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-sm font-semibold text-blue-700 mb-1">Riser Height</div>
                    <div className="text-xl font-bold text-blue-900">
                      {calculatedGeometry.riserHeight.toFixed(3)}"
                    </div>
                    <div className="text-xs text-blue-600 mt-1 space-y-1">
                      <div>{inchesToFeetInchesFraction(calculatedGeometry.riserHeight)}</div>
                      <div className="text-blue-500">{inchesToSpelledOut(calculatedGeometry.riserHeight)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Tread Depth</div>
                    <div className="text-xl font-bold text-green-900">
                      {calculatedGeometry.treadDepth.toFixed(2)}"
                    </div>
                    <div className="text-xs text-green-600 mt-1 space-y-1">
                      <div>{inchesToFeetInchesFraction(calculatedGeometry.treadDepth)}</div>
                      <div className="text-green-500">{inchesToSpelledOut(calculatedGeometry.treadDepth)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-sm font-semibold text-purple-700 mb-1">Stringer Length</div>
                    <div className="text-xl font-bold text-purple-900">
                      {calculatedGeometry.stringerLength.toFixed(2)}"
                    </div>
                    <div className="text-xs text-purple-600 mt-1 space-y-1">
                      <div>{inchesToFeetInchesFraction(calculatedGeometry.stringerLength)}</div>
                      <div className="text-purple-500">{inchesToSpelledOut(calculatedGeometry.stringerLength)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="text-sm font-semibold text-orange-700 mb-1">Angle</div>
                    <div className="text-xl font-bold text-orange-900">
                      {calculatedGeometry.angle.toFixed(1)}°
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Stair inclination
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                    <div className="text-sm font-semibold text-teal-700 mb-1">2R + T Ratio</div>
                    <div className="text-xl font-bold text-teal-900">
                      {calculatedGeometry.twoRPlusT.toFixed(1)}
                    </div>
                    <div className="text-xs text-teal-600 mt-1">
                      Ideal: 24-25
                    </div>
                  </div>
   
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border">
                  <h5 className="font-semibold text-gray-800 mb-3">Stair Geometry Summary</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Steps:</span>
                      <span className="font-bold text-gray-800">{calculatedGeometry.risers - 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risers:</span>
                      <span className="font-bold text-gray-800">{calculatedGeometry.risers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Width:</span>
                      <span className="font-bold text-gray-800">{inchesToFeetInchesFraction(calculatedGeometry.width)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Rise:</span>
                      <span className="font-bold text-gray-800">
                        <div>{inchesToFeetInchesFraction(calculatedGeometry.vertical)}</div>
                        <div className="text-gray-500 text-xs">{inchesToSpelledOut(calculatedGeometry.vertical)}</div>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Run:</span>
                      <span className="font-bold text-gray-800">
                        <div>{inchesToFeetInchesFraction(calculatedGeometry.horizontal)}</div>
                        <div className="text-gray-500 text-xs">{inchesToSpelledOut(calculatedGeometry.horizontal)}</div>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stair Type:</span>
                      <span className="font-bold text-gray-800">
                        {stairTypeConfigs[selectedStairType]?.description || 'Custom'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !showCalculations ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 text-center">
                <div className="text-blue-600">
                  <div className="text-lg font-semibold mb-2">Ready to Calculate</div>
                  <div className="text-sm">Click the Calculate button to see results</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 text-center">
                <div className="text-yellow-700">
                  <div className="text-lg font-semibold mb-2">Enter Dimensions to Begin</div>
                  <div className="text-sm">Fill in all configuration fields to see calculations</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border-2 border-gray-300 p-6 shadow-lg">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              Stair Configuration
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Horizontal Distance
                </label>
                <input
                  type="text"
                  value={inputValues.horizontal}
                  onChange={(e) => handleInputChange('horizontal', e.target.value)}
                  onBlur={() => handleInputBlur('horizontal')}
                  onKeyDown={(e) => handleKeyDown(e, 'horizontal')}
                  onContextMenu={(e) => handleRightClick(e, 'horizontal')}
                  data-field="horizontal"
                  disabled={readOnly}
                  className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 11'-2 1/2&quot; or 134.5"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Examples: 11'-2 1/2&quot;, 11-2.5, 134.5
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vertical Distance
                </label>
                <input
                  type="text"
                  value={inputValues.vertical}
                  onChange={(e) => handleInputChange('vertical', e.target.value)}
                  onBlur={() => handleInputBlur('vertical')}
                  onKeyDown={(e) => handleKeyDown(e, 'vertical')}
                  onContextMenu={(e) => handleRightClick(e, 'vertical')}
                  data-field="vertical"
                  disabled={readOnly}
                  className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 7'-6&quot;, 7-1 1/2, or 90"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Examples: 7'-6&quot;, 7-1 1/2, 7-6, 90
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>Risers</span>
                    {(!userSetRisers && calculatedGeometry.risers > 0) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Auto (Optimized)</span>
                    )}
                  </span>
                </label>
                  <input
                    type="text"
                    value={inputValues.risers}
                    onChange={(e) => handleInputChange('risers', e.target.value)}
                    onBlur={() => handleInputBlur('risers')}
                    onKeyDown={(e) => handleKeyDown(e, 'risers')}
                    data-field="risers"
                    disabled={readOnly}
                    className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Riser Height
                  </label>
             <input
                type="text"
                value={inputValues.riserHeight}

                onChange={(e) => handleInputChange("riserHeight", e.target.value)}
                onBlur={() => handleInputBlur("riserHeight")}
                disabled={readOnly}
                className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder='e.g. 8.4" '
                />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stair Width
                </label>
                <input
                  type="text"
                  value={inputValues.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  onBlur={() => handleInputBlur('width')}
                  onKeyDown={(e) => handleKeyDown(e, 'width')}
                  onContextMenu={(e) => handleRightClick(e, 'width')}
                  data-field="width"
                  disabled={readOnly}
                  className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 3' or 36"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Examples: 3', 36, 3'-6&quot;
                </div>
              </div>
            </div>
          </div>

          {/* Warnings - Only show when calculations are displayed */}
          {showCalculations && warnings.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 p-4 shadow-lg">
              <h5 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Design Recommendations
              </h5>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2 text-xs mt-0.5">⚠️</span>
                    <span className="text-yellow-700 text-xs">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Guide */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-4 shadow-lg">
            <h5 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Interactive Guide
            </h5>
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Red handles: Adjust horizontal distance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Green handles: Adjust vertical distance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Yellow handles: Adjust stair width</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StairVisualization2D;
