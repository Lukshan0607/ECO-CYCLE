const express = require('express');
const router = express.Router();
const {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollSummary,
  generatePayslip
} = require('../Controllers/PayrollController');

// Process new payroll
router.post('/', processPayroll);

// Get all payrolls
router.get('/', getPayrolls);

// Get payroll summary
router.get('/summary', getPayrollSummary);

// Get single payroll by ID
router.get('/:id', getPayrollById);

// Update payroll status
router.patch('/:id/status', updatePayrollStatus);

// Generate payslip PDF
router.get('/:id/payslip', generatePayslip);

module.exports = router;
