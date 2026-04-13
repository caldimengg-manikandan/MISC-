import React from 'react';

const formatNum = (val, dec = 3) => Number(val || 0).toFixed(dec);
const formatMoney = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatCell = ({ label, value, colorClass, valueClass = "", bgClass = "", borderRight = true }) => {
  const vClass = `text-[12px] font-medium leading-none mt-1 ${colorClass || 'text-slate-900'} ${valueClass}`;
  
  return (
    <div className={`px-[12px] py-[9px] flex-1 min-w-0 flex flex-col justify-center ${bgClass} ${borderRight ? 'border-r-[0.5px] border-slate-200' : ''}`}>
      <div className="text-[10px] text-slate-500 leading-none whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
      <div className={vClass}>{value}</div>
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div className="px-[14px] py-[5px] bg-slate-50 border-b-[0.5px] border-slate-200 text-[10px] font-bold tracking-[0.07em] uppercase text-slate-500">
    {title}
  </div>
);

export default function EstimationPreviewCard({ 
  systemCalc = {}, 
  totalCost = 0, 
  stairType = "",
  finishName = "",
  unitType = "LF",
  hidePricePerRiser = false
}) {
  // --- Data Bindings ---
  // Scrap & Tax config
  const scrapFactorPct = systemCalc.scrapFactorPct || (unitType === 'SF' ? 11 : 11);
  const taxRatePct = systemCalc.taxRatePct || 6;

  // Steel
  const steelLbsPerRiser = formatNum(systemCalc.steelLbsPerLF || systemCalc.steelLbsPerRiser || 0, 3);
  const steelLbsSubTotal = formatNum(systemCalc.totalSteel || 0, 3);
  const steelScrapLbs = formatNum(systemCalc.scrapLbs || 0, 3);
  
  // Costs
  const steelDollars = `$${formatMoney(systemCalc.steelPriceBase || 0)}`;
  const scrapDollars = `$${formatMoney(systemCalc.scrapPriceOnly || 0)}`;
  const finishDollars = `$${formatMoney(systemCalc.finishTotalCost || 0)}`;
  const porRokDollars = `$${formatMoney(systemCalc.porRokCost || 0)}`;
  const anchorBoltsDollars = `$${formatMoney(systemCalc.anchorBoltsCost || 0)}`;
  
  // Labor
  const shopLaborDollars = `$${formatMoney(systemCalc.shopLaborPrice || 0)}`;
  const fieldLaborDollars = `$${formatMoney(systemCalc.fieldLaborPrice || 0)}`;
  const laborTotalDollars = `$${formatMoney((systemCalc.shopLaborPrice || 0) + (systemCalc.fieldLaborPrice || 0))}`;

  // Material Subtotal (Standardized from Backend)
  const subTotalMaterialRaw = systemCalc.subTotalMaterial || 0;
  const subTotalMaterial = `$${formatMoney(subTotalMaterialRaw)}`;

  // Summary
  const subTotalWithoutTax = `$${formatMoney(systemCalc.subTotalWithoutTax || 0)}`;
  const taxDollars = `$${formatMoney(systemCalc.taxTotal || 0)}`;
  const totalEstimate = `$${formatMoney(totalCost || 0)}`;
  const pricePerRiser = `$${formatMoney(systemCalc.pricePerRiser || 0)}`;

  // --- Theme Colors ---
  const moneyColor = "text-[#1D9E75]";
  const scrapColor = "text-[#BA7517]";

  return (
    <div className="rounded-lg border-[0.5px] border-slate-300 bg-white shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-2 md:grid-rows-[auto_auto]">
      
      {/* ROW 1 LEFT - Steel & Structure */}
      <div className="border-b-[0.5px] border-slate-300 md:border-r-[0.5px] flex flex-col">
        <SectionHeader title="Steel & structure" />
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label={`Steel lbs / ${unitType === 'SF' ? 'SF' : (unitType === 'LF' ? 'LF' : 'riser')}`} value={steelLbsPerRiser} />
          <StatCell label="Steel lbs total" value={steelLbsSubTotal} borderRight={false} />
        </div>
        <div className="flex">
          <StatCell label={`Scrap lbs (+${scrapFactorPct}%)`} value={steelScrapLbs} colorClass={scrapColor} />
          <StatCell label="Steel cost" value={steelDollars} colorClass={moneyColor} borderRight={false} />
        </div>
      </div>

      {/* ROW 1 RIGHT - Labor */}
      <div className="border-b-[0.5px] border-slate-300 flex flex-col">
        <SectionHeader title="Labor" />
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label={`Shop hrs total`} value={formatNum(systemCalc.shopTotalHrs || 0, 3)} />
          <StatCell label="Shop labor cost" value={shopLaborDollars} colorClass={moneyColor} borderRight={false} />
        </div>
        <div className="flex">
          <StatCell label={`Field hrs total`} value={formatNum(systemCalc.fieldTotalHrs || 0, 3)} />
          <StatCell label="Field labor cost" value={fieldLaborDollars} colorClass={moneyColor} borderRight={false} />
        </div>
      </div>

      {/* ROW 2 LEFT - Material Costs */}
      <div className="border-b-[0.5px] border-slate-300 md:border-b-0 md:border-r-[0.5px] flex flex-col h-full bg-white">
        <SectionHeader title="Material costs (Excl. Scrap)" />
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label="Steel weight cost" value={steelDollars} />
          <StatCell label={`Finish (${finishName?.toLowerCase() || 'primer'})`} value={finishDollars} borderRight={false} />
        </div>
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label="POR ROK / Post cost" value={porRokDollars} />
          <StatCell label="Anchor bolts" value={anchorBoltsDollars} borderRight={false} />
        </div>
        <div className="flex bg-slate-50">
          <StatCell 
            label="Scrap cost (Isolated)" 
            value={scrapDollars} 
            colorClass={scrapColor} 
          />
          <StatCell 
            label="Sub total material" 
            value={subTotalMaterial} 
            colorClass={moneyColor} 
            valueClass="!text-[14px] !font-bold" 
            borderRight={false} 
          />
        </div>
      </div>

      {/* ROW 2 RIGHT - Estimate Summary */}
      <div className="flex flex-col h-full bg-white">
        <SectionHeader title="Estimate summary" />
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label="Sub total material" value={subTotalMaterial} />
          <StatCell label="Labor total" value={laborTotalDollars} borderRight={false} />
        </div>
        <div className="flex border-b-[0.5px] border-slate-200">
          <StatCell label="Scrap cost" value={scrapDollars} colorClass={scrapColor} />
          <StatCell label={`Tax (${taxRatePct}%)`} value={taxDollars} borderRight={false} />
        </div>
        
        {/* Bottom Bar */}
        <div className="flex bg-slate-50 mt-auto border-t-[0.5px] border-slate-300">
          <div className="flex-1 flex flex-col justify-center px-[12px] py-[9px] border-r-[0.5px] border-slate-200">
            <div className="text-[10px] text-slate-500 leading-none">Sub total w/o tax</div>
            <div className="text-[14px] font-medium text-slate-900 mt-1">{subTotalWithoutTax}</div>
          </div>
          <StatCell 
            label="Total estimate" 
            value={totalEstimate} 
            colorClass={moneyColor} 
            valueClass="!text-[18px] !font-bold" 
            bgClass="bg-[#F0FDF4]"
            borderRight={false}
          />
        </div>
      </div>

        
    </div>
  );
}
