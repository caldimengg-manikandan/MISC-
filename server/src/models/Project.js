// server/src/models/Project.js
const mongoose = require('mongoose');

const flightGeometrySchema = new mongoose.Schema({
  flightId: {
    type: String,
    required: true
  },
  flightNumber: {
    type: String,
    required: true
  },
  // Geometry data
  nosingToNosingHorizontal: String,
  nosingToNosingVertical: String,
  numberOfRisers: String,
  stairWidth: String,
  stairAngle: String,
  headroomClearance: String,
  treadThickness: String,
  riserThickness: String,
  // Status tracking
  hasCustomValues: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  savedAt: {
    type: Date
  }
}, { _id: false }); // No separate ID needed

const stairSchema = new mongoose.Schema({
  // Basic stair info
  stairName: String,
  stairType: String,
  landingType: String,
  numberOfLandings: Number,
  
  // Flights array (for tracking flight names/IDs)
  flights: [{
    id: String,
    number: String,
    description: String
  }],
  
  // Flight geometry data - stored separately
  flightGeometries: [flightGeometrySchema],
  
  // Nosing extensions
  leftEndExtension: String,
  rightEndExtension: String,
  frontNosingExtension: String,
  
  // Stringer and tread details
  stringerType: String,
  customStringerType: String,
  treadType: String,
  customTreadType: String,
  
  // Connection details
  groundConnectionType: String,
  connectionAngle: String,
  boltSize: String,
  numberOfBolts: Number,
  boltStandard: String,
  customBoltStandard: String,
  
  // Beam details
  mainBeam: {
    size: String,
    material: String,
    length: String
  },
  infillBeam: {
    size: String,
    material: String,
    quantity: String
  },
  endBeam: {
    size: String,
    material: String,
    quantity: String
  },

  // Rail details per stair
  wallRail: mongoose.Schema.Types.Mixed,
  grabRail: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  projectNumber: {
    type: String,
    required: true,
    unique: true
  },
  projectName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: String,
  projectLocation: String,
  architect: String,
  eor: String,
  gcName: String,
  detailer: String,
  vendorName: String,
  aiscCertified: { type: String, default: 'Yes' },
  units: { type: String, default: 'Imperial' },
  notes: String,
  
  // Multiple stair configurations (if needed)
  stairs: [stairSchema],
  
  // Existing rail types...
  // guardRails array
  guardRails: [mongoose.Schema.Types.Mixed],

  // Custom rail values map
  customRailValues: {
    type: Map,
    of: {
      steelLbsPerLF: Number,
      shopMHPerLF: Number,
      fieldMHPerLF: Number
    }
  },
  
  metalPlatform: {
    quantity: Number,
    length: Number,
    width: Number,
    area: Number,
    type: String
  },
  
  starMetalPans: {
    quantity: Number,
    tread: Number,
    riser: Number,
    width: Number,
    stringerType: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft'
  },
  
  // Calculation results
  totalWeight: Number,
  totalCost: Number,
  materialList: [{
    item: String,
    quantity: Number,
    unit: String,
    weight: Number,
    cost: Number
  }]
});

// Update timestamp on save
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.stairs && this.stairs.length > 0) {
    this.stairs.forEach(stair => {
      if (stair.flightGeometries && stair.flightGeometries.length > 0) {
        stair.flightGeometries.forEach(geo => {
          if (geo.hasCustomValues) {
            geo.savedAt = new Date();
          }
        });
      }
    });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
