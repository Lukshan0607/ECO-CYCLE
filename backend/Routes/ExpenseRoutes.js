const express = require('express');
const expenseController = require('../Controllers/ExpenseController');

const router = express.Router();

// Get all expenses
router.get('/', expenseController.getAllExpenses);

// Get expense summary
router.get('/summary', expenseController.getExpenseSummary);

// Get single expense
router.get('/:id', expenseController.getExpenseById);

// Create a new expense
router.post('/', expenseController.createExpense);

// Update an expense
router.put('/:id', expenseController.updateExpense);

// Delete an expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
