import React, { useState } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import FinanceSummaryReport from './FinanceSummaryReport';
import ExpensesSummaryReport from './ExpensesSummaryReport';
import OrdersSummaryReport from './OrdersSummaryReport';
import PayrollSummaryReport from './PayrollSummaryReport';
import PaymentsSummaryReport from './PaymentsSummaryReport';

export default function ReportsDashboard() {
  const [activeReport, setActiveReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // Start of current month
    to: new Date(), // Today
  });

  const reports = [
    { id: 'finance', name: 'Finance Summary', component: FinanceSummaryReport },
    { id: 'expenses', name: 'Expenses Summary', component: ExpensesSummaryReport },
    { id: 'orders', name: 'Orders Summary', component: OrdersSummaryReport },
    { id: 'payroll', name: 'Payroll Summary', component: PayrollSummaryReport },
    { id: 'payments', name: 'Payments Summary', component: PaymentsSummaryReport },
  ];

  const handleBack = () => setActiveReport(null);

  if (activeReport) {
    const ReportComponent = reports.find(r => r.id === activeReport)?.component;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {reports.find(r => r.id === activeReport)?.name} Report
          </h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          {ReportComponent && <ReportComponent dateRange={dateRange} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download various financial reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card 
            key={report.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setActiveReport(report.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate detailed {report.name.toLowerCase()}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
