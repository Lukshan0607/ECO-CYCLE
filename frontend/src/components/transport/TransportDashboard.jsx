

// src/components/transport/TransportDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Truck, MapPin, Clock, Package, CheckCircle, AlertCircle, Plus, Search, Filter, Navigation, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import LogoutButton from "../common/LogoutButton";

const collectionData = [
  { month: "Jan", collected: 1200, scheduled: 1400, efficiency: 85.7 },
  { month: "Feb", collected: 1450, scheduled: 1600, efficiency: 90.6 },
  { month: "Mar", collected: 1680, scheduled: 1800, efficiency: 93.3 },
  { month: "Apr", collected: 1920, scheduled: 2000, efficiency: 96.0 },
  { month: "May", collected: 2100, scheduled: 2200, efficiency: 95.5 },
];

const routeStatusData = [
  { name: "Completed", value: 65, count: 26 },
  { name: "In Progress", value: 20, count: 8 },
  { name: "Scheduled", value: 10, count: 4 },
  { name: "Delayed", value: 5, count: 2 },
];

const activeCollections = [
  { id: "COL001", location: "Downtown Area", driver: "John Smith", vehicle: "TRK-001", bottles: 450, status: "In Progress", startTime: "08:30", estimatedCompletion: "11:30", progress: 65 },
  { id: "COL002", location: "Industrial Zone", driver: "Sarah Johnson", vehicle: "TRK-002", bottles: 320, status: "Scheduled", startTime: "09:00", estimatedCompletion: "12:00", progress: 0 },
  { id: "COL003", location: "Residential District", driver: "Mike Wilson", vehicle: "TRK-003", bottles: 280, status: "Completed", startTime: "07:00", estimatedCompletion: "10:00", progress: 100 },
  { id: "COL004", location: "Business Park", driver: "Emma Davis", vehicle: "TRK-004", bottles: 380, status: "Delayed", startTime: "08:00", estimatedCompletion: "11:00", progress: 30 },
];

// Route data is loaded from the backend (no mock data)

const vehicles = [
  { id: "TRK-001", type: "Large Truck", capacity: 500, driver: "John Smith", status: "Active", location: "Downtown", fuel: 75, maintenance: "Good" },
  { id: "TRK-002", type: "Medium Truck", capacity: 350, driver: "Sarah Johnson", status: "Active", location: "Industrial Zone", fuel: 60, maintenance: "Good" },
  { id: "TRK-003", type: "Small Truck", capacity: 250, driver: "Mike Wilson", status: "Maintenance", location: "Depot", fuel: 90, maintenance: "Service Due" },
  { id: "TRK-004", type: "Large Truck", capacity: 500, driver: "Emma Davis", status: "Active", location: "Business Park", fuel: 45, maintenance: "Good" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCollection, setSelectedCollection] = useState(null);
  // Deliveries workflow state
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [createForm, setCreateForm] = useState({ collectorId: "", bottleType: "PET", quantity: "" });
  const [assignForm, setAssignForm] = useState({}); // { [deliveryId]: transportStaffId }
  const [error, setError] = useState("");
  // Transport Requests (Pending list)
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRequestId, setAssignRequestId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [assignNotice, setAssignNotice] = useState({ type: "", text: "" }); // {type: 'success'|'error'|'', text}
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  // Driver management state
  const [driversList, setDriversList] = useState([]);
  const [loadingDriversList, setLoadingDriversList] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: { street: "", city: "", state: "", zipCode: "" },
    dateOfBirth: "",
    licenseNumber: "",
    licenseType: "Class C",
    licenseExpiry: "",
    hireDate: "",
    employmentStatus: "Active",
    shift: "Morning",
    username: "",
    password: "",
  });

  // Add Route modal state
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [addRouteForm, setAddRouteForm] = useState({
    name: "",
    estimatedDuration: "",
    distanceTotal: "",
    distanceUnit: "km",
    locationsText: "",
    assignedVehicleId: "",
    assignedDriverId: "",
  });
  const [addRouteErrors, setAddRouteErrors] = useState({});

  // DB-backed routes list
  const [routesList, setRoutesList] = useState([]);
  const [loadingRoutesList, setLoadingRoutesList] = useState(false);

  const fetchRoutesList = async () => {
    try {
      setLoadingRoutesList(true);
      const res = await axios.get('http://localhost:5000/api/transport/routes');
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload || [];
      setRoutesList(list);
    } catch (err) { console.error('Failed to fetch routes', err); }
    finally { setLoadingRoutesList(false); }
  };

  const validateAddRouteForm = () => {
    const errors = {};
    const name = (addRouteForm.name || '').trim();
    if (!name) errors.name = 'Route name is required';
    else if (name.length < 3) errors.name = 'Route name must be at least 3 characters';
    else if (name.length > 80) errors.name = 'Route name cannot exceed 80 characters';

    const est = Number(addRouteForm.estimatedDuration);
    if (!Number.isFinite(est) || est <= 0) errors.estimatedDuration = 'Estimated duration must be a positive number (mins)';

    const dist = Number(addRouteForm.distanceTotal);
    if (!Number.isFinite(dist) || dist <= 0) errors.distanceTotal = 'Distance must be a positive number';

    if (!['km','miles'].includes(addRouteForm.distanceUnit)) errors.distanceUnit = 'Invalid distance unit';

    const locs = (addRouteForm.locationsText || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (addRouteForm.locationsText && locs.length === 0) errors.locationsText = 'Please enter at least one location or leave blank';

    setAddRouteErrors(errors);
    return { valid: Object.keys(errors).length === 0, errors };
  };

  // Vehicle management state
  const [vehiclesList, setVehiclesList] = useState([]);
  const [loadingVehiclesList, setLoadingVehiclesList] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editVehicleForm, setEditVehicleForm] = useState({
    vehicleId: "",
    type: "Medium Truck",
    capacityBottles: "",
    capacityWeight: "",
    licensePlate: "",
    status: "Active",
    fuelLevel: 100,
    fuelType: "Diesel",
    maintenanceStatus: "Good",
  });
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("");
  const [addVehicleForm, setAddVehicleForm] = useState({
    vehicleId: "",
    type: "Medium Truck",
    capacityBottles: "",
    capacityWeight: "",
    model: "",
    licensePlate: "",
    color: "",
    status: "Active",
    fuelLevel: 100,
    fuelType: "Diesel",
    maintenanceStatus: "Good",
    
  });

  const menuItems = [
    { name: "Transport Overview", key: "overview", icon: <Truck size={20} /> },
    { name: "Requests", key: "requests", icon: <Package size={20} /> },
    { name: "Assigned", key: "assigned", icon: <Package size={20} /> },
    { name: "Deliveries", key: "deliveries", icon: <Package size={20} /> },
    { name: "Route Management", key: "routes", icon: <MapPin size={20} /> },
    { name: "Vehicle Fleet", key: "vehicles", icon: <Truck size={20} /> },
    { name: "Drivers", key: "drivers", icon: <Users size={20} /> },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "text-green-600 bg-green-100";
      case "In Progress": return "text-blue-600 bg-blue-100";
      case "Scheduled": return "text-yellow-600 bg-yellow-100";
      case "Delayed": return "text-red-600 bg-red-100";
      case "Active": return "text-green-600 bg-green-100";
      case "Inactive": return "text-gray-600 bg-gray-100";
      case "Maintenance": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const fetchDriversList = async () => {
    try {
      setLoadingDriversList(true);
      const res = await axios.get('http://localhost:5000/api/employees', {
        params: { department: 'transport', position: 'Driver', status: 'active' }
      });
      const payload = res?.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setDriversList(list);
    } catch (err) { console.error('Failed to fetch drivers', err); }
    finally { setLoadingDriversList(false); }
  };

  // Ensure drivers are available for name lookups (Assigned tab displays names)
  useEffect(() => {
    fetchDriversList();
  }, []);

  useEffect(() => {
    if (activeTab === 'assigned') {
      fetchDriversList();
      fetchAssigned();
    }
  }, [activeTab]);

  // Auto-refresh while viewing Assigned to reflect status updates from Inventory
  useEffect(() => {
    if (activeTab !== 'assigned') return;
    const t = setInterval(() => { fetchAssigned(); }, 10000);
    return () => clearInterval(t);
  }, [activeTab]);

  // React to status updates from Collectors page (e.g., PickedUp)
  useEffect(() => {
    const onStatusUpdate = (e) => {
      try {
        const { id, status } = e?.detail || {};
        if (!id || !status) return;
        // Update locally for instant feedback
        setAssigned(prev => prev.map(x => String(x._id) === String(id) ? { ...x, status } : x));
        // Reconcile with backend
        fetchAssigned();
      } catch {}
    };
    window.addEventListener('transport:status-updated', onStatusUpdate);
    return () => window.removeEventListener('transport:status-updated', onStatusUpdate);
  }, []);

  const getDriverNameById = (id) => {
    if (!id) return '-';
    const d = driversList.find(x => (x._id === id) || (String(x._id) === String(id)));
    if (!d) return id; // fallback to id when not found
    const name = (
      d.fullName ||
      d.name ||
      `${(d.personalInfo?.firstName || d.firstName || '').toString().trim()} ${(d.personalInfo?.lastName || d.lastName || '').toString().trim()}`.trim()
    );
    return name || d.employeeId || id;
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Pending' } });
      const arr = res?.data?.requests || [];
      setRequests(arr);
    } catch (err) { console.error('Failed to fetch requests', err); }
    finally { setLoadingRequests(false); }
  };

  // Assigned Requests
  const [assigned, setAssigned] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const fetchAssigned = async () => {
    try {
      setLoadingAssigned(true);
      const [aRes, pRes, dRes] = await Promise.all([
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Assigned' } }),
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'PickedUp' } }),
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Delivered' } }),
      ]);
      const a = aRes?.data?.requests || [];
      const p = pRes?.data?.requests || [];
      const d = dRes?.data?.requests || [];
      // Merge so that already picked up and delivered items still show with latest status
      // Sort by Stock ID (requestId) ascending
      const merged = [...a, ...p, ...d].sort((x,y)=>{
        const kx = (x.requestId || x._id || '').toString();
        const ky = (y.requestId || y._id || '').toString();
        if (kx < ky) return -1; if (kx > ky) return 1; return 0;
      });
      setAssigned(merged);
    } catch (err) { console.error('Failed to fetch assigned requests', err); }
    finally { setLoadingAssigned(false); }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle size={16} className="text-green-600" />;
      case "In Progress": return <Clock size={16} className="text-blue-600" />;
      case "Scheduled": return <Clock size={16} className="text-yellow-600" />;
      case "Delayed": return <AlertCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  // Modal to select driver and schedule time
  const AssignModal = () => {
    if (!showAssignModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white w-[760px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Assign Driver & Schedule Pickup</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={()=>{ setShowAssignModal(false); setAssignRequestId(null); setSelectedDriverId(""); setAssignNotice({type:'', text:''}); }}>✕</button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h4 className="font-medium mb-2">Select a Driver</h4>
              {assignNotice.text && (
                <div className={`mb-3 text-sm px-3 py-2 rounded-lg ${assignNotice.type==='error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{assignNotice.text}</div>
              )}
              <div className="mb-2 text-sm text-gray-700">
                Selected Driver: <span className="font-semibold">{getDriverNameById(selectedDriverId) || '-'}</span>
              </div>
              {loadingDriversList ? (
                <div className="text-gray-600">Loading drivers...</div>
              ) : (
                <div className="max-h-72 overflow-auto border rounded-xl">
                  {driversList.map((d)=>{
                    const name = (
                      d.fullName ||
                      d.name ||
                      `${(d.personalInfo?.firstName || d.firstName || '').toString().trim()} ${(d.personalInfo?.lastName || d.lastName || '').toString().trim()}`.trim()
                    ) || d.employeeId;
                    const status = d.currentStatus;
                    const selected = selectedDriverId === d._id;
                    return (
                      <button key={d._id} onClick={()=>setSelectedDriverId(d._id)} className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-base md:text-lg font-semibold">{name}</div>
                            <div className="text-xs text-gray-500">Employee ID: {d.employeeId}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${status==='Available'?'bg-green-100 text-green-700': 'bg-gray-100 text-gray-700'}`}>{status}</span>
                        </div>
                      </button>
                    );
                  })}
                  {driversList.length === 0 && (
                    <div className="p-4 text-gray-600">No drivers found</div>
                  )}
                </div>
              )}
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Schedule a Pick Up Time</label>
              <input type="datetime-local" className="border rounded-lg px-3 py-2 w-full" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">Schedule when the driver should pick bottles at the collector location.</div>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <button className="border px-4 py-2 rounded-lg" onClick={()=>{ setShowAssignModal(false); setAssignRequestId(null); setSelectedDriverId(""); setAssignNotice({type:'', text:''}); }}>Cancel</button>
            <button disabled={assignSubmitting} className={`px-4 py-2 rounded-lg ${assignSubmitting ? 'bg-blue-300 text-white' : 'bg-blue-600 text-white'}`} onClick={async ()=>{
              try {
                setAssignNotice({ type: '', text: '' });
                if (!assignRequestId) { setAssignNotice({ type:'error', text:'Invalid request selected' }); return; }
                if (!selectedDriverId) { setAssignNotice({ type:'error', text:'Please select a driver' }); return; }
                if (!scheduledAt) { setAssignNotice({ type:'error', text:'Please choose a pickup time' }); return; }
                setAssignSubmitting(true);
                await axios.post(`http://localhost:5000/api/transport-requests/${assignRequestId}/assign-driver`, {
                  driverId: selectedDriverId,
                  scheduledAt,
                });
                // Ensure status is set to Assigned so Collectors page and Assigned tab reflect it
                try {
                  await axios.post(`http://localhost:5000/api/transport-requests/${assignRequestId}/status`, { status: 'Assigned' });
                } catch (err) { console.error('Failed to update status to Assigned', err); }
                // Optimistic UI: move from Requests -> Assigned immediately
                try {
                  const req = requests.find(x => x._id === assignRequestId);
                  if (req) {
                    const newItem = { ...req, assignedDriverId: selectedDriverId, scheduledAt, status: 'Assigned' };
                    setAssigned(prev => {
                      const exists = prev.some(x => x._id === newItem._id);
                      return exists ? prev.map(x => x._id === newItem._id ? newItem : x) : [...prev, newItem];
                    });
                    setRequests(prev => prev.filter(x => x._id !== assignRequestId));
                  }
                } catch {}
                setAssignNotice({ type:'success', text:'Assigned successfully' });
                // brief delay to show success
                setTimeout(()=>{
                  setShowAssignModal(false);
                  setAssignRequestId(null);
                  setSelectedDriverId("");
                  setAssignSubmitting(false);
                  fetchRequests();
                  fetchAssigned();
                  try { window.dispatchEvent(new CustomEvent('transport:assigned-updated')); } catch {}
                }, 600);
              } catch (err) {
                console.error('Assign failed', err);
                setAssignSubmitting(false);
                setAssignNotice({ type:'error', text: err?.response?.data?.message || 'Failed to assign. Please try again.' });
              }
            }}>{assignSubmitting ? 'Assigning...' : 'Confirm'}</button>
          </div>
        </div>
      </div>
    );
  };

  const fetchVehiclesList = async () => {
    try {
      setLoadingVehiclesList(true);
      const res = await axios.get('http://localhost:5000/api/transport/vehicles', {
        params: {
          search: vehicleSearch || undefined,
          type: vehicleTypeFilter || undefined,
          status: vehicleStatusFilter || undefined,
        }
      });
      // Support both shapes: raw array and { success, data }
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setVehiclesList(list);
    } catch (err) { console.error('Failed to fetch vehicles', err); }
    finally { setLoadingVehiclesList(false); }
  };

  // Refetch vehicles when filters/search change and Vehicles tab is active
  useEffect(() => {
    if (activeTab === 'vehicles') fetchVehiclesList();
  }, [vehicleSearch, vehicleTypeFilter, vehicleStatusFilter]);

  const renderOverview = () => (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-4 shadow-lg rounded-2xl">
          <CardContent className="flex items-center space-x-4">
            <Package className="text-green-600" size={32} />
            <div>
              <p className="text-gray-500">Bottles Collected Today</p>
              <h2 className="text-xl font-bold">2,450</h2>
              <p className="text-sm text-green-600">+15% from yesterday</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-lg rounded-2xl">
          <CardContent className="flex items-center space-x-4">
            <Truck className="text-blue-600" size={32} />
            <div>
              <p className="text-gray-500">Active Vehicles</p>
              <h2 className="text-xl font-bold">3/4</h2>
              <p className="text-sm text-blue-600">1 in maintenance</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-lg rounded-2xl">
          <CardContent className="flex items-center space-x-4">
            <MapPin className="text-purple-600" size={32} />
            <div>
              <p className="text-gray-500">Routes Completed</p>
              <h2 className="text-xl font-bold">26/30</h2>
              <p className="text-sm text-purple-600">86.7% efficiency</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-lg rounded-2xl">
          <CardContent className="flex items-center space-x-4">
            <Clock className="text-orange-600" size={32} />
            <div>
              <p className="text-gray-500">Avg Collection Time</p>
              <h2 className="text-xl font-bold">3.2 hrs</h2>
              <p className="text-sm text-orange-600">-0.3 hrs from last week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 shadow-lg rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Monthly Collection Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="collected" fill="#16a34a" name="Collected" />
              <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 shadow-lg rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Route Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={routeStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {routeStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );

  const renderAssigned = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Assigned Transport Requests</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAssigned}>Refresh</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loadingAssigned ? (
          <div className="text-gray-600 p-3">Loading assigned...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">Stock ID</th>
                <th className="p-3">Scheduled Time</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Collector</th>
                <th className="p-3">Weight (kg)</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {assigned.map(r => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.requestId || (r._id?.slice(-6) || '-')}</td>
                  <td className="p-3">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '-'}</td>
                  <td className="p-3">{getDriverNameById(r.assignedDriverId)}</td>
                  <td className="p-3">{r.collectorName}</td>
                  <td className="p-3 font-semibold">{r.quantity}</td>
                  <td className="p-3">{r.location || '-'}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{r.status}</span></td>
                </tr>
              ))}
              {assigned.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={7}>No assigned requests</td></tr>
              )}

            </tbody>
          </table>
        )}
      </div>
    </Card>
  );

  const renderRequests = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Pending Transport Requests</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchRequests}>Refresh</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loadingRequests ? (
          <div className="text-gray-600 p-3">Loading requests...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">Request ID</th>
                <th className="p-3">Requested At</th>
                <th className="p-3">Collector</th>
                <th className="p-3">Weight (kg)</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.requestId || (r._id?.slice(-6) || '-')}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">{r.collectorName}</td>
                  <td className="p-3 font-semibold">{r.quantity}</td>
                  <td className="p-3">{r.location || '-'}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{r.status}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={async ()=>{
                        // Open modal to choose driver and schedule
                        setAssignRequestId(r._id);
                        setShowAssignModal(true);
                        // Initialize default schedule time (next hour)
                        try {
                          const now = new Date();
                          now.setMinutes(0,0,0);
                          now.setHours(now.getHours() + 1);
                          const pad = (n)=>String(n).padStart(2,'0');
                          const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          setScheduledAt(local);
                        } catch {}
                        // Fetch drivers list
                        try {
                          setLoadingDrivers(true);
                          const res = await axios.get('http://localhost:5000/api/transport/drivers');
                          setDrivers(res?.data || []);
                        } catch (err) { console.error('Failed to load drivers', err); }
                        finally { setLoadingDrivers(false); }
                      }}>Assign</Button>
                      <Button size="sm" variant="outline" onClick={async ()=>{
                        try {
                          await axios.post(`http://localhost:5000/api/transport-requests/${r._id}/status`, { status: 'Cancelled' });
                          fetchRequests();
                        } catch (err) { console.error(err); }
                      }}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={7}>No pending requests</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );

  const renderCollections = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Create Collection</h2>
        {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Collector ID"
            value={createForm.collectorId}
            onChange={(e) => setCreateForm({ ...createForm, collectorId: e.target.value })}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={createForm.bottleType}
            onChange={(e) => setCreateForm({ ...createForm, bottleType: e.target.value })}
          >
            <option value="PET">PET</option>
            <option value="HDPE">HDPE</option>
            <option value="GlassGreen">GlassGreen</option>
            <option value="GlassBrown">GlassBrown</option>
            <option value="GlassClear">GlassClear</option>
          </select>
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="Quantity"
            min="1"
            value={createForm.quantity}
            onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
          />
          <Button className="bg-green-600 text-white" onClick={async () => {
            try {
              setError("");
              if (!createForm.collectorId || !createForm.quantity) { setError('Collector ID and quantity required'); return; }
              await axios.post('http://localhost:5000/api/collections', {
                collectorId: createForm.collectorId,
                bottleType: createForm.bottleType,
                quantity: Number(createForm.quantity)
              });
              setCreateForm({ collectorId: "", bottleType: "PET", quantity: "" });
              fetchDeliveries();
            } catch (err) { setError('Failed to create collection'); console.error(err); }
          }}>Add</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <h2 className="text-lg font-bold mb-2">Delivery Records</h2>
        {loadingDeliveries ? (
          <div className="text-gray-600 p-3">Loading deliveries...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">Collector</th>
                <th className="p-3">Bottle Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Transport Staff ID</th>
                <th className="p-3">Collected</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Delivered</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{d.collectorId?.name || d.collectorId || '-'}</td>
                  <td className="p-3">{d.bottleType}</td>
                  <td className="p-3 font-bold">{d.quantity}</td>
                  <td className="p-3">{d.transportStaffId || '-'}</td>
                  <td className="p-3">{d.collectedAt ? new Date(d.collectedAt).toLocaleString() : '-'}</td>
                  <td className="p-3">{d.assignedAt ? new Date(d.assignedAt).toLocaleString() : '-'}</td>
                  <td className="p-3">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {(d.status === 'Collected' || d.status === 'Assigned') && (
                        <>
                          <input
                            className="border rounded-lg px-2 py-1 w-40"
                            placeholder="Transport Staff ID"
                            value={assignForm[d._id] || ''}
                            onChange={(e) => setAssignForm({ ...assignForm, [d._id]: e.target.value })}
                          />
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              const id = assignForm[d._id];
                              if (!id) return;
                              await axios.post(`http://localhost:5000/api/deliveries/${d._id}/assign`, { transportStaffId: id });
                              fetchDeliveries();
                            } catch (err) { console.error(err); }
                          }}>Assign</Button>
                        </>
                      )}
                      {d.status !== 'Delivered' && d.transportStaffId && (
                        <Button className="bg-blue-600 text-white" size="sm" onClick={async () => {
                          try {
                            await axios.post(`http://localhost:5000/api/deliveries/${d._id}/deliver`);
                            fetchDeliveries();
                          } catch (err) { console.error(err); }
                        }}>Mark Delivered</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={9}>No records</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );

  const renderRoutes = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Transport Routes</h2>
        <Button className="bg-purple-600 text-white" onClick={async ()=>{
          try {
            setShowAddRoute(true);
            // fetch options for dropdowns
            setLoadingDriversList(true);
            const [drv, veh] = await Promise.all([
              axios.get('http://localhost:5000/api/transport/drivers').catch(()=>({ data: [] })),
              axios.get('http://localhost:5000/api/transport/vehicles').catch(()=>({ data: [] })),
            ]);
            setDriversList(Array.isArray(drv?.data?.data) ? drv.data.data : Array.isArray(drv?.data) ? drv.data : []);
            setVehiclesList(Array.isArray(veh?.data?.data) ? veh.data.data : Array.isArray(veh?.data) ? veh.data : []);
          } catch (e) { console.error(e); }
          finally { setLoadingDriversList(false); }
        }}><Plus size={16} className="mr-2" />Add Route</Button>
      </div>
      <div className="overflow-x-auto">
        {loadingRoutesList ? (
          <div className="p-3 text-gray-600">Loading routes...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">Route ID</th>
                <th className="p-3">Route Name</th>
                <th className="p-3">Locations</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Estimated Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routesList.map(route => (
                <tr key={route._id || route.routeId} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{route.routeId}</td>
                  <td className="p-3">{route.name}</td>
                  <td className="p-3">{Array.isArray(route.locations) ? route.locations.length : 0} stops</td>
                  <td className="p-3">{route.distance?.total} {route.distance?.unit || 'km'}</td>
                  <td className="p-3">{route.estimatedDuration} mins</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                      {route.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm"><MapPin size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {routesList.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={7}>No routes found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {showAddRoute && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[920px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Route</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=>setShowAddRoute(false)}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Route Name</label>
                <input className={`border rounded-lg px-3 py-2 w-full ${addRouteErrors.name ? 'border-red-500' : ''}`} value={addRouteForm.name} onChange={(e)=>{ setAddRouteForm({...addRouteForm, name: e.target.value}); if (addRouteErrors.name) setAddRouteErrors({...addRouteErrors, name: ''}); }} />
                {addRouteErrors.name && <p className="mt-1 text-sm text-red-600">{addRouteErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Duration (mins)</label>
                <input type="number" className={`border rounded-lg px-3 py-2 w-full ${addRouteErrors.estimatedDuration ? 'border-red-500' : ''}`} value={addRouteForm.estimatedDuration} onChange={(e)=>{ setAddRouteForm({...addRouteForm, estimatedDuration: e.target.value}); if (addRouteErrors.estimatedDuration) setAddRouteErrors({...addRouteErrors, estimatedDuration: ''}); }} />
                {addRouteErrors.estimatedDuration && <p className="mt-1 text-sm text-red-600">{addRouteErrors.estimatedDuration}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Distance Total</label>
                <input type="number" className={`border rounded-lg px-3 py-2 w-full ${addRouteErrors.distanceTotal ? 'border-red-500' : ''}`} value={addRouteForm.distanceTotal} onChange={(e)=>{ setAddRouteForm({...addRouteForm, distanceTotal: e.target.value}); if (addRouteErrors.distanceTotal) setAddRouteErrors({...addRouteErrors, distanceTotal: ''}); }} />
                {addRouteErrors.distanceTotal && <p className="mt-1 text-sm text-red-600">{addRouteErrors.distanceTotal}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distance Unit</label>
                <select className={`border rounded-lg px-3 py-2 w-full ${addRouteErrors.distanceUnit ? 'border-red-500' : ''}`} value={addRouteForm.distanceUnit} onChange={(e)=>{ setAddRouteForm({...addRouteForm, distanceUnit: e.target.value}); if (addRouteErrors.distanceUnit) setAddRouteErrors({...addRouteErrors, distanceUnit: ''}); }}>
                  <option>km</option>
                  <option>miles</option>
                </select>
                {addRouteErrors.distanceUnit && <p className="mt-1 text-sm text-red-600">{addRouteErrors.distanceUnit}</p>}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Assign Vehicle</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addRouteForm.assignedVehicleId} onChange={(e)=>setAddRouteForm({...addRouteForm, assignedVehicleId: e.target.value})}>
                  <option value="">Select vehicle</option>
                  {vehiclesList.map(v=> (
                    <option key={v._id} value={v._id}>{v.vehicleId} · {v.type}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Assign Driver</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addRouteForm.assignedDriverId} onChange={(e)=>setAddRouteForm({...addRouteForm, assignedDriverId: e.target.value})}>
                  <option value="">Select driver</option>
                  {driversList.map(d=>{
                    const name = `${d.personalInfo?.firstName || ''} ${d.personalInfo?.lastName || ''}`.trim() || d.employeeId;
                    return <option key={d._id} value={d._id}>{name} · {d.employeeId}</option>
                  })}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Locations (comma separated)</label>
                <textarea className={`border rounded-lg px-3 py-2 w-full ${addRouteErrors.locationsText ? 'border-red-500' : ''}`} rows={3} placeholder="Location A, Location B, ..." value={addRouteForm.locationsText} onChange={(e)=>{ setAddRouteForm({...addRouteForm, locationsText: e.target.value}); if (addRouteErrors.locationsText) setAddRouteErrors({...addRouteErrors, locationsText: ''}); }} />
                {addRouteErrors.locationsText && <p className="mt-1 text-sm text-red-600">{addRouteErrors.locationsText}</p>}
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="border px-4 py-2 rounded-lg" onClick={()=>setShowAddRoute(false)}>Cancel</button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg" onClick={async ()=>{
                try {
                  const { valid } = validateAddRouteForm();
                  if (!valid) return;
                  const locations = (addRouteForm.locationsText || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map((n, idx)=>({ name: n, order: idx+1 }));
                  const payload = {
                    name: addRouteForm.name,
                    description: '',
                    locations,
                    distance: { total: Number(addRouteForm.distanceTotal) || 0, unit: addRouteForm.distanceUnit },
                    estimatedDuration: Number(addRouteForm.estimatedDuration) || 0,
                    assignedVehicles: addRouteForm.assignedVehicleId ? [addRouteForm.assignedVehicleId] : [],
                  };
                  await axios.post('http://localhost:5000/api/transport/routes', payload);
                  setShowAddRoute(false);
                  setAddRouteForm({ name: "", estimatedDuration: "", distanceTotal: "", distanceUnit: "km", locationsText: "", assignedVehicleId: "", assignedDriverId: "" });
                  setAddRouteErrors({});
                } catch (err) { console.error('Create route failed', err); }
              }}>Save Route</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );

  const renderVehicles = () => (
    <div className="grid grid-cols-1 gap-6">
      <Card className="p-4 shadow-lg rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Vehicle Fleet</h2>
          <Button className="bg-blue-600 text-white" onClick={() => setShowAddVehicle(true)}>
            <Plus size={16} className="mr-2" />Add Vehicle
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by ID, type, model, plate..."
            className="border rounded-lg px-3 py-2 w-full md:w-1/3"
            value={vehicleSearch}
            onChange={(e)=>setVehicleSearch(e.target.value)}
          />
          <select className="border rounded-lg px-3 py-2 w-full md:w-48" value={vehicleTypeFilter} onChange={(e)=>setVehicleTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option>Small Truck</option>
            <option>Medium Truck</option>
            <option>Large Truck</option>
            <option>Van</option>
          </select>
          <select className="border rounded-lg px-3 py-2 w-full md:w-48" value={vehicleStatusFilter} onChange={(e)=>setVehicleStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Maintenance</option>
            <option>Out of Service</option>
          </select>
          <button className="border rounded-lg px-3 py-2" onClick={fetchVehiclesList}>Refresh</button>
        </div>
        {loadingVehiclesList ? (
          <div className="p-4 text-gray-600">Loading vehicles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehiclesList.map((v) => {
                  return (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.vehicleId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{v.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{v.capacity?.bottles || 0} bottles · {v.capacity?.weight || 0} kg</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{v.specifications?.licensePlate || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{v.fuel?.level ?? 0}% {v.fuel?.fuelType ? `· ${v.fuel.fuelType}` : ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{v.maintenance?.status || 'Good'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 border rounded" onClick={() => {
                            setEditingVehicle(v);
                            setEditVehicleForm({
                              vehicleId: v.vehicleId || "",
                              type: v.type || "Medium Truck",
                              capacityBottles: v.capacity?.bottles ?? "",
                              capacityWeight: v.capacity?.weight ?? "",
                              licensePlate: v.specifications?.licensePlate || "",
                              status: v.status || "Active",
                              fuelLevel: v.fuel?.level ?? 100,
                              fuelType: v.fuel?.fuelType || "Diesel",
                              maintenanceStatus: v.maintenance?.status || "Good",
                            });
                            setShowEditVehicle(true);
                          }}>Edit</button>
                          <button className="px-3 py-1 border rounded text-red-600" onClick={async () => {
                            if (!window.confirm('Delete this vehicle permanently?')) return;
                            try {
                              await axios.delete(`http://localhost:5000/api/transport/vehicles/${v._id}`);
                              fetchVehiclesList();
                            } catch (err) { console.error('Delete vehicle failed', err); }
                          }}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {vehiclesList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-600">No vehicles found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAddVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[900px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Vehicle</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddVehicle(false)}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle ID</label>
                <input
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={addVehicleForm.vehicleId}
                  maxLength={10}
                  placeholder="Max 10 letters/numbers"
                  title="Only letters and numbers. Max 10 characters."
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
                    setAddVehicleForm({ ...addVehicleForm, vehicleId: sanitized });
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">Allowed: A–Z, 0–9. Max length 10.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.type} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, type: e.target.value })}>
                  <option>Small Truck</option>
                  <option>Medium Truck</option>
                  <option>Large Truck</option>
                  <option>Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.status} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, status: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Maintenance</option>
                  <option>Out of Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity (Bottles)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="1 – 10,000"
                  title="Enter whole number of bottles between 1 and 10,000"
                  value={addVehicleForm.capacityBottles}
                  onChange={(e) => {
                    const digits = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 5);
                    if (digits === '') { setAddVehicleForm({ ...addVehicleForm, capacityBottles: '' }); return; }
                    let n = parseInt(digits, 10);
                    if (Number.isNaN(n)) { n = ''; }
                    // clamp to 1..10000
                    if (n !== '') {
                      if (n < 1) n = 1;
                      if (n > 10000) n = 10000;
                    }
                    setAddVehicleForm({ ...addVehicleForm, capacityBottles: n === '' ? '' : String(n) });
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">Whole number between 1 and 10,000.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (Weight kg)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.capacityWeight} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, capacityWeight: e.target.value })} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={addVehicleForm.model}
                  maxLength={20}
                  placeholder="Letters only"
                  title="Only letters A–Z. Max 20 characters."
                  onChange={(e) => {
                    const onlyLetters = e.target.value.replace(/[^a-zA-Z]/g, '');
                    const limited = onlyLetters.slice(0, 20);
                    setAddVehicleForm({ ...addVehicleForm, model: limited });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">License Plate</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={addVehicleForm.licensePlate}
                  maxLength={12}
                  placeholder="e.g., ABC-1234"
                  title="Letters, numbers, hyphen and spaces only. Max 12 characters."
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    const allowed = upper.replace(/[^A-Z0-9\-\s]/g, '');
                    const collapsed = allowed.replace(/\s+/g, ' ').trim();
                    const limited = collapsed.slice(0, 12);
                    setAddVehicleForm({ ...addVehicleForm, licensePlate: limited });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={addVehicleForm.color}
                  maxLength={20}
                  placeholder="e.g., Dark Blue"
                  title="Letters and spaces only. Max 20 characters."
                  onChange={(e) => {
                    const onlyLettersSpaces = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    const collapsed = onlyLettersSpaces.replace(/\s+/g, ' ').trim();
                    const titleCased = collapsed.split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : '').join(' ');
                    const limited = titleCased.slice(0, 20);
                    setAddVehicleForm({ ...addVehicleForm, color: limited });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fuel Level (%)</label>
                <input type="number" min="0" max="100" className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.fuelLevel} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, fuelLevel: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.fuelType} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, fuelType: e.target.value })}>
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maintenance Status</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addVehicleForm.maintenanceStatus} onChange={(e) => setAddVehicleForm({ ...addVehicleForm, maintenanceStatus: e.target.value })}>
                  <option>Good</option>
                  <option>Service Due</option>
                  <option>Needs Repair</option>
                  <option>In Service</option>
                </select>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="border px-4 py-2 rounded-lg" onClick={() => setShowAddVehicle(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={async () => {
                try {
                  // Basic validation
                  if (!addVehicleForm.vehicleId || !addVehicleForm.type) return;
                  // Enforce Vehicle ID format: alphanumeric only up to 10 chars
                  if (!/^[A-Za-z0-9]{1,10}$/.test(addVehicleForm.vehicleId)) {
                    window.alert('Vehicle ID must contain only letters and numbers, maximum 10 characters.');
                    return;
                  }
                  // Color validation: optional, but if present must be letters and spaces, max 20
                  const colorVal = (addVehicleForm.color || '').trim();
                  if (colorVal && !/^[A-Za-z ]{1,20}$/.test(colorVal)) {
                    window.alert('Color can only contain letters and spaces (max 20 characters).');
                    return;
                  }
                  // License Plate validation: optional, but if present must be A–Z, 0–9, hyphen and spaces, max 12
                  const plateVal = (addVehicleForm.licensePlate || '').trim();
                  if (plateVal && !/^[A-Z0-9\- ]{1,12}$/.test(plateVal)) {
                    window.alert('License Plate can only contain letters (A–Z), numbers, hyphen and spaces (max 12 characters).');
                    return;
                  }
                  // Model validation: optional, but if present must be letters only, max 20
                  const modelVal = (addVehicleForm.model || '').trim();
                  if (modelVal && !/^[A-Za-z]{1,20}$/.test(modelVal)) {
                    window.alert('Model can only contain letters (A–Z) with no spaces (max 20 characters).');
                    return;
                  }
                  // Capacity (Bottles) validation: required integer 1..10000
                  const bottlesVal = parseInt(addVehicleForm.capacityBottles, 10);
                  if (!Number.isInteger(bottlesVal) || bottlesVal < 1 || bottlesVal > 10000) {
                    window.alert('Capacity (Bottles) must be a whole number between 1 and 10,000.');
                    return;
                  }
                  const payload = {
                    vehicleId: addVehicleForm.vehicleId,
                    type: addVehicleForm.type,
                    capacity: {
                      bottles: bottlesVal,
                      weight: Number(addVehicleForm.capacityWeight) || 0,
                    },
                    specifications: {
                      model: addVehicleForm.model,
                      licensePlate: addVehicleForm.licensePlate,
                      color: addVehicleForm.color,
                    },
                    status: addVehicleForm.status,
                    fuel: {
                      level: Number(addVehicleForm.fuelLevel) || 0,
                      fuelType: addVehicleForm.fuelType,
                    },
                    maintenance: {
                      status: addVehicleForm.maintenanceStatus,
                    },
                  };
                  await axios.post('http://localhost:5000/api/transport/vehicles', payload);
                  setShowAddVehicle(false);
                  setAddVehicleForm({
                    vehicleId: "", type: "Medium Truck", capacityBottles: "", capacityWeight: "",
                    model: "", licensePlate: "", color: "", status: "Active",
                    fuelLevel: 100, fuelType: "Diesel", maintenanceStatus: "Good",
                  });
                  fetchVehiclesList();
                } catch (err) { console.error('Create vehicle failed', err); }
              }}>Save Vehicle</button>
            </div>
          </div>
        </div>
      )}

      {showEditVehicle && editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[900px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Vehicle - {editingVehicle.vehicleId}</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=>{ setShowEditVehicle(false); setEditingVehicle(null); }}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle ID</label>
                <input
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={editVehicleForm.vehicleId}
                  maxLength={10}
                  placeholder="Max 10 letters/numbers"
                  title="Only letters and numbers. Max 10 characters."
                  onChange={(e)=>{
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0,10).toUpperCase();
                    setEditVehicleForm({...editVehicleForm, vehicleId: sanitized});
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.type} onChange={(e)=>setEditVehicleForm({...editVehicleForm, type: e.target.value})}>
                  <option>Small Truck</option>
                  <option>Medium Truck</option>
                  <option>Large Truck</option>
                  <option>Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.status} onChange={(e)=>setEditVehicleForm({...editVehicleForm, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Maintenance</option>
                  <option>Out of Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity (Bottles)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.capacityBottles} onChange={(e)=>setEditVehicleForm({...editVehicleForm, capacityBottles: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (Weight kg)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.capacityWeight} onChange={(e)=>setEditVehicleForm({...editVehicleForm, capacityWeight: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Plate</label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={editVehicleForm.licensePlate}
                  maxLength={12}
                  placeholder="e.g., ABC-1234"
                  title="Letters, numbers, hyphen and spaces only. Max 12 characters."
                  onChange={(e)=>{
                    const upper = e.target.value.toUpperCase();
                    const allowed = upper.replace(/[^A-Z0-9\-\s]/g, '');
                    const collapsed = allowed.replace(/\s+/g, ' ').trim();
                    const limited = collapsed.slice(0, 12);
                    setEditVehicleForm({...editVehicleForm, licensePlate: limited});
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Level (%)</label>
                <input type="number" min="0" max="100" className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.fuelLevel} onChange={(e)=>setEditVehicleForm({...editVehicleForm, fuelLevel: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.fuelType} onChange={(e)=>setEditVehicleForm({...editVehicleForm, fuelType: e.target.value})}>
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maintenance Status</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={editVehicleForm.maintenanceStatus} onChange={(e)=>setEditVehicleForm({...editVehicleForm, maintenanceStatus: e.target.value})}>
                  <option>Good</option>
                  <option>Service Due</option>
                  <option>Needs Repair</option>
                  <option>In Service</option>
                </select>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="border px-4 py-2 rounded-lg" onClick={()=>{ setShowEditVehicle(false); setEditingVehicle(null); }}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={async ()=>{
                try {
                  if (!editingVehicle?._id) return;
                  const payload = {
                    vehicleId: editVehicleForm.vehicleId,
                    type: editVehicleForm.type,
                    capacity: {
                      bottles: Number(editVehicleForm.capacityBottles) || 0,
                      weight: Number(editVehicleForm.capacityWeight) || 0,
                    },
                    specifications: {
                      licensePlate: editVehicleForm.licensePlate,
                    },
                    status: editVehicleForm.status,
                    fuel: {
                      level: Number(editVehicleForm.fuelLevel) || 0,
                      fuelType: editVehicleForm.fuelType,
                    },
                    maintenance: {
                      status: editVehicleForm.maintenanceStatus,
                    },
                  };
                  await axios.put(`http://localhost:5000/api/transport/vehicles/${editingVehicle._id}`, payload);
                  setShowEditVehicle(false);
                  setEditingVehicle(null);
                  fetchVehiclesList();
                } catch (err) { console.error('Update vehicle failed', err); }
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDrivers = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Driver Management</h2>
        <button className="border rounded-lg px-3 py-2" onClick={fetchDriversList}>Refresh</button>
      </div>
      {loadingDriversList ? (
        <div className="p-4 text-gray-600">Loading drivers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {driversList.map(d => {
            const name = (d.fullName || '').trim() || d.employeeId;
            return (
              <div key={d._id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{name}</h3>
                    <p className="text-sm text-gray-500">Employee: {d.employeeId}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{d.email || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{d.phone || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Department</span><span>{d.department}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Position</span><span>{d.position}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${String(d.status).toLowerCase()==='active'?'text-green-600':'text-gray-700'}`}>{d.status}</span></div>
                </div>
              </div>
            );
          })}
          {driversList.length === 0 && (
            <div className="p-4 text-gray-600">No drivers found</div>
          )}
        </div>
      )}
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "requests": return renderRequests();
      case "assigned": return renderAssigned();
      case "deliveries": return renderCollections();
      case "routes": return renderRoutes();
      case "vehicles": return renderVehicles();
      case "drivers": return renderDrivers();
      default: return renderOverview();
    }
  };

  // Fetch deliveries when entering the tab
  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const res = await axios.get('http://localhost:5000/api/deliveries');
      setDeliveries(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Failed to fetch deliveries', err); }
    finally { setLoadingDeliveries(false); }
  };

  useEffect(() => {
    if (activeTab === 'deliveries') fetchDeliveries();
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'assigned') fetchAssigned();
    if (activeTab === 'drivers') fetchDriversList();
    if (activeTab === 'vehicles') fetchVehiclesList();
    if (activeTab === 'routes') fetchRoutesList();
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Truck className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transport Hub</h2>
              <p className="text-sm text-gray-500">Fleet Management</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transport Dashboard</h1>
              <p className="text-gray-600 mt-1">Fleet operations and logistics management</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Export Report</Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
        {/* Global modals */}
        <AssignModal />
      </div>
    </div>
  );
}
//remove mock data