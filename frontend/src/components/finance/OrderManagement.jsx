import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { 
  Eye, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  X, 
  Package, 
  User, 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  XCircle
} from "lucide-react";
import { salesApi } from "../../services/salesApi";
import { paymentProcessingApi } from "../../services/paymentApi";
import { toast } from "react-hot-toast";

// Order Details Modal Component
const OrderDetailsModal = ({ isOpen, onClose, order, onStatusUpdate }) => {
  if (!isOpen || !order) return null;

  const calculateTotal = (items = []) => {
    if (!Array.isArray(items)) return '0.00';
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return total + (quantity * price);
    }, 0).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Order #{order.orderId || 'N/A'}</h2>
            <p className="text-gray-500">
              <Calendar className="inline h-4 w-4 mr-1" />
              {new Date(order.createdAt).toLocaleDateString('en-LK')}
              <Clock className="inline h-4 w-4 ml-3 mr-1" />
              {new Date(order.createdAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Order Summary</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order ID:</span>
                <span className="font-medium">{order.orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Customer:</span>
                <span>{order.customerId?.name || order.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Items:</span>
                <span>{order.products?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Order Amount */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Amount</h3>
            </div>
            <div className="space-y-2 pl-7">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>
                  {parseFloat(order.subTotal || calculateTotal(order.products || [])).toLocaleString('en-LK', {
                    style: 'currency',
                    currency: 'LKR',
                    minimumFractionDigits: 2
                  })}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-500">
                    -{parseFloat(order.discount || 0).toLocaleString('en-LK', {
                      style: 'currency',
                      currency: 'LKR',
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>
                    {parseFloat(order.totalAmount || calculateTotal(order.products || [])).toLocaleString('en-LK', {
                      style: 'currency',
                      currency: 'LKR',
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Order Status</h3>
            </div>
            <div className="pl-7">
              <select
                value={order.status}
                onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  {
                    'Pending': 'bg-yellow-100 text-yellow-800',
                    'Processing': 'bg-blue-100 text-blue-800',
                    'Shipped': 'bg-purple-100 text-purple-800',
                    'Completed': 'bg-green-100 text-green-800',
                    'Cancelled': 'bg-red-100 text-red-800'
                  }[order.status] || 'bg-gray-100 text-gray-800'
                } border-0 focus:ring-2 focus:ring-green-500 w-full`}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="px-6 pb-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.products?.length > 0 ? (
                    order.products.map((item, index) => (
                      <tr key={item._id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.productName || 'Unnamed Product'}
                              </div>
                              {item.productId && (
                                <div className="text-xs text-gray-500">
                                  ID: {item.productId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                          {parseFloat(item.unitPrice || 0).toLocaleString('en-LK', {
                            style: 'currency',
                            currency: 'LKR',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                          {item.quantity || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-LK', {
                            style: 'currency',
                            currency: 'LKR',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">
                        No items found in this order
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {parseFloat(order.subTotal || calculateTotal(order.products || [])).toLocaleString('en-LK', {
                        style: 'currency',
                        currency: 'LKR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                  
                  {order.discount > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-1 text-right text-sm font-medium text-gray-500">
                        Discount
                      </td>
                      <td className="px-4 py-1 text-right text-sm font-medium text-red-600">
                        -{parseFloat(order.discount || 0).toLocaleString('en-LK', {
                          style: 'currency',
                          currency: 'LKR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  )}
                  
                  {order.taxAmount > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-1 text-right text-sm font-medium text-gray-500">
                        Tax ({order.taxRate || 0}%)
                      </td>
                      <td className="px-4 py-1 text-right text-sm font-medium text-gray-900">
                        {parseFloat(order.taxAmount || 0).toLocaleString('en-LK', {
                          style: 'currency',
                          currency: 'LKR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  )}
                  
                  {order.shippingCost > 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-1 text-right text-sm font-medium text-gray-500">
                        Shipping
                      </td>
                      <td className="px-4 py-1 text-right text-sm font-medium text-gray-900">
                        {parseFloat(order.shippingCost || 0).toLocaleString('en-LK', {
                          style: 'currency',
                          currency: 'LKR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  )}
                  
                  <tr className="border-t">
                    <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      Total Amount
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {parseFloat(order.totalAmount || calculateTotal(order.products || [])).toLocaleString('en-LK', {
                        style: 'currency',
                        currency: 'LKR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Payment & Notes */}
        {(order.paymentMethod || order.notes) && (
          <div className="px-6 pb-6 grid md:grid-cols-2 gap-6">
            {order.paymentMethod && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-medium">Payment Method</h3>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="capitalize">{order.paymentMethod}</p>
                  {order.paymentStatus && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      order.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
            {order.notes && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-medium">Order Notes</h3>
                </div>
                <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700">
                  {order.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSummary, setPaymentSummary] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    loading: true
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPaymentSummary = async () => {
    try {
      const summary = await paymentProcessingApi.getSummary();
      setPaymentSummary({
        total: summary.total || 0,
        success: summary.success || 0,
        pending: summary.pending || 0,
        failed: summary.failed || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      setPaymentSummary(prev => ({
        ...prev,
        loading: false
      }));
      toast.error('Failed to load payment summary');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await salesApi.getAllOrders();
      // Transform the data to include all necessary fields
      const formattedOrders = data.map(order => {
        // Calculate total quantity by summing up all product quantities
        const totalQuantity = order.products?.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0) || 0;
        
        return {
          ...order, // Include all order data
          id: order.orderId || `ORD${String(order._id).slice(-6).toUpperCase()}`,
          customer: order.customerName || 'N/A',
          quantity: totalQuantity,
          amount: order.totalAmount ? `LKR ${parseFloat(order.totalAmount).toLocaleString('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}` : 'LKR 0.00',
          status: order.status || 'Pending',
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-LK') : 'N/A'
        };
      });
      console.log('Formatted orders:', formattedOrders); // For debugging
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchPaymentSummary()
      ]);
    };
    
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleViewOrder = async (orderId) => {
    try {
      const order = await salesApi.getOrderById(orderId);
      setSelectedOrder(order);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await salesApi.updateOrderStatus(orderId, { status: newStatus });
      
      // Update the order status in the local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Also update the selected order if it's open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(orderId);
    try {
      await salesApi.deleteOrder(orderId);
      toast.success('Order deleted successfully');
      // Refresh the orders list
      await fetchOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Completed': 'text-green-600 bg-green-100',
      'Pending': 'text-yellow-600 bg-yellow-100',
      'Shipped': 'text-blue-600 bg-blue-100',
      'Processing': 'text-purple-600 bg-purple-100',
      'Cancelled': 'text-red-600 bg-red-100'
    };
    return statusMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate order summary from orders data
  const orderSummary = {
    total: orders.length,
    completed: orders.filter(order => order.status === 'Completed').length,
    pending: orders.filter(order => order.status === 'Pending').length,
    failed: orders.filter(order => order.status === 'Failed' || order.status === 'Cancelled').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders Card */}
        <Card className="border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  ) : (
                    orderSummary.total.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Orders Card */}
        <Card className="border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  ) : (
                    orderSummary.completed.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders Card */}
        <Card className="border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                  ) : (
                    orderSummary.pending.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed Orders Card */}
        <Card className="border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                  ) : (
                    orderSummary.failed.toLocaleString()
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new order.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map((order) => (
                <div 
                  key={order._id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{order.orderId || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-LK')}
                        </p>
                      </div>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'Processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Customer:</span>
                        <span className="font-medium text-gray-900">
                          {order.customerId?.name || order.customerName?.substring(0, 15) || 'N/A'}
                          {order.customerName && order.customerName.length > 15 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Items:</span>
                        <span className="font-medium">{order.products?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-semibold">
                          {parseFloat(order.totalAmount || 0).toLocaleString('en-LK', {
                            style: 'currency',
                            currency: 'LKR',
                            minimumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteOrder(order._id)}
                        disabled={deletingId === order._id}
                      >
                        {deletingId === order._id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onStatusUpdate={handleUpdateStatus}
      />
    </div>
  );
};

export default OrderManagement;
