import React from 'react';

const formatNum = (val, dec = 3) => Number(val || 0).toFixed(dec);
const formatMoney = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Mono-style number value cell ── */
const StatCell = ({ label, value, color, valueStyle = {}, bgStyle = {}, borderRight = true }) => {
  return (
    <div style={{
      padding: '10px 14px',
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderRight: borderRight ? '0.5px solid var(--gpt-border)' : 'none',
      transition: 'background-color 0.35s ease, border-color 0.35s ease',
      ...bgStyle
    }}>
      <div style={{
        fontSize: '10.5px',
        color: 'var(--gpt-text-muted)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        transition: 'color 0.35s ease'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",
        fontSize: '14px',
        fontWeight: 700,
        lineHeight: 1,
        marginTop: '6px',
        color: color || 'var(--gpt-text-primary)',
        transition: 'color 0.35s ease',
        ...valueStyle
      }}>
        {value}
      </div>
    </div>
  );
};

/* ── Section header with micro-gradient sweep ── */
const SectionHeader = ({ title }) => (
  <div style={{
    padding: '5px 14px',
    /* ── Micro-gradient: matte metallic sweep across the header ── */
    background: 'linear-gradient(90deg, rgba(128,128,128,0.08) 0%, rgba(128,128,128,0.03) 60%, rgba(16,163,127,0.04) 100%)',
    borderBottom: '0.5px solid var(--gpt-border)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--gpt-text-muted)',
    transition: 'background 0.35s ease, border-color 0.35s ease, color 0.35s ease',
  }}>
    {title}
  </div>
);

export default function EstimationPreviewCard({ 
  systemCalc = {}, 
  totalCost = 0, 
  stairType = "",
  finishName = "",
  unitType = "LF",
  hidePricePerRiser = false,
  hidePorRok = false,
  hideAnchorBolts = false,
  minimal = false
}) {
  const scrapFactorPct = systemCalc.scrapFactorPct || 11;
  const taxRatePct = systemCalc.taxRatePct || 6;

  const steelLbsPerRiser = formatNum(systemCalc.steelLbsPerLF || systemCalc.steelLbsPerRiser || 0, 3);
  const steelLbsSubTotal = formatNum(systemCalc.totalSteel || 0, 3);
  const steelScrapLbs = formatNum(systemCalc.scrapLbs || 0, 3);

  const steelDollars = `$${formatMoney(systemCalc.steelPriceBase || 0)}`;
  const scrapDollars = `$${formatMoney(systemCalc.scrapPriceOnly || 0)}`;
  const finishDollars = `$${formatMoney(systemCalc.finishTotalCost || 0)}`;
  const porRokDollars = `$${formatMoney(systemCalc.porRokCost || 0)}`;
  const anchorBoltsDollars = `$${formatMoney(systemCalc.anchorBoltsCost || 0)}`;

  const shopLaborDollars = `$${formatMoney(systemCalc.shopLaborPrice || 0)}`;
  const fieldLaborDollars = `$${formatMoney(systemCalc.fieldLaborPrice || 0)}`;
  const laborTotalDollars = `$${formatMoney((systemCalc.shopLaborPrice || 0) + (systemCalc.fieldLaborPrice || 0))}`;

  const subTotalMaterialRaw = systemCalc.subTotalMaterial || 0;
  const subTotalMaterial = `$${formatMoney(subTotalMaterialRaw)}`;

  const subTotalWithoutTax = `$${formatMoney(systemCalc.subTotalWithoutTax || 0)}`;
  const taxDollars = `$${formatMoney(systemCalc.taxTotal || 0)}`;
  const totalEstimate = `$${formatMoney(totalCost || 0)}`;

  /* Premium color tokens */
  const moneyColor = '#10a37f';
  const scrapColor = '#B97B15';

  const cardStyle = {
    borderRadius: '8px',
    border: '0.5px solid var(--gpt-border)',
    background: 'var(--gpt-surface)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto auto',
    transition: 'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
  };

  const quadrantStyle = (rightBorder = false, bottomBorder = true) => ({
    display: 'flex',
    flexDirection: 'column',
    ...(rightBorder ? { borderRight: '0.5px solid var(--gpt-border)' } : {}),
    ...(bottomBorder ? { borderBottom: '0.5px solid var(--gpt-border)' } : {}),
    transition: 'border-color 0.35s ease',
  });

  const cellRowStyle = (bottomBorder = true) => ({
    display: 'flex',
    ...(bottomBorder ? { borderBottom: '0.5px solid var(--gpt-border)' } : {}),
    transition: 'border-color 0.35s ease',
  });

  const subBgStyle = {
    background: 'rgba(128,128,128,0.04)',
    transition: 'background-color 0.35s ease',
  };

  /* ── Accent glow on Total Estimate ── */
  const totalEstimateBgStyle = {
    background: 'linear-gradient(135deg, rgba(16,163,127,0.08) 0%, rgba(29,158,117,0.14) 100%)',
    boxShadow: 'inset 0 0 0 0.5px rgba(16,163,127,0.2)',
    transition: 'background 0.35s ease',
  };

  if (minimal) {
    const hardwareCost = (Number(systemCalc.anchorBoltsCost || 0) + Number(systemCalc.porRokCost || 0));
    const grossWeight = (Number(systemCalc.totalSteel || 0) + Number(systemCalc.scrapLbs || 0));

    return (
      <div className="estimation-preview-card minimal" style={{
        background: 'var(--gpt-bg-primary)',
        border: '1px solid var(--gpt-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {/* ROW 1: STRUCTURAL DATA */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gpt-border)' }}>
          <StatCell label="Steel Net" value={steelLbsSubTotal} />
          <StatCell label="Gross Weight" value={formatNum(grossWeight, 3)} />
          <StatCell label="Shop Hrs" value={formatNum(systemCalc.totalStringerShopHours || 0, 3)} />
          <StatCell label="Field Hrs" value={formatNum(systemCalc.fieldTotalHrs || 0, 3)} borderRight={false} />
        </div>

        {/* ROW 2: FINANCIAL DATA */}
        <div style={{ display: 'flex', background: 'rgba(16, 185, 129, 0.03)' }}>
          <StatCell label="Steel Cost" value={steelDollars} />
          <StatCell label="Finish Cost" value={finishDollars} />
          <StatCell label="Grout/Mt" value={porRokDollars} />
          <StatCell 
            label="Total Estimate" 
            value={totalEstimate} 
            color="#10B981" 
            valueStyle={{ fontWeight: 900, fontSize: '18px' }}
            bgStyle={{ background: 'rgba(16, 185, 129, 0.08)' }}
            borderRight={false} 
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>

      {/* ROW 1 LEFT — Steel & Structure */}
      <div style={quadrantStyle(true, true)}>
        <SectionHeader title="Steel & structure" />
        <div style={cellRowStyle(true)}>
          {!minimal && (systemCalc.panPlateWeight > 0 || systemCalc.gratingWeight > 0) && (
            <>
              <StatCell 
                label={systemCalc.gratingWeight > 0 ? "Grating weight" : "Pan plate weight"} 
                value={formatNum(systemCalc.gratingWeight > 0 ? systemCalc.gratingWeight : systemCalc.panPlateWeight, 3)} 
              />
              {!systemCalc.gratingWeight && systemCalc.panSupportType && (
                <StatCell label="Pan support type" value={systemCalc.panSupportType} />
              )}
            </>
          )}
          <StatCell label="Steel lbs total" value={steelLbsSubTotal} borderRight={false} />
        </div>
        <div style={cellRowStyle(false)}>
          {!minimal && <StatCell label={`Scrap lbs (+${scrapFactorPct}%)`} value={steelScrapLbs} color={scrapColor} />}
          <StatCell label="Total weight (gross)" value={formatNum((Number(systemCalc.totalSteel || 0) + Number(systemCalc.scrapLbs || 0)), 3)} borderRight={false} />
        </div>
      </div>

      {/* ROW 1 RIGHT — Labor */}
      <div style={quadrantStyle(false, true)}>
        <SectionHeader title="Labor" />
        <div style={cellRowStyle(true)}>
          <StatCell label="Shop hrs total" value={formatNum(systemCalc.shopTotalHrs || 0, 3)} borderRight={!minimal} />
          {!minimal && <StatCell label="Shop labor cost" value={shopLaborDollars} color={moneyColor} borderRight={false} />}
        </div>
        <div style={cellRowStyle(false)}>
          <StatCell label="Field hrs total" value={formatNum(systemCalc.fieldTotalHrs || 0, 3)} borderRight={!minimal} />
          {!minimal && <StatCell label="Field labor cost" value={fieldLaborDollars} color={moneyColor} borderRight={false} />}
        </div>
      </div>

      {/* ROW 2 LEFT — Material Costs */}
      <div style={quadrantStyle(true, false)}>
        <SectionHeader title="Material costs (Excl. Scrap)" />
        <div style={cellRowStyle(true)}>
          <StatCell label={`Structural Steel ($${formatMoney(systemCalc.steelPricePerLb || 0.75)}/lb)`} value={`$${formatMoney(systemCalc.structuralSteelCost || systemCalc.steelPriceBase || 0)}`} />
          <StatCell label={`Finish (${finishName?.toLowerCase() || 'primer'})`} value={finishDollars} borderRight={false} />
        </div>
        {(systemCalc.panPlateCost > 0 || systemCalc.gratingTotalCost > 0) && (
          <div style={cellRowStyle(true)}>
            <StatCell label="Pan / Grating Cost" value={`$${formatMoney((systemCalc.panPlateCost || 0) + (systemCalc.gratingTotalCost || 0))}`} color={moneyColor} borderRight={false} />
          </div>
        )}
        <div style={cellRowStyle(!(systemCalc.panPlateCost > 0 || systemCalc.gratingTotalCost > 0))}>
          {!hidePorRok && (
            <StatCell label="POR ROK / Post cost" value={porRokDollars} borderRight={false} />
          )}
        </div>
        {!minimal && (
          <div style={{ display: 'flex', ...subBgStyle }}>
            <StatCell label="Scrap cost (Isolated)" value={scrapDollars} color={scrapColor} />
            <StatCell
              label="Sub total material"
              value={subTotalMaterial}
              color={moneyColor}
              valueStyle={{ fontSize: '14px', fontWeight: 700 }}
              borderRight={false}
            />
          </div>
        )}
      </div>

      {/* ROW 2 RIGHT — Estimate Summary */}
      <div style={quadrantStyle(false, false)}>
        <SectionHeader title="Estimate summary" />
        <div style={cellRowStyle(true)}>
          {!minimal && <StatCell label="Labor total" value={laborTotalDollars} />}
          {!minimal && <StatCell label={`Tax (${taxRatePct}%)`} value={taxDollars} borderRight={false} />}
          {minimal && <StatCell label="Total weight (gross)" value={`${formatNum((Number(systemCalc.totalSteel || 0) + Number(systemCalc.scrapLbs || 0)), 3)} lbs`} borderRight={false} />}
        </div>
        {!minimal && (
          <div style={cellRowStyle(false)}>
            <StatCell label="Total Weight (Gross)" value={`${formatNum((Number(systemCalc.totalSteel || 0) + Number(systemCalc.scrapLbs || 0)), 3)} lbs`} />
            <StatCell label="Material + Scrap" value={`$${formatMoney((systemCalc.subTotalMaterial || 0) + (systemCalc.scrapPriceOnly || 0))}`} color={moneyColor} borderRight={false} />
          </div>
        )}

        {/* ── Bottom Bar with accent glow on Total Estimate ── */}
        <div style={{ display: 'flex', marginTop: 'auto', borderTop: '0.5px solid var(--gpt-border)', ...subBgStyle }}>
          {!minimal && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '9px 12px',
              borderRight: '0.5px solid var(--gpt-border)',
              transition: 'border-color 0.35s ease',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--gpt-text-muted)', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase', transition: 'color 0.35s ease' }}>Sub total w/o tax</div>
              <div style={{
                fontFamily: "'Geist Mono', 'SF Mono', monospace",
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--gpt-text-primary)',
                marginTop: '6px',
                transition: 'color 0.35s ease',
              }}>
                {subTotalWithoutTax}
              </div>
            </div>
          )}
          
          {/* ── Accent Glow Cell ── */}
          <StatCell
            label="Total estimate"
            value={totalEstimate}
            color={moneyColor}
            valueStyle={{ fontSize: minimal ? '18px' : '22px', fontWeight: 900, letterSpacing: '-0.5px' }}
            bgStyle={totalEstimateBgStyle}
            borderRight={false}
          />
        </div>
      </div>
    </div>
  );
}

