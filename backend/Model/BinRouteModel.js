const mongoose = require('mongoose');

const BinRouteSchema = new mongoose.Schema(
  {
    routeId: { type: String, index: true, unique: true },
    location: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    managerName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active', index: true },
    distanceKm: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Generate sequential Location ID: LOC0001, LOC0002, ...
BinRouteSchema.pre('save', async function (next) {
  try {
    // If already has a proper LOC#### ID, keep it
    if (this.routeId && /^LOC\d{4}$/.test(this.routeId)) return next();

    // Assign new LOC#### if new or if legacy BR-* id
    if (this.isNew || !this.routeId || this.routeId.startsWith('BR-')) {
      const latest = await this.constructor
        .findOne({ routeId: { $regex: /^LOC\d{4}$/ } })
        .sort({ routeId: -1 }) // zero-padded -> lex sort works
        .lean();

      let nextNum = 1;
      if (latest && typeof latest.routeId === 'string') {
        const m = latest.routeId.match(/LOC(\d{4})/);
        if (m) nextNum = parseInt(m[1], 10) + 1;
      }
      this.routeId = `LOC${String(nextNum).padStart(4, '0')}`;
    }
    return next();
  } catch (err) {
    // Fallback to LOC with random number to avoid save failure
    this.routeId = `LOC${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    return next();
  }
});

module.exports = mongoose.model('BinRoute', BinRouteSchema);
