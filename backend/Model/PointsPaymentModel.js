const mongoose = require('mongoose');

const PointsPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    requiredPoints: { type: Number, required: true },
    subtotalSnapshot: { type: Number, required: true },
    rateSnapshot: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PointsPayment', PointsPaymentSchema);
