import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Banknote,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../ui/button';
import { format, subDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PaymentsSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsData, setPaymentsData] = useState({
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    avgTransactionValue: 0,
    trend: 0,
    paymentMethods: [],
    recentTransactions: []
  });
  const [error, setError] = useState(null);

  const fetchPaymentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch orders with payment status
      const response = await axios.get(`${API_URL}/sales/orders`, {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const orders = response.data || [];
      
      // Calculate payment statistics
      const totalPayments = orders.length;
      const successfulPayments = orders.filter(order => 
        order.paymentStatus === 'completed' || order.status === 'completed'
      ).length;
      const pendingPayments = orders.filter(order => 
        order.paymentStatus === 'pending' || (order.status === 'pending' && !order.paymentStatus)
      ).length;
      const failedPayments = orders.filter(order => 
        order.paymentStatus === 'failed' || order.status === 'cancelled'
      ).length;
      
      // Calculate total amount from completed orders
      const totalAmount = orders
        .filter(order => order.paymentStatus === 'completed' || order.status === 'completed')
        .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
      
      // Calculate average transaction value
      const avgTransactionValue = successfulPayments > 0 
        ? totalAmount / successfulPayments 
        : 0;
      
      // Get payment methods distribution
      const paymentMethods = {};
      orders.forEach(order => {
        const method = order.paymentMethod || 'Unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = {
            count: 0,
            amount: 0,
            successCount: 0
          };
        }
        paymentMethods[method].count++;
        if (order.paymentStatus === 'completed' || order.status === 'completed') {
          paymentMethods[method].amount += Number(order.totalAmount) || 0;
          paymentMethods[method].successCount++;
        }
      });

      // Format payment methods for display
      const formattedPaymentMethods = Object.entries(paymentMethods).map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
        successRate: Math.round((data.successCount / data.count) * 100) || 0
      }));

      // Get recent transactions (last 5)
      const recentTransactions = orders
        .sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))
        .slice(0, 5)
        .map(order => ({
          id: order._id,
          orderId: order.orderId || `ORD-${order._id.slice(-6).toUpperCase()}`,
          date: order.orderDate || order.createdAt || new Date(),
          amount: order.totalAmount,
          method: order.paymentMethod || 'Unknown',
          status: order.paymentStatus || (order.status === 'completed' ? 'completed' : 'pending'),
          customerName: order.customerName || 'Unknown Customer'
        }));

      // Calculate trend (compare with previous period)
      const previousPeriodEnd = new Date(dateRange.from);
      const previousPeriodStart = subDays(previousPeriodEnd, 
        (dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)
      );
      
      // In a real app, we would fetch previous period data here
      // For now, we'll use a simple calculation
      const trend = totalPayments > 0 ? 5 : 0; // Example trend value

      setPaymentsData({
        totalPayments,
        totalAmount,
        successfulPayments,
        pendingPayments,
        failedPayments,
        avgTransactionValue,
        trend,
        paymentMethods: formattedPaymentMethods,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Failed to load payment data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
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
    doc.text('PAYMENTS SUMMARY REPORT', 105, 45, { align: 'center' });
    
    // Date range
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(
      `Period: ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`, 
      14, 
      55
    );
    
    // Summary stats
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('Total Payments:', 14, 70);
    doc.text(paymentsData.totalPayments.toString(), 50, 70);
    
    doc.text('Total Amount:', 100, 70);
    doc.text(`LKR ${paymentsData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 150, 70);
    
    doc.text('Success Rate:', 14, 80);
    doc.text(`${paymentsData.totalPayments > 0 ? (paymentsData.successfulPayments / paymentsData.totalPayments * 100).toFixed(1) : 0}%`, 50, 80);
    
    // Payment methods table
    doc.autoTable({
      startY: 90,
      head: [['Payment Method', 'Transactions', 'Total Amount', 'Success Rate']],
      body: paymentsData.paymentMethods.map(method => [
        method.name,
        method.count,
        { 
          content: `LKR ${method.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `${method.successRate}%`,
          styles: { 
            halign: 'right',
            textColor: method.successRate >= 90 ? [0, 128, 0] : method.successRate >= 80 ? [255, 165, 0] : [255, 0, 0]
          }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { top: 15 }
    });
    
    // Recent transactions table
    doc.setFontSize(12).setFont(undefined, 'bold');
    doc.text('Recent Transactions', 14, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Transaction ID', 'Amount', 'Method', 'Status']],
      body: paymentsData.recentTransactions.map(tx => [
        format(new Date(tx.date), 'MMM d, yyyy'),
        tx.id,
        { 
          content: `LKR ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        tx.method,
        { 
          content: tx.status,
          styles: { 
            textColor: 
              tx.status.toLowerCase() === 'completed' ? [0, 128, 0] :
              tx.status.toLowerCase() === 'pending' ? [255, 165, 0] :
              [255, 0, 0]
          }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40 },
        4: { cellWidth: 30, halign: 'center' }
      }
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
    
    doc.save(`payments-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (methodName) => {
    const method = methodName.toLowerCase();
    if (method.includes('credit') || method.includes('card')) return <CreditCard className="h-5 w-5" />;
    if (method.includes('bank') || method.includes('transfer')) return <Banknote className="h-5 w-5" />;
    if (method.includes('paypal') || method.includes('digital')) return <DollarSign className="h-5 w-5" />;
    return <CreditCard className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading payment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPaymentData}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const successRate = paymentsData.totalPayments > 0 
    ? (paymentsData.successfulPayments / paymentsData.totalPayments * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments Summary</h2>
          <p className="text-sm text-gray-500">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payments Card */}
        <div className="bg-white rounded-lg border-l-4 border-blue-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Payments</h3>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold text-gray-900">
                {paymentsData.totalPayments.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center text-xs">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                  paymentsData.trend >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {paymentsData.trend >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(paymentsData.trend)}% from last period
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-white rounded-lg border-l-4 border-green-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</h3>
              <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                LKR {paymentsData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {paymentsData.avgTransactionValue > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Avg. Transaction</div>
                  <p className="text-sm font-medium text-gray-700">
                    LKR {paymentsData.avgTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white rounded-lg border-l-4 border-purple-600 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Success Rate</h3>
              <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {successRate}%
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Success Rate</span>
                  <span className="font-medium">{successRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      parseFloat(successRate) >= 90 
                        ? 'bg-green-500' 
                        : parseFloat(successRate) >= 80 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {paymentsData.successfulPayments} of {paymentsData.totalPayments} payments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending/Failed Card */}
        <div className="bg-white rounded-lg border-l-4 border-orange-500 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Status</h3>
              <div className="p-1.5 rounded-md bg-orange-50 text-orange-500">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-gray-900">
                    {paymentsData.pendingPayments || 0}
                  </span>
                </div>
                {paymentsData.pendingPayments > 0 ? (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (paymentsData.pendingPayments / paymentsData.totalPayments) * 100)}%` }}
                    ></div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 rounded-full h-1.5"></div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Failed</span>
                  <span className="font-medium text-gray-900">
                    {paymentsData.failedPayments || 0}
                  </span>
                </div>
                {paymentsData.failedPayments > 0 ? (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (paymentsData.failedPayments / paymentsData.totalPayments) * 100)}%` }}
                    ></div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 rounded-full h-1.5"></div>
                )}
              </div>
              {(paymentsData.pendingPayments === 0 && paymentsData.failedPayments === 0) && (
                <div className="text-center py-1.5 text-xs text-green-700 bg-green-50 rounded-md border border-green-100">
                  All payments processed successfully
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentsData.paymentMethods.map((method) => (
            <div key={method.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{method.name}</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    {method.count} {method.count === 1 ? 'transaction' : 'transactions'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    LKR {method.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      method.successRate >= 90 
                        ? 'bg-green-100 text-green-800' 
                        : method.successRate >= 80 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {method.successRate}% success rate
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  method.successRate >= 90 
                    ? 'bg-green-50 text-green-600' 
                    : method.successRate >= 80 
                      ? 'bg-yellow-50 text-yellow-600' 
                      : 'bg-red-50 text-red-600'
                }`}>
                  {getMethodIcon(method.name)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentsData.recentTransactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
              {tx.orderId}
            </div>
            <div className="text-xs text-gray-500">{tx.customerName || 'Unknown Customer'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      LKR {tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2">
                          {getMethodIcon(tx.method || '')}
                        </div>
                        <span className="text-sm text-gray-900">{tx.method || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {tx.date ? format(new Date(tx.date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
                {(!paymentsData.recentTransactions || paymentsData.recentTransactions.length === 0) && (
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
            <p className="text-sm text-gray-500">
              Showing {paymentsData.recentTransactions?.length || 0} of {paymentsData.totalPayments} transactions • Updated {format(new Date(), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsSummaryReport;
