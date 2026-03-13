import React, { useState, useMemo } from "react";

/**
 * TreadStringerVisualizer
 *
 * Props:
 *  - calculatedGeometry: {
 *      horizontal, vertical, risers, riserHeight, treadDepth, stringerLength, angle, twoRPlusT
 *    }
 *  - scale: pixels per inch (optional, default 1)
 *  - formatFn: (val) => string (optional) - e.g. inchesToFeetInchesFraction
 *
 * Usage:
 *  <TreadStringerVisualizer
 *    calculatedGeometry={calculatedGeometry}
 *    scale={1}
 *    formatFn={inchesToFeetInchesFraction}
 *  />
 */

const TabButton = ({ name, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
      active ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    {name}
  </button>
);

const Tooltip = ({ x, y, children }) => (
  <div
    className="absolute pointer-events-none z-50 bg-black text-white text-xs px-2 py-1 rounded shadow"
    style={{ left: x + 8, top: y - 8, transform: "translate(0, -100%)" }}
  >
    {children}
  </div>
);

const defaultFormat = (v) => (v || v === 0 ? `${Number(v).toFixed(2)}"` : "-");

/* ------------------------------
   Main Component
   ------------------------------ */
export default function TreadStringerVisualizer({
  calculatedGeometry = {},
  scale = 1,
  formatFn = defaultFormat,
}) {
  const [activeTab, setActiveTab] = useState("Tread");
  const [tooltip, setTooltip] = useState(null); // {x,y,content}

  const {
    horizontal = 0,
    vertical = 0,
    risers = 0,
    riserHeight = 0,
    treadDepth = 0,
    stringerLength = 0,
    angle = 0,
    twoRPlusT = 0,
  } = calculatedGeometry || {};

  // derived safe values
  const safeTread = risers > 1 && horizontal > 0 ? horizontal / Math.max(1, risers - 1) : 0;
  const R = riserHeight || (risers > 0 ? vertical / risers : 0);
  const T = treadDepth || safeTread;
  const pxScale = Math.max(0.2, Math.min(1.2, scale)); // visual scaling clamp

  // memoize some drawing sizes
  const svgW = Math.min(720, (horizontal || 120) * pxScale + 220);
  const svgH = 240;

  const clearTooltip = () => setTooltip(null);

  // small helper for tooltip handlers
  const showTooltip = (e, content) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, content });
  };

  /* ------------------------------
     Small shared defs for arrow marker
     ------------------------------ */
  const ArrowDefs = () => (
    <defs>
      <marker id="tsv-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#1f2937" />
      </marker>
    </defs>
  );

  /* ------------------------------
     Tab content renderers
     ------------------------------ */

  const TreadTab = () => {
    // draw one riser+tread to demonstrate
    const originX = 80;
    const originY = svgH - 60;
    const drawR = R * pxScale;
    const drawT = T * pxScale;

    return (
      <div className="relative">
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <ArrowDefs />

          {/* baseline */}
          <line x1={20} y1={originY} x2={svgW - 20} y2={originY} stroke="#e5e7eb" strokeWidth="2" />

          {/* one riser (rectangle) */}
          <rect
            x={originX}
            y={originY - drawR}
            width={12}
            height={drawR}
            fill="#374151"
            className="transition-all duration-400"
            onMouseEnter={(e) =>
              showTooltip(e, `Riser (R) = ${formatFn(R)}\nCalculated: total rise / risers`)
            }
            onMouseLeave={clearTooltip}
          />

          {/* tread */}
          <rect
            x={originX + 12}
            y={originY - drawR}
            width={Math.max(8, drawT)}
            height={8}
            fill="#4b5563"
            className="transition-all duration-400"
            onMouseEnter={(e) => showTooltip(e, `Tread (T) = ${formatFn(T)}\nT = TotalRun / (Risers - 1)`)}
            onMouseLeave={clearTooltip}
          />

          {/* ellipsis to indicate more steps */}
          <text x={originX + 12 + Math.max(8, drawT) + 14} y={originY - drawR + 12} fontSize="18" fill="#6b7280">
            …
          </text>

          {/* R arrow */}
          <line
            x1={originX - 8}
            y1={originY}
            x2={originX - 8}
            y2={originY - drawR}
            stroke="#111827"
            strokeWidth="1.4"
            markerEnd="url(#tsv-arrow)"
            onMouseEnter={(e) => showTooltip(e, `R = ${formatFn(R)}`)}
            onMouseLeave={clearTooltip}
            className="cursor-pointer"
          />
          <text x={originX - 16} y={originY - drawR / 2} fontSize="12" fill="#111827" textAnchor="middle">
            R
          </text>

          {/* T arrow */}
          <line
            x1={originX + 16}
            y1={originY + 18}
            x2={originX + 16 + drawT}
            y2={originY + 18}
            stroke="#111827"
            strokeWidth="1.4"
            markerEnd="url(#tsv-arrow)"
            onMouseEnter={(e) => showTooltip(e, `T = ${formatFn(T)}`)}
            onMouseLeave={clearTooltip}
            className="cursor-pointer"
          />
          <text x={originX + 16 + drawT / 2} y={originY + 32} fontSize="12" fill="#111827" textAnchor="middle">
            T
          </text>

          {/* 2R+T info box */}
          <rect x={svgW - 220} y={18} width={200} height={50} rx={10} fill="#f8fafc" stroke="#e6eef9" />
          <text x={svgW - 120} y={40} fontSize="14" fill="#0f172a" textAnchor="middle" fontWeight="700">
            2R + T = {formatFn(twoRPlusT)}
          </text>
          <text x={svgW - 120} y={56} fontSize="11" fill="#334155" textAnchor="middle">
            ideal ≈ 24–25"
          </text>
        </svg>

        <div className="mt-2 text-xs text-gray-600">
          Formula: <code className="bg-gray-100 px-1 rounded">T = Total Run / (Risers - 1)</code>
          &nbsp; — Hover elements to see calculations.
        </div>
      </div>
    );
  };

  const StringerTab = () => {
    // small visualization: hypotenuse between rise/run
    const originX = 60;
    const originY = svgH - 60;
    const drawH = horizontal * pxScale;
    const drawV = vertical * pxScale;

    // endpoints
    const x2 = originX + drawH;
    const y2 = originY - drawV;

    return (
      <div className="relative">
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <ArrowDefs />

          {/* baseline and vertical */}
          <line x1={originX} y1={originY} x2={x2} y2={originY} stroke="#e6eef9" strokeWidth="2" />
          <line x1={x2} y1={originY} x2={x2} y2={y2} stroke="#e6eef9" strokeWidth="2" />

          {/* stringer (hypotenuse) */}
          <line
            x1={originX}
            y1={originY}
            x2={x2}
            y2={y2}
            stroke="url(#sg-grad)"
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-700"
            onMouseEnter={(e) => showTooltip(e, `Stringer Length = ${formatFn(stringerLength)}\n√(H²+V²)`)}
            onMouseLeave={clearTooltip}
          />
          <defs>
            <linearGradient id="sg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* labels */}
          <text x={(originX + x2) / 2} y={(originY + y2) / 2 - 10} fontSize="12" fill="#0f172a" textAnchor="middle">
            L = {formatFn(stringerLength)}
          </text>

          {/* arrow markers for H and V */}
          <line
            x1={originX}
            y1={originY + 16}
            x2={x2}
            y2={originY + 16}
            stroke="#0f172a"
            strokeWidth="1.2"
            markerEnd="url(#tsv-arrow)"
            onMouseEnter={(e) => showTooltip(e, `Horizontal (H) = ${formatFn(horizontal)}`)}
            onMouseLeave={clearTooltip}
          />
          <line
            x1={x2 + 16}
            y1={originY}
            x2={x2 + 16}
            y2={y2}
            stroke="#0f172a"
            strokeWidth="1.2"
            markerEnd="url(#tsv-arrow)"
            onMouseEnter={(e) => showTooltip(e, `Vertical (V) = ${formatFn(vertical)}`)}
            onMouseLeave={clearTooltip}
          />
        </svg>

        <div className="mt-2 text-xs text-gray-600">
          Stringer length L = √(H² + V²). Hover the stringer to see numeric value.
        </div>
      </div>
    );
  };

  const AngleTab = () => {
    const originX = 70;
    const originY = svgH - 60;
    const drawH = Math.max(20, horizontal * pxScale);
    const drawV = Math.max(10, vertical * pxScale);
    const angleText = `${Number(angle).toFixed(1)}°`;

    return (
      <div className="relative">
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <ArrowDefs />

          {/* right triangle */}
          <line x1={originX} y1={originY} x2={originX + drawH} y2={originY} stroke="#e5e7eb" strokeWidth="2" />
          <line x1={originX + drawH} y1={originY} x2={originX + drawH} y2={originY - drawV} stroke="#e5e7eb" strokeWidth="2" />
          <line
            x1={originX} y1={originY} x2={originX + drawH} y2={originY - drawV}
            stroke="#ea580c"
            strokeWidth="4"
            onMouseEnter={(e) => showTooltip(e, `Angle θ = ${angleText}\natan(V/H)`) }
            onMouseLeave={clearTooltip}
          />

          {/* angle arc */}
          <path
            d={`M ${originX + 26} ${originY - 2} A 26 26 0 0 1 ${originX + 26 + 18 * Math.cos((angle * Math.PI) / 180)} ${originY - 2 - 18 * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke="#ea580c"
            strokeWidth="2"
            className="transition-all duration-500"
          />
          <text x={originX + drawH / 2} y={originY - drawV / 2 - 10} fontSize="12" fill="#0f172a" textAnchor="middle">
            θ = {angleText}
          </text>
        </svg>

        <div className="mt-2 text-xs text-gray-600">
          Angle θ = atan(V / H) (converted to degrees). Hover the orange line to see value.
        </div>
      </div>
    );
  };

  const RatioTab = () => {
    // simple bar showing contributions 2R and T
    const boxW = 320;
    const barMax = Math.max(1, twoRPlusT);
    const scaleX = (val) => (val / barMax) * boxW;

    return (
      <div className="relative">
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <ArrowDefs />

          {/* info box */}
          <rect x={40} y={40} width={svgW - 120} height={120} rx={12} fill="#f8fafc" stroke="#e6eef9" />

          {/* bar representing 2R and T */}
          <g transform={`translate(60, 80)`}>
            <text x={0} y={-12} fontSize="13" fill="#0f172a" fontWeight="700">2R + T = {formatFn(twoRPlusT)}</text>

            {/* 2R portion */}
            <rect
              x={0}
              y={10}
              rx={6}
              width={scaleX(2 * R)}
              height={24}
              fill="#60a5fa"
              onMouseEnter={(e) => showTooltip(e, `2R = ${formatFn(2 * R)}`)}
              onMouseLeave={clearTooltip}
            />
            {/* T portion */}
            <rect
              x={scaleX(2 * R)}
              y={10}
              rx={6}
              width={scaleX(T)}
              height={24}
              fill="#34d399"
              onMouseEnter={(e) => showTooltip(e, `T = ${formatFn(T)}`)}
              onMouseLeave={clearTooltip}
            />

            <text x={0} y={60} fontSize="12" fill="#334155">
              Ideal range: 24–25" (comfortable stair). Use this panel to check ergonomics.
            </text>
          </g>
        </svg>
      </div>
    );
  };

  const tabs = {
    Tread: TreadTab,
    Stringer: StringerTab,
    Angle: AngleTab,
    "2R + T": RatioTab,
  };

  const ActiveContent = tabs[activeTab];

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {Object.keys(tabs).map((t) => (
            <TabButton key={t} name={t} active={activeTab === t} onClick={() => setActiveTab(t)} />
          ))}
        </div>

        <div className="text-xs text-gray-500">Interactive visuals — hover to inspect</div>
      </div>

      <div className="min-h-[280px]">
        <ActiveContent />
      </div>

      {/* tooltip overlay - positioned absolute in the page */}
      {tooltip && (
        <div style={{ position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -120%)" }} className="pointer-events-none z-50">
          <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-pre-line">
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
}
