const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  month: {
    type: String, // Format: YYYY-MM
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  epfEmployee: {
    type: Number,
    default: 0
  },
  epfEmployer: {
    type: Number,
    default: 0
  },
  etfEmployer: {
    type: Number,
    default: 0
  },
  grossPay: {
    type: Number,
    required: true
  },
  netPay: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
payrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ department: 1 });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
