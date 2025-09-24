const mongoose = require('mongoose');

const ProductionPlanSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
    quantity: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Paused', 'Cancelled'], default: 'Scheduled' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionPlan', ProductionPlanSchema);
