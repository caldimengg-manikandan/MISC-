# Stair Calculation — MISC Pro Formula Reference

## Overview
The stair calculation engine computes steel weight, labor hours, finishing costs, and total project cost for each stair flight.

## Input Fields Required
- Stair Type: metal or non-metal
- Stringer Type: Rolled (W-shape) or Plate
- Stringer Size (beam designation e.g. W10x33, or plate width x thickness)
- Number of Risers
- Width (inches or feet)
- Rise height (inches)
- Connection type: welded or bolted
- Finish: Primer, Painted, Galvanized, Galv+Painted, Powder Coated
- Pan type (if applicable): concrete-fill or grating

## Stringer Weight Calculation
- Rolled stringer: weight = lbs/LF from steel tables × stringer LF total
- Plate stringer: weight = plate width (in) × plate thickness (in) × LF × 0.2833 lbs/cubic inch

## Stringer LF Total
- stringerLFTotal = riserCount × riseHeight (ft) × 1.414 (diagonal factor) × 2 (two stringers)

## Pan / Tread Calculation
- panAreaSqFt = riserCount × width (ft) × 0.833 (tread projection factor)
- panWeight = panAreaSqFt × panWeightFactor (from system config: stair_pan_rate lbs/sqft)

## Scrap Factor
- scrapLbs = (stringerLbs + panWeight) × scrap_factor_pct / 100
- Default scrap_factor_pct = 10%

## Shop Labor Hours
- shopHrsPerRiser × riserCount = shopHrsTotal
- shopHrsPerRiser is looked up from dictionary (stair_type shop rates)

## Field Labor Hours
- fieldHrsPerRiser × riserCount = fieldHrsTotal

## Cost Breakdown
- steelCost = (stringerLbs + scrapLbs) × steel_price_per_lb
- pansCost = panWeight × stair_pan_rate ($/lb)
- finishCost = finishing rate × weight (depends on finish type)
  - Galvanized: galvanize_rate × total steel lbs
  - Powder Coated: powder_coat_rate × total steel lbs
  - Painted: included in shop labor rate
- shopLaborCost = shopHrsTotal × shop_hourly_rate
- fieldLaborCost = fieldHrsTotal × field_hourly_rate
- porRokCost = porRok anchor rate × riserCount (if anchored mounting)
- anchorBoltsCost = anchor_bolt_rate × riserCount

## Tax Calculation
- subtotalWithoutTax = steelCost + pansCost + finishCost + scrapCost + shopLaborCost + fieldLaborCost + anchorCosts
- taxAmount = subtotalWithoutTax × tax_rate (default 6%)
- grandTotal = subtotalWithoutTax + taxAmount

## Price Per Riser
- pricePerRiser = grandTotal / riserCount

## Notes
- Non-metal stair types still track labor and assembly but no steel weight
- Grating treads use a different weight factor than concrete-fill pans
- All rates can be overridden per-project using Local Pricing Overrides
