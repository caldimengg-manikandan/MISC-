// client/src/components/common/RatesBar.jsx
import React from 'react';
import configManager from '../../services/configManager';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const RatePill = ({ label, value }) => (
  <div className="rate-pill">
    <div className="rate-pill-label">{label}</div>
    <div className="rate-pill-value">{value}</div>
  </div>
);

const RatesBar = ({ finish }) => {
  // Read from configManager (pre-loaded in index.js)
  const steelPrice    = configManager.get('steel_price_per_lb');
  const shopRate      = configManager.get('shop_hourly_rate');
  const fieldRate     = configManager.get('field_hourly_rate');
  const galvRate      = configManager.get('galvanize_rate');
  const pcRate        = configManager.get('powder_coat_rate');
  const scrapPct      = configManager.get('scrap_factor_pct');
  const taxRate       = (configManager.get('tax_rate') * 100).toFixed(1);

  const showGalv = finish === 'Galvanized' || finish === 'Galv+Painted';
  const showPC   = finish === 'Powder Coated';

  return (
    <div className="rates-bar">
      <span className="rates-bar-title">RATES APPLIED</span>
      <div className="rates-bar-pills">
        <RatePill label="Steel"       value={`$${steelPrice}/lb`} />
        <RatePill label="Shop Labor"  value={`$${shopRate}/hr`}  />
        <RatePill label="Field Labor" value={`$${fieldRate}/hr`} />
        {showGalv && <RatePill label="Galvanize"   value={`$${galvRate}/lb`} />}
        {showPC   && <RatePill label="Powder Coat" value={`$${pcRate}/lb`}   />}
        <RatePill label="Scrap"       value={`${scrapPct}%`}     />
        <RatePill label="Tax"         value={`${taxRate}%`}      />
      </div>
      <Link to="/settings/pricing" className="rates-edit-link">
        <Settings size={12} /> Edit Rates
      </Link>
    </div>
  );
};

export default RatesBar;

