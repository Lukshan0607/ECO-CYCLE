const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  // Explicitly define _id to avoid any automatic generation issues
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  expenseId: {
    type: String,
    unique: true,
    default: function() {
      return this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
    }
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    set: val => parseFloat(val).toFixed(2)
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Office Supplies',
      'Utilities',
      'Salaries',
      'Marketing',
      'Travel',
      'Equipment',
      'Software',
      'Rent',
      'Maintenance',
      'Other'
    ]
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'Please add a date'],
    set: function(val) {
      // Handle both Date objects and ISO date strings
      return val ? new Date(val) : new Date();
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please select a payment method'],
    enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Other']
  },
  receipt: {
    url: String,
    publicId: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add text index for search functionality
expenseSchema.index({ 
  description: 'text',
  category: 'text',
  paymentMethod: 'text',
  status: 'text'
});

module.exports = mongoose.model('Expense', expenseSchema);
