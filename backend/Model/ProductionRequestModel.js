const mongoose = require('mongoose');

const productionRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  team: {
    type: String,
    required: true
  },
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  notes: {
    type: String,
    default: ''
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  approvedBy: {
    type: String
  }
}, {
  timestamps: true
});

// Generate unique request ID before saving: RMR-<auto-incrementing number>
productionRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    try {
      // Find the latest request to determine the next sequence number
      const latest = await this.constructor
        .findOne({ requestId: { $regex: /^RMR-\d+$/ } })
        .sort({ createdAt: -1 })
        .select('requestId')
        .lean();

      let nextNumber = 1;
      if (latest && latest.requestId) {
        const match = latest.requestId.match(/^RMR-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      } else {
        // Fallback to countDocuments if no previous RMR- ids found
        const count = await this.constructor.countDocuments();
        nextNumber = count + 1;
      }

      // Zero-pad to 5 digits (e.g., RMR-00001)
      this.requestId = `RMR-${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating requestId:', error);
      // Last resort fallback ensures uniqueness likelihood
      this.requestId = `RMR-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('ProductionRequest', productionRequestSchema);
