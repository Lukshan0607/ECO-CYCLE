import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Format currency helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const ExpensesSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expensesData, setExpensesData] = useState({
    totalExpenses: 0,
    paidExpenses: 0,
    pendingExpenses: 0,
    failedExpenses: 0,
    avgExpense: 0,
    trend: 0,
    expensesByCategory: [],
    recentExpenses: []
  });

  const fetchExpenseData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch summary data
      const [summaryResponse, expensesResponse] = await Promise.all([
        axios.get(`${API_URL}/expenses/summary`, {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString()
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        // Fetch recent expenses
        axios.get(`${API_URL}/expenses`, {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            limit: 5,
            sort: '-date'
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const summary = summaryResponse.data.data || {};
      const recentExpenses = expensesResponse.data.data || [];
      
      // Calculate trend (simple month-over-month comparison for now)
      const previousMonth = new Date(dateRange.from);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const prevMonthEnd = new Date(dateRange.to);
      prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);
      
      // In a real app, we would fetch previous period data here
      // For now, we'll use a simple calculation
      const trend = summary.total > 0 ? 5 : 0; // Example trend value

      // Format categories
      const categories = summary.categories || [];
      const formattedCategories = categories.map(cat => ({
        name: cat._id || 'Uncategorized',
        amount: cat.total || 0,
        count: cat.count || 0,
        percentage: summary.total > 0 ? ((cat.total / summary.total) * 100).toFixed(1) : 0
      })).sort((a, b) => b.amount - a.amount);

      // Format recent expenses
      const formattedRecentExpenses = recentExpenses.map(exp => ({
        id: exp._id,
        description: exp.description || 'No description',
        date: exp.date,
        amount: exp.amount || 0,
        category: exp.category || 'Uncategorized',
        status: exp.status || 'pending',
        paymentMethod: exp.paymentMethod || 'N/A'
      }));

      setExpensesData({
        totalExpenses: summary.total || 0,
        paidExpenses: summary.paid || 0,
        pendingExpenses: summary.pending || 0,
        failedExpenses: summary.failed || 0,
        avgExpense: summary.avgExpense || 0,
        trend,
        expensesByCategory: formattedCategories,
        recentExpenses: formattedRecentExpenses
      });
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setError('Failed to load expense data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, [dateRange]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16).setFont(undefined, 'bold');
    doc.text('ECOCYCLE LANKA (PVT) LTD', 105, 20, { align: 'center' });
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text('123 Green Tech Park, Colombo 05, Sri Lanka', 105, 28, { align: 'center' });
    doc.text('Tel: +94 11 234 5678 | Email: ecocycle923@gmail.com | Web: www.ecocycle.lk', 105, 33, { align: 'center' });
    
    // Title
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text('EXPENSES SUMMARY REPORT', 105, 45, { align: 'center' });
    
    // Date range
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(
      `Period: ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, ')}`, 
      14, 
      55
    );
    
    // Summary stats
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('Total Expenses:', 14, 70);
    doc.text(`LKR ${(expensesData.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 70);

    doc.text('Average Expense:', 100, 70);
    doc.text(`LKR ${(expensesData.avgExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 150, 70);

    // Status summary
    doc.text('Paid:', 14, 80);
    doc.text(`LKR ${(expensesData.paidExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 80);

    doc.text('Pending:', 100, 80);
    doc.text(`LKR ${(expensesData.pendingExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 150, 80);
  
    // Expenses by category table
    doc.autoTable({
      startY: 95,
      head: [['Category', 'Amount (LKR)', 'Transactions', 'Status']],
      body: (expensesData.expensesByCategory || []).map(expense => [
        expense?.name || 'Uncategorized',
        { 
          content: (expense?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        { 
          content: (expense?.count || 0).toString(),
          styles: { halign: 'right' }
        },
        { 
          content: expense?.status ? Object.entries(expense.status)
            .map(([status, count]) => `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`)
            .join(', ') : '',
          styles: { fontSize: 8, cellPadding: 2 }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { top: 15 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`, 
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`expenses-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      default: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock }
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || statusMap.default;
    const StatusIcon = statusInfo.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  // Calculate summary metrics for display
  const { 
    totalExpenses, 
    paidExpenses, 
    pendingExpenses, 
    failedExpenses, 
    expensesByCategory, 
    recentExpenses,
    trend
  } = expensesData;

  const highestExpenseCategory = expensesByCategory[0] || {};
  const expenseChange = trend;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Expenses Summary</h2>
          <p className="text-sm text-gray-500">Overview of financial expenditures and trends</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToPDF}
          className="border-gray-300 hover:bg-gray-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses Card */}
        <div className="bg-white rounded-lg border-l-4 border-blue-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Expenses</h3>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(expensesData.totalExpenses)}
            </p>
            <div className="mt-2">
              <div className="flex items-center text-xs text-gray-500">
                {expensesData.trend !== 0 && (
                  <span className={`inline-flex items-center mr-1 ${expensesData.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {expensesData.trend > 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(expensesData.trend)}%
                  </span>
                )}
                <span>vs last period</span>
              </div>
            </div>
          </div>
        </div>

        {/* Paid Expenses Card */}
        <div className="bg-white rounded-lg border-l-4 border-green-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</h3>
              <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(expensesData.paidExpenses)}
            </p>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                {expensesData.totalExpenses > 0 ? 
                  `${((expensesData.paidExpenses / expensesData.totalExpenses) * 100).toFixed(1)}% of total` : 
                  'No expenses'}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Expenses Card */}
        <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending</h3>
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(expensesData.pendingExpenses)}
            </p>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                {expensesData.totalExpenses > 0 ? 
                  `${((expensesData.pendingExpenses / expensesData.totalExpenses) * 100).toFixed(1)}% of total` : 
                  'No expenses'}
              </div>
            </div>
          </div>
        </div>

        {/* Failed Expenses Card */}
        <div className="bg-white rounded-lg border-l-4 border-red-500 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Failed</h3>
              <div className="p-1.5 rounded-md bg-red-50 text-red-500">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(expensesData.failedExpenses)}
            </p>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                {expensesData.totalExpenses > 0 ? 
                  `${((expensesData.failedExpenses / expensesData.totalExpenses) * 100).toFixed(1)}% of total` : 
                  'No expenses'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Expense Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Period: {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Expense Distribution</h4>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600"
                  style={{ width: `${(expensesData.paidExpenses / expensesData.totalExpenses * 100) || 0}%` }}
                ></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-medium">{formatCurrency(expensesData.paidExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium">{formatCurrency(expensesData.pendingExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed</span>
                  <span className="font-medium">{formatCurrency(expensesData.failedExpenses)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Key Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg. Expense</span>
                    <span className="font-medium">
                      {expensesData.recentExpenses.length > 0 
                        ? formatCurrency(expensesData.recentExpenses.reduce((sum, e) => sum + e.amount, 0) / expensesData.recentExpenses.length)
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full">
                    <div className="h-1 bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Expense Trend</span>
                    <span className={`font-medium ${expensesData.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {expensesData.trend > 0 ? '+' : ''}{expensesData.trend}%
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${expensesData.trend > 0 ? 'bg-red-600' : 'bg-green-600'}`} 
                      style={{ width: `${Math.min(Math.abs(expensesData.trend), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expensesData.recentExpenses.length > 0 ? (
                expensesData.recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {expensesData.recentExpenses.length} most recent transactions
            </p>
            <p className="text-sm text-gray-500">
              Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesSummaryReport;
