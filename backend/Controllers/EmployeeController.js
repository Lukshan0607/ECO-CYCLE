const mongoose = require('mongoose');
const Employee = require('../Model/EmployeeModel');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for required fields
    const requiredFields = ['employeeId', 'fullName', 'email', 'phone', 'department', 'position', 'employmentType', 'basicSalary'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for existing employee with same email, employeeId, or bank account
    const existingEmployee = await Employee.findOne({
      $or: [
        { email: req.body.email },
        { employeeId: req.body.employeeId.toUpperCase() },
        { accountNumber: req.body.accountNumber }
      ]
    }).session(session);

    if (existingEmployee) {
      const conflicts = [];
      
      if (existingEmployee.email === req.body.email) {
        conflicts.push('email');
      }
      if (existingEmployee.employeeId === req.body.employeeId.toUpperCase()) {
        conflicts.push('employee ID');
      }
      if (existingEmployee.accountNumber === req.body.accountNumber) {
        conflicts.push('bank account number');
      }
      
      const message = `Employee with this ${conflicts.join(', ')} already exists`;
      
      await session.abortTransaction();
      session.endSession();
      
      return res.status(400).json({
        success: false,
        message,
        fields: conflicts
      });
    }

    // Create and save employee
    const employee = new Employee({
      ...req.body,
      employeeId: req.body.employeeId.toUpperCase()
    });

    await employee.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    
    // Ensure we abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key errors (should be caught by our check, but just in case)
    if (error.code === 11000) {
      let message = 'A duplicate entry was found. ';
      
      if (error.message.includes('email')) {
        message += 'An employee with this email already exists.';
      } else if (error.message.includes('employeeId')) {
        message += 'An employee with this ID already exists.';
      } else if (error.message.includes('accountNumber')) {
        message = 'This bank account number is already in use by another employee.';
      } else {
        message += 'This record conflicts with an existing entry.';
      }
      
      return res.status(400).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating employeeId
    if (updates.employeeId) {
      delete updates.employeeId;
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
