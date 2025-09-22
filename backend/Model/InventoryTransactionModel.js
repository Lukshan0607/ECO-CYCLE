const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
  deliveryRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryRecord', required: true, unique: true },
  bottleType: { type: String, required: true },
  quantity: { type: Number, min: 1, required: true },
  sourceCollectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector' },
  transportStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  direction: { type: String, enum: ['IN'], default: 'IN' },
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
