const express = require('express');
const router = express.Router();
const {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollSummary,
  generatePayslip,
  deletePayroll,
  updatePayroll,
  getEmployeeSalaryExpenses
} = require('../Controllers/PayrollController');

// Process new payroll
router.post('/', processPayroll);

// Get all payrolls
router.get('/', getPayrolls);

// Get payroll summary
router.get('/summary', getPayrollSummary);

// Get single payroll by ID
router.get('/:id', getPayrollById);

// Update payroll record
router.put('/:id', updatePayroll);

// Update payroll status
router.patch('/:id/status', updatePayrollStatus);

// Get payslip
router.get('/payslip/:id', generatePayslip);

// Get employee salary expenses breakdown
router.get('/expenses/breakdown', getEmployeeSalaryExpenses);

// Delete a payroll record
router.delete('/:id', deletePayroll);

module.exports = router;
