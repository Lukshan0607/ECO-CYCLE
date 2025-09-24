import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
  });

  // Sample data - replace with API call
  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchPayments = async () => {
      // Simulate API call
      setTimeout(() => {
        setPayments([
          { 
            id: 'PAY-001', 
            customer: 'John Doe', 
            amount: 12500.00, 
            method: 'Credit Card', 
            status: 'completed', 
            date: '2023-09-24',
            reference: 'INV-001'
          },
          // Add more sample data as needed
        ]);
        setLoading(false);
      }, 500);
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filters.status === 'all' || payment.status === filters.status;
    const matchesMethod = filters.method === 'all' || payment.method === filters.method;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
      'completed': { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      'failed': { bg: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
    };
    
    const statusInfo = statusMap[status] || { bg: 'bg-gray-100 text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg}`}>
        {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleStatusUpdate = (paymentId, newStatus) => {
    // TODO: Implement status update logic
    console.log(`Updating payment ${paymentId} to status ${newStatus}`);
  };

  const handleDelete = (paymentId) => {
    // TODO: Implement delete logic
    if (window.confirm('Are you sure you want to delete this payment?')) {
      console.log(`Deleting payment ${paymentId}`);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Payment Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all payment transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Record New Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              id="status-filter"
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              id="method-filter"
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={filters.method}
              onChange={(e) => setFilters({...filters, method: e.target.value})}
            >
              <option value="all">All Methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Payment ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Amount (LKR)
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Method
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {payment.id}
                            {payment.reference && (
                              <div className="text-xs text-gray-500">{payment.reference}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {payment.customer}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {new Intl.NumberFormat('en-LK', {
                              style: 'decimal',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(payment.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {payment.method}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => console.log(`View ${payment.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => handleStatusUpdate(payment.id, payment.status)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
