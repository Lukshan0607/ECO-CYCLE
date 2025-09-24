import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  DollarSign,
  User,
  Calendar,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to calculate order total
const calculateOrderTotal = (products = []) => {
  return products.reduce((total, product) => {
    const quantity = product.quantity || 0;
    const price = product.unitPrice || 0;
    return total + (quantity * price);
  }, 0);
};

// Helper to determine payment status
const getPaymentStatus = (order) => {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.payment && order.payment.status) return order.payment.status;
  return 'unpaid';
};

export default function PaymentsManagement() {
  // Format currency with LKR and thousand separators
  const formatCurrency = (amount) => {
    // Handle loading/error states
    if (amount === 'Loading...' || amount === 'Error') return amount;
    
    // Convert string numbers to numbers if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(numAmount)) return 'LKR 0.00';
    
    return `LKR ${new Intl.NumberFormat('en-LK', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(numAmount)}`;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
  });
  
  // State for update modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    amountPaid: 0,
    notes: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/sales/orders`);
        
        // Transform the API response to match our table structure
        const formattedOrders = response.data.map(order => ({
          _id: order._id,
          orderId: order.orderId || `ORD-${order._id.slice(-6).toUpperCase()}`,
          customerName: order.customerName || 'Unknown Customer',
          totalAmount: order.totalAmount || calculateOrderTotal(order.products),
          products: order.products || [],
          orderDate: order.createdAt ? new Date(order.createdAt) : new Date(),
          status: order.status || 'pending',
          paymentStatus: getPaymentStatus(order),
        }));

        setOrders(formattedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching sales orders:', err);
        setError('Failed to load sales orders. Please try again later.');
        // Fallback to mock data if API fails
        setOrders([
          {
            _id: '1',
            orderId: 'ORD-001',
            customerName: 'John Doe',
            totalAmount: 125.99,
            products: [{ quantity: 1, unitPrice: 125.99 }],
            orderDate: new Date(),
            status: 'completed',
            paymentStatus: 'paid'
          },
          {
            _id: '2',
            orderId: 'ORD-002',
            customerName: 'Jane Smith',
            totalAmount: 89.50,
            products: [{ quantity: 1, unitPrice: 89.50 }],
            orderDate: new Date(Date.now() - 86400000),
            status: 'pending',
            paymentStatus: 'unpaid'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.orderId?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower)) ||
      false;
      
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    const matchesPaymentStatus = filters.paymentStatus === 'all' || 
      (order.paymentStatus ? order.paymentStatus === filters.paymentStatus : false);
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusMap = {
      'pending': { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" key="clock" /> },
      'completed': { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" key="check" /> },
      'shipped': { bg: 'bg-blue-100 text-blue-800', icon: <Package className="w-4 h-4" key="package" /> },
      'delivered': { bg: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="w-4 h-4" key="delivered" /> },
      'cancelled': { bg: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" key="cancelled" /> },
      'paid': { bg: 'bg-green-100 text-green-800', icon: <DollarSign className="w-4 h-4" key="paid" /> },
      'unpaid': { bg: 'bg-orange-100 text-orange-800', icon: <Clock className="w-4 h-4" key="unpaid" /> },
      'partially_paid': { bg: 'bg-yellow-100 text-yellow-800', icon: <DollarSign className="w-4 h-4" key="partial" /> },
      'refunded': { bg: 'bg-gray-100 text-gray-800', icon: <DollarSign className="w-4 h-4" key="refunded" /> }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { bg: 'bg-gray-100 text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg}`}>
        {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
        {status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')}
      </span>
    );
  };

  // Handle order status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!currentOrder || !updateData.status) return;
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${API_URL}/sales/orders/${currentOrder._id}/status`,
        { status: updateData.status }
      );
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === currentOrder._id 
          ? { ...order, status: updateData.status } 
          : order
      ));
      
      setShowUpdateModal(false);
      setCurrentOrder(null);
      setUpdateData({ status: '', paymentStatus: '', paymentMethod: '', amountPaid: 0, notes: '' });
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle payment update
  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    if (!currentOrder) return;
    
    try {
      setIsUpdating(true);
      const paymentData = {
        paymentStatus: updateData.paymentStatus,
        paymentMethod: updateData.paymentMethod,
        amountPaid: parseFloat(updateData.amountPaid),
        notes: updateData.notes
      };
      
      const response = await axios.put(
        `${API_URL}/finance/payments/${currentOrder._id}`,
        paymentData
      );
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === currentOrder._id 
          ? { 
              ...order, 
              paymentStatus: paymentData.paymentStatus,
              payment: {
                ...(order.payment || {}),
                ...paymentData
              }
            } 
          : order
      ));
      
      setShowPaymentModal(false);
      setCurrentOrder(null);
      setUpdateData({ status: '', paymentStatus: '', paymentMethod: '', amountPaid: 0, notes: '' });
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Failed to update payment. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Open update modals
  const openStatusUpdateModal = (order) => {
    setCurrentOrder(order);
    setUpdateData({
      ...updateData,
      status: order.status || ''
    });
    setShowUpdateModal(true);
  };
  
  const openPaymentUpdateModal = (order) => {
    setCurrentOrder(order);
    setUpdateData({
      ...updateData,
      paymentStatus: order.paymentStatus || 'unpaid',
      paymentMethod: order.payment?.method || '',
      amountPaid: order.payment?.amountPaid || order.totalAmount || 0,
      notes: order.payment?.notes || ''
    });
    setShowPaymentModal(true);
  };

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (loading) {
      return {
        totalOrders: 'Loading...',
        paidOrders: 'Loading...',
        pendingOrders: 'Loading...',
        totalAmount: 'Loading...',
        paidAmount: 'Loading...',
        pendingAmount: 'Loading...',
        avgOrderValue: 'Loading...',
        paidPercentage: 'Loading...',
        pendingPercentage: 'Loading...'
      };
    }

    if (error) {
      return {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        avgOrderValue: 0,
        paidPercentage: 0,
        pendingPercentage: 0
      };
    }

    // Ensure we have valid orders array
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        avgOrderValue: 0,
        paidPercentage: 0,
        pendingPercentage: 0
      };
    }

    const paidOrders = orders.filter(order => order.paymentStatus?.toLowerCase() === 'paid');
    const pendingOrders = orders.filter(order => {
      const status = order.paymentStatus?.toLowerCase();
      return status === 'pending' || status === 'partially_paid' || status === 'unpaid';
    });
    
    // Ensure we're working with numbers
    const totalAmount = parseFloat(orders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      return sum + amount;
    }, 0).toFixed(2));

    const paidAmount = parseFloat(paidOrders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      return sum + amount;
    }, 0).toFixed(2));

    const pendingAmount = parseFloat(pendingOrders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      return sum + amount;
    }, 0).toFixed(2));

    const totalOrders = orders.length;
    const paidOrdersCount = paidOrders.length;
    const pendingOrdersCount = pendingOrders.length;
    
    const avgOrderValue = totalOrders > 0 ? parseFloat((totalAmount / totalOrders).toFixed(2)) : 0;
    const paidPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    const pendingPercentage = totalAmount > 0 ? Math.round((pendingAmount / totalAmount) * 100) : 0;

    return {
      totalOrders,
      paidOrders: paidOrdersCount,
      pendingOrders: pendingOrdersCount,
      totalAmount,
      paidAmount,
      pendingAmount,
      avgOrderValue,
      paidPercentage,
      pendingPercentage
    };
  }, [orders, loading, error]);

  const StatCard = ({ title, value, change, icon: Icon, trend }) => {
    const getTrendColor = () => {
      if (trend === 'up') return 'text-green-500';
      if (trend === 'down') return 'text-red-500';
      return 'text-gray-500';
    };

    const getTrendIcon = () => {
      if (trend === 'up') return (
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
      if (trend === 'down') return (
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
      return null;
    };

    return (
      <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-blue-50'}`}>
              <Icon className={`h-6 w-6 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
          </div>
          {change && (
            <div className={`mt-4 flex items-center text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Status Update Modal
  const StatusUpdateModal = () => (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-50">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Update Order Status</h3>
          <div className="mt-4">
            <select
              value={updateData.status}
              onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>
            <button
              onClick={() => setShowUpdateModal(false)}
              className="mt-3 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Payment Update Modal
  const PaymentUpdateModal = () => (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-50">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Update Payment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Status</label>
              <select
                value={updateData.paymentStatus}
                onChange={(e) => setUpdateData({...updateData, paymentStatus: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={updateData.paymentMethod}
                onChange={(e) => setUpdateData({...updateData, paymentMethod: e.target.value})}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_payment">Mobile Payment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
              <input
                type="number"
                value={updateData.amountPaid}
                onChange={(e) => setUpdateData({...updateData, amountPaid: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={updateData.notes}
                onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 space-y-3">
            <button
              onClick={handlePaymentUpdate}
              disabled={isUpdating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Payment'}
            </button>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 relative">
      {/* Modals */}
      {showUpdateModal && <StatusUpdateModal />}
      {showPaymentModal && <PaymentUpdateModal />}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of all payment transactions and financial metrics
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(summary.totalAmount)} 
          icon={DollarSign}
          change={`${summary.totalOrders} ${summary.totalOrders === 1 ? 'order' : 'orders'}`}
        />
        <StatCard 
          title="Paid Amount" 
          value={formatCurrency(summary.paidAmount)}
          change={`${summary.paidPercentage}% of total`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard 
          title="Pending Amount" 
          value={formatCurrency(summary.pendingAmount)}
          change={`${summary.pendingPercentage}% of total`}
          icon={Clock}
          trend={summary.pendingAmount > 0 ? "down" : "up"}
        />
        <StatCard 
          title="Avg. Order Value" 
          value={formatCurrency(summary.avgOrderValue)}
          change={`${summary.paidOrders} of ${summary.totalOrders} paid`}
          icon={DollarSign}
          trend={summary.paidPercentage >= 50 ? "up" : "down"}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
      </div>

      <div className="mt-2">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Search orders by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="status-filter"
              className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="payment-status-filter"
              className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              value={filters.paymentStatus}
              onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Items
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Order Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payment
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-sm text-gray-500 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                        <p className="mt-2">Loading orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-sm text-gray-500 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm || filters.status !== 'all' || filters.paymentStatus !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'No sales orders have been placed yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 sm:pl-6">
                          {order.orderId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate max-w-[150px]" title={order.customerName}>
                              {order.customerName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            {order.products?.length || 0} items
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {order.orderDate ? format(new Date(order.orderDate), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {order.status ? getStatusBadge(order.status) : getStatusBadge('pending')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {order.paymentStatus ? getStatusBadge(order.paymentStatus) : getStatusBadge('unpaid')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              onClick={() => openStatusUpdateModal(order)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Update Status"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => openPaymentUpdateModal(order)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Update Payment"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
