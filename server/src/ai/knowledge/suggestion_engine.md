# Suggestion Engine — Guard Rail Auto-Selection

## Overview
The Suggestion Engine automatically selects the most appropriate guard rail type based on filter criteria the estimator sets. This prevents manual scrolling through 30+ rail types.

## How It Works

### Step 1: Set Suggestion Filters
Before selecting a rail type, use the four filter controls at the top of each guard rail configuration:

1. **Lines**: Any / 1-Line / 2-Line / 3-Line / 8-Line
   - Number of horizontal pipe rails
   - Typical: 2-Line for standard guard rail, 1-Line for handrail

2. **Pipe Size**: Any / 1 1/4" / 1 1/2"
   - Schedule 40 pipe diameter
   - 1 1/4" is most common; 1 1/2" for heavier duty

3. **Post Type**: Any / SCH 40 / SCH 80
   - Post pipe schedule
   - SCH 80 has thicker walls, heavier and stronger

4. **Infill**: Any / Pipe / ½" Picket / ¾" Picket / Mesh
   - What fills the space between the top rail and bottom rail / floor
   - Pipe = standard horizontal rails only
   - Picket = vertical bars between rails
   - Mesh = welded wire mesh panel infill

### Step 2: Auto-Selection
The engine scores all rail types against the filters:
- Score 2 = exact match on all non-null filters → Recommended
- Score 1 = partial match (some filters match)
- Score 0 = does not match (greyed out in dropdown)

The best-scoring rail type is automatically selected and shown with a ✓ green banner "Recommended for your inputs."

### Step 3: Manual Override
- If you choose a different rail type manually, the engine shows an amber ⚠ banner
- The banner says "Selected rail may not match current inputs"
- A "Use Suggested" button appears to revert to the auto-selected type

## Intermediate Rails Auto-Set
When a rail type is selected:
- intermediateRails is auto-set to (Lines − 1)
- Example: 2-Line → 1 intermediate rail; 3-Line → 2 intermediate rails

### Manual Override of Intermediate Rails
- You can type a different number in the Intermediate Rails field
- A brown "Custom count" badge appears
- Steel lbs/LF is adjusted proportionally:
  - delta = actual − standard
  - adjustedLbsLF = standard + (delta × standardLbsLF / Lines)
- An amber note shows when adjustment changes the steel weight

## When Filters Are Changed
- The suggestion engine re-runs immediately on every filter change
- If new filter combination has no exact match, the nearest partial match is shown
- The dropdown dims (opacity 40%) options that do not match any active filter
