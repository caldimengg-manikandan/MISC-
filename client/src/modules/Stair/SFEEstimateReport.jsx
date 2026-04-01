import React, { useRef } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

/**
 * SFEEstimateReport redesigned to match EXACTLY the new "Miscellaneous Metal Final Estimate Form" 
 * summary table layout provided by the user in the latest screenshot.
 */
export default function SFEEstimateReport({ data, onBack }) {
  const printRef = useRef();

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

  const { projectData = {}, summary = {} } = data;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  // Constants
  const pricePerLb = 0.75;
  const laborRate = 70.00;
  const taxRate = 0.06;

  // Re-calculate based on screenshot methodology to ensure absolute parity
  const steelWeight = summary.baseSteelWeight || 0;
  const scrapWeight = summary.scrapWeight || (steelWeight * 0.1); // Screenshot shows scrap is ~ +10%
  const shopHours = summary.totalShopHours || 0;
  const fieldHours = summary.totalFieldHours || 0;

  const steelPriceRaw = steelWeight * pricePerLb;
  const scrapPriceRaw = scrapWeight * pricePerLb;
  const shopLaborPrice = shopHours * laborRate;
  const fieldLaborPrice = fieldHours * laborRate;

  const pansPrice = summary.pansMaterialPrice || 0;
  const gratingPrice = summary.gratingPrice || summary.gratingCost || 0;
  const galvanizePrice = summary.galvanizeCost || 0;
  const anchorBoltsPrice = summary.anchorBoltsCost || 0;
  const porRokPrice = summary.porRokCost || 0;

  // TOTAL MATERIAL PRICE = Steel Price + Pans + Grating + Galv + Anchor Bolts + Por Rok
  const totalMaterialPrice = steelPriceRaw + pansPrice + gratingPrice + galvanizePrice + anchorBoltsPrice + porRokPrice;
  
  // SALES TAX = Total Material Price * Tax Rate (6%)
  const salesTaxValue = totalMaterialPrice * taxRate;

  // SUB TOTAL WITH OUT TAX = Total Material Price + Shop Labor + Field Labor + Scrap Steel Price
  const subTotalWithoutTax = totalMaterialPrice + shopLaborPrice + fieldLaborPrice + scrapPriceRaw;

  // GRAND TOTAL
  const grandTotalValue = subTotalWithoutTax + salesTaxValue;

  const handlePrint = () => {
    window.print();
  };

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
            <Printer size={18} /> Print Form (PDF)
          </button>
        </div>
      </div>

      {/* Main Report Page */}
      <div ref={printRef} className="report-paper bg-white mx-auto shadow-2xl overflow-hidden relative" style={{ width: '1056px', minHeight: '816px', padding: '20px' }}>
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
                <div style={{ width: '90px' }}>
                   <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100" height="100" fill="#1e293b"/>
                      <path d="M20 80 L20 20 L80 20 L80 40 L40 40 L40 50 L70 50 L70 60 L40 60 L40 80 Z" fill="white"/>
                   </svg>
                </div>
                <div className="text-[14px] font-black leading-tight text-center mt-1 uppercase">
                   STEEL FAB<br/>ENTERPRISES LLC
                </div>
            </div>
            <div className="ml-10">
               <h1 className="text-[32px] font-medium tracking-tight" style={{ color: '#000' }}>Miscellaneous Metal Final Estimate Form</h1>
            </div>
          </div>
          <div className="text-[14px] font-medium mt-1 pr-4">
            Rev. 02/06/15
          </div>
        </div>

        {/* Project Info Section */}
        <div className="grid grid-cols-[1fr_250px] gap-8 mb-8">
          <div>
            <div className="flex gap-4 items-center mb-1">
              <span className="text-[14px] font-bold min-w-[80px]">Project:</span>
              <div className="flex-grow border-b border-slate-900 text-[14px] px-2 font-bold">{projectData.projectName || '0'}</div>
              <span className="text-[14px] font-bold">Date:</span>
              <div className="border-2 border-slate-900 px-6 py-1 text-[14px] font-bold">{today}</div>
            </div>
            <div className="flex gap-4 items-center mb-1 mt-2">
              <span className="min-w-[80px]"></span>
              <div className="flex-grow border-b border-slate-900 text-[14px] px-2 font-bold">0</div>
              <span className="text-[14px] font-bold">Notes:</span>
              <div className="flex-grow border-b border-slate-900 min-w-[150px]"></div>
            </div>
            <div className="flex gap-4 items-center mt-2">
              <span className="text-[14px] font-bold min-w-[80px]">Project No.</span>
              <div className="flex-grow border-b border-slate-900 text-[14px] px-2 font-bold">{projectData.projectNumber || '0'}</div>
              <div className="w-[200px]"></div>
            </div>
          </div>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-[1fr_200px] gap-0">
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
                  <td className="border border-slate-400 text-center font-bold text-[#f59e0b]">5.500</td>
                  <td className="border border-slate-400 text-center font-bold text-[#f59e0b]">5.750</td>
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
                       <div className="bg-[#CCF2D1] text-[#166534] font-bold px-4 py-1 border-r border-slate-400 flex items-center">Yes</div>
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
                       <div className="bg-[#CCF2D1] text-[#166534] font-bold px-4 py-1 border-r border-slate-400 flex items-center">Yes</div>
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

          {/* Constants Sidebar (Matches Screenshot Positions) */}
          <div className="flex flex-col gap-4 mt-20 pl-4 border-l border-slate-100">
             <div className="flex flex-col">
                <span className="text-[12px] font-black text-right uppercase mb-1">Price Per LB:</span>
                <div className="bg-[#FEF9C3] border-2 border-slate-900 p-2 flex justify-between items-center">
                   <span className="font-bold text-[14px]">$</span>
                   <span className="font-bold text-[16px]">0.75</span>
                </div>
             </div>
             <div className="flex flex-col mt-2">
                <span className="text-[11px] font-black text-right uppercase mb-1 truncate">Shop Hourly Rate:</span>
                <div className="bg-[#FEF9C3] border-2 border-slate-900 p-2 flex justify-between items-center">
                   <span className="font-bold text-[14px]">$</span>
                   <span className="font-bold text-[16px]">70.00</span>
                </div>
             </div>
             <div className="flex flex-col mt-2">
                <span className="text-[12px] font-black text-right uppercase mb-1 truncate">Field Hourly Rate:</span>
                <div className="bg-[#FEF9C3] border-2 border-slate-900 p-2 flex justify-between items-center">
                   <span className="font-bold text-[14px]">$</span>
                   <span className="font-bold text-[16px]">70.00</span>
                </div>
             </div>
             <div className="flex flex-col mt-2">
                <span className="text-[12px] font-black text-right uppercase mb-1">Sales Tax:</span>
                <div className="bg-[#FEF9C3] border-2 border-slate-900 p-2 flex justify-center items-center">
                   <span className="font-bold text-[16px]">6%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Grand Total Section (Bottom Right) */}
        <div className="flex justify-end mt-12 w-full pr-10">
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
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-20 right-20 text-[10px] text-slate-400 italic flex justify-between uppercase">
           <span>SFE Engineering Framework v2.0 • Deterministic Fabrication Logic</span>
           <span>Proprietary and Confidential • Steel Fab Enterprises LLC</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0; padding: 0; }
          .report-container { padding: 0 !important; background-color: white !important; }
          .report-paper { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; height: 100% !important; }
          @page { size: landscape; margin: 5mm; }
        }
      `}</style>
    </div>
  );
}
