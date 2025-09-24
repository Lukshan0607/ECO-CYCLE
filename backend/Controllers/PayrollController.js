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

// @desc    Update a payroll record
// @route   PUT /api/payroll/:id
// @access  Private/Admin
const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll record not found');
  }

  const {
    month,
    basicSalary,
    allowances,
    overtimeHours,
    overtimePay,
    deductions,
    notes,
    status,
    dateProcessed
  } = req.body;

  // Update only the fields that are provided in the request
  const updateFields = {};
  if (month) updateFields.month = month;
  if (basicSalary !== undefined) updateFields.basicSalary = basicSalary;
  if (allowances !== undefined) updateFields.allowances = allowances;
  if (overtimeHours !== undefined) updateFields.overtimeHours = overtimeHours;
  if (overtimePay !== undefined) updateFields.overtimePay = overtimePay;
  if (deductions !== undefined) updateFields.deductions = deductions;
  if (notes !== undefined) updateFields.notes = notes;
  if (status) updateFields.status = status;
  if (dateProcessed) updateFields.dateProcessed = dateProcessed;
  
  // Recalculate totals if any financial fields are updated
  if (basicSalary !== undefined || allowances !== undefined || 
      overtimePay !== undefined || deductions !== undefined) {
    const grossPay = (parseFloat(basicSalary || payroll.basicSalary) || 0) + 
                    (parseFloat(allowances || payroll.allowances) || 0) + 
                    (parseFloat(overtimePay || payroll.overtimePay) || 0);
    
    const epfEmployee = (parseFloat(basicSalary || payroll.basicSalary) || 0) * 0.08; // 8% of basic
    const etfEmployer = (parseFloat(basicSalary || payroll.basicSalary) || 0) * 0.03; // 3% of basic
    const netPay = grossPay - (parseFloat(deductions || payroll.deductions) || 0) - epfEmployee;
    
    updateFields.grossPay = grossPay;
    updateFields.epfEmployee = epfEmployee;
    updateFields.etfEmployer = etfEmployer;
    updateFields.netPay = netPay;
  }

  const updatedPayroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedPayroll
  });
});

// @desc    Delete a payroll record
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = asyncHandler(async (req, res) => {
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
});

// @desc    Generate payslip PDF
// @route   GET /api/payroll/:id/payslip
// @access  Private/Admin
const generatePayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'employeeId accountNumber bankName fullName department position');

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    // Get employee details from the populated field or fallback to payroll data
    const employee = payroll.employeeId || {};
    const employeeName = employee.fullName || payroll.employeeName || 'N/A';
    const employeeId = employee.employeeId || payroll.employeeId || 'N/A';
    const department = employee.department || payroll.department || 'N/A';
    const position = employee.position || payroll.position || 'N/A';
    const bankAccount = employee.accountNumber || 'N/A';
    const bankName = employee.bankName || 'N/A';

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
      
      // Set default font and size
      const normalFont = 'Helvetica';
      const boldFont = 'Helvetica-Bold';
      const titleSize = 20;
      const headerSize = 14;
      const subHeaderSize = 12;
      const normalSize = 10;
      const smallSize = 8;
      
      // Company Header
      doc
        .fillColor('#2c3e50')
        .font(boldFont)
        .fontSize(titleSize)
        .text('ECOCYCLE LANKA (PVT) LTD', { align: 'center' })
        .font(normalFont)
        .fontSize(normalSize)
        .fillColor('#7f8c8d')
        .text('123 Green Tech Park, Colombo 05, Sri Lanka', { align: 'center' })
        .text('Tel: +94 11 234 5678 | Email: hr@ecocycle.lk | Web: www.ecocycle.lk', { align: 'center' })
        .moveDown(0.5);
      
      // Payslip Title
      doc
        .fillColor('#2c3e50')
        .font(boldFont)
        .fontSize(headerSize)
        .text('MONTHLY PAYSLIP', { align: 'center', underline: true })
        .moveDown(0.5);
      
      // Pay Period and Payslip Number
      doc
        .font(normalFont)
        .fontSize(normalSize)
        .fillColor('#2c3e50')
        .text(`Pay Period: ${payroll.month ? new Date(payroll.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}`, { align: 'center' })
        .text(`Payslip #: ${payroll._id.toString().substring(18).toUpperCase()}`, { align: 'center' })
        .moveDown(1);
      
      // Employee Details Section
      doc
        .font(boldFont)
        .fontSize(subHeaderSize)
        .fillColor('#2c3e50')
        .text('EMPLOYEE DETAILS')
        .moveDown(0.3)
        .lineGap(5);
      
      // Employee Details Table
      const employeeStartY = doc.y;
      doc
        .font(normalFont)
        .fontSize(normalSize)
        .fillColor('#2c3e50')
        .text('Employee Name:', 50, employeeStartY)
        .text(employeeName, 180, employeeStartY)
        .text('Employee ID:', 350, employeeStartY)
        .text(employeeId, 430, employeeStartY)
        .text('Department:', 50, employeeStartY + 20)
        .text(department, 180, employeeStartY + 20)
        .text('Designation:', 350, employeeStartY + 20)
        .text(position, 430, employeeStartY + 20)
        .text('Bank Account:', 50, employeeStartY + 40)
        .text(bankAccount, 180, employeeStartY + 40)
        .text('Bank Name:', 350, employeeStartY + 40)
        .text(bankName, 430, employeeStartY + 40)
        .moveDown(1.5);
      
      // Earnings Section
      doc
        .font(boldFont)
        .fontSize(subHeaderSize)
        .text('EARNINGS')
        .moveDown(0.3);
      
      // Earnings Table
      const earnings = [
        { description: 'Basic Salary', amount: parseFloat(payroll.basicSalary || 0).toFixed(2) },
        { description: 'Fixed Allowances', amount: parseFloat(payroll.allowances || 0).toFixed(2) },
        { description: `Overtime (${payroll.overtimeHours || 0} hours)`, amount: parseFloat(payroll.overtimePay || 0).toFixed(2) },
        { description: 'Bonus/Incentives', amount: parseFloat(payroll.bonus || 0).toFixed(2) }
      ];
      
      // Draw earnings table
      let startY = doc.y;
      doc
        .font(boldFont)
        .fontSize(normalSize)
        .text('Description', 50, startY)
        .text('Amount (LKR)', 400, startY, { align: 'right' });
      
      startY += 20;
      let totalEarnings = 0;
      
      earnings.forEach(earning => {
        doc
          .font(normalFont)
          .text(earning.description, 50, startY)
          .text(parseFloat(earning.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 400, startY, { align: 'right' });
        totalEarnings += parseFloat(earning.amount || 0);
        startY += 15;
      });
      
      // Total Earnings
      doc
        .moveTo(350, startY)
        .lineTo(500, startY)
        .stroke('#bdc3c7')
        .font(boldFont)
        .text('Total Earnings', 50, startY + 5)
        .text(totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 400, startY + 5, { align: 'right' });
      
      startY += 30;
      
      // Deductions Section
      doc
        .font(boldFont)
        .fontSize(subHeaderSize)
        .text('DEDUCTIONS', 50, startY)
        .moveDown(0.3);
      
      startY += 15;
      
      // Deductions Table
      const deductions = [
        { description: 'EPF (Employee 8%)', amount: parseFloat(payroll.epfEmployee || 0).toFixed(2) },
        { description: 'EPF (Employer 12%)', amount: parseFloat(payroll.epfEmployer || 0).toFixed(2) },
        { description: 'ETF (Employer 3%)', amount: parseFloat(payroll.etfEmployer || 0).toFixed(2) },
        { description: 'PAYE Tax', amount: parseFloat(payroll.tax || 0).toFixed(2) },
        { description: 'Other Deductions', amount: parseFloat(payroll.deductions || 0).toFixed(2) }
      ];
      
      // Draw deductions table
      doc
        .font(boldFont)
        .fontSize(normalSize)
        .text('Description', 50, startY)
        .text('Amount (LKR)', 400, startY, { align: 'right' });
      
      startY += 20;
      let totalDeductions = 0;
      
      deductions.forEach(deduction => {
        if (parseFloat(deduction.amount) > 0) {
          doc
            .font(normalFont)
            .text(deduction.description, 50, startY)
            .text(parseFloat(deduction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 400, startY, { align: 'right' });
          totalDeductions += parseFloat(deduction.amount || 0);
          startY += 15;
        }
      });
      
      // Total Deductions
      doc
        .moveTo(350, startY)
        .lineTo(500, startY)
        .stroke('#bdc3c7')
        .font(boldFont)
        .text('Total Deductions', 50, startY + 5)
        .text(totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 400, startY + 5, { align: 'right' });
      
      startY += 30;
      
      // Net Pay Section
      const netPay = totalEarnings - totalDeductions;
      
      doc
        .fillColor('#27ae60')
        .font(boldFont)
        .fontSize(14)
        .text('NET PAY', 50, startY)
        .text(`LKR ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 400, startY, { align: 'right' })
        .moveDown(1);
      
      // Payment Advice
      doc
        .fillColor('#2c3e50')
        .font(boldFont)
        .fontSize(subHeaderSize)
        .text('PAYMENT ADVICE', 50, doc.y + 10)
        .moveDown(0.3);
      
      doc
        .font(normalFont)
        .fontSize(normalSize)
        .text(`The amount of LKR ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your bank account.`, 50, doc.y)
        .text(`Payment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, doc.y + 15)
        .moveDown(1);
      
      // Footer
      doc
        .fillColor('#7f8c8d')
        .fontSize(smallSize)
        .text('This is a computer-generated document and does not require a signature.', { align: 'center' })
        .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' })
        .text('© 2025 EcoCycle Lanka (Pvt) Ltd. All rights reserved.', { align: 'center' });
      
      // Add page numbers if needed
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(smallSize)
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30);
      }
      
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
};

// Export all controller functions
// @desc    Get employee salary expenses breakdown
// @route   GET /api/payroll/expenses/breakdown
// @access  Private/Admin
const getEmployeeSalaryExpenses = asyncHandler(async (req, res) => {
  try {
    const { year, month } = req.query;
    let match = {};
    
    // Build date filter
    if (year && month) {
      match.month = { $regex: `^${year}-${month.toString().padStart(2, '0')}` };
    } else if (year) {
      match.month = { $regex: `^${year}` };
    }

    const result = await Payroll.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $substr: ['$month', 0, 7] }
          },
          totalBasicSalary: { $sum: '$basicSalary' },
          totalEPF: { $sum: { $add: ['$epfEmployee', '$epfEmployer'] } },
          totalETF: { $sum: '$etfEmployer' },
          totalOvertime: { $sum: '$overtimePay' },
          totalDeductions: { $sum: '$deductions' },
          totalNetPay: { $sum: '$netPay' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Format the response
    const formattedData = result.map(item => ({
      month: item._id.month,
      basicSalary: item.totalBasicSalary,
      epf: item.totalEPF,
      etf: item.totalETF,
      overtime: item.totalOvertime,
      deductions: item.totalDeductions,
      netPay: item.totalNetPay,
      employeeCount: item.employeeCount
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching employee salary expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee salary expenses',
      error: error.message
    });
  }
});

module.exports = {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollSummary,
  updatePayroll,
  deletePayroll,
  generatePayslip,
  getEmployeeSalaryExpenses
};
