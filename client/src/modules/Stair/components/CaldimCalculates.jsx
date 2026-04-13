import { useState, useCallback } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// UNIT CONVERSION UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function fisToFt(ft, inch, sx) {
  return (parseInt(ft) || 0) + (parseInt(inch) || 0) / 12 + (parseInt(sx) || 0) / 192;
}

function ftToFIS(val) {
  if (!isFinite(val)) return { neg: false, ft: 0, inch: 0, sx: 0 };
  const neg = val < 0;
  let v = Math.abs(val);
  const ft = Math.floor(v + 1e-9);
  const iRem = (v - ft) * 12;
  let inch = Math.floor(iRem + 1e-9);
  let sx = Math.round((iRem - inch) * 16);
  if (sx >= 16) { sx = 0; inch += 1; }
  if (inch >= 12) { return ftToFIS((neg ? -1 : 1) * fisToFt(ft + 1, 0, sx)); }
  return { neg, ft, inch, sx };
}

function fmtFIS(val) {
  if (!isFinite(val)) return "Error";
  const { neg, ft, inch, sx } = ftToFIS(val);
  const sign = neg ? "- " : "";
  const sxS = sx > 0 ? ` ${sx}/16` : "";
  return `${sign}${ft}' - ${inch}${sxS}"`;
}

function fmtVal(val, units) {
  if (!isFinite(val)) return "Error";
  switch (units) {
    case "fis": return fmtFIS(val);
    case "is": {
      const ti = val * 12, neg = ti < 0, abs = Math.abs(ti);
      const inches = Math.floor(abs + 1e-9);
      const sx = Math.round((abs - inches) * 16);
      return `${neg ? "-" : ""}${inches}${sx > 0 ? ` ${sx}/16` : ""}"`;
    }
    case "di": return `${(val * 12).toFixed(4)}"`;
    case "df": return `${val.toFixed(4)}'`;
    case "mm": return `${(val * 304.8).toFixed(1)} mm`;
    case "m":  return `${(val * 0.3048).toFixed(4)} m`;
    default: return fmtFIS(val);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SOLVER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function calcStairs(flfl, maxRiser, treadWidth) {
  if (flfl <= 0 || maxRiser <= 0 || treadWidth <= 0) return null;
  const numRisers = Math.ceil(flfl / maxRiser);
  const actRiser = flfl / numRisers;
  const numTreads = numRisers - 1;
  const run = numTreads * treadWidth;
  const nsns = treadWidth;
  const slope = Math.sqrt(flfl * flfl + run * run);
  const pitch = Math.atan(actRiser / treadWidth) * (180 / Math.PI);
  return { actRiser, numTreads, numRisers, run, nsns, slope, pitch };
}

function calcRightTriangle(fields) {
  const { side_a, side_b, side_c, angle_a, angle_b } = fields;
  const result = { ...fields };
  
  if (side_a && side_b && !side_c) {
    result.side_c = Math.sqrt(side_a * side_a + side_b * side_b);
    result.angle_a = Math.atan(side_a / side_b) * 180 / Math.PI;
    result.angle_b = 90 - result.angle_a;
  } else if (side_a && side_c && !side_b) {
    result.side_b = Math.sqrt(side_c * side_c - side_a * side_a);
    result.angle_a = Math.asin(side_a / side_c) * 180 / Math.PI;
    result.angle_b = 90 - result.angle_a;
  } else if (side_b && side_c && !side_a) {
    result.side_a = Math.sqrt(side_c * side_c - side_b * side_b);
    result.angle_a = Math.acos(side_b / side_c) * 180 / Math.PI;
    result.angle_b = 90 - result.angle_a;
  } else if (side_a && angle_a && !side_b) {
    const ar = angle_a * Math.PI / 180;
    result.side_b = side_a / Math.tan(ar);
    result.side_c = side_a / Math.sin(ar);
    result.angle_b = 90 - angle_a;
  }
  
  if (result.side_a && result.side_b) {
    result.pitch = (result.side_a / result.side_b) * 12;
  }
  
  return result;
}

function calcObliqueTriangle(fields) {
  const { side_a, side_b, side_c, angle_a, angle_b, angle_c } = fields;
  const result = { ...fields };
  
  if (side_a && side_b && side_c) {
    result.angle_a = Math.acos((side_b*side_b + side_c*side_c - side_a*side_a) / (2*side_b*side_c)) * 180/Math.PI;
    result.angle_b = Math.acos((side_a*side_a + side_c*side_c - side_b*side_b) / (2*side_a*side_c)) * 180/Math.PI;
    result.angle_c = 180 - result.angle_a - result.angle_b;
  } else if (side_a && side_b && angle_c) {
    const ac = angle_c * Math.PI / 180;
    result.side_c = Math.sqrt(side_a*side_a + side_b*side_b - 2*side_a*side_b*Math.cos(ac));
    result.angle_a = Math.asin(side_a * Math.sin(ac) / result.side_c) * 180/Math.PI;
    result.angle_b = 180 - angle_c - result.angle_a;
  }
  
  return result;
}

function calcCircle(fields) {
  const { radius, diameter, chord, arc, angle } = fields;
  const result = { ...fields };
  
  if (radius) {
    result.diameter = radius * 2;
    result.circumference = 2 * Math.PI * radius;
    result.area = Math.PI * radius * radius;
  } else if (diameter) {
    result.radius = diameter / 2;
    result.circumference = Math.PI * diameter;
    result.area = Math.PI * (diameter/2) * (diameter/2);
  }
  
  if (result.radius && chord) {
    result.angle = 2 * Math.asin(chord / (2 * result.radius)) * 180 / Math.PI;
  }
  
  if (result.radius && angle) {
    const angleRad = angle * Math.PI / 180;
    result.arc = result.radius * angleRad;
    result.chord = 2 * result.radius * Math.sin(angleRad / 2);
  }
  
  return result;
}

function calcRoof(fields) {
  const { pitch, bldgRun, bldgRise, bldgSlope, overhangRun, overhangRise, overhangSlope } = fields;
  const result = { ...fields };
  
  if (pitch && bldgRun) {
    result.bldgRise = (pitch / 12) * bldgRun;
    result.bldgSlope = Math.sqrt(result.bldgRise * result.bldgRise + bldgRun * bldgRun);
  } else if (bldgRise && bldgRun) {
    result.pitch = (bldgRise / bldgRun) * 12;
    result.bldgSlope = Math.sqrt(bldgRise * bldgRise + bldgRun * bldgRun);
  }
  
  if (result.pitch && overhangRun) {
    result.overhangRise = (result.pitch / 12) * overhangRun;
    result.overhangSlope = Math.sqrt(result.overhangRise * result.overhangRise + overhangRun * overhangRun);
  }
  
  if (result.bldgRun && overhangRun && result.pitch) {
    const totalRun = result.bldgRun + overhangRun;
    const totalRise = (result.pitch / 12) * totalRun;
    result.totalRun = totalRun;
    result.totalRise = totalRise;
    result.totalSlope = Math.sqrt(totalRise * totalRise + totalRun * totalRun);
  }
  
  return result;
}

function calcConcrete(fields) {
  const { length, width, thickness, diameter, height } = fields;
  const result = { ...fields };
  
  if (length && width && thickness) {
    const cubicInches = length * width * thickness;
    result.cubicFeet = cubicInches / 1728;
    result.cubicYards = result.cubicFeet / 27;
    result.squareFeet = (length * width) / 144;
  }
  
  if (diameter && height) {
    const radius = diameter / 2;
    const area = Math.PI * radius * radius;
    const volume = area * height;
    result.cubicFeet = volume / 1728;
    result.cubicYards = result.cubicFeet / 27;
    result.squareFeet = (Math.PI * diameter * diameter / 4) / 144;
  }
  
  return result;
}

function calcBoardFeet(thickness, width, length, quantity = 1) {
  const boardFeetPerPiece = (thickness * width * length) / 12;
  const totalBoardFeet = boardFeetPerPiece * quantity;
  return { boardFeetPerPiece, totalBoardFeet };
}

function calcSquaring(sideA, sideB) {
  const diagonal = Math.sqrt(sideA * sideA + sideB * sideB);
  const area = (sideA * sideB) / 144;
  return { diagonal, area };
}

function calcSlopePercentage(fields) {
  const { percentage, pitch, rise, run } = fields;
  const result = { ...fields };
  
  if (percentage) {
    result.pitch = (percentage / 100) * 12;
    result.angle = Math.atan(percentage / 100) * 180 / Math.PI;
  } else if (pitch) {
    result.percentage = (pitch / 12) * 100;
    result.angle = Math.atan(pitch / 12) * 180 / Math.PI;
  } else if (rise && run) {
    result.percentage = (rise / run) * 100;
    result.pitch = (rise / run) * 12;
    result.angle = Math.atan(rise / run) * 180 / Math.PI;
  }
  
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// THEMES
// ══════════════════════════════════════════════════════════════════════════════

const THEMES = {
  windows: {
    win: "#f0f0f0", btn: "#e1e1e1", btnBrd: "#adadad", txt: "#000",
    disp: "#ffffff", titleBar: "#0078d4", titleTxt: "#fff",
    special: "#c8cfe8", menuBg: "#f5f5f5", menuHover: "#0078d4",
    equals: "#b8d4b8", clear: "#f0c0c0", active: "#0078d4",
    fieldActive: "#0078d4", statusOk: "#006400", statusErr: "#cc0000",
    statusOkBg: "#e8ffe8", statusErrBg: "#ffe8e8",
  },
  highContrast: {
    win: "#000", btn: "#1a1a1a", btnBrd: "#ffffff", txt: "#ffffff",
    disp: "#000", titleBar: "#000", titleTxt: "#ffff00",
    special: "#00008b", menuBg: "#000", menuHover: "#0000cc",
    equals: "#005500", clear: "#550000", active: "#0000cc",
    fieldActive: "#0000cc", statusOk: "#00ff00", statusErr: "#ff0000",
    statusOkBg: "#001a00", statusErrBg: "#1a0000",
  },
  pleasantGray: {
    win: "#c0c0c8", btn: "#d4d4d8", btnBrd: "#888898", txt: "#111",
    disp: "#e8e8ec", titleBar: "#4a4a5a", titleTxt: "#ffffff",
    special: "#a8a8c0", menuBg: "#d0d0d8", menuHover: "#505060",
    equals: "#98b898", clear: "#b89898", active: "#505060",
    fieldActive: "#505060", statusOk: "#006400", statusErr: "#cc0000",
    statusOkBg: "#d8e8d8", statusErrBg: "#e8d8d8",
  },
  highTech: {
    win: "#0d1117", btn: "#1a2332", btnBrd: "#1e4060", txt: "#7dd3e8",
    disp: "#080c12", titleBar: "#0f2744", titleTxt: "#00c8e8",
    special: "#142030", menuBg: "#0d1117", menuHover: "#0f3460",
    equals: "#102810", clear: "#280e0e", active: "#0f5080",
    fieldActive: "#0f5080", statusOk: "#00aa44", statusErr: "#cc2222",
    statusOkBg: "#081808", statusErrBg: "#180808",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function CaldimCalculates({ onClose, dragControls }) {
  // ── Calculator core state ─────────────────────────────────────────────────
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(null);
  const [pendOp, setPendOp] = useState(null);
  const [entering, setEntering] = useState(false);
  const [segs, setSegs] = useState(["", "", ""]);
  const [activeSeg, setActiveSeg] = useState(0);
  const [clipboard, setClipboard] = useState(0);

  // ── Memory ────────────────────────────────────────────────────────────────
  const [mems, setMems] = useState(Array(8).fill(0));

  // ── Tape history ──────────────────────────────────────────────────────────
  const [tape, setTape] = useState([]);
  const [showTape, setShowTape] = useState(false);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [units, setUnitsS] = useState("fis");
  const [angMode, setAngMode] = useState("degrees");
  const [theme, setTheme] = useState("windows");
  const [hideEst, setHideEst] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [openMenu, setOpenMenu] = useState(null);
  const [solver, setSolver] = useState("stair");
  const [activeField, setActiveField] = useState(null);
  const [errMsg, setErrMsg] = useState("No Error");
  const [showHelp, setShowHelp] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // ── Solver state ──────────────────────────────────────────────────────────
  const [stair, setStair] = useState({
    flfl: 0, maxRiser: 0, treadWidth: 0, actRiser: 0,
    run: 0, nsns: 0, pitch: 0, numTreads: 0, numRisers: 0
  });
  
  const [rtri, setRtri] = useState({
    side_a: 0, side_b: 0, side_c: 0,
    angle_a: 0, angle_b: 0, pitch: 0
  });
  
  const [oblique, setOblique] = useState({
    side_a: 0, side_b: 0, side_c: 0,
    angle_a: 0, angle_b: 0, angle_c: 0
  });
  
  const [circle, setCircle] = useState({
    radius: 0, diameter: 0, circumference: 0,
    area: 0, chord: 0, arc: 0, angle: 0
  });
  
  const [roof, setRoof] = useState({
    pitch: 0, bldgRun: 0, bldgRise: 0, bldgSlope: 0,
    overhangRun: 0, overhangRise: 0, overhangSlope: 0,
    totalRun: 0, totalRise: 0, totalSlope: 0
  });
  
  const [concrete, setConcrete] = useState({
    length: 0, width: 0, thickness: 0, diameter: 0, height: 0,
    cubicFeet: 0, cubicYards: 0, squareFeet: 0
  });
  
  const [boardFeet, setBoardFeet] = useState({
    thickness: 0, width: 0, length: 0, quantity: 1,
    boardFeetPerPiece: 0, totalBoardFeet: 0
  });
  
  const [squaring, setSquaring] = useState({
    sideA: 0, sideB: 0, diagonal: 0, area: 0
  });
  
  const [slopeCalc, setSlopeCalc] = useState({
    percentage: 0, pitch: 0, rise: 0, run: 0, angle: 0
  });

  const T = THEMES[theme];

  // ══════════════════════════════════════════════════════════════════════════════
  // CALCULATOR CORE FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const digit = useCallback((d) => {
    if (entering) {
      const idx = activeSeg;
      const newSegs = [...segs];
      newSegs[idx] += String(d);
      setSegs(newSegs);
      const newFt = fisToFt(newSegs[0], newSegs[1], newSegs[2]);
      setCur(newFt);
    } else {
      setSegs([String(d), "", ""]);
      setActiveSeg(0);
      setCur(d);
      setEntering(true);
    }
  }, [entering, segs, activeSeg]);

  const dot = useCallback(() => {
    if (entering && activeSeg < 2) {
      setActiveSeg(activeSeg + 1);
    } else {
      setSegs(["0", "", ""]);
      setActiveSeg(1);
      setEntering(true);
    }
  }, [entering, activeSeg]);

  const pressOp = useCallback((op) => {
    if (pendOp && entering) {
      pressEq();
    }
    setPrev(cur);
    setPendOp(op);
    setEntering(false);
  }, [cur, pendOp, entering]);

  const pressEq = useCallback(() => {
    if (!pendOp || prev === null) return;
    let res = cur;
    if (pendOp === "+") res = prev + cur;
    else if (pendOp === "-") res = prev - cur;
    else if (pendOp === "*") res = prev * cur;
    else if (pendOp === "/") res = cur !== 0 ? prev / cur : 0;
    else if (pendOp === "**") res = Math.pow(prev, cur);
    else if (pendOp === "rem") res = prev % cur;
    
    setCur(res);
    setPrev(null);
    setPendOp(null);
    setEntering(false);
    
    setTape(t => [{ 
      prev: fmtFIS(prev), 
      op: pendOp, 
      cur: fmtFIS(cur), 
      result: fmtFIS(res),
      time: new Date().toLocaleTimeString()
    }, ...t].slice(0, 20));
  }, [cur, prev, pendOp]);

  const pressSpecial = useCallback((key) => {
    let res = cur;
    if (key === "sqrt") res = Math.sqrt(Math.abs(cur));
    else if (key === "neg") res = -cur;
    else if (key === "pi") res = Math.PI;
    else if (key === "cy") res = cur / 27;
    else if (key === "asin") res = Math.asin(cur) * 180 / Math.PI;
    else if (key === "acos") res = Math.acos(cur) * 180 / Math.PI;
    else if (key === "atan") res = Math.atan(cur) * 180 / Math.PI;
    setCur(res);
    setEntering(false);
  }, [cur]);

  const pressMemory = useCallback((cmd) => {
    if (cmd === "M+") setMems(m => { const n = [...m]; n[0] += cur; return n; });
    else if (cmd === "M-") setMems(m => { const n = [...m]; n[0] -= cur; return n; });
    else if (cmd === "MR") { setCur(mems[0]); setEntering(false); }
    else if (cmd === "MC") setMems(Array(8).fill(0));
  }, [cur, mems]);

  const clearAll = useCallback(() => {
    setCur(0);
    setPrev(null);
    setPendOp(null);
    setSegs(["", "", ""]);
    setActiveSeg(0);
    setEntering(false);
  }, []);

  const clearEntry = useCallback(() => {
    setCur(0);
    setSegs(["", "", ""]);
    setActiveSeg(0);
    setEntering(false);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // MENU FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const copyToClipboard = useCallback(() => {
    setClipboard(cur);
    setOpenMenu(null);
  }, [cur]);

  const pasteFromClipboard = useCallback(() => {
    setCur(clipboard);
    setEntering(false);
    setOpenMenu(null);
  }, [clipboard]);

  const storeToMemory = useCallback((slot) => {
    setMems(m => {
      const n = [...m];
      n[slot] = cur;
      return n;
    });
    setOpenMenu(null);
  }, [cur]);

  const recallFromMemory = useCallback((slot) => {
    setCur(mems[slot]);
    setEntering(false);
    setOpenMenu(null);
  }, [mems]);

  // ══════════════════════════════════════════════════════════════════════════════
  // SOLVER RUNNER
  // ══════════════════════════════════════════════════════════════════════════════

  const runSolver = useCallback(() => {
    try {
      if (solver === "stair") {
        const result = calcStairs(stair.flfl, stair.maxRiser, stair.treadWidth);
        if (result) {
          setStair({ ...stair, ...result });
          setErrMsg("No Error");
        } else {
          setErrMsg("Invalid inputs");
        }
      } else if (solver === "right") {
        const result = calcRightTriangle(rtri);
        setRtri(result);
        setErrMsg("No Error");
      } else if (solver === "oblique") {
        const result = calcObliqueTriangle(oblique);
        setOblique(result);
        setErrMsg("No Error");
      } else if (solver === "circle") {
        const result = calcCircle({ ...circle, radius: cur });
        setCircle(result);
        setErrMsg("No Error");
      } else if (solver === "roof") {
        const result = calcRoof(roof);
        setRoof(result);
        setErrMsg("No Error");
      } else if (solver === "concrete") {
        const result = calcConcrete(concrete);
        setConcrete(result);
        setErrMsg("No Error");
      } else if (solver === "boardfeet") {
        const result = calcBoardFeet(boardFeet.thickness, boardFeet.width, boardFeet.length, boardFeet.quantity);
        setBoardFeet({ ...boardFeet, ...result });
        setErrMsg("No Error");
      } else if (solver === "squaring") {
        const result = calcSquaring(squaring.sideA, squaring.sideB);
        setSquaring({ ...squaring, ...result });
        setErrMsg("No Error");
      } else if (solver === "slope") {
        const result = calcSlopePercentage(slopeCalc);
        setSlopeCalc(result);
        setErrMsg("No Error");
      }
    } catch (e) {
      setErrMsg("Calculation Error");
    }
  }, [solver, stair, rtri, oblique, circle, roof, concrete, boardFeet, squaring, slopeCalc, cur]);

  const sendToField = useCallback(() => {
    if (!activeField) return;
    
    const [solverName, fieldKey] = activeField.split(".");
    
    if (solverName === "stair") {
      setStair(s => ({ ...s, [fieldKey]: cur }));
    } else if (solverName === "right") {
      setRtri(r => ({ ...r, [fieldKey]: cur }));
    } else if (solverName === "oblique") {
      setOblique(o => ({ ...o, [fieldKey]: cur }));
    } else if (solverName === "circle") {
      setCircle(c => ({ ...c, [fieldKey]: cur }));
    } else if (solverName === "roof") {
      setRoof(r => ({ ...r, [fieldKey]: cur }));
    } else if (solverName === "concrete") {
      setConcrete(c => ({ ...c, [fieldKey]: cur }));
    } else if (solverName === "boardfeet") {
      setBoardFeet(b => ({ ...b, [fieldKey]: cur }));
    } else if (solverName === "squaring") {
      setSquaring(s => ({ ...s, [fieldKey]: cur }));
    } else if (solverName === "slope") {
      setSlopeCalc(s => ({ ...s, [fieldKey]: cur }));
    }
    
    setActiveField(null);
  }, [activeField, cur]);

  // ══════════════════════════════════════════════════════════════════════════════
  // HELPER COMPONENTS
  // ══════════════════════════════════════════════════════════════════════════════

  const BS = useCallback((bg = T.btn, extra = {}) => ({
    background: bg,
    border: `1px outset ${T.btnBrd}`,
    color: T.txt,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 4px",
    minHeight: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    ...extra,
  }), [T]);

  const SolverField = ({ label, fieldKey, value, format }) => {
    const isActive = activeField === `${solver}.${fieldKey}`;
    let displayVal = "";
    
    if (format === "angle") {
      displayVal = value ? `${value.toFixed(2)}°` : "0.00°";
    } else if (format === "count") {
      displayVal = value ? value.toString() : "0";
    } else {
      displayVal = value ? fmtFIS(value) : "0' - 0\"";
    }
    
    return (
      <div style={{ display: "flex", gap: 1, marginBottom: 1 }}>
        <button
          style={{
            ...BS(isActive ? T.fieldActive : T.btn, { color: isActive ? "#fff" : T.txt }),
            width: 70,
            fontSize: 9,
            justifyContent: "flex-end",
            paddingRight: 3,
          }}
          onClick={() => setActiveField(`${solver}.${fieldKey}`)}
        >
          {label}
        </button>
        <div style={{
          flex: 1,
          background: T.disp,
          border: `1px inset ${T.btnBrd}`,
          fontSize: 10,
          padding: "1px 3px",
          color: T.txt,
          fontFamily: "Courier New, monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}>
          {displayVal}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ 
      background: T.win, 
      padding: 4, 
      borderRadius: 8, 
      fontFamily: "Segoe UI, sans-serif", 
      userSelect: "none", 
      position: "relative",
      transform: maximized ? "scale(1.2)" : "scale(1)",
      transformOrigin: "top left",
      transition: "transform 0.2s ease",
      boxShadow: maximized ? "0 30px 60px rgba(0,0,0,0.5)" : "none",
    }}>
      {/* Title Bar - Used as Drag Handle */}
      <div 
        onPointerDown={(e) => {
          if (dragControls) dragControls.start(e, { snapToCursor: false });
        }}
        style={{
        background: T.titleBar,
        color: T.titleTxt,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 3,
        borderRadius: "6px 6px 0 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: dragControls ? "grab" : "default"
      }}>
        <span>🧮 Caldim Calculates</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button 
            style={{ ...BS(), fontSize: 10, padding: "1px 6px" }}
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
          >_</button>
          <button 
            style={{ ...BS(), fontSize: 10, padding: "1px 6px" }}
            onClick={(e) => { e.stopPropagation(); setMaximized(!maximized); }}
          >□</button>
          <button 
            style={{ ...BS(T.clear), fontSize: 10, padding: "1px 6px" }}
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
          >✕</button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Menu Bar */}
      <div style={{ display: "flex", gap: 1, marginBottom: 3, background: T.menuBg, padding: "1px 2px" }}>
        {[
          { name: "Edit", items: ["Copy (Ctrl+C)", "Paste (Ctrl+V)", "Clear All"] },
          { name: "Store", items: Array(8).fill(0).map((_, i) => `Memory Slot ${i + 1}`) },
          { name: "Recall", items: Array(8).fill(0).map((_, i) => `Recall Slot ${i + 1}`) },
          { name: "Tape", items: ["Show Tape", "Clear Tape"] },
          { name: "Solver", items: [
            { label: "Stair", value: "stair" },
            { label: "Right Triangle", value: "right" },
            { label: "Oblique Triangle", value: "oblique" },
            { label: "Circle", value: "circle" },
            { label: "Roof/Truss", value: "roof" },
            { label: "Concrete", value: "concrete" },
            { label: "Board Feet", value: "boardfeet" },
            { label: "Squaring", value: "squaring" },
            { label: "Slope %", value: "slope" },
          ]},
          { name: "Settings", items: Object.keys(THEMES).map(t => t.charAt(0).toUpperCase() + t.slice(1).replace(/([A-Z])/g, ' $1')) },
          { name: "Help", items: ["About", "Quick Start"] }
        ].map(menu => (
          <div key={menu.name} style={{ position: "relative" }}>
            <button
              style={{
                ...BS(openMenu === menu.name ? T.menuHover : "transparent", { color: openMenu === menu.name ? "#fff" : T.txt }),
                border: "none",
                fontSize: 11,
                padding: "2px 8px",
              }}
              onClick={() => setOpenMenu(openMenu === menu.name ? null : menu.name)}
            >
              {menu.name}
            </button>
            
            {openMenu === menu.name && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: T.menuBg,
                border: `1px solid ${T.btnBrd}`,
                zIndex: 1000,
                minWidth: 180,
                boxShadow: "2px 2px 4px rgba(0,0,0,0.2)",
              }}>
                {menu.items.map((item, idx) => {
                  const itemLabel = typeof item === "object" ? item.label : item;
                  const itemValue = typeof item === "object" ? item.value : null;
                  
                  return (
                    <button
                      key={idx}
                      style={{
                        ...BS("transparent"),
                        width: "100%",
                        justifyContent: "flex-start",
                        border: "none",
                        fontSize: 11,
                        padding: "4px 8px",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = T.menuHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => {
                        if (menu.name === "Edit") {
                          if (idx === 0) copyToClipboard();
                          else if (idx === 1) pasteFromClipboard();
                          else if (idx === 2) { clearAll(); setOpenMenu(null); }
                        } else if (menu.name === "Store") {
                          storeToMemory(idx);
                        } else if (menu.name === "Recall") {
                          recallFromMemory(idx);
                        } else if (menu.name === "Tape") {
                          if (idx === 0) { setShowTape(!showTape); setOpenMenu(null); }
                          else if (idx === 1) { setTape([]); setOpenMenu(null); }
                        } else if (menu.name === "Solver" && itemValue) {
                          setSolver(itemValue);
                          setOpenMenu(null);
                        } else if (menu.name === "Settings") {
                          const themeKey = itemLabel.toLowerCase().replace(/ /g, '');
                          setTheme(themeKey);
                          setOpenMenu(null);
                        } else if (menu.name === "Help") {
                          setShowHelp(true);
                          setOpenMenu(null);
                        }
                      }}
                    >
                      {menu.name === "Solver" && solver === itemValue ? "✓ " : ""}{itemLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", gap: 3 }}>
        {/* LEFT: Calculator */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: T.disp,
            border: `2px inset ${T.btnBrd}`,
            padding: "8px",
            marginBottom: 3,
            minHeight: 40,
            fontFamily: "Courier New, monospace",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "right",
            color: T.txt,
          }}>
            {fmtFIS(cur)}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.txt, marginBottom: 2, opacity: 0.6 }}>
            <span>feet</span>
            <span>inches</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 1,
          }}>
            <button style={BS(T.special)} onClick={() => pressSpecial("asin")}>ASIN</button>
            <button style={BS()} onClick={() => { if(onClose) onClose(); }}>OFF</button>
            <button style={BS()} onClick={() => digit(13)}>13</button>
            <button style={BS()} onClick={() => digit(14)}>14</button>
            <button style={BS()} onClick={() => digit(15)}>15</button>
            <button style={BS()} onClick={() => setUnitsS("df")}>DEC</button>
            <button style={BS()} onClick={() => setUnitsS("fis")}>FIS</button>
            <button style={BS(T.clear)} onClick={clearAll}>CS</button>

            <button style={BS(T.special)} onClick={() => pressSpecial("acos")}>ACOS</button>
            <button style={BS()}>SHIFT</button>
            <button style={BS()} onClick={() => digit(10)}>10</button>
            <button style={BS()} onClick={() => digit(11)}>11</button>
            <button style={BS()} onClick={() => digit(12)}>12</button>
            <button style={BS()} onClick={() => setUnitsS("mm")}>MM</button>
            <button style={BS()} onClick={() => setUnitsS("is")}>INCH</button>
            <button style={BS(T.clear)} onClick={clearEntry}>C/CE</button>

            <button style={BS(T.special)} onClick={() => pressSpecial("atan")}>ATAN</button>
            <button style={{ ...BS(), opacity: 0.15, cursor: "default" }} disabled>INV</button>
            <button style={BS()} onClick={() => digit(7)}>7</button>
            <button style={BS()} onClick={() => digit(8)}>8</button>
            <button style={BS()} onClick={() => digit(9)}>9</button>
            <button style={BS()} onClick={() => pressSpecial("sqrt")}>√x</button>
            <button style={BS()} onClick={() => pressOp("**")}>x²</button>
            <button style={BS()} onClick={() => pressSpecial("neg")}>+/-</button>

            <button style={BS(T.special)} onClick={() => pressSpecial("cy")}>CY</button>
            <button style={BS()} onClick={dot}>•</button>
            <button style={BS()} onClick={() => digit(4)}>4</button>
            <button style={BS()} onClick={() => digit(5)}>5</button>
            <button style={BS()} onClick={() => digit(6)}>6</button>
            <button style={BS()} onClick={() => pressOp("*")}>✕</button>
            <button style={BS()} onClick={() => pressOp("rem")}>REM</button>
            <button
              style={{
                ...BS(T.equals, { fontSize: 24, fontWeight: "bold" }),
                gridRow: "span 2",
                minHeight: 50,
                borderWidth: "2px",
              }}
              onClick={pressEq}
            >=</button>

            <button style={BS(T.special)} onClick={() => pressSpecial("pi")}>π</button>
            <button style={BS()} onClick={() => digit(0)}>0</button>
            <button style={BS()} onClick={() => digit(1)}>1</button>
            <button style={BS()} onClick={() => digit(2)}>2</button>
            <button style={BS()} onClick={() => digit(3)}>3</button>
            <button style={BS()} onClick={() => pressOp("+")}>+</button>
            <button style={BS()} onClick={() => pressOp("-")}>–</button>

            <button style={BS(T.special)} onClick={() => setHideEst(!hideEst)}>👁</button>
            <button style={BS()} onClick={() => pressMemory("M+")}>M+</button>
            <button style={BS()} onClick={() => pressMemory("M-")}>M–</button>
            <button style={BS()} onClick={() => pressMemory("MR")}>MR</button>
            <button style={BS()} onClick={() => pressMemory("MC")}>MC</button>
            <button style={BS()} onClick={() => setShowTape(!showTape)}>🔍</button>
            <button style={BS()} onClick={runSolver}>📐</button>
            <button style={BS()} onClick={() => setSolver("slope")}>⛰</button>
          </div>

          {!hideEst && (
            <div style={{ marginTop: 3 }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                {["A = 0.00 sf", "T = 0.000 ft", "V = 0.00 cy"].map(s => (
                  <div key={s} style={{
                    flex: 1,
                    background: T.disp,
                    border: `1px inset ${T.btnBrd}`,
                    padding: "1px 4px",
                    fontSize: 11,
                    color: T.txt,
                    fontFamily: "Courier New, monospace",
                  }}>{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Solver Panel */}
        <div style={{ width: 178, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <button style={{ ...BS(), flex: 1, fontSize: 10 }}>🖨</button>
            <button
              style={{ ...BS(T.equals), flex: 2, fontSize: 11, fontWeight: 700 }}
              onClick={sendToField}
            >→</button>
          </div>

          {solver === "stair" && (<>
            <SolverField label="FL-FL" fieldKey="flfl" value={stair.flfl} />
            <SolverField label="Max Riser" fieldKey="maxRiser" value={stair.maxRiser} />
            <SolverField label="Tr. Width" fieldKey="treadWidth" value={stair.treadWidth} />
            <SolverField label="Act.Riser" fieldKey="actRiser" value={stair.actRiser} />
            <div style={{
              textAlign: "center",
              fontSize: 10,
              padding: "1px 4px",
              marginBottom: 1,
              background: errMsg === "No Error" ? T.statusOkBg : T.statusErrBg,
              color: errMsg === "No Error" ? T.statusOk : T.statusErr,
              border: `1px solid ${T.btnBrd}`,
            }}>{errMsg}</div>
            <SolverField label="Run" fieldKey="run" value={stair.run} />
            <SolverField label="NS-NS" fieldKey="nsns" value={stair.nsns} />
            <SolverField label="Pitch" fieldKey="pitch" value={stair.pitch} format="angle" />
            <SolverField label="# Tread" fieldKey="numTreads" value={stair.numTreads} format="count" />
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
            <div style={{ marginTop: 3, fontSize: 9, color: T.txt, opacity: 0.6, lineHeight: 1.4 }}>
              1. Click field label<br/>
              2. Enter value<br/>
              3. Press → then Run
            </div>
          </>)}

          {solver === "right" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Right Triangle</div>
            <SolverField label="Rise (A)" fieldKey="side_a" value={rtri.side_a} />
            <SolverField label="Run (B)" fieldKey="side_b" value={rtri.side_b} />
            <SolverField label="Slope (C)" fieldKey="side_c" value={rtri.side_c} />
            <SolverField label="Angle A" fieldKey="angle_a" value={rtri.angle_a} format="angle" />
            <SolverField label="Angle B" fieldKey="angle_b" value={rtri.angle_b} format="angle" />
            <SolverField label="Pitch" fieldKey="pitch" value={rtri.pitch} />
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "oblique" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Oblique Triangle</div>
            <SolverField label="Side A" fieldKey="side_a" value={oblique.side_a} />
            <SolverField label="Side B" fieldKey="side_b" value={oblique.side_b} />
            <SolverField label="Side C" fieldKey="side_c" value={oblique.side_c} />
            <SolverField label="Angle A" fieldKey="angle_a" value={oblique.angle_a} format="angle" />
            <SolverField label="Angle B" fieldKey="angle_b" value={oblique.angle_b} format="angle" />
            <SolverField label="Angle C" fieldKey="angle_c" value={oblique.angle_c} format="angle" />
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "circle" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Circle</div>
            <SolverField label="Radius" fieldKey="radius" value={circle.radius} />
            <SolverField label="Diameter" fieldKey="diameter" value={circle.diameter} />
            <SolverField label="Chord" fieldKey="chord" value={circle.chord} />
            <SolverField label="Arc" fieldKey="arc" value={circle.arc} />
            <SolverField label="Angle" fieldKey="angle" value={circle.angle} format="angle" />
            <div style={{ marginTop: 2, padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Circumference: {circle.circumference ? fmtFIS(circle.circumference) : "0"}
            </div>
            <div style={{ padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Area: {circle.area ? circle.area.toFixed(4) + " sf" : "0 sf"}
            </div>
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "roof" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Roof/Truss</div>
            <div style={{ fontSize: 9, color: T.txt, marginBottom: 2, opacity: 0.8 }}>Building:</div>
            <SolverField label="Pitch" fieldKey="pitch" value={roof.pitch} />
            <SolverField label="Bldg Run" fieldKey="bldgRun" value={roof.bldgRun} />
            <SolverField label="Bldg Rise" fieldKey="bldgRise" value={roof.bldgRise} />
            <SolverField label="Bldg Slope" fieldKey="bldgSlope" value={roof.bldgSlope} />
            <div style={{ fontSize: 9, color: T.txt, marginTop: 2, marginBottom: 2, opacity: 0.8 }}>Overhang:</div>
            <SolverField label="Ovr Run" fieldKey="overhangRun" value={roof.overhangRun} />
            <SolverField label="Ovr Slope" fieldKey="overhangSlope" value={roof.overhangSlope} />
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "concrete" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Concrete</div>
            <SolverField label="Length" fieldKey="length" value={concrete.length} />
            <SolverField label="Width" fieldKey="width" value={concrete.width} />
            <SolverField label="Thickness" fieldKey="thickness" value={concrete.thickness} />
            <div style={{ marginTop: 2, padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Cu. Ft: {concrete.cubicFeet ? concrete.cubicFeet.toFixed(2) : "0"}
            </div>
            <div style={{ padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Cu. Yd: {concrete.cubicYards ? concrete.cubicYards.toFixed(2) : "0"}
            </div>
            <div style={{ padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Sq. Ft: {concrete.squareFeet ? concrete.squareFeet.toFixed(2) : "0"}
            </div>
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "boardfeet" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Board Feet</div>
            <SolverField label="Thickness" fieldKey="thickness" value={boardFeet.thickness} />
            <SolverField label="Width" fieldKey="width" value={boardFeet.width} />
            <SolverField label="Length" fieldKey="length" value={boardFeet.length} />
            <SolverField label="Quantity" fieldKey="quantity" value={boardFeet.quantity} format="count" />
            <div style={{ marginTop: 2, padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Per Pc: {boardFeet.boardFeetPerPiece ? boardFeet.boardFeetPerPiece.toFixed(4) : "0"} BF
            </div>
            <div style={{ padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Total: {boardFeet.totalBoardFeet ? boardFeet.totalBoardFeet.toFixed(4) : "0"} BF
            </div>
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "squaring" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Squaring</div>
            <SolverField label="Side A" fieldKey="sideA" value={squaring.sideA} />
            <SolverField label="Side B" fieldKey="sideB" value={squaring.sideB} />
            <div style={{ marginTop: 2, padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Diagonal: {squaring.diagonal ? fmtFIS(squaring.diagonal) : "0"}
            </div>
            <div style={{ padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Area: {squaring.area ? squaring.area.toFixed(2) : "0"} sf
            </div>
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}

          {solver === "slope" && (<>
            <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Slope %</div>
            <SolverField label="Percentage" fieldKey="percentage" value={slopeCalc.percentage} />
            <SolverField label="Pitch" fieldKey="pitch" value={slopeCalc.pitch} />
            <SolverField label="Rise" fieldKey="rise" value={slopeCalc.rise} />
            <SolverField label="Run" fieldKey="run" value={slopeCalc.run} />
            <div style={{ marginTop: 2, padding: "2px 4px", background: T.disp, border: `1px solid ${T.btnBrd}`, fontSize: 9 }}>
              Angle: {slopeCalc.angle ? slopeCalc.angle.toFixed(2) : "0"}°
            </div>
            <button
              style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
              onClick={runSolver}
            >Run</button>
          </>)}
        </div>
      </div>

      {/* Tape Window */}
      {showTape && (
        <div style={{
          position: "absolute",
          top: 60,
          right: 10,
          width: 250,
          maxHeight: 400,
          background: T.win,
          border: `2px solid ${T.btnBrd}`,
          borderRadius: 8,
          boxShadow: "4px 4px 12px rgba(0,0,0,0.3)",
          zIndex: 1001,
        }}>
          <div style={{
            background: T.titleBar,
            color: T.titleTxt,
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>Calculation Tape</span>
            <button
              style={{ ...BS(T.clear), fontSize: 10, padding: "1px 4px" }}
              onClick={() => setShowTape(false)}
            >✕</button>
          </div>
          <div style={{ maxHeight: 350, overflow: "auto", padding: 8 }}>
            {tape.length === 0 ? (
              <div style={{ fontSize: 10, color: T.txt, opacity: 0.5, textAlign: "center", padding: 20 }}>
                No calculations yet
              </div>
            ) : (
              tape.map((entry, idx) => (
                <div key={idx} style={{
                  fontSize: 9,
                  padding: "4px",
                  marginBottom: 2,
                  background: T.disp,
                  border: `1px solid ${T.btnBrd}`,
                  borderRadius: 4,
                  fontFamily: "Courier New, monospace",
                }}>
                  <div style={{ color: T.txt, opacity: 0.6 }}>{entry.time}</div>
                  <div style={{ color: T.txt }}>{entry.prev} {entry.op} {entry.cur} = {entry.result}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Help Window */}
      {showHelp && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          background: T.win,
          border: `2px solid ${T.btnBrd}`,
          borderRadius: 8,
          boxShadow: "8px 8px 24px rgba(0,0,0,0.5)",
          zIndex: 1002,
        }}>
          <div style={{
            background: T.titleBar,
            color: T.titleTxt,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>Caldim Calculates - Help</span>
            <button
              style={{ ...BS(T.clear), fontSize: 12, padding: "2px 6px" }}
              onClick={() => setShowHelp(false)}
            >✕</button>
          </div>
          <div style={{ padding: 16, maxHeight: 400, overflow: "auto" }}>
            <div style={{ fontSize: 12, color: T.txt, lineHeight: 1.6 }}>
              <h3 style={{ marginBottom: 8 }}>Quick Start Guide</h3>
              
              <p style={{ marginBottom: 8 }}>
                <strong>FIS Mode:</strong> Enter feet-inches-sixteenths using the number keys.
                Use the dot (•) button to separate feet, inches, and fractions.
              </p>
              
              <p style={{ marginBottom: 8 }}>
                <strong>Solvers:</strong> Click Solver menu to choose a solver.
                Click field labels, enter values, press → to send, then Run.
              </p>
              
              <p style={{ marginBottom: 8 }}>
                <strong>Memory:</strong> Use M+ to add, M- to subtract, MR to recall, MC to clear.
                Store menu provides 8 memory slots.
              </p>
              
              <p style={{ marginBottom: 8 }}>
                <strong>Tape:</strong> View calculation history via Tape menu.
              </p>
              
              <p>
                <strong>Themes:</strong> Change appearance in Settings menu.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* End Minimize wrapper */}
        </>
      )}
    </div>
  );
}
