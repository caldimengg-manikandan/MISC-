# Rates Configuration — MISC Pro System Config Keys

## Overview
System rates control all financial calculations across MISC Pro. They are set globally in Pricing Settings (admin only) and can be overridden per-project in Local Pricing Overrides.

## All Config Keys

### Material Rates
| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| steel_price_per_lb | 0.75 | $/lb | Base steel purchase price |
| stair_pan_rate | 1.00 | $/lb | Concrete-fill stair pan cost |
| galvanize_rate | 0.75 | $/lb | Hot-dip galvanizing cost |
| powder_coat_rate | 1.75 | $/lb | Powder coat finishing cost |
| grating_rate | 12.00 | $/sqft | Bar grating floor panels |

### Labor Rates
| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| shop_hourly_rate | 70.00 | $/hr | In-shop fabrication rate |
| field_hourly_rate | 70.00 | $/hr | On-site installation rate |

### Mounting / Anchor Rates
| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| mounting_embedded_rate | 5.00 | $/each | Embedded post cost |
| mounting_anchored_rate | 6.00 | $/each | Anchored post cost |
| anchor_bolt_rate | 0.025 | $/lb | Anchor bolt material cost |
| por_rok_rate | 0.035 | $/each | POR ROK expanding anchor |

### Calculation Factors
| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| scrap_factor_pct | 10 | % | Waste/scrap allowance on steel |
| tax_rate | 0.06 | decimal | Sales tax (6% = 0.06) |

### Other Config Keys
| Key | Default | Description |
|-----|---------|-------------|
| company_name | — | Company display name |
| default_units | Imperial | Imperial or Metric |
| aisc_certification | Y | Default AISC status for new projects |

## Changing Global Rates
1. Go to Settings → Pricing Settings
2. Modify the desired rate field
3. Click Save — ALL future calculations use the new rate immediately

## Project-Level Overrides (Local Config)
- In any estimation module, click the "Rates" button in the header
- Set any rate to a project-specific value
- This override applies ONLY to the current project
- Blue highlight on a field shows it has an active override
- The header "Rates Bar" shows which rates are currently active
- Click "Reset Defaults" in the modal to remove all overrides and revert to global rates

## Important Notes
- Rate changes affect NEW calculations only
- Previously calculated and saved projects retain their stored results
- To recalculate a project with new rates, click "Run Estimation" again
- Tax rate is stored as a decimal (0.06 = 6%) but displayed as percentage in the UI
