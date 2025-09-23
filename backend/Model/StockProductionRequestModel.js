const mongoose = require('mongoose');

const StockProductionRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    required: true,
    index: true,
    match: /^RI-\d{4}$/
  },
  weightKg: {
    type: Number,
    required: true,
    min: 0.001
  }
}, { timestamps: true });

module.exports = mongoose.model('StockProductionRequest', StockProductionRequestSchema);
