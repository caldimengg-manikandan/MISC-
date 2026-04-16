import React from 'react';

const formatNum = (val, dec = 3) => Number(val || 0).toFixed(dec);
const formatMoney = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Mono-style number value cell ── */
const StatCell = ({ label, value, color, valueStyle = {}, bgStyle = {}, borderRight = true }) => {
  return (
    <div style={{
      padding: '9px 12px',
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
        fontSize: '10px',
        color: 'var(--gpt-text-muted)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: 'color 0.35s ease'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",  /* ← Mono font for all numbers */
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1,
        marginTop: '4px',
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
  hidePricePerRiser = false
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
  const moneyColor = '#1D9E75';
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

  return (
    <div style={cardStyle}>

      {/* ROW 1 LEFT — Steel & Structure */}
      <div style={quadrantStyle(true, true)}>
        <SectionHeader title="Steel & structure" />
        <div style={cellRowStyle(true)}>
          <StatCell label={`Steel lbs / ${unitType === 'SF' ? 'SF' : (unitType === 'LF' ? 'LF' : 'riser')}`} value={steelLbsPerRiser} />
          <StatCell label="Steel lbs total" value={steelLbsSubTotal} borderRight={false} />
        </div>
        <div style={cellRowStyle(false)}>
          <StatCell label={`Scrap lbs (+${scrapFactorPct}%)`} value={steelScrapLbs} color={scrapColor} />
          <StatCell label="Steel cost" value={steelDollars} color={moneyColor} borderRight={false} />
        </div>
      </div>

      {/* ROW 1 RIGHT — Labor */}
      <div style={quadrantStyle(false, true)}>
        <SectionHeader title="Labor" />
        <div style={cellRowStyle(true)}>
          <StatCell label="Shop hrs total" value={formatNum(systemCalc.shopTotalHrs || 0, 3)} />
          <StatCell label="Shop labor cost" value={shopLaborDollars} color={moneyColor} borderRight={false} />
        </div>
        <div style={cellRowStyle(false)}>
          <StatCell label="Field hrs total" value={formatNum(systemCalc.fieldTotalHrs || 0, 3)} />
          <StatCell label="Field labor cost" value={fieldLaborDollars} color={moneyColor} borderRight={false} />
        </div>
      </div>

      {/* ROW 2 LEFT — Material Costs */}
      <div style={quadrantStyle(true, false)}>
        <SectionHeader title="Material costs (Excl. Scrap)" />
        <div style={cellRowStyle(true)}>
          <StatCell label="Steel weight cost" value={steelDollars} />
          <StatCell label={`Finish (${finishName?.toLowerCase() || 'primer'})`} value={finishDollars} borderRight={false} />
        </div>
        <div style={cellRowStyle(true)}>
          <StatCell label="POR ROK / Post cost" value={porRokDollars} />
          <StatCell label="Anchor bolts" value={anchorBoltsDollars} borderRight={false} />
        </div>
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
      </div>

      {/* ROW 2 RIGHT — Estimate Summary */}
      <div style={quadrantStyle(false, false)}>
        <SectionHeader title="Estimate summary" />
        <div style={cellRowStyle(true)}>
          <StatCell label="Sub total material" value={subTotalMaterial} />
          <StatCell label="Labor total" value={laborTotalDollars} borderRight={false} />
        </div>
        <div style={cellRowStyle(true)}>
          <StatCell label="Scrap cost" value={scrapDollars} color={scrapColor} />
          <StatCell label={`Tax (${taxRatePct}%)`} value={taxDollars} borderRight={false} />
        </div>

        {/* ── Bottom Bar with accent glow on Total Estimate ── */}
        <div style={{ display: 'flex', marginTop: 'auto', borderTop: '0.5px solid var(--gpt-border)', ...subBgStyle }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '9px 12px',
            borderRight: '0.5px solid var(--gpt-border)',
            transition: 'border-color 0.35s ease',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--gpt-text-muted)', lineHeight: 1, transition: 'color 0.35s ease' }}>Sub total w/o tax</div>
            <div style={{
              fontFamily: "'Geist Mono', 'SF Mono', monospace",
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--gpt-text-primary)',
              marginTop: '4px',
              transition: 'color 0.35s ease',
            }}>
              {subTotalWithoutTax}
            </div>
          </div>

          {/* ── Accent Glow Cell ── */}
          <StatCell
            label="Total estimate"
            value={totalEstimate}
            color={moneyColor}
            valueStyle={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}
            bgStyle={totalEstimateBgStyle}
            borderRight={false}
          />
        </div>
      </div>
    </div>
  );
}
