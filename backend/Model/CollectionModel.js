const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  collectionId: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  collectorName: { type: String, required: true },
  bottleType: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  location: { type: String },
  // Award tracking
  awardedPoints: { type: Number, default: 0 },
  awardedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  awardedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
