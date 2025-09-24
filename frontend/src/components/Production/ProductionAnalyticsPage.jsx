import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import { LayoutDashboard, FileText, Factory, Package, TrendingUp, Settings, BarChart3, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"]; // tailwind palette

const ProductionAnalyticsPage = () => {
  const [plans, setPlans] = useState([]);
  const [qualityRecords, setQualityRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [plansRes, qualRes, machRes, prodRes, apprRes] = await Promise.all([
          axios.get("http://localhost:5000/api/production-plans"),
          axios.get("http://localhost:5000/api/quality"),
          axios.get("http://localhost:5000/api/machines"),
          axios.get("http://localhost:5000/api/products"),
          axios.get("http://localhost:5000/api/production-requests/status/Approved"),
        ]);
        setPlans(plansRes.data?.plans || (Array.isArray(plansRes.data) ? plansRes.data : []));
        setQualityRecords(qualRes.data?.records || (Array.isArray(qualRes.data) ? qualRes.data : []));
        setMachines(machRes.data?.machines || (Array.isArray(machRes.data) ? machRes.data : []));
        setProducts(prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []));
        setApproved(Array.isArray(apprRes.data) ? apprRes.data : []);
      } catch (e) {
        console.error("Analytics fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Date filtering helpers
  const isWithinRange = (dateStr) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (startDate) {
      const s = new Date(startDate);
      if (d < new Date(s.getFullYear(), s.getMonth(), s.getDate())) return false;
    }
    if (endDate) {
      const e = new Date(endDate);
      if (d > new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999)) return false;
    }
    return true;
  };

  // Derived datasets
  const productionByMonth = useMemo(() => {
    // Sum quantities by startDate month; fallback to current month if missing
    const map = new Map();
    plans.filter((p) => !startDate && !endDate ? true : isWithinRange(p.startDate)).forEach((p) => {
      const d = p.startDate ? new Date(p.startDate) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + (parseFloat(p.quantity) || 0));
    });
    const arr = Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1)).map(([k, v]) => ({ month: k, produced: v }));
    return arr;
  }, [plans]);

  const defectRateByMonth = useMemo(() => {
    const map = new Map();
    qualityRecords.filter((q) => !startDate && !endDate ? true : isWithinRange(q.inspectionDate)).forEach((q) => {
      const d = q.inspectionDate ? new Date(q.inspectionDate) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inspected = parseFloat(q.inspectedQuantity) || 0;
      const defects = parseFloat(q.defectCount) || 0;
      const prev = map.get(key) || { inspected: 0, defects: 0 };
      map.set(key, { inspected: prev.inspected + inspected, defects: prev.defects + defects });
    });
    const arr = Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1)).map(([k, v]) => ({
      month: k,
      defectRate: v.inspected ? (v.defects / v.inspected) * 100 : 0,
    }));
    return arr;
  }, [qualityRecords, startDate, endDate]);

  const machinesByStatus = useMemo(() => {
    const map = new Map();
    machines.forEach((m) => {
      const status = (m.status || "Unknown").toString();
      map.set(status, (map.get(status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [machines]);

  const approvedByMaterial = useMemo(() => {
    const map = new Map();
    approved.filter((r) => !startDate && !endDate ? true : isWithinRange(r.approvedDate)).forEach((r) => {
      const name = r?.inventoryItemId?.name || "Unknown";
      map.set(name, (map.get(name) || 0) + (parseFloat(r?.requestedQty) || 0));
    });
    return Array.from(map.entries()).map(([name, qty]) => ({ name, qty }));
  }, [approved, startDate, endDate]);

  // KPI metrics (respecting date range)
  const totalProduced = useMemo(() => productionByMonth.reduce((s, d) => s + (parseFloat(d.produced) || 0), 0), [productionByMonth]);
  const avgDefectRate = useMemo(() => {
    if (!defectRateByMonth.length) return 0;
    return defectRateByMonth.reduce((s, d) => s + (parseFloat(d.defectRate) || 0), 0) / defectRateByMonth.length;
  }, [defectRateByMonth]);
  const machinesRunning = useMemo(() => machines.filter(m => (m.status || '').toLowerCase() === 'running').length, [machines]);
  const approvedStock = useMemo(() => approvedByMaterial.reduce((s, d) => s + (parseFloat(d.qty) || 0), 0), [approvedByMaterial]);

  // Custom tooltip formatters
  const numberFmt = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n ?? 0);
  const percentFmt = (n) => `${numberFmt(n)}%`;

  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg px-3 py-2 shadow">
          <div className="text-xs text-gray-500">{label}</div>
          {payload.map((p, i) => (
            <div key={i} className="text-sm"><span className="font-medium" style={{ color: p.color }}>{p.name}: </span>{numberFmt(p.value)}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  const LineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg px-3 py-2 shadow">
          <div className="text-xs text-gray-500">{label}</div>
          {payload.map((p, i) => (
            <div key={i} className="text-sm"><span className="font-medium" style={{ color: p.color }}>{p.name}: </span>{percentFmt(p.value)}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  const menuItems = [
    { name: "Overview", key: "overview", icon: <LayoutDashboard size={20} /> },
    { name: "Products", key: "products", icon: <Package size={20} /> },
    { name: "Production Planning", key: "planning", icon: <Factory size={20} /> },
    { name: "Raw Materials", key: "materials", icon: <Package size={20} /> },
    { name: "Quality Control", key: "quality", icon: <Settings size={20} /> },
    { name: "Analytics", key: "analytics", icon: <TrendingUp size={20} /> },
    { name: "Reports", key: "reports", icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-200">
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
            item.key === 'analytics' ? (
              <div
                key={item.key}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </div>
            ) : item.key === 'reports' ? (
              <Link key={item.key} to="/production/reports" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100`}>
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ) : (
              <Link key={item.key} to="/production" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100`}>
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          ))}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Production Analytics</h1>
                <p className="text-gray-600">Insights from live production data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => { setStartDate(""); setEndDate(""); }} className="ml-2 text-sm px-3 py-2 rounded-lg border hover:bg-gray-50">Reset</button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow">
              <div className="text-blue-100 text-sm">Total Produced</div>
              <div className="text-3xl font-bold">{numberFmt(totalProduced)}</div>
              <div className="text-xs text-blue-100 mt-1">In selected period</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow">
              <div className="text-emerald-100 text-sm">Approved Stock (Kg)</div>
              <div className="text-3xl font-bold">{numberFmt(approvedStock)}</div>
              <div className="text-xs text-emerald-100 mt-1">Materials approved</div>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-2xl p-5 shadow">
              <div className="text-rose-100 text-sm">Avg Defect Rate</div>
              <div className="text-3xl font-bold">{percentFmt(avgDefectRate)}</div>
              <div className="text-xs text-rose-100 mt-1">Across inspections</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-2xl p-5 shadow">
              <div className="text-purple-100 text-sm">Machines Running</div>
              <div className="text-3xl font-bold">{machinesRunning}</div>
              <div className="text-xs text-purple-100 mt-1">of {machines.length} total</div>
            </div>
          </div>

          {/* Row 1: Production by Month + Defect Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Production by Month</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={productionByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="produced" fill="#3b82f6" name="Produced" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white shadow rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Defect Rate by Month</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={defectRateByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit="%" />
                  <Tooltip content={<LineTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="defectRate" stroke="#ef4444" name="Defect %" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Machine Status + Approved by Material */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2"><PieIcon size={18}/> Machine Status Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={machinesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                    {machinesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white shadow rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Approved Materials (Kg) by Material</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={approvedByMaterial}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="qty" fill="#10b981" name="Stock (Kg)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionAnalyticsPage;
