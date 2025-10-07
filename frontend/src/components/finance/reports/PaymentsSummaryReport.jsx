import React, { useState, useEffect } from 'react';
import { Download, CreditCard, CheckCircle, Clock, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulated data - replace with actual API call
        const response = await fetch(`/api/payments/summary?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
        const data = await response.json();
        setPaymentsData(data);
      } catch (error) {
        console.error('Error fetching payments summary:', error);
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

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const successRate = paymentsData.totalPayments > 0 
    ? (paymentsData.successfulPayments / paymentsData.totalPayments * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Payments Summary Report</h2>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        <Button onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{paymentsData.totalPayments}</p>
                  <span className={`flex items-center text-sm mb-1 ${paymentsData.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {paymentsData.trend >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(paymentsData.trend)}%
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  LKR {paymentsData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {successRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paymentsData.successfulPayments} of {paymentsData.totalPayments} payments
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                successRate >= 90 ? 'bg-green-100' : 
                successRate >= 80 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <CheckCircle className={`h-6 w-6 ${
                  successRate >= 90 ? 'text-green-600' : 
                  successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Transaction</p>
                <p className="text-2xl font-bold">
                  LKR {paymentsData.avgTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {paymentsData.paymentMethods.map((method) => (
                <div key={method.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{method.name}</span>
                    <div className="text-sm text-muted-foreground">
                      {method.count} transactions
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {method.successRate}% success rate
                    </div>
                    <div className="font-medium">
                      LKR {method.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        method.successRate >= 90 ? 'bg-green-500' :
                        method.successRate >= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      } rounded-full`} 
                      style={{ 
                        width: `${method.percentage}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-full bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span>Completed</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {paymentsData.successfulPayments} payments
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-full bg-yellow-100 text-yellow-800">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span>Pending</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {paymentsData.pendingPayments} payments
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-full bg-red-100 text-red-800">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <span>Failed</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {paymentsData.failedPayments} payments
                </div>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-6">
                <div 
                  className="h-full bg-green-500" 
                  style={{ 
                    width: `${(paymentsData.successfulPayments / paymentsData.totalPayments) * 100}%` 
                  }}
                />
                <div 
                  className="h-full bg-yellow-500 -mt-2" 
                  style={{ 
                    width: `${(paymentsData.pendingPayments / paymentsData.totalPayments) * 100}%`,
                    marginLeft: `${(paymentsData.successfulPayments / paymentsData.totalPayments) * 100}%`
                  }}
                />
                <div 
                  className="h-full bg-red-500 -mt-2" 
                  style={{ 
                    width: `${(paymentsData.failedPayments / paymentsData.totalPayments) * 100}%`,
                    marginLeft: `${((paymentsData.successfulPayments + paymentsData.pendingPayments) / paymentsData.totalPayments) * 100}%`
                  }}
                />
              </div>
              
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                <div className="space-y-3">
                  {paymentsData.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${getStatusColor(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                        </div>
                        <span className="font-medium">{tx.id.substring(0, 8)}...</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          LKR {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsSummaryReport;
