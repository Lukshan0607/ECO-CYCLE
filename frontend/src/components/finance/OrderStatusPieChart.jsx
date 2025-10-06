import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { salesApi } from '../../services/salesApi';

const COLORS = {
  'Completed': '#10B981',    // Green
  'Processing': '#3B82F6',   // Blue
  'Pending': '#F59E0B',      // Yellow
  'Failed': '#EF4444',       // Red
  'Shipped': '#8B5CF6',      // Purple
  'Cancelled': '#6B7280'     // Gray
};

const OrderStatusPieChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to normalize status (convert to title case and handle variations)
  const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    
    // Convert to lowercase for case-insensitive comparison
    const lowerStatus = status.toLowerCase().trim();
    
    // Handle common variations
    if (['completed', 'complete', 'paid', 'delivered'].includes(lowerStatus)) return 'Completed';
    if (['pending', 'processing', 'in progress', 'unpaid'].includes(lowerStatus)) return 'Pending';
    if (['failed', 'failure', 'error'].includes(lowerStatus)) return 'Failed';
    if (['cancelled', 'canceled'].includes(lowerStatus)) return 'Cancelled';
    if (['shipped', 'shipping'].includes(lowerStatus)) return 'Shipped';
    if (['refunded', 'refund'].includes(lowerStatus)) return 'Refunded';
    
    // For any other status, capitalize the first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  useEffect(() => {
    const fetchOrderStatusData = async () => {
      try {
        setLoading(true);
        const orders = await salesApi.getAllOrders();
        
        // Count orders by normalized status
        const statusCounts = {};
        orders.forEach(order => {
          const status = normalizeStatus(order.status);
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Convert to array format for the chart
        const chartData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
          color: COLORS[name] || '#999999'
        }));

        setData(chartData);
      } catch (err) {
        console.error('Error fetching order status data:', err);
        setError('Failed to load order status data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatusData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Order Status Distribution</h3>
      </div>
      
      <div className="h-80 flex flex-col">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} orders`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: '1rem',
                  fontSize: '0.75rem',
                }}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700">{item.name}</span>
              <span className="ml-auto font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPieChart;
