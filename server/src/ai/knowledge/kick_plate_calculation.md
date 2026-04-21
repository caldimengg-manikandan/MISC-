# Kick Plate Calculation — MISC Pro Formula Reference

## Overview
Kick plates (toe boards) are low-height steel plates installed at floor level along railings to prevent objects from rolling off edges.

## Input Fields
- Width (inches): 4", 6", 8", 10", or 12" standard options
- Length (feet): matches the rail run length
- Finish: Primer, Painted, Galvanized, Powder Coated

## Weight Calculation
- kickPlateWeight = (widthIn / 12) × length × steelLbsPerSqFt
- steelLbsPerSqFt for 3/16" plate ≈ 7.65 lbs/sqft
- steelLbsPerSqFt for 1/4" plate ≈ 10.2 lbs/sqft

## Scrap
- scrapLbs = kickPlateWeight × scrap_factor_pct / 100

## Labor
- shopHrsLF (per linear foot) from dictionary
- totalShopHrs = shopHrsLF × length

## Cost Calculation
- steelCost = kickPlateWeight × steel_price_per_lb
- scrapCost = scrapLbs × steel_price_per_lb
- finishCost = finishRate × kickPlateWeight
- shopLaborCost = totalShopHrs × shop_hourly_rate
- subtotalWithoutTax = steelCost + scrapCost + finishCost + shopLaborCost
- taxAmount = subtotalWithoutTax × tax_rate
- totalCost = subtotalWithoutTax + taxAmount

## Notes
- Kick plates do not have posts or anchor bolts
- Type code: KICK_PLATE
- Can be added as standalone item or as part of a guard rail system
- Toeplate Required field on guard rail automatically generates a kick plate entry
