import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, ArrowLeft, Loader2, BarChart2, CheckCircle, 
  Building2, User, DollarSign, Layers, Ruler, Package, Zap 
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

/**
 * EstimateReport now includes the modern "Reports Dashboard" layout 
 * as the first section, followed by the traditional "Miscellaneous Metal Final Estimate Form".
 */
export default function EstimateReport({ data, onBack }) {
  const printRef = useRef();
  const [config, setConfig] = useState({
    steel_price_per_lb: 0.75,
    shop_hourly_rate: 70.00,
    field_hourly_rate: 70.00,
    tax_rate: 0.06,
    galvanize_rate: 0.10,
    scrap_markup: 0.11,
    powder_coat_rate: 1.75,
    anchor_bolt_rate: 0.025,
    embedded_post_rate: 5.00,
    anchored_post_rate: 6.00
  });
  const [fetchingConfig, setFetchingConfig] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const token = localStorage.getItem('steel_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.success) setConfig(d.data);
      } catch (e) {
        console.error("Failed to fetch report pricing config", e);
      } finally {
        setFetchingConfig(false);
      }
    }
    fetchPricing();
  }, []);

  if (!data || !data.summary) {
    return (
      <div className="p-8 text-center bg-slate-50 min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 inline-block">
          <p className="text-slate-600 font-medium">No calculation data available.</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { projectData = {}, summary = {}, stairs = [], rails = [], platforms = [], rawStairs = [], additionalCosts = null } = data;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const todayLong = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Formatting helpers
  const fmtDollar = (v) => v ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  const fmtNum = (v, d = 2) => (v !== undefined && v !== null) ? v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

  // Pull directly from summary to ensure total parity
  const steelWeight = summary.baseSteelWeight || 0;
  const scrapWeight = summary.scrapWeight || (steelWeight * (config.scrap_markup || 0.11)); 
  const shopHours = summary.totalShopHours || 0;
  const fieldHours = summary.totalFieldHours || 0;
  const galvShopHrsTotal = summary.totalGalvanizeShopHours || 0;
  const galvFieldHrsTotal = summary.totalGalvanizeFieldHours || 0;

  const steelPriceRaw = summary.baseSteelCost || 0;
  const scrapPriceRaw = summary.scrapWeightCost || 0;
  const shopLaborPrice = summary.shopLaborCost || 0;
  const fieldLaborPrice = summary.fieldLaborCost || 0;

  const pansPrice = summary.pansMaterialPrice || 0;
  const gratingPrice = summary.gratingPrice || summary.gratingCost || 0;
  const galvanizePrice = summary.galvanizeCost || 0;
  const anchorBoltsPrice = summary.anchorBoltsCost || 0;
  const porRokPrice = summary.porRokAnchorsCost || 0;
  const mountingCharges = summary.mountingCharges || 0;

  const totalMaterialPrice = steelPriceRaw + pansPrice + gratingPrice + galvanizePrice + mountingCharges;
  const subTotalWithoutTax = summary.subtotalWithoutTax || 0;
  const salesTaxValue = summary.taxAmount || 0;
  const grandTotalValue = summary.grandTotal || 0;

  const handlePrint = () => window.print();

  // Modern UI Components
  const ModernStatTile = ({ label, value, sub, color = '#10a37f' }) => (
    <div className="modern-stat-tile">
      <div className="modern-stat-value" style={{ color }}>{value}</div>
      <div className="modern-stat-label">{label}</div>
      {sub && <div className="modern-stat-sub">{sub}</div>}
    </div>
  );

  const ModernRatePill = ({ label, value }) => (
    <div className="modern-rate-pill">
      <span className="modern-rate-label">{label}</span>
      <span className="modern-rate-value">{value}</span>
    </div>
  );

  const ModernMetaRow = ({ label, value, highlight }) => (
    <div className="modern-meta-row">
      <span className="modern-meta-label">{label}</span>
      <span className={`modern-meta-value ${highlight ? 'highlight' : ''}`}>{value || '—'}</span>
    </div>
  );

  const CurrencyCell = ({ value, isZero = false, color = "#f59e0b" }) => (
    <div className="flex justify-between items-center w-full h-full px-2">
      <span style={{ color: color, fontWeight: 900 }}>$</span>
      <span style={{ color: isZero && value <= 0 ? "#94a3b8" : color, fontWeight: 700 }}>
        {value === 0 ? "-" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );

  return (
    <div className="report-container min-h-screen bg-slate-100 p-8 font-sans">
      {/* Toolbar */}
      <div className="no-print max-w-[1100px] mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold transition-all">
          <ArrowLeft size={18} /> Back to Estimation
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]">
            <Printer size={18} /> Print All Sections (PDF)
          </button>
        </div>
      </div>

      {/* ── SECTION 1: MODERN REPORT DASHBOARD ── */}
      <div className="report-paper bg-white mx-auto shadow-2xl mb-12 overflow-hidden" style={{ width: '1056px', minHeight: '816px', padding: '40px' }}>
        
        {/* Project Header Table */}
        <div className="mb-8 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-center mb-4">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Estimation Report</span>
               <h1 className="text-[28px] font-black text-slate-900 leading-tight">{projectData.projectName}</h1>
             </div>
             <div className="text-right">
               <div className="text-[12px] font-bold text-slate-800">Generated: {todayLong}</div>
               <div className="text-[11px] text-slate-500 font-medium">Ref: {projectData.projectNumber}</div>
             </div>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="py-2 pr-4 border-t border-slate-200 w-1/4">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Customer</span>
                  <span className="text-[13px] font-bold text-slate-800">{projectData.customerName || '—'}</span>
                </td>
                <td className="py-2 pr-4 border-t border-slate-200 w-1/4">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Project Location</span>
                  <span className="text-[13px] font-bold text-slate-800">{projectData.projectLocation || '—'}</span>
                </td>
                <td className="py-2 pr-4 border-t border-slate-200 w-1/4">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">AISC Certified</span>
                  <span className="text-[13px] font-bold text-emerald-600">Yes</span>
                </td>
                <td className="py-2 border-t border-slate-200 w-1/4">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Units</span>
                  <span className="text-[13px] font-bold text-slate-800">Imperial</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modern Stats Strip */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          <ModernStatTile label="Grand Total" value={fmtDollar(grandTotalValue)} color="#10a37f" />
          <ModernStatTile label="Total Risers" value={summary.totalRisers || '—'} sub="across all stairs" />
          <ModernStatTile label="Price / Riser" value={fmtDollar(summary.pricePerRiser)} color="#6366f1" />
          <ModernStatTile label="Total Steel lbs" value={fmtNum((steelWeight + scrapWeight), 0)} sub="incl. scrap" />
          <ModernStatTile label="Shop Hours" value={fmtNum(shopHours, 1)} sub="total MH" color="#f59e0b" />
          <ModernStatTile label="Field Hours" value={fmtNum(fieldHours, 1)} sub="total MH" color="#ec4899" />
        </div>

        {/* Header & Rates */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="modern-card">
            <div className="modern-section-header"><Building2 size={16} /> 1 — Report Header</div>
            <div className="modern-meta-grid">
              <ModernMetaRow label="Project Number" value={projectData.projectNumber} />
              <ModernMetaRow label="Project Name" value={projectData.projectName} />
              <ModernMetaRow label="Customer" value={projectData.customerName} />
              <ModernMetaRow label="Project Location" value={projectData.projectLocation} />
              <ModernMetaRow label="Status" value="Draft" />
              <ModernMetaRow label="AISC Certified" value="Yes" highlight />
              <ModernMetaRow label="Units" value="Imperial" />
            </div>
          </div>

          <div className="modern-card">
            <div className="modern-section-header"><DollarSign size={16} /> 2 — Rates Used</div>
            <p className="text-[11px] text-slate-500 mb-3 ml-1">Configuration active at time of estimate generation</p>
            <div className="grid grid-cols-2 gap-2">
              <ModernRatePill label="Steel $/lb" value={`$${(config.steel_price_per_lb || 0).toFixed(4)}`} />
              <ModernRatePill label="Shop $/hr" value={`$${(config.shop_hourly_rate || 0).toFixed(2)}`} />
              <ModernRatePill label="Field $/hr" value={`$${(config.field_hourly_rate || 0).toFixed(2)}`} />
              <ModernRatePill label="Galvanize $/lb" value={`$${(config.galvanize_rate || 0).toFixed(4)}`} />
              <ModernRatePill label="Scrap %" value={`${((config.scrap_markup || 0) * 100).toFixed(1)}%`} />
              <ModernRatePill label="Tax %" value={`${((config.tax_rate || 0) * 100).toFixed(2)}%`} />
              <ModernRatePill label="Anchor Rate" value={`$${(config.anchor_bolt_rate || 0).toFixed(4)}/lb`} />
              <ModernRatePill label="Anchored Rate" value={`$${(config.anchored_post_rate || 0).toFixed(2)}/post`} />
            </div>
          </div>
        </div>

        {/* Project Summary Table */}
        <div className="modern-card">
          <div className="modern-section-header"><BarChart2 size={16} /> 3 — Project Summary</div>
          <table className="modern-summary-table">
            <thead>
              <tr>
                <th>Line Item</th>
                <th className="text-right">Stair</th>
                <th className="text-right">Rail</th>
                <th className="text-right">Platform</th>
                <th className="text-right total-col">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Steel lbs (base)</td>
                <td className="text-right">{fmtNum(summary.stairSteelLbs || 0, 0)}</td>
                <td className="text-right">{fmtNum(summary.railSteelLbs || 0, 0)}</td>
                <td className="text-right">{fmtNum(summary.platSteelLbs || 0, 0)}</td>
                <td className="text-right total-col">{fmtNum(steelWeight, 0)}</td>
              </tr>
              <tr>
                <td>Scrap lbs</td>
                <td colSpan={3} className="text-center text-slate-300">—</td>
                <td className="text-right total-col warn">{fmtNum(scrapWeight, 0)}</td>
              </tr>
              <tr>
                <td>Steel cost</td>
                <td colSpan={3} className="text-center text-slate-300">—</td>
                <td className="text-right total-col">{fmtDollar(steelPriceRaw)}</td>
              </tr>
              <tr>
                <td>Pans / Grating cost</td>
                <td className="text-right">{fmtDollar(pansPrice + gratingPrice)}</td>
                <td className="text-right">—</td>
                <td className="text-right">—</td>
                <td className="text-right total-col">{fmtDollar(pansPrice + gratingPrice)}</td>
              </tr>
              <tr className="font-bold border-t-2 border-slate-200">
                <td>Module sub-total</td>
                <td className="text-right">{fmtDollar(summary.stairTotal || 0)}</td>
                <td className="text-right">{fmtDollar(summary.railTotal || 0)}</td>
                <td className="text-right">{fmtDollar(summary.platTotal || 0)}</td>
                <td className="text-right total-col">{fmtDollar(summary.stairTotal + summary.railTotal + summary.platTotal)}</td>
              </tr>
              <tr className="bg-slate-50 italic">
                <td className="font-bold">Grand Total</td>
                <td colSpan={3} className="text-center text-slate-300">—</td>
                <td className="text-right total-col hero-total">{fmtDollar(grandTotalValue)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 flex gap-6 text-[12px]">
              <div className="flex items-center gap-2 text-slate-600"><Layers size={14} className="text-emerald-600" /> <strong>{rawStairs.length}</strong> stair assemblies</div>
              <div className="flex items-center gap-2 text-slate-600"><Ruler size={14} className="text-indigo-600" /> <strong>{summary.railCount || rails.length}</strong> rail sections</div>
              <div className="flex items-center gap-2 text-slate-600"><Package size={14} className="text-amber-600" /> <strong>{platforms.length}</strong> landing assemblies</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: OFFICIAL MISC METAL FORM ── */}
      <div ref={printRef} className="report-paper bg-white mx-auto shadow-2xl overflow-hidden relative" style={{ width: '1056px', minHeight: '816px', padding: '20px', pageBreakBefore: 'always' }}>
        
        {/* Section 2 Title (Compact) */}
        <div className="border-b-2 border-slate-900 mb-6 flex justify-between items-end pb-1">
          <h2 className="text-[20px] font-bold uppercase tracking-tight">Miscellaneous Metal Final Estimate Form</h2>
          <span className="text-[12px] font-medium text-slate-500">Official Fabrication Breakdown</span>
        </div>

        {/* Main Grid and Totals Section Grouped */}
        <div className="summary-group" style={{ breakInside: 'avoid' }}>
          {/* Main Grid Section */}
          <div className="w-full">
            <div className="overflow-hidden">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-white">
                    <th className="w-[180px]"></th>
                    <th className="w-[150px]"></th>
                    <th className="border border-slate-400 p-2 text-[10px] font-bold uppercase text-center bg-slate-100">Galvanize<br/>Shop<br/>Hours/ LF</th>
                    <th className="border border-slate-400 p-2 text-[10px] font-bold uppercase text-center bg-slate-100">Galvanize<br/>Field<br/>Hours/ LF</th>
                    <th className="border border-slate-400 p-2 text-[10px] font-bold uppercase text-center bg-slate-200">STEEL (+10%<br/>SCRAP) LBS</th>
                    <th className="border border-slate-400 p-2 text-[10px] font-bold uppercase text-center bg-slate-200">SHOP HOURS</th>
                    <th className="border border-slate-400 p-2 text-[10px] font-bold uppercase text-center bg-slate-200">FIELD HOURS</th>
                  </tr>
                  <tr>
                    <th colSpan={2}></th>
                    <th className="border border-slate-400 p-2 text-[11px] font-bold uppercase text-center bg-slate-100">Steel lbs</th>
                    <th className="bg-white" colSpan={4}></th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {/* SUB TOTAL ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold bg-white">SUB TOTAL</td>
                    <td className="border border-slate-400 text-center font-bold bg-slate-50">{steelWeight.toFixed(3)}</td>
                    <td className="border border-slate-400 text-center font-bold text-[#f59e0b] bg-slate-50">{galvShopHrsTotal.toFixed(3)}</td>
                    <td className="border border-slate-400 text-center font-bold text-[#f59e0b] bg-slate-50">{galvFieldHrsTotal.toFixed(3)}</td>
                    <td className="border border-slate-400 text-center font-bold bg-slate-50">{scrapWeight.toFixed(3)}</td>
                    <td className="border border-slate-400 text-center font-bold bg-slate-50">{shopHours.toFixed(2)}</td>
                    <td className="border border-slate-400 text-center font-bold bg-slate-50">{fieldHours.toFixed(2)}</td>
                  </tr>
                  {/* STEEL PRICE ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">STEEL PRICE</td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={steelPriceRaw} />
                    </td>
                    <td className="border border-slate-400" />
                    <td className="border border-slate-400" />
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={scrapPriceRaw} />
                    </td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={shopLaborPrice} />
                    </td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={fieldLaborPrice} />
                    </td>
                  </tr>
                  {/* STAIR PANS ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">Stair Pans TOTAL PRICE</td>
                    <td className="border border-slate-400 text-center font-bold text-[#f59e0b] px-2">{pansPrice === 0 ? "0" : pansPrice.toFixed(2)}</td>
                    <td className="border border-slate-400" colSpan={5} />
                  </tr>
                  {/* STAIR GRATING ROW */}
                  <tr className="h-10">
                    <td className="p-0 border border-slate-400">
                      <div className="flex h-full">
                        <div className={`font-bold px-4 py-1 border-r border-slate-400 flex items-center ${gratingPrice > 0 ? 'bg-[#CCF2D1] text-[#166534]' : 'bg-slate-100 text-slate-400'}`}>{gratingPrice > 0 ? 'Yes' : 'No'}</div>
                        <div className="flex-grow px-2 py-1 text-right font-bold uppercase flex items-center justify-end text-[10px]">Stair Grating</div>
                      </div>
                    </td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={gratingPrice} isZero={gratingPrice === 0} />
                    </td>
                    <td colSpan={5} className="border border-slate-400" />
                  </tr>
                  {/* GALVANIZE ROW */}
                  <tr className="h-10">
                    <td className="p-0 border border-slate-400">
                      <div className="flex h-full">
                        <div className={`font-bold px-4 py-1 border-r border-slate-400 flex items-center ${galvanizePrice > 0 ? 'bg-[#CCF2D1] text-[#166534]' : 'bg-slate-100 text-slate-400'}`}>{galvanizePrice > 0 ? 'Yes' : 'No'}</div>
                        <div className="flex-grow px-2 py-1 text-right font-bold uppercase flex items-center justify-end text-[#166534]">Galvanize</div>
                      </div>
                    </td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={galvanizePrice} />
                    </td>
                    <td colSpan={5} className="border border-slate-400" />
                  </tr>
                  {/* ANCHOR BOLTS ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">Anchor Bolts</td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={anchorBoltsPrice} />
                    </td>
                    <td colSpan={5} className="border border-slate-400" />
                  </tr>
                  {/* POR ROK ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">POR ROK ANCHORS</td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={porRokPrice} />
                    </td>
                    <td colSpan={5} className="border border-slate-400" />
                  </tr>
                  {/* MOUNTING CHARGES ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">Mounting (Embedded/Anchored)</td>
                    <td className="border border-slate-400 p-0 text-center font-bold">
                      <CurrencyCell value={mountingCharges} />
                    </td>
                    <td colSpan={5} className="border border-slate-400" />
                  </tr>
                  {/* TOTAL MATERIAL PRICE ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-extrabold uppercase bg-slate-50">Total Material Price</td>
                    <td className="border border-slate-400 p-0 text-center font-black">
                      <CurrencyCell value={totalMaterialPrice} />
                    </td>
                    <td colSpan={5} className="bg-white border-none" />
                  </tr>
                  {/* PRICE PER RISER ROW */}
                  <tr className="h-10">
                    <td className="border border-slate-400 text-right px-4 font-bold">PRICE PER RISER</td>
                    <td className="border border-slate-400 text-center font-bold text-[#f59e0b] px-2">{summary.pricePerRiser || "0"}</td>
                    <td colSpan={5} className="bg-white border-none" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Section (Bottom Right) */}
          <div className="flex justify-end mt-4 w-full pr-10">
            <div className="flex flex-col border-2 border-slate-900 w-[450px]">
              <div className="flex">
                <div className="flex-grow text-right pr-6 py-2 uppercase font-black tracking-tight text-[16px] border-r border-slate-300">Sub Total With Out Tax</div>
                <div className="w-[180px] p-0">
                  <CurrencyCell value={subTotalWithoutTax} color="#f59e0b" />
                </div>
              </div>
              <div className="flex border-t border-slate-300">
                <div className="flex-grow text-right pr-6 py-2 uppercase font-black tracking-tight text-[16px] border-r border-slate-300">Tax</div>
                <div className="w-[180px] p-0">
                  <CurrencyCell value={salesTaxValue} color="#f59e0b" />
                </div>
              </div>
              <div className="flex border-t-2 border-slate-900 bg-slate-50 italic">
                <div className="flex-grow text-right pr-6 py-3 uppercase font-black tracking-tighter text-[22px] border-r-2 border-slate-900">Total Estimate</div>
                <div className="w-[180px] p-0 bg-white">
                  <CurrencyCell value={grandTotalValue} color="#f59e0b" />
                </div>
              </div>
              {additionalCosts && additionalCosts.total !== undefined && (
                <div className="flex border-t-2 border-slate-900 bg-amber-50 italic">
                  <div className="flex-grow text-right pr-6 py-3 uppercase font-black tracking-tighter text-[18px] whitespace-nowrap border-r-2 border-slate-900 text-amber-900">Total W/ Adjustments</div>
                  <div className="w-[180px] p-0 bg-white">
                    <CurrencyCell value={additionalCosts.total} color="#d97706" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: ITEMISED DETAIL PAGES ── */}
      <div className="report-paper bg-white mx-auto shadow-2xl overflow-hidden relative" style={{ width: '1056px', minHeight: '816px', padding: '20px', pageBreakBefore: 'always' }}>
        {/* Detailed Entries Section */}
        {rawStairs && rawStairs.length > 0 && (
        <div className="w-full">
          <h2 className="text-[18px] font-bold border-b-2 border-slate-900 pb-1 mb-4">Itemized Entries (Stringers and Rails)</h2>
          
          <div className="mb-6" style={{ breakInside: 'avoid' }}>
            <h3 className="text-[14px] font-bold mb-2 uppercase text-slate-700">Stair Sub-Assemblies</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-800">
                    <th className="p-2 text-left font-bold border border-slate-300">Ref</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Category</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Stair Type</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Tread Setup / Grating</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Pan Thick</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Mounting</th>
                    <th className="p-2 text-center font-bold border border-slate-300">Finish</th>
                    <th className="p-2 text-right font-bold border border-slate-300" style={{minWidth: '70px'}}>Wt(lbs)</th>
                  </tr>
                </thead>
                <tbody>
                  {rawStairs.map((s, i) => (
                    <tr key={s.id || i} className="border-b border-slate-300 bg-white hover:bg-slate-50">
                      <td className="p-2 border border-slate-300"><b>{s.id ? `Stair ${i + 1}` : 'Stair'}</b></td>
                      <td className="p-2 text-center border border-slate-300">{s.stairCategory || 'Commercial'}</td>
                      <td className="p-2 text-center border border-slate-300">{s.stairType || '-'}</td>
                      <td className="p-2 text-center border border-slate-300">{s.gratingTreadType || s.gratingType || '-'}</td>
                      <td className="p-2 text-center border border-slate-300">{s.panPlThk || s.gaugeId || '-'}</td>
                      <td className="p-2 text-center border border-slate-300">{s.mountingType || '-'}</td>
                      <td className="p-2 text-center border border-slate-300">{s.finish || '-'}</td>
                      <td className="p-2 text-right border border-slate-300 font-bold bg-slate-50">{(s.totalWeight || s.systemCalc?.totalWeight || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(() => {
            const allRails = [];
            rawStairs.forEach(s => { if (s.rails) allRails.push(...s.rails); });
            if (allRails.length === 0) return null;
            return (
              <div className="mb-6" style={{ breakInside: 'avoid' }}>
                <h3 className="text-[14px] font-bold mb-2 uppercase text-slate-700">Railing Sub-Assemblies</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[10px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-200 border-b-2 border-slate-800">
                        <th className="p-2 text-left font-bold border border-slate-300">Type</th>
                        <th className="p-2 text-center font-bold border border-slate-300">Length</th>
                        <th className="p-2 text-center font-bold border border-slate-300">Actual Spacing</th>
                        <th className="p-2 text-center font-bold border border-slate-300">Mounting Type</th>
                        <th className="p-2 text-center font-bold border border-slate-300">Finish Spec</th>
                        <th className="p-2 text-right font-bold border border-slate-300" style={{minWidth: '70px'}}>Wt(lbs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRails.map((r, i) => (
                        <tr key={r.id || i} className="border-b border-slate-300 bg-white hover:bg-slate-50">
                          <td className="p-2 border border-slate-300 font-bold">{r.railType || r.typeCode || 'Railing'}</td>
                          <td className="p-2 text-center border border-slate-300">{fmtNum(typeof r.railLength === 'object' ? r.railLength.value : (r.railLength || r.length))}'</td>
                          <td className="p-2 text-center border border-slate-300">{r.systemCalc?.actualSpacing || '-'}</td>
                          <td className="p-2 text-center border border-slate-300">{r.mountingType || '-'}</td>
                          <td className="p-2 text-center border border-slate-300">{r.finish || '-'}</td>
                          <td className="p-2 text-right border border-slate-300 font-bold bg-slate-50">{(r.totalWeight || r.systemCalc?.totalWeight || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
        )}
      </div>

      <style>{`
        /* Modern Report Dashboard Styles */
        .modern-hero {
          background: linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0f3460 100%);
          border-radius: 12px;
          padding: 24px;
          color: white;
        }
        .modern-hero-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }
        .modern-hero-name { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .modern-hero-num { font-family: monospace; color: #10a37f; font-size: 13px; margin-bottom: 6px; }
        .modern-hero-customer { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 6px; }
        .modern-hero-meta { min-width: 200px; display: flex; flex-direction: column; gap: 4px; }
        .modern-hero-meta-row { display: flex; justify-content: space-between; font-size: 12px; gap: 20px; }
        .modern-hero-meta-row span:first-child { color: rgba(255,255,255,0.4); }
        .modern-hero-meta-row span.yes { color: #10a37f; font-weight: 700; }
        
        .modern-stat-tile { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .modern-stat-value { font-size: 18px; font-weight: 700; font-family: monospace; }
        .modern-stat-label { font-size: 11px; font-weight: 600; color: #1e293b; }
        .modern-stat-sub { font-size: 10px; color: #64748b; }

        .modern-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; height: 100%; }
        .modern-section-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 12px; }
        .modern-meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f8fafc; }
        .modern-meta-label { font-size: 11px; color: #64748b; }
        .modern-meta-value { font-size: 12px; color: #0f172a; font-weight: 500; }
        .modern-meta-value.highlight { color: #10a37f; }

        .modern-rate-pill { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #f1f5f9; padding: 6px 10px; border-radius: 6px; }
        .modern-rate-label { font-size: 11px; color: #64748b; }
        .modern-rate-value { font-size: 11px; font-weight: 700; font-family: monospace; }

        .modern-summary-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .modern-summary-table th { background: #10a37f; color: white; padding: 8px; text-align: left; }
        .modern-summary-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
        .modern-summary-table .total-col { color: #10a37f; font-weight: 700; }
        .modern-summary-table .hero-total { font-size: 16px; color: #f59e0b; }
        .modern-summary-table .warn { color: #f59e0b; }

        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0; padding: 0; }
          .report-container { padding: 0 !important; background-color: white !important; }
          .report-paper { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; height: auto !important; }
          .modern-hero { background: #1a1a2e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .modern-summary-table th { background: #10a37f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: landscape; margin: 5mm; }
        }
      `}</style>
    </div>
  );
}

