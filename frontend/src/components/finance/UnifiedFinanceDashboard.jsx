// src/components/finance/UnifiedFinanceDashboard.jsx
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  DollarSign, FileText, TrendingUp, 
  Users, Briefcase, Target, Users as UsersIcon,
  Plus, Filter, Download, Calendar, ShoppingCart, Receipt,
  CreditCard, FileBarChart2
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import LogoutButton from "../common/LogoutButton";
import ExpenseBreakdown from './ExpenseBreakdown';

// Lazy load components
const EmployeePayroll = lazy(() => import('./EmployeePayroll'));
const EmployeeManagement = lazy(() => import('./EmployeeManagement'));
const OverviewCards = lazy(() => import('./OverviewCards'));
const FinanceCharts = lazy(() => import('./FinanceCharts'));
const OrderManagement = lazy(() => import('./OrderManagement'));
const ExpensesDashboard = lazy(() => import('./ExpensesDashboard'));
const PaymentsManagement = lazy(() => import('./PaymentsManagement'));
const OrderStatusPieChart = lazy(() => import('./OrderStatusPieChart'));
const PaymentStatusPieChart = lazy(() => import('./PaymentStatusPieChart'));
const ReportsDashboard = lazy(() => import('./reports/ReportsDashboard'));

// Data will be fetched from API

export default function UnifiedFinanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [financialData, setFinancialData] = useState({
    recentTransactions: [],
    expenseBreakdown: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  // Fetch and process expenses data for analytics
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch expenses data
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch expenses data');
      }
      const { data: expenses } = await response.json();
      
      // Process expenses data for analytics
      const monthlyData = {};
      
      expenses.forEach(expense => {
        if (!expense.date || !expense.amount) return;
        
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(expense.amount) || 0;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            period: monthYear,
            revenue: 0,
            expenses: 0,
            profit: 0,
            categories: {}
          };
        }
        
        // Categorize expenses
        const category = expense.category?.name || 'Uncategorized';
        if (!monthlyData[monthYear].categories[category]) {
          monthlyData[monthYear].categories[category] = 0;
        }
        monthlyData[monthYear].categories[category] += amount;
        
        // Update totals
        if (expense.type === 'income') {
          monthlyData[monthYear].revenue += amount;
        } else {
          monthlyData[monthYear].expenses += amount;
        }
        monthlyData[monthYear].profit = monthlyData[monthYear].revenue - monthlyData[monthYear].expenses;
      });
      
      // Convert to array and sort by period
      const processedData = Object.values(monthlyData).sort((a, b) => 
        a.period.localeCompare(b.period)
      );
      
      setAnalyticsData(processedData);
      
      // Store all expenses for the ExpenseBreakdown component
      setFinancialData(prev => ({
        ...prev,
        allExpenses: expenses, // Store all expenses for the breakdown
        recentTransactions: expenses.slice(0, 5) // Show 5 most recent
      }));
      
    } catch (err) {
      setError(err.message);
      console.error('Error processing expenses data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts and when activeTab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab]);


  // Get data from state
  const { allExpenses = [], recentTransactions = [] } = financialData;
  const pendingPayments = []; // This will be populated from the backend

  const tabs = [
    { id: "overview", name: "Financial Overview", icon: <DollarSign size={20} /> },
    { id: "expenses", name: "Expenses", icon: <Receipt size={20} /> },
    { id: "orders", name: "Order Management", icon: <ShoppingCart size={20} /> },
    { id: "analytics", name: "Financial Analytics", icon: <TrendingUp size={20} /> },
    { id: "reports", name: "Reports", icon: <FileBarChart2 size={20} /> },
    { id: "employee-management", name: "Employee Management", icon: <UsersIcon size={20} /> },
    { id: "payroll", name: "Employee Payroll", icon: <Briefcase size={20} /> },
    { id: "payments", name: "Payments Management", icon: <CreditCard size={20} /> }
  ];

  // Render content based on active tab
  const renderContent = () => {
    const renderWithSuspense = (Component, props = {}) => (
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <Component {...props} />
      </Suspense>
    );

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'expenses':
        return renderWithSuspense(ExpensesDashboard);
      case 'orders':
        return renderWithSuspense(OrderManagement);
      case 'analytics':
        return renderAnalytics();
      case 'employee-management':
        return renderWithSuspense(EmployeeManagement);
      case 'payroll':
        return renderWithSuspense(EmployeePayroll);
      case 'payments':
        return renderWithSuspense(PaymentsManagement);
      case 'reports':
        return renderWithSuspense(ReportsDashboard);
      default:
        return <div className="p-6">Select a tab to view content</div>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <OverviewCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>}>
          <PaymentStatusPieChart />
        </Suspense>
        <FinanceCharts />
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpenseBreakdown expenses={allExpenses} />

        <Suspense fallback={<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>}>
          <OrderStatusPieChart />
        </Suspense>
      </div>
    </div>
  );


  const renderTransactions = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Transaction ID</th>
                <th className="text-left p-2">Customer/Description</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Method</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">{transaction.id}</td>
                  <td className="p-2">{transaction.customer}</td>
                  <td className="p-2 font-semibold">₹{transaction.amount.toLocaleString()}</td>
                  <td className="p-2">{transaction.method}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-gray-600">{transaction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderPendingPayments = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Pending Payments</h3>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Send Reminder
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Payment ID</th>
                <th className="text-left p-2">Invoice</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Due Date</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">{payment.id}</td>
                  <td className="p-2">{payment.invoice}</td>
                  <td className="p-2">{payment.customer}</td>
                  <td className="p-2 font-semibold">₹{payment.amount.toLocaleString()}</td>
                  <td className="p-2">{payment.dueDate}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.overdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.overdue ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-2">
                    <Button variant="outline" size="sm">
                      Send Reminder
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Finance Hub</h2>
              <p className="text-sm text-gray-500">Finance & Payments</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive financial management and payment processing
              </p>
            </div>
            <div className="flex space-x-3">
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </main>
    </div>
  );
}
