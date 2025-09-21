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

module.exports = {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollSummary,
  
  // @desc    Generate payslip PDF
  // @route   GET /api/payroll/:id/payslip
  // @access  Private/Admin
  generatePayslip: asyncHandler(async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id)
        .populate('employeeId', 'fullName employeeId department position')
        .populate('createdBy', 'name email');

      if (!payroll) {
        res.status(404).json({ success: false, message: 'Payroll not found' });
        return;
      }

      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${payroll.employeeId.employeeId}-${payroll.month}.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add company header
      doc
        .fontSize(20)
        .text('EcoCycle', { align: 'center' })
        .fontSize(16)
        .text('PAYSLIP', { align: 'center', underline: true })
        .moveDown();
      
      // Add payslip details
      doc
        .fontSize(10)
        .text(`Employee: ${payroll.employeeId.fullName}`, { continued: true })
        .text(`ID: ${payroll.employeeId.employeeId}`, { align: 'right' })
        .text(`Department: ${payroll.department}`, { continued: true })
        .text(`Position: ${payroll.position}`, { align: 'right' })
        .text(`Pay Period: ${new Date(payroll.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`)
        .moveDown();
      
      // Add earnings section
      doc
        .fontSize(12)
        .text('Earnings', { underline: true })
        .fontSize(10)
        .text(`Basic Salary: LKR ${parseFloat(payroll.basicSalary).toFixed(2)}`)
        .text(`Allowances: LKR ${parseFloat(payroll.allowances).toFixed(2)}`)
        .text(`Overtime (${payroll.overtimeHours} hrs): LKR ${parseFloat(payroll.overtimePay).toFixed(2)}`)
        .moveDown();
      
      // Add deductions section
      doc
        .fontSize(12)
        .text('Deductions', { underline: true })
        .fontSize(10)
        .text(`EPF (Employee 8%): LKR ${parseFloat(payroll.epfEmployee).toFixed(2)}`)
        .text(`EPF (Employer 12%): LKR ${parseFloat(payroll.epfEmployer).toFixed(2)}`)
        .text(`ETF (Employer 3%): LKR ${parseFloat(payroll.etfEmployer).toFixed(2)}`)
        .text(`Other Deductions: LKR ${parseFloat(payroll.deductions).toFixed(2)}`)
        .moveDown();
      
      // Add totals
      doc
        .fontSize(12)
        .text('Summary', { underline: true })
        .fontSize(10)
        .text(`Gross Pay: LKR ${parseFloat(payroll.grossPay).toFixed(2)}`)
        .text(`Total Deductions: LKR ${(parseFloat(payroll.epfEmployee) + parseFloat(payroll.deductions)).toFixed(2)}`)
        .font('Helvetica-Bold')
        .text(`Net Pay: LKR ${parseFloat(payroll.netPay).toFixed(2)}`)
        .moveDown();
      
      // Add footer
      doc
        .font('Helvetica')
        .fontSize(8)
        .text('This is a computer-generated payslip. No signature is required.', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { align: 'center' });
      
      // Finalize the PDF and end the response
      doc.end();
    } catch (error) {
      console.error('Error generating payslip:', error);
      res.status(500).json({ success: false, message: 'Error generating payslip' });
    }
  })
};
