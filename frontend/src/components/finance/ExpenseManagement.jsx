import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Tag, Calendar as CalendarIcon, FileText, 
  Filter, Download, Plus, Check, X, 
  AlertTriangle, Clock, Search, BarChart2, Eye, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

// Custom Card component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const expenseCategories = [
  'Travel', 'Meals', 'Office Supplies', 
  'Utilities', 'Marketing', 'Training', 'Other'
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processed: 'bg-blue-100 text-blue-800'
};

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dateRange: 'thisMonth',
    search: ''
  });

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    receipt: null,
    notes: ''
  });

  // Sample data - replace with API call
  useEffect(() => {
    const sampleExpenses = [
      {
        id: 'EXP-001',
        description: 'Team lunch meeting',
        amount: 125.75,
        category: 'Meals',
        date: '2024-09-15',
        status: 'approved',
        submittedBy: 'John Doe',
        approvedBy: 'Jane Smith',
        receiptUrl: '#',
        notes: 'Client meeting with ABC Corp'
      },
      {
        id: 'EXP-002',
        description: 'Office supplies',
        amount: 89.99,
        category: 'Office Supplies',
        date: '2024-09-10',
        status: 'pending',
        submittedBy: 'Alice Johnson',
        notes: 'Pens, notebooks, and printer paper'
      },
      {
        id: 'EXP-003',
        description: 'Flight to conference',
        amount: 450.00,
        category: 'Travel',
        date: '2024-08-28',
        status: 'approved',
        submittedBy: 'Bob Wilson',
        approvedBy: 'Jane Smith',
        receiptUrl: '#',
        notes: 'Tech Conference 2024'
      }
    ];
    setExpenses(sampleExpenses);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewExpense(prev => ({
      ...prev,
      receipt: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to save expense
    const newExpenseWithId = {
      ...newExpense,
      id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      status: 'pending',
      submittedBy: 'Current User',
      date: newExpense.date || format(new Date(), 'yyyy-MM-dd')
    };
    
    setExpenses([newExpenseWithId, ...expenses]);
    setShowAddForm(false);
    
    // Reset form
    setNewExpense({
      description: '',
      amount: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      receipt: null,
      notes: ''
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesStatus = filters.status === 'all' || expense.status === filters.status;
    const matchesCategory = filters.category === 'all' || expense.category === filters.category;
    const matchesSearch = expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                         expense.id.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <h3 className="text-2xl font-bold">LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  12% from last month
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <h3 className="text-2xl font-bold">{pendingExpenses}</h3>
                <p className="text-sm text-gray-500">Requires your review</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <h3 className="text-2xl font-bold">LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p className="text-sm text-gray-500">Across {expenses.length} transactions</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <BarChart2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button 
              className="flex items-center px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {/* Export functionality */}}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {expense.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                      {expense.notes && <div className="text-xs text-gray-500">{expense.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      LKR {parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[expense.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        {expense.status === 'pending' && (
                          <>
                            <button className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-green-50">
                              <Check className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No expenses found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Add New Expense</h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={newExpense.description}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter expense description"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (LKR)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">LKR</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={newExpense.amount}
                        onChange={handleInputChange}
                        className="w-full pl-12 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      name="category"
                      value={newExpense.category}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        value={newExpense.date}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Receipt (Optional)</label>
                    <div>
                      <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-sm">
                          {newExpense.receipt ? newExpense.receipt.name : 'Click to upload receipt'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                        />
                      </label>
                      {newExpense.receipt && (
                        <button 
                          type="button" 
                          onClick={() => setNewExpense({...newExpense, receipt: null})}
                          className="mt-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <X className="w-4 h-4 mr-1 inline-block" />
                          Remove File
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={newExpense.notes || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any additional details about this expense"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 border-t p-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Expense
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
