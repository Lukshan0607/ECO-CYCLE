import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import { LayoutDashboard, CheckCircle, FileText, Factory, Package, TrendingUp, AlertTriangle, Printer, Settings } from "lucide-react";

const ProductionReportPage = () => {
  const [acceptedMaterials, setAcceptedMaterials] = useState([]);
  const [plans, setPlans] = useState([]);
  const [machines, setMachines] = useState([]);
  const [qualityRecords, setQualityRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAcceptedMaterials = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/production-requests/status/Approved');
      setAcceptedMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Report: fetchAcceptedMaterials', e);
    }
  };

  const fetchProductionPlans = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/production-plans');
      setPlans(Array.isArray(res.data?.plans) ? res.data.plans : Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Report: fetchProductionPlans', e);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/machines');
      setMachines(Array.isArray(res.data?.machines) ? res.data.machines : Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Report: fetchMachines', e);
    }
  };

  const fetchQuality = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/quality');
      setQualityRecords(Array.isArray(res.data?.records) ? res.data.records : Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Report: fetchQuality', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAcceptedMaterials(),
      fetchProductionPlans(),
      fetchMachines(),
      fetchQuality(),
    ]).finally(() => setLoading(false));
  }, []);

  const menuItems = [
    { name: "Overview", key: "overview", icon: <LayoutDashboard size={20} /> },
    { name: "Products", key: "products", icon: <Package size={20} /> },
    { name: "Production Planning", key: "planning", icon: <Factory size={20} /> },
    { name: "Raw Materials", key: "materials", icon: <Package size={20} /> },
    { name: "Quality Control", key: "quality", icon: <Settings size={20} /> },
    { name: "Analytics", key: "analytics", icon: <TrendingUp size={20} /> },
    { name: "Reports", key: "reports", icon: <FileText size={20} /> },
  ];

  const approvedRequestsCount = acceptedMaterials.length;
  const approvedTotalQty = acceptedMaterials.reduce((sum, r) => sum + (parseFloat(r?.requestedQty) || 0), 0);
  const inProgressPlans = plans.filter(p => p.status === 'In Progress').length;
  const completedPlans = plans.filter(p => p.status === 'Completed').length;
  const machinesRunning = machines.filter(m => (m.status || '').toLowerCase() === 'running').length;
  const defectRate = (() => {
    const totalInspected = qualityRecords.reduce((s, q) => s + (parseFloat(q?.inspectedQuantity) || 0), 0);
    const totalDefects = qualityRecords.reduce((s, q) => s + (parseFloat(q?.defectCount) || 0), 0);
    if (!totalInspected) return 0;
    return (totalDefects / totalInspected) * 100;
  })();

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'Production Report';
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    // Fallback restore in case afterprint isn't fired
    setTimeout(restoreTitle, 1500);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body, #root { background: white !important; }
          /* Hide navigation, headers, and any explicit no-print */
          aside, header, nav, .no-print { display: none !important; }
          /* Expand content to full width */
          .print-content { width: 100% !important; margin: 0 !important; padding: 0 0 !important; }
          /* Remove gradients and shadows for clean print */
          .bg-gradient-to-br, .bg-white { background: white !important; }
          .shadow, .shadow-lg, .shadow-xl { box-shadow: none !important; }
          /* Avoid page breaks in headers */
          h1, h2, h3 { page-break-after: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          /* Show print-only header */
          .only-print { display: block !important; }
        }
        /* Hide print-only header on screen */
        .only-print { display: none; }
      `}</style>

      {/* Sidebar */}
      <aside className="no-print w-72 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Factory className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Production Hub</h2>
              <p className="text-sm text-gray-500">Manufacturing Operations</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            item.key === 'reports' ? (
              <div
                key={item.key}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </div>
            ) : item.key === 'analytics' ? (
              <Link
                key={item.key}
                to="/production/analytics"
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ) : (
              <Link
                key={item.key}
                to={`/production?tab=${item.key}`}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          ))}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto print-content">
      {/* Print-only report title and company info */}
      <div className="only-print" style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '12pt', fontWeight: 700, marginBottom: '2px' }}>ECOCYCLE LANKA (PVT) LTD</div>
        <div style={{ fontSize: '10pt', color: '#444', lineHeight: 1.3 }}>
          123 Green Tech Park, Colombo 05, Sri Lanka<br/>
          Tel: +94 11 234 5678 | Email: hr@ecocycle.lk | Web: www.ecocycle.lk
        </div>
        <hr style={{ margin: '8px 0', border: 0, borderTop: '1px solid #ccc' }} />
        <h1 style={{ fontSize: '18pt', margin: 0 }}>Production Report</h1>
        <div style={{ fontSize: '10pt', color: '#555' }}>Generated on: {new Date().toLocaleString()}</div>
      </div>
      <header className="no-print bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Reports</h1>
            <p className="text-gray-600">Summary of production KPIs and records</p>
          </div>
        </div>
        <div>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <Printer size={18} /> Print / Export
          </button>
        </div>
      </header>

      <div className="p-6">
      {loading ? (
        <div className="text-center text-gray-600">Loading report...</div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Approved Raw Materials</div>
                  <div className="text-3xl font-bold">{approvedRequestsCount}</div>
                  <div className="text-xs text-gray-500">Stock(Kg): {approvedTotalQty}</div>
                </div>
                <CheckCircle className="text-emerald-500" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Plans In Progress</div>
                  <div className="text-3xl font-bold">{inProgressPlans}</div>
                  <div className="text-xs text-gray-500">Completed: {completedPlans}</div>
                </div>
                <TrendingUp className="text-blue-600" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Machines Running</div>
                  <div className="text-3xl font-bold">{machinesRunning}</div>
                  <div className="text-xs text-gray-500">Total: {machines.length}</div>
                </div>
                <Factory className="text-purple-600" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Defect Rate</div>
                  <div className="text-3xl font-bold">{defectRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">from {qualityRecords.length} inspections</div>
                </div>
                <AlertTriangle className="text-orange-600" />
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approved Materials */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Package size={18}/> Approved Raw Materials</h2>
                <span className="text-xs text-gray-500">{new Date().toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">Material</th>
                      <th className="py-2 pr-2">Color</th>
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2 text-right">Qty (Kg)</th>
                      <th className="py-2 pr-2">Approved Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedMaterials.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-gray-500">No approved requests</td></tr>
                    ) : (
                      acceptedMaterials.map((r) => (
                        <tr key={r._id} className="border-b last:border-b-0">
                          <td className="py-2 pr-2">{r?.inventoryItemId?.name || '-'}</td>
                          <td className="py-2 pr-2">{r?.inventoryItemId?.color || '-'}</td>
                          <td className="py-2 pr-2">{r?.inventoryItemId?.type || '-'}</td>
                          <td className="py-2 pr-2 text-right">{r?.requestedQty}</td>
                          <td className="py-2 pr-2">{r?.approvedDate ? new Date(r.approvedDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Production Plans */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Factory size={18}/> Production Plans</h2>
                <span className="text-xs text-gray-500">{plans.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">Product</th>
                      <th className="py-2 pr-2 text-right">Qty</th>
                      <th className="py-2 pr-2">Start</th>
                      <th className="py-2 pr-2">End</th>
                      <th className="py-2 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-gray-500">No plans</td></tr>
                    ) : (
                      plans.slice(0, 10).map((p) => (
                        <tr key={p._id} className="border-b last:border-b-0">
                          <td className="py-2 pr-2">{p.productName || '-'}</td>
                          <td className="py-2 pr-2 text-right">{p.quantity}</td>
                          <td className="py-2 pr-2">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-2">{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-2">{p.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
      </div>
    </div>
  );
};

export default ProductionReportPage;
