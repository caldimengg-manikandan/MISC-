# Platform Calculation — MISC Pro Formula Reference

## Overview
Platforms are horizontal steel surfaces (landings, mezzanines) that can be attached to stairs or standalone.

## Input Fields
- Platform width (feet)
- Platform length (feet)
- Finish type
- Mounting type
- Floor type: concrete-fill pan, grating, or checker plate

## Area Calculation
- platformArea = width × length (square feet)

## Steel Weight
- framingLbsSqFt factor from dictionary lookup by platform type
- framingWeight = platformArea × framingLbsSqFt
- floorWeight = platformArea × floorWeightFactor (by floor type)
- totalSteelLbs = framingWeight + floorWeight

## Scrap
- scrapLbs = totalSteelLbs × scrap_factor_pct / 100

## Labor Hours
- shopHrsSqFt × platformArea = totalShopHrs
- fieldHrsSqFt × platformArea = totalFieldHrs

## Mounting Costs
- Embedded anchor cost per embed point
- Typically 4 embed points per platform

## Cost Calculation
- steelCost = (totalSteelLbs + scrapLbs) × steel_price_per_lb
- floorCost = platformArea × floor_rate (grating, pan, checker)
- finishCost = totalSteelLbs × finish_rate (galvanize, powder coat)
- shopLaborCost = totalShopHrs × shop_hourly_rate
- fieldLaborCost = totalFieldHrs × field_hourly_rate
- mountingCost = embed_rate × embedCount
- subtotalWithoutTax = all costs summed
- taxAmount = subtotalWithoutTax × tax_rate
- totalCost = subtotalWithoutTax + taxAmount
