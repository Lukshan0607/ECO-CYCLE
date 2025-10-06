import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CreditCard, Loader2, AlertCircle, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OverviewCards = () => {
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,      // Sum of all completed payments
    paymentsReceived: {   // Completed payments (count and amount)
      count: 0,
      amount: 0
    },
    salaryExpenses: 0,    // Total salary expenses from payroll
    totalExpenses: 0,     // Sum of all expenses (including salary)
    netProfit: 0,         // Total Revenue - Total Expenses
    profitTrend: 'up',    // Profit trend (up/down)
    profitChange: '0%',   // Percentage change in profit
    salaryTrend: 'up',    // Salary expense trend (up/down)
    salaryChange: '0%'    // Percentage change in salary expenses
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinancialData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchFinancialData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current month and year for filtering payrolls
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentYear = currentDate.getFullYear();
      const currentMonthFormatted = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      
      // Fetch all necessary data in parallel
      const [salesResponse, expensesResponse, payrollsResponse] = await Promise.all([
        axios.get(`${API_URL}/sales/orders`),
        axios.get(`${API_URL}/expenses/summary`),
        axios.get(`${API_URL}/payroll`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);
      
      const orders = salesResponse.data || [];
      const expensesData = expensesResponse.data?.data || { total: 0 };
      const payrolls = payrollsResponse.data?.data || [];
      
      // Calculate monthly payroll (matching EmployeePayroll calculation)
      const monthlyPayroll = payrolls
        .filter(run => run.month?.startsWith(currentMonthFormatted))
        .reduce((sum, run) => sum + (parseFloat(run.netPay) || 0), 0);
      
      // Calculate payment metrics from orders
      const metrics = orders.reduce((acc, order) => {
        if (order.paymentStatus === 'completed') {
          acc.paymentsReceived.count += 1;
          acc.paymentsReceived.amount += parseFloat(order.totalAmount) || 0;
        }
        return acc;
      }, { 
        paymentsReceived: { count: 0, amount: 0 }
      });

      const totalRevenue = metrics.paymentsReceived.amount;
      const otherExpenses = parseFloat(expensesData.total) || 0;
      const totalExpenses = monthlyPayroll + otherExpenses;
      const netProfit = totalRevenue - totalExpenses;

      setFinanceData({
        totalRevenue,
        paymentsReceived: metrics.paymentsReceived,
        salaryExpenses: monthlyPayroll,
        totalExpenses,
        netProfit,
        profitTrend: netProfit >= 0 ? 'up' : 'down',
        profitChange: '0.0%', // Placeholder, can be calculated with previous month data
        salaryTrend: 'up',    // Placeholder
        salaryChange: '0.0%'  // Placeholder
      });
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load financial data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    // Handle loading/error states
    if (amount === undefined || amount === null) return 'LKR 0.00';
    
    // Format as LKR with thousand separators
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(financeData.totalRevenue),
      subtitle: `${financeData.paymentsReceived.count} completed payments`,
      icon: DollarSign,
      color: 'bg-gradient-to-r from-blue-600 to-blue-800',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-100',
      bgIconColor: 'bg-blue-100',
      description: 'Total revenue from all completed payments',
      trend: 'up',
      trendValue: '12.5%',
      trendText: 'vs last month'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(financeData.totalRevenue - financeData.totalExpenses),
      subtitle: `Revenue: ${formatCurrency(financeData.totalRevenue)} - Expenses: ${formatCurrency(financeData.totalExpenses)}`,
      icon: TrendingUp,
      color: `bg-gradient-to-r ${(financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'from-emerald-600 to-emerald-800' : 'from-rose-600 to-rose-800'}`,
      bgColor: (financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
      textColor: (financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'text-emerald-600' : 'text-rose-600',
      iconColor: (financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'text-emerald-100' : 'text-rose-100',
      bgIconColor: (financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'bg-emerald-100' : 'bg-rose-100',
      description: 'Net profit (Revenue - Expenses)',
      trend: (financeData.totalRevenue - financeData.totalExpenses) >= 0 ? 'up' : 'down',
      trendValue: (Math.abs((financeData.totalRevenue - financeData.totalExpenses) / (financeData.totalExpenses || 1)) * 100).toFixed(1) + '%',
      trendText: 'vs expenses'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(financeData.totalExpenses),
      subtitle: 'All operational costs',
      icon: CreditCard,
      color: 'bg-gradient-to-r from-rose-600 to-rose-800',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      iconColor: 'text-rose-100',
      bgIconColor: 'bg-rose-100',
      description: 'Total operational and administrative expenses',
      trend: financeData.expenseTrend,
      trendValue: financeData.expenseChange,
      trendText: 'vs last month'
    },
    {
      title: 'Salary Expenses',
      value: formatCurrency(financeData.salaryExpenses),
      subtitle: 'Monthly payroll total',
      icon: Users,
      color: 'bg-gradient-to-r from-violet-600 to-violet-800',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      iconColor: 'text-violet-100',
      bgIconColor: 'bg-violet-100',
      description: 'Total monthly salary expenses',
      trend: financeData.salaryTrend,
      trendValue: financeData.salaryChange,
      trendText: 'vs last month'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading data...</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </h3>
                  {card.subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${card.color} shadow-md`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                {card.trend && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    card.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {card.trend === 'up' ? (
                      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L13 9.414V17a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0112 7z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1H9a1 1 0 110-2h2a1 1 0 011 1zM9 9a1 1 0 100-2H7a1 1 0 100 2h2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {card.trendValue}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {card.trendText}
                </span>
              </div>
            </div>
            
            <div className={`px-6 py-3 bg-white/50 border-t border-gray-100`}>
              <p className="text-xs text-gray-500 truncate">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
