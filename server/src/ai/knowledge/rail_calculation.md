# Rail Calculation — CALMISC Formula Reference

## Overview
Rail calculations cover Wall Rail, Guard Rail, Grab Rail, Cane Rail, and Kick Plate. Each type has unique lbs/LF factors, post spacing rules, and labor rates.

## Rail Types and Type Codes
- **WALL_RAIL**: 1-Line hand railing wall-bolted (bracket-mounted)
- **GUARD_1_LINE** through **GUARD_8_LINE**: Floor-mounted guard rails with 1–8 pipe lines
- **GRAB_RAIL**: Handrailing on guardrail (bracket-mounted)
- **CANE_RAIL**: Continuous cane rail (floor anchored)
- **KICK_PLATE**: Toeboard at floor level

## Key Input Fields
- Rail Type (full type name from dictionary)
- Rail Length (feet or inches)
- Mounting Type: Bolted to Stringer, Welded to Stringer, Embedded, Anchored, Side Mounted, Wall Bolted, Anchored to Floor
- Finish: Primer, Painted, Galvanized, Powder Coated
- Post Spacing (default 4 ft)
- Intermediate Rails (auto-set = Lines − 1, can be manually overridden)
- Toeplate Required (Yes/No) + Toeplate Width

## Steel Weight (lbs/LF)
Each rail type has a lbs/LF factor stored in the dictionary table.
- Example: 2-Line 1¼" SCH.40 pipe = 6.84 lbs/LF
- Example: 3-Line 1¼" SCH.40 pipe = 10.26 lbs/LF

### Intermediate Rail Adjustment
When intermediate rail count is manually overridden:
- delta = actual intermediateRails − standard (Lines − 1)
- adjustedLbsLf = dict.steelLbsLf + (delta × dict.steelLbsLf / Lines)
- Example: 2-Line at 6.84, add 1 extra rail: +3.42 → 10.26 lbs/LF total

## Post Count Calculation
- postQty = floor(railLength / postSpacing) + 1

## Steel Weight Total
- baseSteelLbs = adjustedLbsLf × railLength
- scrapLbs = baseSteelLbs × scrap_factor_pct / 100

## Bracket Count (Wall Rail / Grab Rail)
- bracketQty = postQty (brackets replace posts for wall/grab rail)

## Mounting Costs
- Embedded posts: mounting_embedded_rate × postQty
- Anchored posts: mounting_anchored_rate × postQty
- Anchor bolts: anchor_bolt_rate × postQty
- POR ROK anchors: por_rok_rate × postQty

## Toeplate Weight
- toeplateWeight = toeWidth(in)/12 × railLength × 0.2833 × plateThk

## Labor Hours per LF
- Shop hours/LF and field hours/LF from dictionary by rail type
- totalShopHrs = shopHrsLF × railLength
- totalFieldHrs = fieldHrsLF × railLength

## Finish Costs
- Galvanized: galvanize_rate × totalSteelLbs
- Powder Coated: powder_coat_rate × totalSteelLbs
- Primer/Painted: included in shop rate

## Cost Summary
- steelCost = (baseSteelLbs + scrapLbs) × steel_price_per_lb
- finishCost = (depends on finish type above)
- shopLaborCost = totalShopHrs × shop_hourly_rate
- fieldLaborCost = totalFieldHrs × field_hourly_rate
- mountingCost = embedded/anchored rates × posts
- subtotalWithoutTax = sum of all costs
- taxAmount = subtotalWithoutTax × tax_rate
- totalCost = subtotalWithoutTax + taxAmount

## Kick Plate Specifics
- Width options: 4", 6", 8", 10", 12"
- Weight: widthIn/12 × length × steel_price_per_lb factor
- No posts required
- Type code: KICK_PLATE
