import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ExpensesSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [expenseTrends, setExpenseTrends] = useState({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [avgExpense, setAvgExpense] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulated data - replace with actual API call
        const response = await fetch(`/api/expenses/summary?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
        const data = await response.json();
        
        setExpensesByCategory(data.categories || []);
        setExpenseTrends(data.trends || {});
        setTotalExpenses(data.total || 0);
        setAvgExpense(data.average || 0);
      } catch (error) {
        console.error('Error fetching expenses summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    doc.text(`LKR ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 70);
    
    doc.text('Average Daily Expense:', 100, 70);
    doc.text(`LKR ${avgExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 160, 70);
    
    // Expenses by category table
    doc.autoTable({
      startY: 80,
      head: [['Category', 'Amount (LKR)', 'Percentage', 'Trend']],
      body: expensesByCategory.map(expense => [
        expense.category,
        { 
          content: expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        { 
          content: `${((expense.amount / totalExpenses) * 100).toFixed(1)}%`,
          styles: { halign: 'right' }
        },
        { 
          content: expenseTrends[expense.category] > 0 ? 
            { content: `+${expenseTrends[expense.category]}%`, styles: { textColor: [255, 0, 0] } } : 
            { content: `${expenseTrends[expense.category]}%`, styles: { textColor: [0, 128, 0] } },
          styles: { halign: 'center' }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Expenses Summary Report</h2>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        <Button onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg. Daily Expense</p>
                <p className="text-2xl font-bold">
                  LKR {avgExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {expensesByCategory.length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Expenses by Category</h3>
        <div className="space-y-2">
          {expensesByCategory.map((expense) => {
            const percentage = (expense.amount / totalExpenses) * 100;
            const trend = expenseTrends[expense.category] || 0;
            
            return (
              <div key={expense.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="font-medium w-32 truncate">{expense.category}</span>
                    <span className="text-muted-foreground ml-2">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-right">
                      LKR {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`ml-2 flex items-center ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {trend > 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(trend)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExpensesSummaryReport;
