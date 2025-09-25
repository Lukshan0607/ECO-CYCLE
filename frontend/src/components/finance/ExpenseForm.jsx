import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Tag, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

const ExpenseForm = ({ expense, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    status: 'pending',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set form data if editing an existing expense
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount ? expense.amount.toString() : '',
        category: expense.category || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod || 'Credit Card',
        status: expense.status || 'pending',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  // Categories that match the backend enum
  const categories = [
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
  ];

  // Payment methods that match the backend enum
  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Bank Transfer',
    'Check',
    'Other'
  ];

  // Status options - must match the backend enum values
  const statuses = [
    { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4 text-amber-500" /> },
    { value: 'paid', label: 'Paid', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { value: 'failed', label: 'Failed', icon: <XCircle className="w-4 h-4 text-red-500" /> }
  ];

  // Silent validation - returns boolean instead of error message
  const validateField = (name, value) => {
    if (!value && (name === 'description' || name === 'amount' || 
                  name === 'category' || name === 'paymentMethod' || 
                  name === 'status')) {
      return false; // Required fields
    }

    switch (name) {
      case 'description':
        // Only allow letters, numbers, and spaces
        return value.trim().length >= 3 && 
               value.length <= 100 && 
               /^[a-zA-Z0-9\s]+$/.test(value); // Only allow letters, numbers, and spaces
      
      case 'amount':
        if (isNaN(parseFloat(value)) || !/^\d+(\.\d{1,2})?$/.test(value)) {
          return false;
        }
        const amount = parseFloat(value);
        return amount > 0 && amount <= 1000000 && value.split('.')[0].length <= 7; // Max 7 digits before decimal
      
      case 'date':
        if (!value) return false;
        const selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return selectedDate <= today;
      
      case 'category':
        return categories.includes(value);
      
      case 'paymentMethod':
        return paymentMethods.includes(value);
      
      case 'status':
        return statuses.some(s => s.value === value);
      
      case 'notes':
        return !value || (
          value.length <= 500 && 
          !/[<>{}`~$^]/.test(value) && // Block potentially dangerous characters
          /^[\w\s.,!?@#$%^&*()\-+=:;"'\/\\|\[\]{}()\n\r]+$/.test(value) // Allow safe characters including newlines
        );
      
      default:
        return true;
    }
  };

  const validate = () => {
    return Object.keys(formData).every(field => validateField(field, formData[field]));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Apply input restrictions based on field type
    switch (name) {
      case 'description':
        // Only allow letters, numbers, and spaces
        processedValue = value
          .replace(/[^a-zA-Z0-9\s]/g, '') // Only allow letters, numbers, and spaces
          .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
          .trimStart() // Remove leading spaces
          .slice(0, 100); // Limit to 100 characters
        break;
        
      case 'amount':
        // Only allow numbers and exactly 2 decimal places
        if (value === '') {
          processedValue = '';
        } else if (/^\d*\.?\d{0,2}$/.test(value)) {
          // Ensure proper decimal formatting
          if (value.includes('.')) {
            const [whole, decimal] = value.split('.');
            // Don't allow more than 2 decimal places
            if (decimal && decimal.length > 2) return;
            // Ensure there's at least one digit before decimal if decimal exists
            if (whole === '' && decimal) return;
          }
          // Limit to 1,000,000.00
          if (parseFloat(value) > 1000000) return;
          processedValue = value;
        } else {
          return; // Don't update if invalid
        }
        break;
        
      case 'date': {
        // Ensure date is not in the future and is a valid date
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (isNaN(selectedDate.getTime()) || selectedDate > today) {
          // If invalid or future date, reset to today's date
          const todayStr = new Date().toISOString().split('T')[0];
          processedValue = todayStr;
        } else {
          processedValue = value;
        }
        break;
      }
        
      case 'notes':
        // Allow common punctuation but block potentially dangerous characters
        processedValue = value
          .replace(/[<>{}`~$^]/g, '') // Block potentially dangerous characters
          .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
          .trimStart() // Remove leading spaces
          .slice(0, 500); // Limit to 500 characters
        break;
        
      default:
        processedValue = value;
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // No need to validate in real-time for silent validation
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    const isFormValid = Object.entries(formData).every(([field, value]) => {
      // Special handling for required fields
      if ((field === 'description' || field === 'amount' || field === 'category' || field === 'paymentMethod') && !value) {
        return false;
      }
      return validateField(field, value);
    });
    
    if (isSubmitting || !isFormValid) {
      return; // Silently prevent submission if invalid or already submitting
    }
    
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        ...(expense?._id && { _id: expense._id }), // Include _id if it exists (for updates)
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes?.trim() || ''
      };
      
      console.log('Submitting expense:', expenseData);
      await onSave(expenseData);
      
      // Only reset the form if this is not an edit
      if (!expense?._id) {
        setFormData({
          description: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Credit Card',
          status: 'pending',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      // Re-throw the error to be handled by the parent component
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="date"
              id="date"
              value={formData.date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="e.g., Office supplies for team"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="amount"
              id="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`block w-full pl-3 pr-16 sm:text-sm rounded-md ${errors.amount ? 'border-red-300' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">LKR</span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${errors.category ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>


        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="-ml-1 mr-2 h-5 w-5" />
            {expense ? 'Update Expense' : 'Save Expense'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ExpenseForm;
