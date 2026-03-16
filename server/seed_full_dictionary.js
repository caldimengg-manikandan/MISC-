require('dotenv').config();
const mongoose = require('mongoose');
const Dictionary = require('./src/models/Dictionary');

const STAIR_TYPES = [
  { label: 'Pan Plate — Concrete Filled', value: 'pan-concrete' },
  { label: 'Grating Tread', value: 'grating-tread' },
  { label: 'Non-Metal Stair', value: 'non-metal' },
];

const STRINGER_SIZES  = ['W8x31', 'W10x33', 'W12x35', 'W12x40', 'W12x50', 'W14x43', 'MC12x10.6', 'C12x20.7', 'C15x33.9'];
const CONNECTION_TYPES = ['Welded', 'Bolted'];
const FINISH_OPTIONS   = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

const GRATING_TYPES = [
  '1 1/4" Bar grating / Welded',
  '1 1/4" Bar grating / Bolted',
  '1" Bar grating / Welded',
  '1" Bar grating / Bolted',
  'McNichols Treads',
  'Other Pre-fabricated Treads'
];

const PLATFORM_TYPES = [
  { value: 'pan-lte8',    label: 'Metal Pan Platform  ≤ 8 ft' },
  { value: 'pan-8-10',    label: 'Metal Pan Platform  8 – 10 ft' },
  { value: 'pan-10-12',   label: 'Metal Pan Platform  10 – 12 ft' },
  { value: 'grating-lte8',label: 'Grating Platform  ≤ 8 ft' },
  { value: 'grating-8-10',label: 'Grating Platform  8 – 10 ft' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Clear existing
  await Dictionary.deleteMany({});
  console.log('Cleared dictionary');

  const data = [];

  // Stair Types
  STAIR_TYPES.forEach((t, i) => data.push({ category: 'stair_type', label: t.label, value: t.value || t.label.toLowerCase().replace(/\s+/g, '-'), order: i + 1 }));

  // Stringer Sizes
  STRINGER_SIZES.forEach((s, i) => data.push({ category: 'stringer_size', label: s, value: s, order: i + 1 }));

  // Connection Types
  CONNECTION_TYPES.forEach((c, i) => data.push({ category: 'connection_type', label: c, value: c, order: i + 1 }));

  // Finishes
  FINISH_OPTIONS.forEach((f, i) => data.push({ category: 'finish_option', label: f, value: f, order: i + 1 }));

  // Grating Types
  GRATING_TYPES.forEach((g, i) => data.push({ category: 'grating_type', label: g, value: g, order: i + 1 }));

  // Platform Types
  PLATFORM_TYPES.forEach((p, i) => data.push({ category: 'platform_type', label: p.label, value: p.value || p.label.toLowerCase().replace(/\s+/g, '-'), order: i + 1 }));

  await Dictionary.insertMany(data);
  console.log('Seeded ', data.length, ' items');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
