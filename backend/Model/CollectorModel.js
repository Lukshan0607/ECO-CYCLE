const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  location: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Collector', collectorSchema);
