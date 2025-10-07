import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, FileText, Users, Download, PieChart } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import format from 'date-fns/format';
import subMonths from 'date-fns/subMonths';
import addDays from 'date-fns/addDays';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PaymentStatusPieChart from '../PaymentStatusPieChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// Format currency helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date helper function
const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FinanceSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    salaryExpenses: 0,
    netProfit: 0,
    revenueTrend: 0,
    expenseTrend: 0,
    salaryData: [],
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      console.log('Fetching financial data...');
      try {
        // Get current month and year for filtering
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const currentMonthFormatted = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        console.log('Making API requests...');
        // Fetch all necessary data in parallel
        const [salesResponse, expensesResponse, payrollsResponse] = await Promise.all([
          axios.get(`${API_URL}/sales/orders`)
            .then(res => {
              console.log('Sales response:', res.data);
              return res;
            })
            .catch(err => {
              console.error('Error fetching sales data:', err);
              throw err;
            }),
          axios.get(`${API_URL}/expenses/summary`)
            .then(res => {
              console.log('Expenses response:', res.data);
              return res;
            })
            .catch(err => {
              console.error('Error fetching expenses data:', err);
              throw err;
            }),
          axios.get(`${API_URL}/payroll`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            params: {
              month: currentMonthFormatted
            }
          })
          .then(res => {
            console.log('Payroll response:', res.data);
            return res;
          })
          .catch(err => {
            console.error('Error fetching payroll data:', err);
            throw err;
          })
        ]);

        const orders = salesResponse.data || [];
        const expensesData = expensesResponse.data?.data || { total: 0 };
        const payrolls = payrollsResponse.data?.data || [];
        
        // Calculate monthly payroll (matching EmployeePayroll calculation)
        const monthlyPayrolls = payrolls.filter(run => run.month?.startsWith(currentMonthFormatted));
        const salaryExpenses = monthlyPayrolls.reduce((sum, run) => sum + (parseFloat(run.netPay) || 0), 0);
        
        // Prepare salary data for chart
        const salaryData = [
          { name: 'Basic Salary', value: monthlyPayrolls.reduce((sum, run) => sum + (parseFloat(run.basicSalary) || 0), 0) },
          { name: 'Overtime', value: monthlyPayrolls.reduce((sum, run) => sum + (parseFloat(run.overtime) || 0), 0) },
          { name: 'EPF', value: monthlyPayrolls.reduce((sum, run) => sum + (parseFloat(run.epf) || 0), 0) },
          { name: 'ETF', value: monthlyPayrolls.reduce((sum, run) => sum + (parseFloat(run.etf) || 0), 0) }
        ].filter(item => item.value > 0);
        
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
        const totalExpenses = salaryExpenses + otherExpenses;
        const netProfit = totalRevenue - totalExpenses;
        
        // Calculate trends (simplified - in a real app, you'd compare with previous period)
        const revenueTrend = 0; // Calculate based on previous period
        const expenseTrend = 0; // Calculate based on previous period

        setReportData({
          totalRevenue,
          totalExpenses,
          salaryExpenses,
          netProfit,
          revenueTrend,
          expenseTrend,
          salaryData,
        });
      } catch (error) {
        console.error('Error fetching financial data:', error);
        console.log('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, [dateRange]);

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Header with company info
    doc.setFillColor(0, 100, 180);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ECOCYCLE LANKA (PVT) LTD', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('123 Green Tech Park, Colombo 05, Sri Lanka', 105, 20, { align: 'center' });
    doc.text('Tel: +94 11 234 5678 | Email: ecocycle923@gmail.com', 105, 25, { align: 'center' });
    
    // Report title and date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Finance Summary Report', 20, 45);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`, 20, 52);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 59);

    // Add financial cards with improved styling
    const cardWidth = 90; // Wider cards for better readability
    const cardHeight = 25; // More compact height
    const cardMargin = 10; // Increased margin
    const startY = 70; // Starting Y position for cards
    
    // Card data with professional color scheme
    const cards = [
      {
        title: 'TOTAL REVENUE',
        value: formatCurrency(reportData.totalRevenue),
        color: [16, 86, 167], // Professional blue
        bgColor: [232, 240, 253], // Light blue background
        borderColor: [207, 226, 255], // Subtle border
        description: 'Total revenue from all completed transactions'
      },
      {
        title: 'TOTAL EXPENSES',
        value: formatCurrency(reportData.totalExpenses),
        color: [183, 29, 24], // Professional red
        bgColor: [253, 235, 235], // Light red background
        borderColor: [254, 215, 215], // Subtle border
        description: 'Total operational and administrative costs'
      },
      {
        title: 'SALARY EXPENSES',
        value: formatCurrency(reportData.salaryExpenses),
        color: [123, 36, 170], // Professional purple
        bgColor: [240, 235, 255], // Light purple background
        borderColor: [224, 214, 255], // Subtle border
        description: 'Monthly payroll and benefits'
      },
      {
        title: 'NET ' + (reportData.netProfit >= 0 ? 'PROFIT' : 'LOSS'),
        value: formatCurrency(reportData.netProfit),
        color: reportData.netProfit >= 0 ? [0, 123, 92] : [183, 29, 24], // Green if profit, red if loss
        bgColor: reportData.netProfit >= 0 ? [231, 251, 240] : [253, 235, 235], // Light green/red background
        borderColor: reportData.netProfit >= 0 ? [199, 247, 220] : [254, 215, 215], // Subtle border
        description: reportData.netProfit >= 0 ? 'Net profit after all expenses' : 'Net loss after all expenses'
      }
    ];

    // Draw cards in 2x2 grid with improved styling
    cards.forEach((card, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = 10 + (col * (cardWidth + cardMargin));
      const y = startY + (row * (cardHeight + cardMargin));
      
      // Card background with subtle shadow effect
      doc.setFillColor(...card.bgColor);
      doc.setDrawColor(...card.borderColor);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Add a subtle left border
      doc.setFillColor(...card.color);
      doc.rect(x, y, 4, cardHeight, 'F');
      
      // Card content
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'bold');
      doc.text(card.title, x + 10, y + 8);
      
      // Value with improved typography
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...card.color);
      doc.text(card.value, x + 10, y + 18);
      
      // Description with ellipsis if too long
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(120, 120, 120);
      const desc = doc.splitTextToSize(card.description, cardWidth - 25);
      doc.text(desc, x + 10, y + 22);
      
      // Removed icon circle
    });
    
    // Calculate the position after cards (2 rows of cards + margins)
    const afterCardsY = startY + (cardHeight * 2) + (cardMargin * 3);
    
    // Add section divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, afterCardsY - 10, 190, afterCardsY - 10);
    
    // Financial summary section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Financial Summary', 20, afterCardsY);
    doc.setFont(undefined, 'normal');
    
    // Simple table
    const addRow = (label, value, y, isBold = false) => {
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.text(label, 25, y);
      doc.text(value, 180, y, { align: 'right' });
      return y + 7;
    };
    
    let yPos = afterCardsY + 15;
    yPos = addRow('Total Revenue', formatCurrency(reportData.totalRevenue), yPos);
    yPos = addRow('Total Expenses', formatCurrency(reportData.totalExpenses), yPos);
    yPos = addRow('  • Salary Expenses', formatCurrency(reportData.salaryExpenses), yPos);
    yPos = addRow('  • Other Expenses', formatCurrency(reportData.totalExpenses - reportData.salaryExpenses), yPos);
    yPos = addRow('Net Profit', formatCurrency(reportData.netProfit), yPos + 3, true);
    
    // Add section divider before key metrics
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Key metrics
    doc.setFont(undefined, 'bold');
    doc.text('Key Metrics', 20, yPos);
    doc.setFont(undefined, 'normal');
    
    yPos += 10;
    yPos = addRow('Profit Margin', 
      `${((reportData.netProfit / (reportData.totalRevenue || 1)) * 100).toFixed(1)}%`, 
      yPos
    );
    yPos = addRow('Salary to Revenue', 
      `${((reportData.salaryExpenses / (reportData.totalRevenue || 1)) * 100).toFixed(1)}%`, 
      yPos
    );
    yPos = addRow('Expense Ratio', 
      `${((reportData.totalExpenses / (reportData.totalRevenue || 1)) * 100).toFixed(1)}%`, 
      yPos
    );
    
    // Add final section divider
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Confidential - For Internal Use Only', 20, 285);
    doc.text(`Page 1 of 1`, 105, 285, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 190, 285, { align: 'right' });
    
    // Save PDF
    doc.save(`finance-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderTrendIcon = (value) => {
    if (value > 0) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Finance Summary Report</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </p>
        </div>
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  LKR {reportData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center mt-1 text-sm ${reportData.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.revenueTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(reportData.revenueTrend)}% from last period
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  LKR {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center mt-1 text-sm ${reportData.expenseTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.expenseTrend <= 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(reportData.expenseTrend)}% from last period
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Salary Expenses</p>
                <p className="text-2xl font-bold">
                  LKR {reportData.salaryExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(reportData.salaryExpenses / reportData.totalExpenses * 100 || 0).toFixed(1)}% of total expenses
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.netProfit >= 0 ? '+' : ''}LKR {Math.abs(reportData.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Margin: {((reportData.netProfit / reportData.totalRevenue) * 100 || 0).toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Status Chart */}
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Payment Status Distribution</h3>
          </div>
          <div className="h-64">
            <PaymentStatusPieChart />
          </div>
        </Card>

        {/* Salary Expense Distribution */}
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Salary Expense Distribution</h3>
          </div>
          <div className="h-64">
            {reportData.salaryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.salaryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `LKR ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="value" name="Amount (LKR)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No salary data available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinanceSummaryReport;
