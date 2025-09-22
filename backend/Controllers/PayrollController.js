const Payroll = require('../Model/PayrollModel');
// Employee model is optional for basic functionality
let Employee;
try {
  Employee = require('../Model/EmployeeModel');
} catch (err) {
  console.warn('EmployeeModel not found. Some features may be limited.');
}

const PDFDocument = require('pdfkit');

// Simple async handler middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Process new payroll
// @route   POST /api/payroll
// @access  Private/Admin
const processPayroll = asyncHandler(async (req, res) => {
  const {
    employeeId,
    month,
    basicSalary,
    allowances,
    overtimeHours,
    overtimePay,
    deductions,
    notes
  } = req.body;

  // Check if employee exists if Employee model is available
  let employee = { fullName: 'Unknown Employee', employeeId: employeeId };
  if (Employee) {
    const emp = await Employee.findById(employeeId);
    if (emp) {
      employee = {
        fullName: emp.fullName || 'Unknown Employee',
        employeeId: emp.employeeId || employeeId,
        department: emp.department || 'Unknown',
        position: emp.position || 'Unknown'
      };
    }
  }

  // Check if payroll already exists for this employee and month
  const existingPayroll = await Payroll.findOne({
    employeeId,
    month: new Date(month).toISOString().substring(0, 7)
  });

  if (existingPayroll) {
    res.status(400);
    throw new Error('Payroll already processed for this employee and month');
  }

  // Calculate payroll components
  const epfEmployee = (basicSalary * 0.08).toFixed(2);
  const epfEmployer = (basicSalary * 0.12).toFixed(2);
  const etfEmployer = (basicSalary * 0.03).toFixed(2);
  const grossPay = (parseFloat(basicSalary) + parseFloat(allowances) + parseFloat(overtimePay)).toFixed(2);
  const netPay = (grossPay - parseFloat(epfEmployee) - parseFloat(deductions)).toFixed(2);

  // Create payroll
  const payroll = await Payroll.create({
    employeeId,
    employeeName: employee.fullName || 'Unknown Employee',
    department: employee.department,
    position: employee.position,
    month: new Date(month).toISOString().substring(0, 7),
    basicSalary,
    allowances: parseFloat(allowances) || 0,
    overtimeHours: parseFloat(overtimeHours) || 0,
    overtimePay: parseFloat(overtimePay) || 0,
    deductions: parseFloat(deductions) || 0,
    epfEmployee: parseFloat(epfEmployee),
    epfEmployer: parseFloat(epfEmployer),
    etfEmployer: parseFloat(etfEmployer),
    grossPay: parseFloat(grossPay),
    netPay: parseFloat(netPay),
    notes,
    status: 'processed'
  });

  res.status(201).json({
    success: true,
    data: payroll
  });
});

// @desc    Get all payrolls
// @route   GET /api/payroll
// @access  Private/Admin
const getPayrolls = asyncHandler(async (req, res) => {
  const { month, department, status } = req.query;
  
  // Build query
  const query = {};
  if (month) query.month = month;
  if (department) query.department = department;
  if (status) query.status = status;

  const payrolls = await Payroll.find(query)
    .sort({ month: -1, employeeName: 1 })
    .lean();

  // Process the data to ensure consistent format for frontend
  const processedPayrolls = payrolls.map(payroll => ({
    ...payroll,
    _id: payroll._id.toString(),
    employeeId: payroll.employeeId ? payroll.employeeId.toString() : '',
    // Ensure all required fields have default values
    employeeName: payroll.employeeName || 'Unknown Employee',
    department: payroll.department || 'Unknown',
    position: payroll.position || 'Unknown',
    // Remove any nested objects that might cause issues
    employee: undefined
  }));

  res.status(200).json({
    success: true,
    count: processedPayrolls.length,
    data: processedPayrolls
  });
});

// @desc    Get payroll by ID
// @route   GET /api/payroll/:id
// @access  Private/Admin
const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).lean();

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  // Process the data to ensure consistent format for frontend
  const processedPayroll = {
    ...payroll,
    _id: payroll._id.toString(),
    employeeId: payroll.employeeId ? payroll.employeeId.toString() : '',
    // Ensure all required fields have default values
    employeeName: payroll.employeeName || 'Unknown Employee',
    department: payroll.department || 'Unknown',
    position: payroll.position || 'Unknown',
    // Remove any nested objects that might cause issues
    employee: undefined
  };

  res.status(200).json({
    success: true,
    data: processedPayroll
  });
});

// @desc    Update payroll status
// @route   PATCH /api/payroll/:id/status
// @access  Private/Admin
const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const payroll = await Payroll.findById(req.params.id);
  
  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  // Update status and set paidAt if status is 'paid'
  payroll.status = status;
  if (status === 'paid') {
    payroll.paidAt = Date.now();
  }

  await payroll.save();

  res.status(200).json({
    success: true,
    data: payroll
  });
});

// @desc    Get payroll summary
// @route   GET /api/payroll/summary
// @access  Private/Admin
const getPayrollSummary = asyncHandler(async (req, res) => {
  const { month } = req.query;
  
  const match = {};
  if (month) match.month = month;

  const summary = await Payroll.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalBasicSalary: { $sum: '$basicSalary' },
        totalAllowances: { $sum: '$allowances' },
        totalOvertime: { $sum: '$overtimePay' },
        totalDeductions: { $sum: { $add: ['$epfEmployee', '$deductions'] } },
        totalEpfEmployee: { $sum: '$epfEmployee' },
        totalEpfEmployer: { $sum: '$epfEmployer' },
        totalEtfEmployer: { $sum: '$etfEmployer' },
        totalNetPay: { $sum: '$netPay' },
        totalCost: { 
          $sum: { 
            $add: ['$netPay', '$epfEmployer', '$etfEmployer'] 
          } 
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: summary[0] || {}
  });
});

// @desc    Delete a payroll record
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payroll exists
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check if payroll is already processed/paid
    if (payroll.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a paid payroll record. Please void the payment first.'
      });
    }

    // Delete the payroll record
    await Payroll.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollSummary,
  deletePayroll,
  
  // @desc    Generate payslip PDF
  // @route   GET /api/payroll/:id/payslip
  // @access  Private/Admin
  generatePayslip: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll) {
        return res.status(404).json({ success: false, message: 'Payroll not found' });
      }

      return new Promise((resolve, reject) => {
        // Create a new PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Create a buffer to store the PDF
        const chunks = [];
        
        // Collect PDF chunks
        doc.on('data', (chunk) => chunks.push(chunk));
        
        // When PDF generation is done
        doc.on('end', () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);
            const base64Pdf = pdfBuffer.toString('base64');
            res.json({
              success: true,
              filename: `payslip-${payroll.employeeId || 'employee'}-${payroll.month || 'date'}.pdf`,
              data: `data:application/pdf;base64,${base64Pdf}`
            });
            resolve();
          } catch (error) {
            console.error('Error processing PDF:', error);
            if (!res.headersSent) {
              res.status(500).json({ success: false, message: 'Error processing PDF' });
            }
            reject(error);
          }
        });
        
        // Handle errors
        doc.on('error', (err) => {
          console.error('PDF generation error:', err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error generating PDF' });
          }
          reject(err);
        });
        
        // Generate PDF content
        doc
          .fontSize(20)
          .text('EcoCycle', { align: 'center' })
          .fontSize(16)
          .text('PAYSLIP', { align: 'center', underline: true })
          .moveDown()
          
          // Employee details
          .fontSize(10)
          .text(`Employee: ${payroll.employeeName || 'N/A'}`, { continued: true })
          .text(`ID: ${payroll.employeeId || 'N/A'}`, { align: 'right' })
          .text(`Department: ${payroll.department || 'N/A'}`, { continued: true })
          .text(`Position: ${payroll.position || 'N/A'}`, { align: 'right' })
          .text(`Pay Period: ${payroll.month ? new Date(payroll.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}`)
          .moveDown()
          
          // Earnings section
          .fontSize(12)
          .text('Earnings', { underline: true })
          .fontSize(10)
          .text(`Basic Salary: LKR ${parseFloat(payroll.basicSalary || 0).toFixed(2)}`)
          .text(`Allowances: LKR ${parseFloat(payroll.allowances || 0).toFixed(2)}`)
          .text(`Overtime (${payroll.overtimeHours || 0} hrs): LKR ${parseFloat(payroll.overtimePay || 0).toFixed(2)}`)
          .moveDown()
          
          // Deductions section
          .fontSize(12)
          .text('Deductions', { underline: true })
          .fontSize(10)
          .text(`EPF (Employee 8%): LKR ${parseFloat(payroll.epfEmployee || 0).toFixed(2)}`)
          .text(`EPF (Employer 12%): LKR ${parseFloat(payroll.epfEmployer || 0).toFixed(2)}`)
          .text(`ETF (Employer 3%): LKR ${parseFloat(payroll.etfEmployer || 0).toFixed(2)}`)
          .text(`Other Deductions: LKR ${parseFloat(payroll.deductions || 0).toFixed(2)}`)
          .moveDown()
          
          // Summary
          .fontSize(12)
          .text('Summary', { underline: true })
          .fontSize(10)
          .text(`Gross Pay: LKR ${parseFloat(payroll.grossPay || 0).toFixed(2)}`)
          .text(`Total Deductions: LKR ${(parseFloat(payroll.epfEmployee || 0) + parseFloat(payroll.deductions || 0)).toFixed(2)}`)
          .font('Helvetica-Bold')
          .text(`Net Pay: LKR ${parseFloat(payroll.netPay || 0).toFixed(2)}`)
          .moveDown()
          
          // Footer
          .font('Helvetica')
          .fontSize(8)
          .text('This is a computer-generated payslip. No signature is required.', { align: 'center' })
          .text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { align: 'center' });
        
        // Finalize the PDF
        doc.end();
      });
    } catch (error) {
      console.error('Error in payslip generation:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error generating payslip', 
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }
  }
};
