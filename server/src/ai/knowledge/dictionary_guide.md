# Dictionary Guide — CALMISC Data Dictionary

## Overview
The Dictionary stores the lookup tables that drive the calculation engine. Admins can manage dictionary entries in the Settings → Dictionary section.

## Dictionary Categories (13 categories)

### 1. stair_type
- Defines available stair types
- Each entry has: label, shop hrs/riser, field hrs/riser
- Examples: "Metal Pan Stair", "Grating Tread", "Non-Metal"

### 2. stringer_type
- Rolled (W-shape) or Plate stringers
- For plate: width and thickness options
- For rolled: W-shape size options with lbs/ft from steel tables

### 3. guardRail_type
- All guard rail type options (30+ entries)
- Each entry has: label, type code, lbs/LF, shop hrs/LF, field hrs/LF
- Example: "2-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Post" → 6.84 lbs/LF

### 4. wallRail_type
- Wall-mounted handrail options
- Example: "1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe"

### 5. grabRail_type
- Grab rail (handrailing on guardrail) options
- Example: "1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe"

### 6. caneRail_type
- Cane rail options
- Examples: "Standard Cane Rail", "Continuous Cane Rail"

### 7. finish_option
- Available finish specifications
- Options: Primer, Painted, Galvanized, Galv+Painted, Powder Coated

### 8. mounting_type
- Post/anchor mounting methods
- Options: Bolted to Stringer, Welded to Stringer, Side Mounted Bolted, Side Mounted Welded, Embedded, Anchored, Anchored to Wall w/bracket, Anchored to Floor, Welded w/bracket

### 9. steel_grade_stair
- Steel grade options for stair stringers
- Examples: A36, A572-50, A992

### 10. steel_grade_rail
- Steel grade options for rail pipe
- Examples: A36, A572-50, SS316, SS 304

### 11. connection_type
- Stair connection to structure
- Options: Welded, Bolted, Bearing Plate

### 12. plate_thickness
- Plate stringer thickness options (inches)
- Common values: 3/8", 1/2", 5/8", 3/4"

### 13. plate_width
- Plate stringer width options (inches)
- Common values: 8", 10", 12", 14", 16"

## Managing Dictionary Entries

### Adding a New Entry
1. Go to Settings → Dictionary
2. Select a category from the dropdown
3. Click "Add Item" button
4. Enter the label and any associated rate values
5. Save

### Editing an Entry
1. Find the entry in the dictionary list
2. Click the edit (pencil) icon
3. Modify the label or rates
4. Save — changes apply to all FUTURE calculations

### Quick Edit (In Estimation Module)
- Small gear icons ⚙ appear next to select dropdowns in the estimation module
- Clicking opens a Quick Edit modal for that specific category
- Add or edit entries without leaving the estimation flow

### Deleting Dictionary Entries
- Entries can only be deleted if they are not referenced by any existing project
- Archived entries remain for historical data integrity

## Notes
- Rail type dictionary entries contain the lbs/LF and hrs/LF values critical to calculations
- Changing a dictionary entry does NOT retroactively change saved project calculations
- New calculations will use the updated values immediately
