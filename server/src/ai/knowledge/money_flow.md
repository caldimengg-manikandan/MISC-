# Money Flow — How CALMISC Builds the Total Estimate

## Overview
This document explains the exact flow from raw steel inputs to the final Grand Total displayed in the Calculation Summary.

## Step 1: Material Weight
- Base steel weight = stringer weight + pan/tread weight + rail weight + platform weight
- Each component has its own lbs/LF or lbs/sqft rate from the system dictionary

## Step 2: Scrap Allowance
- scrapLbs = baseSteelLbs × (scrap_factor_pct / 100)
- Default: 10% scrap factor on all steel
- This accounts for cutting waste, offcuts, and material shrinkage
- Total steel ordered = baseSteelLbs + scrapLbs

## Step 3: Steel Material Cost
- steelCost = (baseSteelLbs + scrapLbs) × steel_price_per_lb
- steel_price_per_lb is the global default (or project-level override)

## Step 4: Finishing Cost
Different finishes apply different cost formulas:
- **Primer only**: No extra finishing cost (included in shop rate)
- **Galvanized**: galvanize_rate ($/lb) × totalSteelLbs
- **Galvanized + Painted**: galvanize_rate × lbs + paint factor
- **Powder Coated**: powder_coat_rate ($/lb) × totalSteelLbs

## Step 5: Accessory Costs
- Stair pans: panWeight × stair_pan_rate ($/lb)
- Grating: gratingArea × grating_rate ($/sqft)
- POR ROK anchors: porRokQty × por_rok_rate
- Anchor bolts: anchorBoltQty × anchor_bolt_rate

## Step 6: Mounting Costs
- Embedded posts: postCount × mounting_embedded_rate
- Anchored posts: postCount × mounting_anchored_rate

## Step 7: Labor Costs
- Shop labor: totalShopHours × shop_hourly_rate
- Field labor: totalFieldHours × field_hourly_rate
- Shop hours = fabrication, welding, assembly in the shop
- Field labor = installation, setting posts, anchoring on-site

## Step 8: Subtotal Without Tax
subtotalWithoutTax = steelCost + finishCost + pansCost + gratingCost + accessoryCosts + mountingCost + shopLaborCost + fieldLaborCost

## Step 9: Sales Tax
- taxAmount = subtotalWithoutTax × tax_rate
- Default tax_rate = 0.06 (6%)

## Step 10: Grand Total
grandTotal = subtotalWithoutTax + taxAmount

## Price Per Riser (Stair-specific)
pricePerRiser = grandTotal / totalRisers

This is shown in the Calculation Summary panel and is the primary quoted number for a project.

## Local Pricing Overrides
Each project can override global rates for:
- steel_price_per_lb
- stair_pan_rate
- galvanize_rate
- powder_coat_rate
- shop_hourly_rate
- field_hourly_rate
- mounting_embedded_rate
- mounting_anchored_rate
- anchor_bolt_rate
- scrap_factor_pct
- tax_rate

Overrides are project-specific and do NOT affect other projects. They are saved to the project's localConfig column in the database.
