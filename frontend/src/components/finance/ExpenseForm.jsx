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

  const validate = () => {
    const newErrors = {};
    
    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    
    // Validate amount
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    // Validate category
    if (!formData.category) {
      newErrors.category = 'Category is required';
    } else if (!categories.includes(formData.category)) {
      newErrors.category = 'Please select a valid category';
    }
    
    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (isNaN(new Date(formData.date).getTime())) {
      newErrors.date = 'Please enter a valid date';
    }
    
    // Validate payment method
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    } else if (!paymentMethods.includes(formData.paymentMethod)) {
      newErrors.paymentMethod = 'Please select a valid payment method';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    const newValue = type === 'number' 
      ? value === '' ? '' : parseFloat(value) || ''
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate() || isSubmitting) {
      return; // Don't proceed if validation fails or already submitting
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="amount"
              id="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`block w-full pl-7 pr-12 sm:text-sm rounded-md ${errors.amount ? 'border-red-300' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
              placeholder="0.00"
            />
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
              className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.date ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>
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
