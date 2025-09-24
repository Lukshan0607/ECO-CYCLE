const mongoose = require('mongoose');
const Expense = require('../Model/ExpenseModel');

// Get all expenses (with optional search, filters)
exports.getAllExpenses = async (req, res) => {
  try {
    const { search, status, category, startDate, endDate } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const requiredFields = ['description', 'amount', 'category', 'date', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMessage);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: missingFields.map(field => `${field} is required`)
      });
    }

    // Ensure amount is a number
    if (isNaN(parseFloat(req.body.amount))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        errors: ['Amount must be a valid number']
      });
    }

    // Create a new expense object with a properly generated expenseId
    const { _id, ...expenseData } = req.body;
    
    // Generate a new unique ID for the expense
    const expenseId = new mongoose.Types.ObjectId();
    
    // Ensure we have a clean data object with proper types
    const newExpense = {
      ...expenseData,
      _id: expenseId,  // Explicitly set the _id
      expenseId: expenseId.toString(), // Add expenseId as a string
      amount: parseFloat(req.body.amount),
      createdBy: req.body.createdBy || new mongoose.Types.ObjectId() // Temporary fix - replace with actual user ID from auth
    };
    
    // Explicitly remove any null or undefined values that might cause issues
    Object.keys(newExpense).forEach(key => {
      if (newExpense[key] === null || newExpense[key] === undefined) {
        delete newExpense[key];
      }
    });

    const expense = await Expense.create(newExpense);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('Mongoose validation errors:', messages);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      // Extract the field that caused the duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry found',
        errors: [`An expense with ${field} '${value}' already exists`]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Validate expense ID
    if (!expenseId) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID is required',
        errors: ['Expense ID must be provided']
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format',
        errors: ['The provided expense ID is not valid']
      });
    }
    
    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'No data provided for update',
        errors: ['Request body cannot be empty']
      });
    }
    
    // Validate required fields
    const { description, amount, category, date, paymentMethod } = req.body;
    if (!description || !amount || !category || !date || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: ['Description, amount, category, date, and payment method are required']
      });
    }

    // Ensure amount is a valid number
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        errors: ['Amount must be a valid number greater than 0']
      });
    }

    // Prepare update data
    const updateData = {
      description: description.trim(),
      amount: amountValue,
      category,
      date: new Date(date),
      paymentMethod,
      status: req.body.status,
      notes: req.body.notes || '',
      updatedAt: Date.now()
    };

    // Update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );
    
    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
        errors: [`No expense found with ID: ${expenseId}`]
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error);
      const messages = [];
      
      // Extract all validation error messages
      if (error.errors) {
        for (const field in error.errors) {
          messages.push(`${field}: ${error.errors[field].message}`);
        }
      } else if (error.message) {
        messages.push(error.message);
      } else {
        messages.push('Validation failed');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
        receivedData: req.body // Include received data for debugging
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Validate expense ID
    if (!expenseId) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID is required',
        errors: ['Expense ID must be provided']
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format',
        errors: ['The provided expense ID is not valid']
      });
    }
    
    // Find and delete the expense
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);
    
    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
        errors: ['The specified expense could not be found']
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get expense summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      {
        $group: {
          _id: null,
          // Only sum amounts for successful or pending expenses
          total: { 
            $sum: {
              $cond: [
                { $ne: ['$status', 'failed'] },
                '$amount',
                0
              ]
            }
          },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] } },
          // Count only non-failed expenses for the main count
          count: { 
            $sum: { 
              $cond: [
                { $ne: ['$status', 'failed'] },
                1,
                0
              ]
            } 
          },
          // Count failed expenses separately
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]); // Fixed: Added missing closing bracket and semicolon

    const categorySummary = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Total only includes paid and pending expenses
        total: summary[0]?.total || 0,
        paid: summary[0]?.paid || 0,
        pending: summary[0]?.pending || 0,
        failed: summary[0]?.failed || 0,
        count: summary[0]?.count || 0, // Count of non-failed expenses
        failedCount: summary[0]?.failedCount || 0, // Count of failed expenses
        byCategory: categorySummary,
        // Add a note about what's included in the total
        note: 'Total amount excludes failed expenses. Check the failed amount separately.'
      }
    });
  } catch (error) {
    console.error('Error getting expense summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
