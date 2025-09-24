// src/components/collectors/CollectorsDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import {
  Squares2X2Icon,
  PlusIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helpers
const nowIso = () => new Date().toISOString();

export default function CollectorsDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Uncontrolled form refs for Add Collection (prevents focus loss when typing)
  const phoneRef = useRef(null);
  const qtyRef = useRef(null);
  const locationRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // Data
  const [notifications, setNotifications] = useState([]);
  // Stock will be derived from collections data
  const [transportReqs, setTransportReqs] = useState([]);
  // Recent Collections loaded from DB
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Receipt modal state (for last created collection)
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  // Filters: weight range (grams) and date
  const [filterMinG, setFilterMinG] = useState("");
  const [filterMaxG, setFilterMaxG] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const res = await axios.get("http://localhost:5000/api/collections", {
        params: {
          collectorName: "Demo Collector",
          limit: 100,
          dateFrom: filterFrom || undefined,
          dateTo: filterTo || undefined,
        },
      });
      setCollections(res?.data?.collections || []);
    } catch (e) {
      // keep empty
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchTransportRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transport-requests", {
        params: { collectorName: "Demo Collector" }
      });
      const arr = res?.data?.requests || [];
      setTransportReqs(arr);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [filterFrom, filterTo]);

  useEffect(() => {
    fetchTransportRequests();
  }, []);

  // Removed local edit/delete helpers; using DB-backed table and disabled buttons for now

  const totals = useMemo(() => {
    const totalQty = collections.reduce((s, c) => s + (c.quantity || 0), 0);
    const pending = collections.filter(c => (c.status||'').toLowerCase().includes('pending')).reduce((s,c)=>s+(c.quantity||0),0);
    const delivered = collections.filter(c => (c.status||'').toLowerCase().includes('delivered')).reduce((s,c)=>s+(c.quantity||0),0);
    return { totalQty, pending, delivered };
  }, [collections]);

  // Compute total quantity since the last transport request (any status)
  const lastRequestAt = useMemo(() => {
    if (!transportReqs || transportReqs.length === 0) return null;
    const dt = transportReqs.reduce((max, r) => {
      const d = r.createdAt ? new Date(r.createdAt) : null;
      return (!max || (d && d > max)) ? d : max;
    }, null);
    return dt;
  }, [transportReqs]);

  const qtySinceLastRequest = useMemo(() => {
    return collections.reduce((sum, c) => {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      const isNew = lastRequestAt ? (d && d > lastRequestAt) : true;
      return sum + (isNew ? (c.quantity || 0) : 0);
    }, 0);
  }, [collections, lastRequestAt]);

  const currentBatchCollections = useMemo(() => {
    // Only items created after the last request belong to the current batch
    return collections.filter(c => {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      return lastRequestAt ? (d && d > lastRequestAt) : true;
    });
  }, [collections, lastRequestAt]);

  const batchByType = useMemo(() => {
    const map = currentBatchCollections.reduce((acc, c) => {
      const t = c.bottleType || 'Unknown';
      acc[t] = (acc[t] || 0) + (c.quantity || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([type, qty]) => ({ type, qty }));
  }, [currentBatchCollections]);

  const batchId = useMemo(() => {
    // Batch number = number of requests so far + 1 for open batch
    const num = (transportReqs?.length || 0) + 1;
    const pad4 = (n) => String(n).padStart(4, '0');
    return `CST${pad4(num)}`;
  }, [transportReqs]);

  const batchCreatedRange = useMemo(() => {
    if (!currentBatchCollections.length) return null;
    const times = currentBatchCollections
      .map(c => c.createdAt ? new Date(c.createdAt) : null)
      .filter(Boolean)
      .sort((a,b) => a - b);
    return { from: times[0], to: times[times.length - 1] };
  }, [currentBatchCollections]);

  const requestsCount = useMemo(() => transportReqs.length, [transportReqs]);

  // Charts data
  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]; // blue/purple/green/orange/red

  // Points calculation based on bottle type
  const calcPoints = (_type, qty) => {
    // qty is in kilograms; rule: 1 point per 100 grams (rounded to nearest 100g)
    const grams = (Number(qty) || 0) * 1000;
    return Math.round(grams / 100);
  };

  const chartByType = useMemo(() => {
    const map = collections.reduce((acc, s) => {
      acc[s.bottleType] = (acc[s.bottleType] || 0) + (s.quantity||0);
      return acc;
    }, {});
    return Object.entries(map).map(([type, qty]) => ({ type, qty }));
  }, [collections]);

  const chartStatus = useMemo(() => {
    const map = collections.reduce((acc, s) => {
      const key = s.status || 'Unknown';
      acc[key] = (acc[key] || 0) + (s.quantity||0);
      return acc;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [collections]);

  const chartDaily = useMemo(() => {
    const fmt = (d) => new Date(d).toISOString().split("T")[0];
    const map = collections.reduce((acc, s) => {
      const day = fmt(s.createdAt);
      acc[day] = (acc[day] || 0) + (s.quantity||0);
      return acc;
    }, {});
    return Object.entries(map)
      .sort((a,b) => new Date(a[0]) - new Date(b[0]))
      .map(([day, qty]) => ({ day, qty }));
  }, [collections]);

  // Submit new collection: award points + create collection + add to collector stock
  const handleSubmitCollection = async (form) => {
    try {
      setSubmitting(true);
      setToast("");
      // Interpret input as grams and convert to kilograms for storage/points
      const qtyG = Number(form.quantity || 0);
      const qty = qtyG / 1000;
      // If editing, skip phone requirement
      if (!editingId && (!form.phone || !qty)) {
        setToast("Phone number and quantity are required");
        return;
      }

      // If editing, update the existing collection and recalc points + refresh timestamp
      if (editingId) {
        const pointsToAward = calcPoints('MIXED', qty);
        await axios.put(`http://localhost:5000/api/collections/${editingId}`, {
          quantity: qty, // stored in kg
          location: form.location || "",
          awardedPoints: pointsToAward,
          refreshTimestamp: true,
        });
        await fetchCollections();
        setToast("Collection updated: points recalculated and time refreshed.");
        // reset
        setEditingId(null);
        if (phoneRef.current) phoneRef.current.value = "";
        if (qtyRef.current) qtyRef.current.value = "";
        if (locationRef.current) locationRef.current.value = "";
        return;
      }

      // New collection: verify user exists first; if not, do NOT save
      try {
        const existsRes = await axios.get(
          "http://localhost:5000/api/users/exists",
          { params: { phone: form.phone } }
        );
        if (!existsRes?.data?.exists) {
          setToast("User not found for this phone. Please create an account first.");
          return; // stop here; do not create collection
        }
      } catch (_) {
        setToast("Could not verify user. Please try again.");
        return;
      }

      // 1) Create delivery collection record (backend route exists) — always save collection
      const pointsToAward = calcPoints('MIXED', qty);
      const createRes = await axios
        .post("http://localhost:5000/api/collections", {
          collectorName: "Demo Collector",
          // Backend requires bottleType; use default since form removed type
          bottleType: 'MIXED',
          quantity: qty, // stored in kg
          location: form.location || "",
          awardedPoints: pointsToAward, // persist awarded points on create
        })
        .catch(() => {});

      const created = createRes?.data?.collection || null;
      const createdCollectionId = created?.collectionId;
      const createdMongoId = created?._id;
      const createdStatus = created?.status || "Pending Transport";
      const createdAt = created?.createdAt || new Date().toISOString();

      // We'll refresh from DB after finishing

      // 3) Award points (we already verified user exists)
      try {
        await axios.post("http://localhost:5000/api/points/award", {
          phone: form.phone,
          points: pointsToAward,
          reason: `Bottle collection (Mixed)` ,
          collectionId: createdCollectionId,
          collectionMongoId: createdMongoId,
        });
        setToast(`Collection saved and ${pointsToAward} points awarded!`);
        // Set receipt data (award succeeded)
        setLastReceipt({
          id: createdCollectionId || createdMongoId,
          createdAt,
          collectorName: "Demo Collector",
          bottleType: 'MIXED',
          quantity: qtyG, // show grams on receipt
          location: form.location || "",
          awardedPoints: pointsToAward,
          userPhone: form.phone,
        });
      } catch (_) {
        setToast("Collection saved. Could not award points at this time.");
        // Set receipt data (without points)
        setLastReceipt({
          id: createdCollectionId || createdMongoId,
          createdAt,
          collectorName: "Demo Collector",
          bottleType: 'MIXED',
          quantity: qtyG, // show grams on receipt
          location: form.location || "",
          awardedPoints: 0,
          userPhone: form.phone,
        });
      }

      // Refresh the DB-backed table
      await fetchCollections();

      // Reset uncontrolled inputs
      if (phoneRef.current) phoneRef.current.value = "";
      if (qtyRef.current) qtyRef.current.value = "";
      if (locationRef.current) locationRef.current.value = "";
    } catch (e) {
      setToast("Failed to save collection. Please try again.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  // Start editing: populate form with row values (phone not stored with collection, keep it blank)
  const startEdit = (c) => {
    setEditingId(c._id);
    try {
      // stored in kg; show grams with 1 decimal in the input
      const grams = ((Number(c.quantity) || 0) * 1000).toFixed(1);
      if (qtyRef.current) qtyRef.current.value = grams;
      if (locationRef.current) locationRef.current.value = c.location || "";
      // focus qty field for quick edit
      if (qtyRef.current) qtyRef.current.focus();
    } catch {}
    setToast(`Editing collection #${c._id.slice(-6)}`);
    setTimeout(()=>setToast(""), 2000);
    // Scroll to the form for convenience
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  const cancelEdit = () => {
    setEditingId(null);
    if (qtyRef.current) qtyRef.current.value = "";
    if (locationRef.current) locationRef.current.value = "";
  };

  const deleteRow = async (c) => {
    const ok = window.confirm("Delete this collection from database?");
    if (!ok) return;
    await axios.delete(`http://localhost:5000/api/collections/${c._id}`);
    if (editingId === c._id) cancelEdit();
    await fetchCollections();
    setToast("Collection deleted.");
    setTimeout(()=>setToast(""), 2000);
  };

  // Create transport request from selected stock row
  const requestTransport = async (stock) => {
    try {
      await axios.post("http://localhost:5000/api/transport-requests", {
        collectionId: null,
        collectorName: "Demo Collector",
        bottleType: stock.bottleType,
        quantity: stock.quantity,
        location: stock.location || "",
        notes: `Requested via dashboard for ${stock.bottleType}`,
      });
      // Optionally push a lightweight local notification entry
      setNotifications(prev => ([
        { id: `n_${Date.now()}`, type: "request", text: `Transport requested for ${stock.quantity} ${stock.bottleType}`, time: nowIso(), read: false },
        ...prev,
      ]));
      setToast("Transport request sent to Transport team.");
      setTimeout(() => setToast(""), 2500);
      // refresh requests list
      fetchTransportRequests();
    } catch (e) {
      setToast("Failed to send transport request. Ensure backend is running.");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const Sidebar = () => (
    <aside className="w-72 bg-white shadow-xl border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Squares2X2Icon className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Collector Hub</h2>
            <p className="text-sm text-gray-500">Bottle Collections</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='dashboard' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <Squares2X2Icon className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>
        <button onClick={() => setActiveTab("add")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='add' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <PlusIcon className="w-5 h-5" />
          <span className="font-medium">Add Collection</span>
        </button>
        <button onClick={() => setActiveTab("stock")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='stock' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <CubeIcon className="w-5 h-5" />
          <span className="font-medium">My Stock</span>
        </button>
        <button onClick={() => setActiveTab("requests")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='requests' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <TruckIcon className="w-5 h-5" />
          <span className="font-medium">Transport Requests</span>
        </button>
        <button onClick={() => setActiveTab("notifications")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='notifications' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <BellAlertIcon className="w-5 h-5" />
          <span className="font-medium">Notifications</span>
        </button>
        <button onClick={() => setActiveTab("reports")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='reports' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <DocumentChartBarIcon className="w-5 h-5" />
          <span className="font-medium">Reports</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${activeTab==='profile' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
          <UserCircleIcon className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </button>

        <Link to="/inventory/deliveries" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
          <ClipboardDocumentListIcon className="w-5 h-5" />
          <span className="font-medium">Delivery Records</span>
        </Link>
        <LogoutButton />
      </nav>
    </aside>
  );

  const Header = () => (
    <header className="bg-white border-b border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collector Dashboard</h1>
          <p className="text-gray-600 mt-1">Record bottles, award points, and manage transport</p>
        </div>
      </div>
    </header>
  );

  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg rounded-2xl p-6">
          <p className="text-emerald-100 text-sm">Total Bottles</p>
          <h2 className="text-3xl font-bold">{totals.totalQty}</h2>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg rounded-2xl p-6">
          <p className="text-blue-100 text-sm">Active Requests</p>
          <h2 className="text-3xl font-bold">{requestsCount}</h2>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg rounded-2xl p-6">
          <p className="text-orange-100 text-sm">Pending Transport</p>
          <h2 className="text-3xl font-bold">{totals.pending}</h2>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg rounded-2xl p-6">
          <p className="text-purple-100 text-sm">Delivered</p>
          <h2 className="text-3xl font-bold">{totals.delivered}</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
        <ul className="space-y-2">
          {notifications.slice(0,5).map(n => (
            <li key={n.id} className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm text-gray-800">{n.text}</span>
              <span className="text-xs text-gray-500">{new Date(n.time).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">By Bottle Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}/>
              <Bar dataKey="qty" radius={[4,4,0,0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={chartStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Daily Collections</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }}/>
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}/>
              <Line type="monotone" dataKey="qty" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Helpers to build QR code image URLs without extra dependencies
  const buildQrUrl = (payload) => {
    try {
      const text = encodeURIComponent(JSON.stringify(payload));
      // Primary provider
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${text}`;
    } catch {
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(String(payload))}`;
    }
  };
  const buildQrFallbackUrl = (payload) => {
    try {
      const text = encodeURIComponent(JSON.stringify(payload));
      // Fallback provider
      return `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${text}`;
    } catch {
      return `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(String(payload))}`;
    }
  };

  const ReceiptModal = () => {
    if (!showReceipt || !lastReceipt) return null;
    const qrPayload = {
      type: 'collection_receipt',
      id: lastReceipt.id,
      collector: lastReceipt.collectorName,
      phone: lastReceipt.userPhone,
      bottleType: lastReceipt.bottleType,
      quantity: lastReceipt.quantity,
      location: lastReceipt.location,
      points: lastReceipt.awardedPoints,
      createdAt: lastReceipt.createdAt,
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        {/* Print styles to ensure only the receipt prints on one page */}
        <style>{`
          @page { size: A4; margin: 0; }
          @media print {
            body * { visibility: hidden; }
            .receipt-print, .receipt-print * { visibility: visible; }
            .receipt-print { position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; padding: 12mm; box-sizing: border-box; }
          }
        `}</style>
        <div className="bg-white w-[680px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden receipt-print">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Collection Receipt</h3>
            <button onClick={()=>setShowReceipt(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Receipt ID</span><span className="font-mono">{lastReceipt.id}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span>{new Date(lastReceipt.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Collector</span><span>{lastReceipt.collectorName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">User Phone</span><span>{lastReceipt.userPhone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Bottle Type</span><span>{lastReceipt.bottleType}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity</span><span>{lastReceipt.quantity}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span>{lastReceipt.location || '-'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Awarded Points</span><span>{lastReceipt.awardedPoints}</span></div>
            </div>
            <div className="flex items-center justify-center">
              <img
                alt="QR Code"
                className="border rounded-xl p-2"
                src={buildQrUrl(qrPayload)}
                onError={(e)=>{ try { if (!e.currentTarget.dataset.fallback){ e.currentTarget.dataset.fallback='1'; e.currentTarget.src = buildQrFallbackUrl(qrPayload); } } catch {} }}
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button onClick={()=>window.print()} className="border px-4 py-2 rounded-lg">Print</button>
            <button onClick={()=>setShowReceipt(false)} className="bg-gray-900 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const AddCollectionTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-5xl">
      <ReceiptModal />
      {toast && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">{toast}</div>}
      <h2 className="text-xl font-bold text-gray-900 mb-2">Record New Collection</h2>
      {editingId && (
        <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm">
          You are editing an existing collection. Update fields below and click "Update Collection" or click "Cancel Edit" to discard changes.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={(e)=>e.preventDefault()} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium">User Phone Number</label>
          <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
            <PhoneIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input
              ref={phoneRef}
              className="w-full outline-none"
              placeholder={editingId ? "Phone not required when editing" : "e.g., +94 71 123 4567"}
              defaultValue=""
              disabled={!!editingId}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Weight (g)</label>
          <input
            ref={qtyRef}
            type="text"
            inputMode="decimal"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            defaultValue=""
            placeholder="e.g., 350.5"
            onInput={(e)=>{
              try {
                let v = e.target.value;
                // remove everything except digits and dots
                v = v.replace(/[^0-9.]/g, '');
                // keep only the first dot
                const i = v.indexOf('.');
                if (i !== -1) {
                  v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
                }
                // limit to 1 decimal place
                const parts = v.split('.');
                if (parts.length > 1) {
                  v = parts[0] + '.' + parts[1].slice(0, 1);
                }
                e.target.value = v;
              } catch {}
            }}
            onPaste={(e)=>{
              try {
                const text = (e.clipboardData || window.clipboardData).getData('text');
                if (/[^0-9.]/.test(text)) e.preventDefault();
              } catch {}
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Location (Optional)</label>
          <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
            <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input
              ref={locationRef}
              className="w-full outline-none"
              placeholder="e.g., Gampaha"
              defaultValue=""
            />
          </div>
        </div>
      <div className="flex items-center gap-3 mt-6 md:col-span-2">
        <button
          type="button"
          disabled={submitting}
          onClick={()=>handleSubmitCollection({
            phone: phoneRef.current?.value?.trim() || "",
            quantity: qtyRef.current?.value || "",
            location: locationRef.current?.value || "",
          })}
          className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-60"
        >
          {editingId ? 'Update Collection' : 'Save & Award Points'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel Edit
          </button>
        )}
        <button type="button" onClick={() => {
          if (!lastReceipt) { setToast("Please save the collection first to generate a receipt."); return; }
          setShowReceipt(true);
        }} className="flex items-center gap-2 border px-4 py-2 rounded-lg"><QrCodeIcon className="w-5 h-5"/>Generate Receipt/QR</button>
      </div>
      </form>

      {/* Right-side Points Rules */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 h-max">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Points Rules</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li><span className="font-medium">Mixed:</span> 1 point per 100g</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">Points are awarded to the user who brings bottles based on the rules above.</p>
      </div>
      </div>

      {/* Recent Collections Table (under the form) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Collections</h3>
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Weight (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={filterMinG}
              onChange={(e)=>setFilterMinG(e.target.value)}
              className="border rounded-lg px-3 py-2 w-40"
              placeholder="e.g., 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Weight (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={filterMaxG}
              onChange={(e)=>setFilterMaxG(e.target.value)}
              className="border rounded-lg px-3 py-2 w-40"
              placeholder="e.g., 1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e)=>setFilterFrom(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e)=>setFilterTo(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCollections} className="mt-6 md:mt-0 bg-gray-800 text-white px-4 py-2 rounded-lg">Apply</button>
            <button onClick={()=>{ setFilterMinG(""); setFilterMaxG(""); setFilterFrom(""); setFilterTo(""); }} className="mt-6 md:mt-0 border px-4 py-2 rounded-lg">Reset</button>
          </div>
        </div>
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Collector Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weight (g)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Awarded Points</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Collected Stamp (Time & Date)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loadingCollections && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              )}
              {!loadingCollections && collections.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">No collections yet.</td>
                </tr>
              )}
              {!loadingCollections && collections
                .slice()
                .filter(c => {
                  const g = (Number(c.quantity)||0) * 1000;
                  const minOk = filterMinG === "" ? true : g >= Number(filterMinG);
                  const maxOk = filterMaxG === "" ? true : g <= Number(filterMaxG);
                  return minOk && maxOk;
                })
                .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
                .map((c, idx) => (
                <tr key={c._id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{c.collectionId || (c._id?.slice(-6) || idx + 1)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.awardedToUserId?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.collectorName || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{((Number(c.quantity)||0) * 1000).toFixed(1)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.location || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.awardedPoints || 0}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <button onClick={()=>startEdit(c)} className="px-3 py-1 rounded bg-blue-600 text-white">Edit</button>
                      <button onClick={()=>deleteRow(c)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const MyStockTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">My Stock</h2>
      {currentBatchCollections.length === 0 ? (
        <div className="p-6 border rounded-2xl bg-gray-50 text-gray-700">
          No current stock. New collections will appear here until you send a request.
        </div>
      ) : (
        <div className="p-6 border rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Batch</div>
              <div className="text-2xl font-bold text-gray-900">{batchId}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Since last request</div>
              <div className="text-3xl font-extrabold text-gray-900">{qtySinceLastRequest}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border">
              <div className="text-sm text-gray-500">Current Weight</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{qtySinceLastRequest} kg</div>
              <div className="text-xs text-gray-500 mt-1">Since last transport request</div>
            </div>
            <div className="p-4 rounded-xl bg-white border">
              <div className="text-sm text-gray-500">Created Range</div>
              <div className="mt-2 text-sm text-gray-800">
                <div>From: {batchCreatedRange?.from ? new Date(batchCreatedRange.from).toLocaleString() : '-'}</div>
                <div>To: {batchCreatedRange?.to ? new Date(batchCreatedRange.to).toLocaleString() : '-'}</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border flex flex-col justify-between">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="mt-2"><span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending Transport</span></div>
              </div>
              <button
                className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-60"
                disabled={qtySinceLastRequest < 20}
                title="Enabled when total since last request reaches 20 kg"
                onClick={async ()=>{
                  try {
                    await axios.post('http://localhost:5000/api/transport-requests', {
                      collectionId: null,
                      collectorName: 'Demo Collector',
                      bottleType: 'Mixed',
                      quantity: qtySinceLastRequest,
                      location: '',
                      notes: 'Threshold reached (>=20 kg) since last request. Please collect.',
                      requestId: batchId,
                    });
                    setToast('Transport request sent to Transport team.');
                    setTimeout(()=>setToast(''), 2500);
                    await fetchTransportRequests();
                    await fetchCollections();
                  } catch (e) {
                    setToast('Failed to create transport request.');
                    setTimeout(()=>setToast(''), 2500);
                  }
                }}
              >Request Transport</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const TransportRequestsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Transport Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-700">
              <th className="py-3 px-4 font-semibold">Request ID</th>
              <th className="py-3 px-4 font-semibold">Collector</th>
              <th className="py-3 px-4 font-semibold">Weight (kg)</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Created</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transportReqs.map((r, idx) => (
              <tr key={r._id || idx} className="border-t text-sm">
                <td className="py-3 px-4 font-mono">{r.requestId || (r._id?.slice(-6) || idx+1)}</td>
                <td className="py-3 px-4">{r.collectorName}</td>
                <td className="py-3 px-4 font-semibold">{r.quantity}</td>
                <td className="py-3 px-4">{r.location || '-'}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'Delivered' ? 'bg-green-100 text-green-700' : r.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : r.status === 'PickedUp' ? 'bg-purple-100 text-purple-700' : r.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                <td className="py-3 px-4">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                <td className="py-3 px-4">
                  <button
                    className="px-3 py-1 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                    disabled={r.status !== 'Assigned'}
                    onClick={async ()=>{
                      try {
                        await axios.post(`http://localhost:5000/api/transport-requests/${r._id}/status`, { status: 'PickedUp' });
                        setTransportReqs(prev => prev.map(x => x._id === r._id ? { ...x, status: 'PickedUp' } : x));
                        setToast('Marked as handed over.');
                        try { window.dispatchEvent(new CustomEvent('transport:status-updated', { detail: { id: r._id, status: 'PickedUp' } })); } catch {}
                        setTimeout(()=>setToast(''), 2000);
                      } catch (e) {
                        setToast('Failed to update status.');
                        setTimeout(()=>setToast(''), 2000);
                      }
                    }}
                  >Handed over</button>
                </td>
              </tr>
            ))}
            {transportReqs.length === 0 && (
              <tr>
                <td className="py-6 px-4 text-gray-500" colSpan={7}>No requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const NotificationsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-gray-50' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-800">{n.text}</span>
              <span className="text-xs text-gray-500">{new Date(n.time).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-gray-600">No notifications</div>
        )}
      </div>
    </div>
  );

  const ReportsTab = () => {
    const byType = collections.reduce((acc, x) => { acc[x.bottleType] = (acc[x.bottleType]||0) + (x.quantity||0); return acc; }, {});
    const rows = Object.entries(byType).map(([k, v]) => ({ type: k, qty: v }));
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-xl">
            <h3 className="font-semibold mb-2">Totals</h3>
            <p className="text-sm">Total bottles: <span className="font-semibold">{totals.totalQty}</span></p>
            <p className="text-sm">Collections recorded: <span className="font-semibold">{collections.length}</span></p>
            <p className="text-sm">Transport requests: <span className="font-semibold">{requestsCount}</span></p>
          </div>
          <div className="p-4 border rounded-xl">
            <h3 className="font-semibold mb-2">By Bottle Type</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-600"><th className="text-left py-1">Type</th><th className="text-right py-1">Qty</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.type} className="border-t">
                    <td className="py-1">{r.type}</td>
                    <td className="py-1 text-right font-semibold">{r.qty}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={2}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ProfileTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-4">My Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="Demo Collector" />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="+94 71 111 1111" />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="Colombo" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="collector@example.com" />
        </div>
      </div>
      <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700">Save</button>
    </div>
  );

  const Content = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab/>;
      case "add": return <AddCollectionTab/>;
      case "stock": return <MyStockTab/>;
      case "requests": return <TransportRequestsTab/>;
      case "notifications": return <NotificationsTab/>;
      case "reports": return <ReportsTab/>;
      case "profile": return <ProfileTab/>;
      default: return <DashboardTab/>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar/>
      <div className="flex-1 overflow-auto">
        <Header/>
        <div className="p-6">
          <Content/>
        </div>
      </div>
    </div>
  );
}
