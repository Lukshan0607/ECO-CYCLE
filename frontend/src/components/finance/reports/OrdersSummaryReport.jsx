import React, { useState, useEffect } from 'react';
import { Download, Package, CheckCircle, Clock, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const OrdersSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    trend: 0,
    ordersByStatus: [],
    topProducts: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulated data - replace with actual API call
        const response = await fetch(`/api/orders/summary?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
        const data = await response.json();
        setOrderStats(data);
      } catch (error) {
        console.error('Error fetching orders summary:', error);
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
    doc.text('ORDERS SUMMARY REPORT', 105, 45, { align: 'center' });
    
    // Date range
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(
      `Period: ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`, 
      14, 
      55
    );
    
    // Summary stats
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('Total Orders:', 14, 70);
    doc.text(orderStats.totalOrders.toString(), 50, 70);
    
    doc.text('Total Revenue:', 100, 70);
    doc.text(`LKR ${orderStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 150, 70);
    
    doc.text('Avg. Order Value:', 14, 80);
    doc.text(`LKR ${orderStats.avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 60, 80);
    
    // Orders by status table
    doc.autoTable({
      startY: 90,
      head: [['Status', 'Count', 'Percentage']],
      body: orderStats.ordersByStatus.map(status => [
        status.status,
        status.count,
        { 
          content: `${((status.count / orderStats.totalOrders) * 100).toFixed(1)}%`,
          styles: { halign: 'right' }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' }
      },
      margin: { top: 15 }
    });
    
    // Top products table
    doc.setFontSize(12).setFont(undefined, 'bold');
    doc.text('Top Selling Products', 14, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Quantity Sold', 'Revenue (LKR)']],
      body: orderStats.topProducts.map(product => [
        product.name,
        product.quantity,
        { 
          content: product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' }
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
    
    doc.save(`orders-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Orders Summary Report</h2>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        <Button onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
                  <span className={`flex items-center text-sm mb-1 ${orderStats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {orderStats.trend >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(orderStats.trend)}%
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  LKR {orderStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">
                  LKR {orderStats.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {orderStats.totalOrders > 0 
                    ? ((orderStats.completed / orderStats.totalOrders) * 100).toFixed(1) + '%' 
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Orders by Status</h3>
            <div className="space-y-4">
              {orderStats.ordersByStatus.map((status) => (
                <div key={status.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-full ${getStatusColor(status.status)}`}>
                        {getStatusIcon(status.status)}
                      </div>
                      <span className="font-medium">{status.status}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {status.count} orders ({
                        orderStats.totalOrders > 0 
                          ? ((status.count / orderStats.totalOrders) * 100).toFixed(1) 
                          : '0'
                      }%)
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        status.status.toLowerCase() === 'completed' ? 'bg-green-500' :
                        status.status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      } rounded-full`} 
                      style={{ 
                        width: `${(status.count / orderStats.totalOrders) * 100}%` 
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
            <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              {orderStats.topProducts.map((product, index) => (
                <div key={product.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} sold
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">
                      LKR {product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersSummaryReport;
