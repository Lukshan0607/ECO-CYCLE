const mongoose = require('mongoose');

const transportRequestSchema = new mongoose.Schema({
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
  collectorName: { type: String, required: true },
  bottleType: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  location: { type: String },
  status: { type: String, enum: ['Pending', 'Assigned', 'PickedUp', 'Delivered', 'Cancelled'], default: 'Pending' },
  transportStaffId: { type: String },
  assignedDriverId: { type: String },
  scheduledAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
