const mongoose = require('mongoose');

const DeliveryRecordSchema = new mongoose.Schema({
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector', required: true },
  bottleType: { type: String, required: true },
  quantity: { type: Number, min: 1, required: true },
  transportStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  status: { type: String, enum: ['Collected', 'Assigned', 'InTransit', 'Delivered', 'Rejected'], default: 'Collected' },
  collectedAt: { type: Date, default: Date.now },
  assignedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  inventoryApplied: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryRecord', DeliveryRecordSchema);
