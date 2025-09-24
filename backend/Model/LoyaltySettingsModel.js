const mongoose = require('mongoose');

const loyaltySettingsSchema = new mongoose.Schema({
  pointsPerRupee: {
    type: Number,
    required: true,
    min: [0, 'pointsPerRupee cannot be negative'],
    default: 0.1,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

loyaltySettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LoyaltySettings', loyaltySettingsSchema);
