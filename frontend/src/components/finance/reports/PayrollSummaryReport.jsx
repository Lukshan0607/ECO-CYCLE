import React, { useState, useEffect } from 'react';
import { Download, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const PayrollSummaryReport = ({ dateRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [payrollData, setPayrollData] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    averageSalary: 0,
    epfContributions: 0,
    etfContributions: 0,
    overtimePayments: 0,
    netPay: 0,
    trend: 0,
    departmentBreakdown: [],
    payrollHistory: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulated data - replace with actual API call
        const response = await fetch(`/api/payroll/summary?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
        const data = await response.json();
        setPayrollData(data);
      } catch (error) {
        console.error('Error fetching payroll summary:', error);
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
    doc.text('PAYROLL SUMMARY REPORT', 105, 45, { align: 'center' });
    
    // Date range
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text(
      `Pay Period: ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`, 
      14, 
      55
    );
    
    // Summary stats
    doc.setFontSize(11).setFont(undefined, 'bold');
    doc.text('Total Payroll:', 14, 70);
    doc.text(`LKR ${payrollData.totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 70);
    
    doc.text('Total Employees:', 100, 70);
    doc.text(payrollData.totalEmployees.toString(), 160, 70);
    
    doc.text('Average Salary:', 14, 80);
    doc.text(`LKR ${payrollData.averageSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 80);
    
    doc.text('EPF Contributions:', 100, 80);
    doc.text(`LKR ${payrollData.epfContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 160, 80);
    
    // Department breakdown table
    doc.autoTable({
      startY: 90,
      head: [['Department', 'Employees', 'Total Payroll', 'Avg. Salary']],
      body: payrollData.departmentBreakdown.map(dept => [
        dept.department,
        dept.employeeCount,
        { 
          content: `LKR ${dept.totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `LKR ${dept.averageSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      margin: { top: 15 }
    });
    
    // Payroll history table
    doc.setFontSize(12).setFont(undefined, 'bold');
    doc.text('Payroll History', 14, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Period', 'Basic Salary', 'OT', 'Allowances', 'Deductions', 'Net Pay']],
      body: payrollData.payrollHistory.map(period => [
        period.period,
        { 
          content: `LKR ${period.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `LKR ${period.overtime.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `LKR ${period.allowances.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `LKR ${period.deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right' }
        },
        { 
          content: `LKR ${period.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          styles: { halign: 'right', fontStyle: 'bold' }
        }
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
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
    
    doc.save(`payroll-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
          <h2 className="text-xl font-semibold">Payroll Summary Report</h2>
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
                <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">
                    LKR {payrollData.totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`flex items-center text-sm mb-1 ${payrollData.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {payrollData.trend >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(payrollData.trend)}%
                  </span>
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
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{payrollData.totalEmployees}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Salary</p>
                <p className="text-2xl font-bold">
                  LKR {payrollData.averageSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <p className="text-sm font-medium text-muted-foreground">EPF Contributions</p>
                <p className="text-2xl font-bold">
                  LKR {payrollData.epfContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Department Breakdown</h3>
            <div className="space-y-4">
              {payrollData.departmentBreakdown.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{dept.department}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.employeeCount} employees
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      Avg: LKR {dept.averageSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="font-medium">
                      LKR {dept.totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ 
                        width: `${(dept.totalPayroll / payrollData.totalPayroll) * 100}%` 
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
            <h3 className="text-lg font-medium mb-4">Payroll Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Salary:</span>
                <span className="font-medium">
                  LKR {payrollData.totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overtime Payments:</span>
                <span className="font-medium">
                  LKR {payrollData.overtimePayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">EPF (12%):</span>
                <span className="font-medium">
                  LKR {payrollData.epfContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ETF (3%):</span>
                <span className="font-medium">
                  LKR {payrollData.etfContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t pt-3 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Net Pay:</span>
                  <span className="text-primary">
                    LKR {payrollData.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollSummaryReport;
