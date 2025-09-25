const mongoose = require('mongoose');

const QualityRecordSchema = new mongoose.Schema(
  {
    batchNo: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Passed', 'Failed', 'Rework'], default: 'Passed' },
    defects: { type: [String], default: [] },
    defectCount: { type: Number, default: 0, min: 0 },
    inspectionDate: { type: Date, default: Date.now },
    inspector: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    checks: {
      visual: { type: Boolean, default: true },
      dimensions: { type: Boolean, default: true },
      functional: { type: Boolean, default: true },
      packaging: { type: Boolean, default: true },
      safety: { type: Boolean, default: true }
    },
    inspectedQuantity: { type: Number, default: 0, min: 0 },
    stockApplied: { type: Boolean, default: false },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionPlan' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QualityRecord', QualityRecordSchema);
