/**
 * library.config.js
 * Central configuration for the Library Management Module.
 * 
 * Used by:
 *   - server/src/routes/libraryRoutes.js
 *   - server/src/utils/excelGenerator.js
 *   - client/src/utils/library/validation.js (import the VALIDATION_RULES section)
 */

// ── Category Schema ───────────────────────────────────────────────────────────
// Maps each dictionary category to its human-readable label, the DB column
// names it uses, and display headers for the library table / Excel template.
//
// DB numeric columns available: steelLbsLf, shopLaborMhLf, fieldLaborMhLf,
//                               widthMax, spanMin, spanMax, price
// DB text columns available: label, value, description

const LIBRARY_CATEGORIES = {
  stringer_size: {
    label: 'Stringer Sizes',
    icon: 'ruler',
    description: 'Steel stringer size definitions with labor and pricing factors',
    fields: [
      { key: 'label',          header: 'Stringer size',  type: 'text',   required: true,  dbCol: 'label' },
      { key: 'widthMin',       header: 'Min. Stair width',type: 'number', required: false, dbCol: 'widthMin',       min: 0,   max: 100,  decimals: 1 },
      { key: 'widthMax',       header: 'max stair width',type: 'number', required: false, dbCol: 'widthMax',       min: 0,   max: 100,  decimals: 1 },
      { key: 'spanMin',        header: 'min length', type: 'number', required: false, dbCol: 'spanMin',        min: 0,   max: 100,  decimals: 1 },
      { key: 'spanMax',        header: 'max length', type: 'number', required: false, dbCol: 'spanMax',        min: 0,   max: 100,  decimals: 1 },
      { key: 'steelLbsLf',    header: 'weight',  type: 'number', required: true,  dbCol: 'steelLbsLf',     min: 0.1, max: 500,  decimals: 1 },
      { key: 'shopLaborMhLf', header: 'shop hrs',   type: 'number', required: true,  dbCol: 'shopLaborMhLf',  min: 0.1, max: 50,   decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'field hrs',  type: 'number', required: true,  dbCol: 'fieldLaborMhLf', min: 0.1, max: 50,   decimals: 2 },
      { key: 'shopEfficiency', header: 'shop efficiency', type: 'number', required: false, dbCol: 'shopEfficiency', min: 0,   max: 500,  decimals: 0 },
      { key: 'fieldEfficiency',header: 'Field efficiency',type: 'number', required: false, dbCol: 'fieldEfficiency',min: 0,   max: 500,  decimals: 0 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'StringerSizes',
  },

  finish_option: {
    label: 'Finish Options',
    icon: 'paintbrush',
    description: 'Paint, galvanize, and coating finish types with labor and material costs',
    fields: [
      { key: 'label',          header: 'Description',  type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',          header: 'Code',         type: 'text',   required: true,  dbCol: 'value' },
      { key: 'shopLaborMhLf', header: 'Shop Labor MH', type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0, max: 100, decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field Labor MH',type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0, max: 100, decimals: 2 },
      { key: 'price',          header: 'Price ($/LB)', type: 'number', required: false, dbCol: 'price',          min: 0, max: 999,  decimals: 4 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'FinishOptions',
  },

  guardRail_type: {
    label: 'Guard Rail Types',
    icon: 'shield',
    description: 'Guard rail material types with steel weight and labor multipliers',
    fields: [
      { key: 'label',          header: 'Description',   type: 'text',   required: true,  dbCol: 'label' },
      { key: 'steelLbsLf',    header: 'Steel LBS/LF',  type: 'number', required: true,  dbCol: 'steelLbsLf',     min: 0.1, max: 500, decimals: 1 },
      { key: 'shopLaborMhLf', header: 'Shop MH/LF',    type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0,   max: 50,  decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field MH/LF',   type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0,   max: 50,  decimals: 2 },
      { key: 'price',          header: 'Price ($/LF)',  type: 'number', required: false, dbCol: 'price',          min: 0,   max: 9999,decimals: 4 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'GuardRailTypes',
  },

  wallRail_type: {
    label: 'Wall Rail Types',
    icon: 'minus-square',
    description: 'Wall-mounted rail types with steel weight and labor multipliers',
    fields: [
      { key: 'label',          header: 'Description',   type: 'text',   required: true,  dbCol: 'label' },
      { key: 'steelLbsLf',    header: 'Steel LBS/LF',  type: 'number', required: true,  dbCol: 'steelLbsLf',     min: 0.1, max: 500, decimals: 1 },
      { key: 'shopLaborMhLf', header: 'Shop MH/LF',    type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0,   max: 50,  decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field MH/LF',   type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0,   max: 50,  decimals: 2 },
      { key: 'price',          header: 'Price ($)',     type: 'number', required: false, dbCol: 'price',          min: 0,   max: 9999,decimals: 4 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'WallRailTypes',
  },

  grabRail_type: {
    label: 'Grab Rail Types',
    icon: 'grip',
    description: 'Grab bar and handrail types with steel weight and labor multipliers',
    fields: [
      { key: 'label',          header: 'Description',   type: 'text',   required: true,  dbCol: 'label' },
      { key: 'steelLbsLf',    header: 'Steel LBS/LF',  type: 'number', required: true,  dbCol: 'steelLbsLf',     min: 0.1, max: 500, decimals: 1 },
      { key: 'shopLaborMhLf', header: 'Shop MH/LF',    type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0,   max: 50,  decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field MH/LF',   type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0,   max: 50,  decimals: 2 },
      { key: 'price',          header: 'Price ($)',     type: 'number', required: false, dbCol: 'price',          min: 0,   max: 9999,decimals: 4 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'GrabRailTypes',
  },

  caneRail_type: {
    label: 'Cane Rail Types',
    icon: 'activity',
    description: 'Cane rail types with steel weight and labor factors',
    fields: [
      { key: 'label',          header: 'Description',   type: 'text',   required: true,  dbCol: 'label' },
      { key: 'steelLbsLf',    header: 'Steel LBS/LF',  type: 'number', required: true,  dbCol: 'steelLbsLf',     min: 0.1, max: 500, decimals: 1 },
      { key: 'shopLaborMhLf', header: 'Shop MH/LF',    type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0,   max: 50,  decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field MH/LF',   type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0,   max: 50,  decimals: 2 },
      { key: 'price',          header: 'Price ($/LF)',  type: 'number', required: false, dbCol: 'price',          min: 0,   max: 9999,decimals: 4 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'CaneRailTypes',
  },

  stair_type: {
    label: 'Stair Types',
    icon: 'layers',
    description: 'Stair tread types and stair configuration categories',
    fields: [
      { key: 'label', header: 'Description', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Code',        type: 'text', required: true, dbCol: 'value' },
      { key: 'price', header: 'Price ($/LF)', type: 'number', required: false, dbCol: 'price', min: 0, max: 9999, decimals: 4 },
      { key: 'shopLaborMhLf', header: 'Shop MH/LF', type: 'number', required: false, dbCol: 'shopLaborMhLf', min: 0, max: 50, decimals: 3 },
      { key: 'fieldLaborMhLf', header: 'Field MH/LF', type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0, max: 50, decimals: 3 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'StairTypes',
  },

  platform_type: {
    label: 'Platform Types',
    icon: 'layout',
    description: 'Stair landing and platform configuration types',
    fields: [
      { key: 'label', header: 'Description', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Code',        type: 'text', required: true, dbCol: 'value' },
      { key: 'price', header: 'Price ($/SQFT)', type: 'number', required: false, dbCol: 'price', min: 0, max: 99999, decimals: 2 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'PlatformTypes',
  },

  grating_type: {
    label: 'Grating & Tread Factors',
    icon: 'grid',
    description: 'Grating and tread types with baseline costs and multipliers',
    fields: [
      { key: 'label',          header: 'Description',    type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',          header: 'Code',           type: 'text',   required: true,  dbCol: 'value' },
      { key: 'price',          header: 'Price ($/SQFT)', type: 'number', required: false, dbCol: 'price',          min: 0, max: 9999, decimals: 4 },
      { key: 'shopLaborMhLf', header: 'Labor Factor',   type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0, max: 10,   decimals: 3 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'GratingTypes',
  },

  mounting_type: {
    label: 'Mounting & Hardware',
    icon: 'tool',
    description: 'Rail mounting types (embedded, anchored, bolted, welded)',
    fields: [
      { key: 'label', header: 'Description', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Code',        type: 'text', required: true, dbCol: 'value' },
      { key: 'price', header: 'Price ($/EA)', type: 'number', required: false, dbCol: 'price', min: 0, max: 9999, decimals: 4 },
    ],
    isSystemDefaultable: false,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'MountingTypes',
  },

  connection_type: {
    label: 'Connection Types',
    icon: 'link',
    description: 'Connection engineering types (welded, bolted) with MH per point',
    fields: [
      { key: 'label',          header: 'Description',       type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',          header: 'Code',              type: 'text',   required: true,  dbCol: 'value' },
      { key: 'shopLaborMhLf', header: 'Shop MH/Point',     type: 'number', required: false, dbCol: 'shopLaborMhLf',  min: 0, max: 20, decimals: 2 },
      { key: 'fieldLaborMhLf',header: 'Field MH/Point',    type: 'number', required: false, dbCol: 'fieldLaborMhLf', min: 0, max: 20, decimals: 2 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'ConnectionTypes',
  },

  steel_grade_stair: {
    label: 'Steel Grades (Stair)',
    icon: 'zap',
    description: 'Steel grade specifications for stair fabrication',
    fields: [
      { key: 'label', header: 'Grade Name', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Code',       type: 'text', required: true, dbCol: 'value' },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'SteelGradesStair',
  },

  steel_grade_rail: {
    label: 'Steel Grades (Rail)',
    icon: 'zap',
    description: 'Steel grade specifications for rail fabrication',
    fields: [
      { key: 'label', header: 'Grade Name', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Code',       type: 'text', required: true, dbCol: 'value' },
      { key: 'price', header: 'Price ($/LB)', type: 'number', required: false, dbCol: 'price', min: 0, max: 999, decimals: 4 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'SteelGradesRail',
  },

  material_type: {
    label: 'Material Types (Stair)',
    icon: 'box',
    description: 'General material specifications and pricing per LB',
    fields: [
      { key: 'label', header: 'Material Type', type: 'text', required: true, dbCol: 'label' },
      { key: 'value', header: 'Grade',         type: 'text', required: true, dbCol: 'value' },
      { key: 'price', header: 'Cost ($)/LB',  type: 'number', required: false, dbCol: 'price', min: 0, max: 999, decimals: 4 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'MaterialTypes',
  },

  gauge_plate_spec: {
    label: 'Pan Plate / Gauge Specs',
    icon: 'layers',
    description: 'Pan plate thickness (gauge) with weight and pricing factors',
    fields: [
      { key: 'label',          header: 'Description',   type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',          header: 'Gauge/Code',    type: 'text',   required: true,  dbCol: 'value' },
      { key: 'steelLbsLf',    header: 'Steel LBS/SQFT',type: 'number', required: true,  dbCol: 'steelLbsLf', min: 0, max: 100, decimals: 2 },
      { key: 'price',          header: 'Price ($/SQFT)',type: 'number', required: false, dbCol: 'price',      min: 0, max: 999, decimals: 2 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'GaugePlateSpecs',
  },

  pan_plate_type: {
    label: 'Pan Plate Types',
    icon: 'grid',
    description: 'Pan plate configuration types (Z-shape, C-shape, bent, welded) with shop labor hours per SF',
    fields: [
      { key: 'label',          header: 'Pan Plate Type',      type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',          header: 'Code',                type: 'text',   required: true,  dbCol: 'value' },
      { key: 'shopEfficiency', header: 'Shop Hrs/SQFT',       type: 'number', required: true,  dbCol: 'shopEfficiency', min: 0.5, max: 5, decimals: 2 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'PanPlateTypes',
  },

  pan_support_type: {
    label: 'Pan Support Types',
    icon: 'layers',
    description: 'Pan plate support configurations (Single, Dual, Bent, Welded) with labor multiplier',
    fields: [
      { key: 'label',           header: 'Support Type',        type: 'text',   required: true,  dbCol: 'label' },
      { key: 'value',           header: 'Code',                type: 'text',   required: true,  dbCol: 'value' },
      { key: 'fieldEfficiency', header: 'Labor Multiplier (%)', type: 'number', required: true,  dbCol: 'fieldEfficiency', min: 50, max: 200, decimals: 0 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'PanSupportTypes',
  },

  pan_plate_config: {
    label: 'Pan Plate Configurations',
    icon: 'clipboard',
    description: 'Unified pan plate specifications including weight, labor, and dimensions',
    fields: [
      { key: 'label',           header: 'PL THK',               type: 'text',   required: true,  dbCol: 'label' },
      { key: 'description',     header: 'PAN TYPE',             type: 'text',   required: false, dbCol: 'description' },
      { key: 'value',           header: 'PAN SUPPORT TYPE',     type: 'text',   required: true,  dbCol: 'value' },
      { key: 'spanMin',         header: 'MIN LENGTH FT',        type: 'number', required: false, dbCol: 'spanMin',         min: 0,    max: 50,   decimals: 2 },
      { key: 'spanMax',         header: 'MAX LENGTH FT',        type: 'number', required: false, dbCol: 'spanMax',         min: 0,    max: 50,   decimals: 2 },
      { key: 'steelLbsLf',      header: 'WEIGHT LBS',           type: 'number', required: false, dbCol: 'steelLbsLf',      min: 0,    max: 100,  decimals: 4 },
      { key: 'shopLaborMhLf',   header: 'SHOP HRS HR',          type: 'number', required: true,  dbCol: 'shopLaborMhLf',   min: 0,    max: 10,   decimals: 2 },
      { key: 'fieldLaborMhLf',  header: 'FIELD HRS HR',         type: 'number', required: false, dbCol: 'fieldLaborMhLf',  min: 0,    max: 10,   decimals: 2 },
      { key: 'shopEfficiency',  header: 'SHOP EFFICIENCY %',    type: 'number', required: false, dbCol: 'shopEfficiency',  min: 0,    max: 200,  decimals: 0 },
      { key: 'fieldEfficiency', header: 'FIELD EFFICIENCY %',   type: 'number', required: false, dbCol: 'fieldEfficiency', min: 0,    max: 200,  decimals: 0 },
      { key: 'price',           header: 'COST/PIECE',           type: 'number', required: false, dbCol: 'price',           min: 0,    max: 9999, decimals: 2 },
    ],
    isSystemDefaultable: true,
    allowedRoles: ['admin', 'owner', 'superadmin'],
    excelFilename: 'PanPlateConfigs',
  },

};

// ── Excel Template Constants ────────────────────────────────────────────────
const SHEET_NAMES = {
  instructions: 'Instructions',
  data: 'Data',
  rules: 'Validation Rules',
};

// ── System Default Identifiers ──────────────────────────────────────────────
const SYSTEM_DEFAULT_FINISHES = [
  'PRIMER', 'PAINTED', 'GALVANIZED', 'GALV+PAINTED', 'POWDER COATED', 'POWDER_COATED',
];

// ── Excel Template Settings ─────────────────────────────────────────────────
const EXCEL_TEMPLATE_BLANK_ROWS = 10;  // blank rows at bottom for new entries
const CACHE_TTL_SECONDS = 30;

// ── Roles with Library access ───────────────────────────────────────────────
// Option A: admin-only (estimators have no access)
const LIBRARY_ADMIN_ROLES = ['admin', 'owner', 'superadmin'];

// ── Category display order for sidebar ─────────────────────────────────────
const CATEGORY_ORDER = [
  'finish_option',
  'stringer_size',
  'guardRail_type',
  'wallRail_type',
  'grabRail_type',
  'caneRail_type',
  'stair_type',
  'platform_type',
  'grating_type',
  'mounting_type',
  'connection_type',
  'steel_grade_stair',
  'steel_grade_rail',
  'material_type',
  'gauge_plate_spec',
  'pan_plate_type',
  'pan_support_type',
  'pan_plate_config',
];

module.exports = {
  LIBRARY_CATEGORIES,
  SHEET_NAMES,
  SYSTEM_DEFAULT_FINISHES,
  EXCEL_TEMPLATE_BLANK_ROWS,
  CACHE_TTL_SECONDS,
  LIBRARY_ADMIN_ROLES,
  CATEGORY_ORDER,
};
