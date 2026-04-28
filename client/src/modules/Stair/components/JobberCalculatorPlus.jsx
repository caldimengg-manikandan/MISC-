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

function fromUnits(raw, units) {
  const n = parseFloat(raw) || 0;
  if (units === "df") return n;
  if (units === "di" || units === "is") return n / 12;
  if (units === "mm") return n / 304.8;
  if (units === "m")  return n / 0.3048;
  return n; // fis handled separately
}

// ══════════════════════════════════════════════════════════════════════════════
// STAIR SOLVER
// ══════════════════════════════════════════════════════════════════════════════

function calcStairs(flfl, maxRiser, treadWidth) {
  if (flfl <= 0 || maxRiser <= 0 || treadWidth <= 0) return null;
  const numRisers = Math.ceil(flfl / maxRiser);
  const actRiser = flfl / numRisers;
  const numTreads = numRisers - 1;
  const run = numTreads * treadWidth;
  const nsns = treadWidth;
  const pitch = Math.atan(actRiser / treadWidth) * (180 / Math.PI);
  return { actRiser, numTreads, run, nsns, pitch };
}

// Right-triangle solver
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

export default function JobberCalcPlus() {
  // ── Calculator core state ─────────────────────────────────────────────────
  const [cur, setCur]         = useState(0);
  const [prev, setPrev]       = useState(null);
  const [pendOp, setPendOp]   = useState(null);
  const [entering, setEntering] = useState(false);
  const [segs, setSegs]       = useState(["", "", ""]);
  const [activeSeg, setActiveSeg] = useState(0); // 0=ft 1=inch 2=sx

  // ── Memory ────────────────────────────────────────────────────────────────
  const [mems, setMems] = useState(Array(8).fill(0));

  // ── Tape history ──────────────────────────────────────────────────────────
  const [tape, setTape] = useState(Array(20).fill(null));

  // ── Settings ──────────────────────────────────────────────────────────────
  const [units, setUnitsS]    = useState("fis");
  const [angMode, setAngMode] = useState("degrees");
  const [theme, setTheme]     = useState("windows");
  const [hideEst, setHideEst] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [openMenu, setOpenMenu]   = useState(null);
  const [openSub, setOpenSub]     = useState(null);
  const [solver, setSolver]       = useState("stair");
  const [shift, setShift]         = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [errMsg, setErrMsg]       = useState("No Error");

  // ── Stair fields ──────────────────────────────────────────────────────────
  const [stair, setStair] = useState({
    flfl:       0,
    maxRiser:   fisToFt(0, 7, 8),
    treadWidth: fisToFt(0, 11, 0),
    actRiser:   0,
    run:        0,
    nsns:       0,
    pitch:      0,
    numTreads:  0,
  });

  // ── Right-triangle fields ─────────────────────────────────────────────────
  const [rtri, setRtri] = useState({
    side_a: 0, side_b: 0, side_c: 0, angle_a: 0, angle_b: 0,
  });

  const T = THEMES[theme] || THEMES.windows;

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const closeMenus = () => { setOpenMenu(null); setOpenSub(null); };

  const getVal = useCallback(() => {
    if (!entering) return cur;
    if (units === "fis") return fisToFt(segs[0], segs[1], segs[2]);
    return fromUnits(segs[0], units);
  }, [entering, cur, segs, units]);

  const commitVal = useCallback(() => {
    const v = getVal();
    setCur(v);
    setEntering(false);
    return v;
  }, [getVal]);

  // ── Display string ────────────────────────────────────────────────────────
  const displayStr = (() => {
    if (!entering) return fmtVal(cur, units);
    if (units === "fis") {
      const ft   = parseInt(segs[0]) || 0;
      const inch = activeSeg >= 1 ? (parseInt(segs[1]) || 0) : 0;
      const sx   = activeSeg >= 2 ? (parseInt(segs[2]) || 0) : 0;
      const sxS  = activeSeg >= 2 ? ` ${sx}/16` : "";
      return `${ft}' - ${inch}${sxS}"`;
    }
    return segs[0] || "0";
  })();

  // ── Tape ──────────────────────────────────────────────────────────────────
  const addTape = (expr, result) =>
    setTape(prev => [{ expr, result }, ...prev].slice(0, 20).concat(Array(20).fill(null)).slice(0, 20));

  // ══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const digit = useCallback((d) => {
    setEntering(true);
    const s = units === "fis" ? activeSeg : 0;
    setSegs(prev => { const n = [...prev]; n[s] = (n[s] || "") + String(d); return n; });
  }, [activeSeg, units]);

  const dot = useCallback(() => {
    if (units === "fis") {
      if (activeSeg < 2) setActiveSeg(s => s + 1);
    } else {
      setEntering(true);
      setSegs(prev => {
        const n = [...prev];
        if (!n[0].includes(".")) n[0] = (n[0] || "0") + ".";
        return n;
      });
    }
  }, [activeSeg, units]);

  const clearEntry = useCallback((all) => {
    if (all || !entering) {
      setCur(0); setPrev(null); setPendOp(null); setErrMsg("No Error");
    }
    setEntering(false);
    setSegs(["", "", ""]);
    setActiveSeg(0);
  }, [entering]);

  // ── Operators ────────────────────────────────────────────────────────────

  function compute(a, op, b) {
    switch (op) {
      case "+":   return a + b;
      case "-":   return a - b;
      case "*":   return a * b;
      case "/":   return b !== 0 ? a / b : Infinity;
      case "rem": return a % b;
      case "**":  return Math.pow(a, b);
      default:    return b;
    }
  }
  const opSym = (o) => ({"+":"+", "-":"-", "*":"×", "/":"÷", "rem":"%", "**":"^"}[o] || o);

  const pressOp = useCallback((o) => {
    const v = entering ? commitVal() : cur;
    if (pendOp && prev !== null) {
      const r = compute(prev, pendOp, v);
      addTape(`${fmtVal(prev, units)} ${opSym(pendOp)} ${fmtVal(v, units)}`, fmtVal(r, units));
      setCur(r); setPrev(r);
    } else {
      setPrev(v);
    }
    setPendOp(o);
    setEntering(false); setSegs(["", "", ""]); setActiveSeg(0);
  }, [entering, commitVal, cur, pendOp, prev, units]);

  const pressEq = useCallback(() => {
    if (!pendOp) return;
    const v = entering ? commitVal() : cur;
    const r = compute(prev ?? 0, pendOp, v);
    addTape(`${fmtVal(prev ?? 0, units)} ${opSym(pendOp)} ${fmtVal(v, units)}`, fmtVal(r, units));
    setCur(r); setPrev(null); setPendOp(null);
    setEntering(false); setSegs(["", "", ""]); setActiveSeg(0);
    setErrMsg("No Error");
  }, [pendOp, entering, commitVal, cur, prev, units]);

  // ── Trig ──────────────────────────────────────────────────────────────────

  const pressTrig = useCallback((fn) => {
    const v = entering ? commitVal() : cur;
    const toRad = angMode === "degrees" ? v * Math.PI / 180 : v;
    let r;
    if (shift) {
      r = fn==="sin" ? Math.asin(v) : fn==="cos" ? Math.acos(v) : Math.atan(v);
      if (angMode === "degrees") r = r * 180 / Math.PI;
    } else {
      r = fn==="sin" ? Math.sin(toRad) : fn==="cos" ? Math.cos(toRad) : Math.tan(toRad);
    }
    setCur(r); setEntering(false); setShift(false);
  }, [entering, commitVal, cur, shift, angMode]);

  // ── Special ───────────────────────────────────────────────────────────────

  const pressSpecial = useCallback((fn) => {
    const v = entering ? commitVal() : cur;
    let r = v;
    if (fn === "sqrt") r = Math.sqrt(Math.abs(v));
    else if (fn === "neg") r = -v;
    else if (fn === "pi") r = Math.PI / 6; // π/6 foot as a useful constant
    else if (fn === "cy") r = v / 27; // cu ft → cu yd
    setCur(r); setEntering(false);
  }, [entering, commitVal, cur]);

  // ── Memory ────────────────────────────────────────────────────────────────

  const pressMemory = useCallback((op) => {
    const v = entering ? commitVal() : cur;
    if (op === "M+") setMems(m => { const n=[...m]; n[0]+=v; return n; });
    else if (op === "M-") setMems(m => { const n=[...m]; n[0]-=v; return n; });
    else if (op === "MR") { setCur(mems[0]); setEntering(false); }
    else if (op === "MC") setMems(m => { const n=[...m]; n[0]=0; return n; });
  }, [entering, commitVal, cur, mems]);

  // ── Solver ────────────────────────────────────────────────────────────────

  const sendToField = useCallback(() => {
    if (!activeField) return;
    const v = entering ? commitVal() : cur;
    if (solver === "stair") setStair(s => ({ ...s, [activeField]: v }));
    else if (solver === "right") setRtri(s => ({ ...s, [activeField]: v }));
  }, [activeField, entering, commitVal, cur, solver]);

  const runSolver = useCallback(() => {
    if (solver === "stair") {
      const res = calcStairs(stair.flfl, stair.maxRiser, stair.treadWidth);
      if (res) { setStair(s => ({ ...s, ...res })); setErrMsg("No Error"); }
      else setErrMsg("Input Error");
    } else if (solver === "right") {
      const res = calcRightTriangle(rtri);
      setRtri(res);
      setErrMsg("No Error");
    }
  }, [solver, stair, rtri]);

  const setUnits = useCallback((u) => {
    setUnitsS(u);
    setEntering(false); setSegs(["","",""]); setActiveSeg(0);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // STYLE FACTORIES
  // ══════════════════════════════════════════════════════════════════════════

  const BS = (color, extra) => ({
    background: color || T.btn,
    border: `1px outset ${T.btnBrd}`,
    color: T.txt,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    minHeight: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    padding: "1px 2px",
    boxSizing: "border-box",
    ...extra,
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MENU DATA
  // ══════════════════════════════════════════════════════════════════════════

  const menuData = {
    Edit: [
      { label: "Copy To Clipboard", action: () => navigator.clipboard?.writeText(displayStr).catch(()=>{}) },
      { label: "Ins", action: () => {} },
    ],
    Store: [
      ...mems.map((v, i) => ({
        label: `${i}--> ${v.toFixed(3)}`,
        action: () => { setMems(m => { const n=[...m]; n[i]=entering?getVal():cur; return n; }); setEntering(false); }
      })),
      { label: "Clear Memories", action: () => setMems(Array(8).fill(0)) },
    ],
    Recall: mems.map((v, i) => ({
      label: `${i}--> ${v.toFixed(3)}`,
      action: () => { setCur(v); setEntering(false); }
    })),
    Tape: tape.map((t, i) => ({
      label: t ? `${i+1}--> ${t.result}` : `${i+1}-->`,
      action: () => {}
    })),
    Solver: [
      { label: "Right Triangle",   checked: solver==="right",   action: () => setSolver("right") },
      { label: "Oblique Triangle", checked: solver==="oblique", action: () => setSolver("oblique") },
      { label: "Circle Solution",  checked: solver==="circle",  action: () => setSolver("circle") },
      { label: "Stair Solver",     checked: solver==="stair",   action: () => setSolver("stair") },
      { label: "Truss Solver",     checked: solver==="truss",   action: () => setSolver("truss") },
      { label: "Clear Solver",     action: () => {
        setStair({ flfl:0, maxRiser:fisToFt(0,7,8), treadWidth:fisToFt(0,11,0), actRiser:0, run:0, nsns:0, pitch:0, numTreads:0 });
        setRtri({ side_a:0, side_b:0, side_c:0, angle_a:0, angle_b:0 });
        setErrMsg("No Error");
      }},
    ],
  };

  const settingsData = {
    Units: [
      { label: "Feet Inches Sixteenths", checked: units==="fis", action: () => setUnits("fis") },
      { label: "Inches Sixteenths",      checked: units==="is",  action: () => setUnits("is") },
      { label: "Decimal Inches",         checked: units==="di",  action: () => setUnits("di") },
      { label: "Decimal Feet",           checked: units==="df",  action: () => setUnits("df") },
      { label: "Millimeters",            checked: units==="mm",  action: () => setUnits("mm") },
      { label: "Meters",                 checked: units==="m",   action: () => setUnits("m") },
    ],
    "Angular Mode": [
      { label: "Radians",         checked: angMode==="radians",  action: () => setAngMode("radians") },
      { label: "Decimal Degrees", checked: angMode==="degrees",  action: () => setAngMode("degrees") },
      { label: "D.M.S. (display)", checked: false, action: () => {} },
      { label: "D.M.S. (input)",   checked: false, action: () => {} },
    ],
    "Display Color": [
      { label: "High Contrast",          checked: theme==="highContrast",  action: () => setTheme("highContrast") },
      { label: "Pleasant Gray",          checked: theme==="pleasantGray",  action: () => setTheme("pleasantGray") },
      { label: "Windows Settings",       checked: theme==="windows",       action: () => setTheme("windows") },
      { label: "High Tech",              checked: theme==="highTech",      action: () => setTheme("highTech") },
      { label: "Custom Text Color",      action: () => {} },
      { label: "Custom Background Color",action: () => {} },
    ],
    "Visibility": [
      { label: "Full Size",           action: () => {} },
      { label: "Hide Solver Displays",action: () => {} },
      { label: "Hide Solver Buttons", action: () => {} },
      { label: "Hide Estimator",      checked: hideEst, action: () => setHideEst(v => !v) },
      { label: "Display Only",        action: () => {} },
    ],
    "Always On Top": null,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SOLVER PANEL FIELD COMPONENT
  // ══════════════════════════════════════════════════════════════════════════

  const SolverField = ({ label, fieldKey, value, format = "fis" }) => {
    const isActive = activeField === fieldKey;
    let display;
    if (format === "angle") display = typeof value === "number" ? `${value.toFixed(2)}°` : "0.00°";
    else if (format === "count") display = String(typeof value === "number" ? Math.round(value) : 0);
    else display = fmtFIS(value || 0);
    return (
      <div style={{ display: "flex", gap: 1, marginBottom: 1 }}>
        <button
          onClick={() => setActiveField(fieldKey)}
          style={{
            width: 72, fontSize: 10, fontWeight: 500, textAlign: "right",
            justifyContent: "flex-end", paddingRight: 4, cursor: "pointer",
            ...BS(isActive ? T.fieldActive : T.btn),
            color: isActive ? "#fff" : T.txt,
            minHeight: 18,
          }}
        >
          {label}
        </button>
        <div style={{
          width: 96, textAlign: "right", fontSize: 11, minHeight: 18,
          background: T.disp, border: `1px inset ${T.btnBrd}`,
          padding: "0 4px", fontFamily: "Courier New, monospace", color: T.txt,
          lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden",
        }}>
          {display}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MENU BAR RENDER HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const DropdownItems = ({ items }) => (
    <div style={{
      position: "absolute", top: "100%", left: 0,
      background: "#f5f5f5", border: "1px solid #aaa",
      zIndex: 300, minWidth: 170, boxShadow: "3px 3px 6px rgba(0,0,0,.25)",
      fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    }} onClick={e => e.stopPropagation()}>
      {items.map((item, idx) => (
        <div key={idx}
          onClick={() => { item.action(); closeMenus(); }}
          style={{ padding: "3px 8px 3px 6px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 12, color: "#000", gap: 2 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#0078d4"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#000"; }}
        >
          <span style={{ width: 14, textAlign: "center", fontSize: 10 }}>{item.checked ? "✓" : ""}</span>
          {item.label}
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ padding: "8px 0", display: "flex", justifyContent: "center",
      fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" }}>
      <div
        style={{
          width: 660, background: T.win,
          border: "2px outset #aaa",
          boxShadow: "4px 4px 10px rgba(0,0,0,.4)",
        }}
        onClick={() => openMenu && closeMenus()}
      >
        {/* ════════════════════════════════════════════════════════════════
            TITLE BAR
        ════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: T.titleBar, color: T.titleTxt,
          padding: "4px 8px", display: "flex",
          alignItems: "center", justifyContent: "space-between", fontSize: 13,
          userSelect: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15 }}>⚙</span>
            <strong style={{ fontWeight: 600 }}>Jobber Computer Plus</strong>
          </div>
          <div style={{ display: "flex", gap: 1 }}>
            {[["─", false], ["□", false], ["✕", true]].map(([s, bold]) => (
              <button key={s} style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.3)",
                color: T.titleTxt, cursor: "pointer",
                padding: "1px 6px", fontSize: 11, fontWeight: bold ? 700 : 400,
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MENU BAR
        ════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: T.win, borderBottom: `1px solid ${T.btnBrd}`,
          display: "flex", fontSize: 12, flexWrap: "wrap",
        }} onClick={e => e.stopPropagation()}>

          {/* Regular menus */}
          {Object.entries(menuData).map(([label, items]) => (
            <div key={label} style={{ position: "relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setOpenMenu(openMenu===label?null:label); setOpenSub(null); }}
                style={{
                  background: openMenu===label ? "#0078d4" : "transparent",
                  color: openMenu===label ? "#fff" : T.txt,
                  border: "none", padding: "3px 8px", cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit",
                }}
              >
                {label}
              </button>
              {openMenu===label && <DropdownItems items={items} />}
            </div>
          ))}

          {/* Settings (submenu) */}
          <div style={{ position: "relative" }}>
            <button
              onClick={e => { e.stopPropagation(); setOpenMenu(openMenu==="Settings"?null:"Settings"); setOpenSub(null); }}
              style={{
                background: openMenu==="Settings" ? "#0078d4" : "transparent",
                color: openMenu==="Settings" ? "#fff" : T.txt,
                border: "none", padding: "3px 8px", cursor: "pointer",
                fontSize: 12, fontFamily: "inherit",
              }}
            >
              Settings
            </button>
            {openMenu==="Settings" && (
              <div style={{
                position: "absolute", top: "100%", left: 0,
                background: "#f5f5f5", border: "1px solid #aaa",
                zIndex: 300, minWidth: 155, boxShadow: "3px 3px 6px rgba(0,0,0,.25)",
              }} onClick={e => e.stopPropagation()}>
                {Object.entries(settingsData).map(([key, items]) => (
                  <div key={key} style={{ position: "relative" }}
                    onMouseEnter={() => items && setOpenSub(key)}
                    onMouseLeave={() => setOpenSub(null)}
                  >
                    <div style={{
                      padding: "3px 4px 3px 20px", cursor: "pointer",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", fontSize: 12,
                      background: openSub===key ? "#0078d4" : "transparent",
                      color: openSub===key ? "#fff" : "#000",
                    }}
                      onClick={() => { if (!items) closeMenus(); }}
                    >
                      <span>{key}</span>
                      {items && <span style={{ fontSize: 9, paddingRight: 4 }}>▶</span>}
                    </div>
                    {openSub===key && items && (
                      <div style={{
                        position: "absolute", left: "100%", top: 0,
                        background: "#f5f5f5", border: "1px solid #aaa",
                        minWidth: 200, zIndex: 301, boxShadow: "3px 3px 6px rgba(0,0,0,.25)",
                      }}>
                        {items.map((item, idx) => (
                          <div key={idx}
                            onClick={() => { item.action(); closeMenus(); }}
                            style={{ padding: "3px 8px 3px 6px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 12, color: "#000", gap: 2 }}
                            onMouseEnter={e => { e.currentTarget.style.background="#0078d4"; e.currentTarget.style.color="#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background=""; e.currentTarget.style.color="#000"; }}
                          >
                            <span style={{ width: 14, textAlign: "center", fontSize: 10 }}>{item.checked ? "✓" : ""}</span>
                            {item.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <div style={{ position: "relative" }}>
            <button
              onClick={e => { e.stopPropagation(); setOpenMenu(openMenu==="Help"?null:"Help"); }}
              style={{
                background: openMenu==="Help" ? "#0078d4" : "transparent",
                color: openMenu==="Help" ? "#fff" : T.txt,
                border: "none", padding: "3px 8px", cursor: "pointer",
                fontSize: 12, fontFamily: "inherit",
              }}
            >
              Help
            </button>
            {openMenu==="Help" && (
              <div style={{
                position: "absolute", top: "100%", left: 0,
                background: "#f5f5f5", border: "1px solid #aaa",
                zIndex: 300, minWidth: 220, boxShadow: "3px 3px 6px rgba(0,0,0,.25)",
                padding: "6px 0",
              }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "3px 8px 3px 20px", fontSize: 12, color: "#000" }}>
                  Jobber Computer Plus — Replica
                </div>
                <div style={{ padding: "3px 8px 3px 20px", fontSize: 11, color: "#555" }}>
                  Construction/Contractor Calculator
                </div>
                <div style={{ borderTop: "1px solid #ccc", margin: "4px 0" }} />
                <div style={{ padding: "3px 8px 3px 20px", fontSize: 11, color: "#555" }}>
                  Feet · Inches · Sixteenths arithmetic
                </div>
                <div style={{ padding: "3px 8px 3px 20px", fontSize: 11, color: "#555" }}>
                  Stair solver, Triangle solver
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MAIN BODY
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", padding: 4, gap: 4 }}>

          {/* ── LEFT: Calculator ──────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── Main Display ── */}
            <div style={{
              background: T.disp, border: `2px inset ${T.btnBrd}`,
              marginBottom: 3, padding: "3px 6px 2px",
              minHeight: 50, display: "flex", flexDirection: "column",
            }}>
              <div style={{
                fontSize: 26, fontWeight: "bold", textAlign: "right",
                color: T.txt, fontFamily: "Courier New, Courier, monospace",
                letterSpacing: "0.01em", lineHeight: 1.2, minHeight: 32,
                overflow: "hidden", whiteSpace: "nowrap",
              }}>
                {displayStr}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 24, paddingLeft: 2 }}>
                  <span style={{ fontSize: 9, color: "#888", fontStyle: "italic" }}>feet</span>
                  <span style={{ fontSize: 9, color: "#888", fontStyle: "italic" }}>inches</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <button
                    style={{ ...BS(), padding: "0 4px", minHeight: 10, fontSize: 9, lineHeight: 1 }}
                    onClick={() => setCur(v => v + 1/192)}
                  >▲</button>
                  <button
                    style={{ ...BS(), padding: "0 4px", minHeight: 10, fontSize: 9, lineHeight: 1 }}
                    onClick={() => setCur(v => Math.max(0, v - 1/192))}
                  >▼</button>
                </div>
              </div>
            </div>

            {/* ── Button Grid (8 cols × 6 rows) ── */}
            {/*
              Col:  1      2      3   4   5    6     7    8
              R1:  ASIN   OFF   13  14  15  DEC   FIS   CS
              R2:  ACOS  SHIFT  10  11  12  MET   DEC  C/CE
              R3:  ATAN  [---]   7   8   9   √x   xʸ   +/-
              R4:  CY      •     4   5   6    ×   REM   [=]
              R5:  π       0     1   2   3    +    –    [=]
              R6:  👁     M+    M–  MR  MC   🔍   📐    ⛰
            */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gridTemplateRows: "repeat(6, 24px)",
              gap: 2,
            }}>
              {/* Row 1 */}
              <button style={BS(T.special)} onClick={() => pressTrig("sin")}>{shift?"SIN":"ASIN"}</button>
              <button style={BS()} onClick={() => clearEntry(true)}>OFF</button>
              <button style={BS()} onClick={() => digit(13)}>13</button>
              <button style={BS()} onClick={() => digit(14)}>14</button>
              <button style={BS()} onClick={() => digit(15)}>15</button>
              <button style={BS()} onClick={() => setUnits("df")}>DEC</button>
              <button style={BS()} onClick={() => setUnits("fis")}>FIS</button>
              <button style={BS()} onClick={() => {}}>CS</button>

              {/* Row 2 */}
              <button style={BS(T.special)} onClick={() => pressTrig("cos")}>{shift?"COS":"ACOS"}</button>
              <button style={BS(shift ? "#e8c830" : T.special, { color: shift?"#000":T.txt })} onClick={() => setShift(s => !s)}>SHIFT</button>
              <button style={BS()} onClick={() => digit(10)}>10</button>
              <button style={BS()} onClick={() => digit(11)}>11</button>
              <button style={BS()} onClick={() => digit(12)}>12</button>
              <button style={BS()} onClick={() => setUnits("m")}>MET</button>
              <button style={BS()} onClick={() => setUnits("di")}>DEC</button>
              <button style={BS(T.clear)} onClick={() => clearEntry(false)}>C/CE</button>

              {/* Row 3 */}
              <button style={BS(T.special)} onClick={() => pressTrig("tan")}>{shift?"TAN":"ATAN"}</button>
              <button style={{ ...BS(), opacity: 0.15, cursor: "default" }} disabled></button>
              <button style={BS()} onClick={() => digit(7)}>7</button>
              <button style={BS()} onClick={() => digit(8)}>8</button>
              <button style={BS()} onClick={() => digit(9)}>9</button>
              <button style={BS()} onClick={() => pressSpecial("sqrt")}>√x</button>
              <button style={BS()} onClick={() => pressOp("**")}>xʸ</button>
              <button style={BS()} onClick={() => pressSpecial("neg")}>+/-</button>

              {/* Row 4 */}
              <button style={BS(T.special)} onClick={() => pressSpecial("cy")}>CY</button>
              <button style={BS()} onClick={dot}>•</button>
              <button style={BS()} onClick={() => digit(4)}>4</button>
              <button style={BS()} onClick={() => digit(5)}>5</button>
              <button style={BS()} onClick={() => digit(6)}>6</button>
              <button style={BS()} onClick={() => pressOp("*")}>✕</button>
              <button style={BS()} onClick={() => pressOp("rem")}>REM</button>
              {/* = button spans rows 4–5 at col 8 */}
              <button
                style={{
                  ...BS(T.equals, { fontSize: 24, fontWeight: "bold" }),
                  gridRow: "span 2",
                  minHeight: 50,
                  borderWidth: "2px",
                }}
                onClick={pressEq}
              >=</button>

              {/* Row 5 */}
              <button style={BS(T.special)} onClick={() => pressSpecial("pi")}>π</button>
              <button style={BS()} onClick={() => digit(0)}>0</button>
              <button style={BS()} onClick={() => digit(1)}>1</button>
              <button style={BS()} onClick={() => digit(2)}>2</button>
              <button style={BS()} onClick={() => digit(3)}>3</button>
              <button style={BS()} onClick={() => pressOp("+")}>+</button>
              <button style={BS()} onClick={() => pressOp("-")}>–</button>
              {/* col 8 row 5: spanned by = above */}

              {/* Row 6 */}
              <button style={BS(T.special)} title="View" onClick={() => {}}>👁</button>
              <button style={BS()} onClick={() => pressMemory("M+")}>M+</button>
              <button style={BS()} onClick={() => pressMemory("M-")}>M–</button>
              <button style={BS()} onClick={() => pressMemory("MR")}>MR</button>
              <button style={BS()} onClick={() => pressMemory("MC")}>MC</button>
              <button style={BS()} title="Zoom" onClick={() => {}}>🔍</button>
              <button style={BS()} title="Solve" onClick={runSolver}>📐</button>
              <button style={BS()} title="Material" onClick={() => {}}>⛰</button>
            </div>

            {/* ── Estimator Status Bar ── */}
            {!hideEst && (
              <div style={{ marginTop: 3 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {["A = 0.00 sf", "T = 0.000 ft", "V = 0.00 cy"].map(s => (
                    <div key={s} style={{
                      flex: 1, background: T.disp, border: `1px inset ${T.btnBrd}`,
                      padding: "1px 4px", fontSize: 11, color: T.txt,
                      fontFamily: "Courier New, monospace",
                    }}>{s}</div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {["0.00 lb/cy", "0.00 lb", "$0.00/cy", "$0.00"].map(s => (
                    <div key={s} style={{
                      flex: 1, background: T.disp, border: `1px inset ${T.btnBrd}`,
                      padding: "1px 4px", fontSize: 11, color: T.txt,
                      fontFamily: "Courier New, monospace",
                    }}>{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Solver Panel ──────────────────────────────────── */}
          <div style={{ width: 178, flexShrink: 0 }}>

            {/* Top action row */}
            <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
              <button style={{ ...BS(), flex: 1, fontSize: 10 }} onClick={() => {}}>🖨</button>
              <button style={{ ...BS(T.equals), flex: 2, fontSize: 11, fontWeight: 700 }}
                onClick={sendToField} title="Send display value to selected field">→</button>
            </div>

            {/* ── Stair Solver ── */}
            {solver === "stair" && (<>
              <SolverField label="FL-FL"     fieldKey="flfl"       value={stair.flfl} />
              <SolverField label="Max Riser" fieldKey="maxRiser"   value={stair.maxRiser} />
              <SolverField label="Tr. Width" fieldKey="treadWidth" value={stair.treadWidth} />
              <SolverField label="Act.Riser" fieldKey="actRiser"   value={stair.actRiser} />

              <div style={{
                textAlign: "center", fontSize: 10, padding: "1px 4px", marginBottom: 1,
                background: errMsg==="No Error" ? T.statusOkBg : T.statusErrBg,
                color: errMsg==="No Error" ? T.statusOk : T.statusErr,
                border: `1px solid ${T.btnBrd}`,
              }}>{errMsg}</div>

              <SolverField label="Run"       fieldKey="run"        value={stair.run} />
              <SolverField label="NS-NS"     fieldKey="nsns"       value={stair.nsns} />

              <div style={{
                textAlign: "center", fontSize: 10, padding: "1px 4px", marginBottom: 1,
                background: errMsg==="No Error" ? T.statusOkBg : T.statusErrBg,
                color: errMsg==="No Error" ? T.statusOk : T.statusErr,
                border: `1px solid ${T.btnBrd}`,
              }}>{errMsg}</div>

              <SolverField label="Pitch"     fieldKey="pitch"      value={stair.pitch}     format="angle" />
              <SolverField label="# Tread"   fieldKey="numTreads"  value={stair.numTreads} format="count" />

              <button style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
                onClick={runSolver}>
                Run
              </button>

              <div style={{ marginTop: 3, fontSize: 9, color: T.txt, opacity: 0.6, lineHeight: 1.4 }}>
                1. Click a field label to select<br/>
                2. Type value in calculator<br/>
                3. Press → to send, then Run
              </div>
            </>)}

            {/* ── Right Triangle Solver ── */}
            {solver === "right" && (<>
              <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Right Triangle</div>
              <SolverField label="Side A"   fieldKey="side_a"  value={rtri.side_a} />
              <SolverField label="Side B"   fieldKey="side_b"  value={rtri.side_b} />
              <SolverField label="Side C"   fieldKey="side_c"  value={rtri.side_c} />
              <SolverField label="Angle A"  fieldKey="angle_a" value={rtri.angle_a} format="angle" />
              <SolverField label="Angle B"  fieldKey="angle_b" value={rtri.angle_b} format="angle" />
              <button style={{ ...BS(T.active, { color: "#fff" }), width: "100%", marginTop: 3, minHeight: 22, fontSize: 12 }}
                onClick={runSolver}>Run</button>
            </>)}

            {/* ── Circle Solver ── */}
            {solver === "circle" && (<>
              <div style={{ fontSize: 10, color: T.txt, marginBottom: 3, fontWeight: 600 }}>Circle Solution</div>
              <div style={{ fontSize: 10, color: T.txt, opacity: 0.7 }}>
                Enter radius in main calculator, then Run
              </div>
              <div style={{ display: "flex", gap: 1, marginTop: 4, flexDirection: "column" }}>
                {[
                  { l: "Radius",        v: fmtFIS(cur) },
                  { l: "Diameter",      v: fmtFIS(cur*2) },
                  { l: "Circumference", v: fmtFIS(cur*2*Math.PI) },
                  { l: "Area",          v: `${(cur*cur*Math.PI).toFixed(4)} sf` },
                ].map(({l,v}) => (
                  <div key={l} style={{ display: "flex", gap: 1 }}>
                    <div style={{ ...BS(), width: 80, fontSize: 9, justifyContent: "flex-end", paddingRight: 3, cursor: "default" }}>{l}</div>
                    <div style={{ flex: 1, background: T.disp, border: `1px inset ${T.btnBrd}`, fontSize: 10, padding: "1px 3px", color: T.txt, fontFamily: "Courier New, monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </>)}

            {/* ── Other solvers placeholder ── */}
            {(solver === "oblique" || solver === "truss") && (
              <div style={{ fontSize: 10, color: T.txt, opacity: 0.6, padding: 4 }}>
                {solver === "oblique" ? "Oblique Triangle" : "Truss Solver"}<br/>
                <span style={{ opacity: 0.5 }}>Use menu to switch solver</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

