const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  collectionId: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  collectorName: { type: String, required: true },
  bottleType: { type: String, required: true },
  // quantity stored in kilograms; UI records grams and converts to kg
  // allow sub-1kg values (e.g., 0.350 kg). Set min to 0.001 (≈1 gram)
  quantity: { type: Number, required: true, min: 0.001 },
  location: { type: String },
  // Award tracking
  awardedPoints: { type: Number, default: 0 },
  awardedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  awardedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
