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

const transportRoutes = [
  { id: "RT001", name: "City Center Route", locations: 8, distance: "25 km", avgTime: "3.5 hrs", frequency: "Daily", status: "Active" },
  { id: "RT002", name: "Suburban Route", locations: 12, distance: "35 km", avgTime: "4.2 hrs", frequency: "Daily", status: "Active" },
  { id: "RT003", name: "Industrial Route", locations: 6, distance: "18 km", avgTime: "2.8 hrs", frequency: "Twice Daily", status: "Active" },
  { id: "RT004", name: "Weekend Route", locations: 15, distance: "42 km", avgTime: "5.1 hrs", frequency: "Weekends", status: "Inactive" },
];

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

  const menuItems = [
    { name: "Transport Overview", key: "overview", icon: <Truck size={20} /> },
    { name: "Requests", key: "requests", icon: <Package size={20} /> },
    { name: "Assigned", key: "assigned", icon: <Package size={20} /> },
    { name: "Deliveries", key: "deliveries", icon: <Package size={20} /> },
    { name: "Route Management", key: "routes", icon: <MapPin size={20} /> },
    { name: "Vehicle Fleet", key: "vehicles", icon: <Truck size={20} /> },
    { name: "Driver Management", key: "drivers", icon: <Users size={20} /> },
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
      const res = await axios.get('http://localhost:5000/api/transport/drivers');
      setDriversList(Array.isArray(res.data) ? res.data : []);
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

  const getDriverNameById = (id) => {
    if (!id) return '-';
    const d = driversList.find(x => (x._id === id) || (String(x._id) === String(id)));
    if (!d) return id; // fallback
    const first = d.personalInfo?.firstName || '';
    const last = d.personalInfo?.lastName || '';
    const name = `${first} ${last}`.trim();
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
      const [aRes, dRes] = await Promise.all([
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Assigned' } }),
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Delivered' } }),
      ]);
      const a = aRes?.data?.requests || [];
      const d = dRes?.data?.requests || [];
      // Merge so that already delivered items still show with Delivered status
      // Sort by Stock ID (requestId) ascending
      const merged = [...a, ...d].sort((x,y)=>{
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
              {loadingDrivers ? (
                <div className="text-gray-600">Loading drivers...</div>
              ) : (
                <div className="max-h-72 overflow-auto border rounded-xl">
                  {drivers.map((d)=>{
                    const name = `${d.personalInfo?.firstName || ''} ${d.personalInfo?.lastName || ''}`.trim() || d.employeeId;
                    const status = d.currentStatus;
                    const selected = selectedDriverId === d._id;
                    return (
                      <button key={d._id} onClick={()=>setSelectedDriverId(d._id)} className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-xs text-gray-500">Employee ID: {d.employeeId}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${status==='Available'?'bg-green-100 text-green-700': 'bg-gray-100 text-gray-700'}`}>{status}</span>
                        </div>
                      </button>
                    );
                  })}
                  {drivers.length === 0 && (
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
                // Ensure status is set to Assigned so Collectors page reflects it
                try {
                  await axios.post(`http://localhost:5000/api/transport-requests/${assignRequestId}/status`, { status: 'Assigned' });
                } catch (err) {
                  console.error('Failed to update status to Assigned', err);
                }
                setAssignNotice({ type:'success', text:'Assigned successfully' });
                // brief delay to show success
                setTimeout(()=>{
                  setShowAssignModal(false);
                  setAssignRequestId(null);
                  setSelectedDriverId("");
                  setAssignSubmitting(false);
                  fetchRequests();
                  fetchAssigned();
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
        <Button className="bg-purple-600 text-white"><Plus size={16} className="mr-2" />Add Route</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3">Route ID</th>
              <th className="p-3">Route Name</th>
              <th className="p-3">Locations</th>
              <th className="p-3">Distance</th>
              <th className="p-3">Avg Time</th>
              <th className="p-3">Frequency</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transportRoutes.map(route => (
              <tr key={route.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{route.id}</td>
                <td className="p-3">{route.name}</td>
                <td className="p-3">{route.locations} stops</td>
                <td className="p-3">{route.distance}</td>
                <td className="p-3">{route.avgTime}</td>
                <td className="p-3">{route.frequency}</td>
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
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderVehicles = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4 shadow-lg rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Vehicle Fleet</h2>
          <Button className="bg-blue-600 text-white"><Plus size={16} className="mr-2" />Add Vehicle</Button>
        </div>
        <div className="space-y-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{vehicle.id} - {vehicle.type}</h3>
                  <p className="text-sm text-gray-500">Driver: {vehicle.driver}</p>
                  <p className="text-sm text-gray-500">Capacity: {vehicle.capacity} bottles</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Current Location</p>
                  <p className="text-sm font-medium">{vehicle.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fuel Level</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${vehicle.fuel > 50 ? 'bg-green-600' : vehicle.fuel > 25 ? 'bg-yellow-600' : 'bg-red-600'}`}
                        style={{ width: `${vehicle.fuel}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{vehicle.fuel}%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-xs ${vehicle.maintenance === 'Good' ? 'text-green-600' : 'text-orange-600'}`}>
                  {vehicle.maintenance}
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Track</Button>
                  <Button variant="outline" size="sm">Maintain</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 shadow-lg rounded-2xl">
        <h2 className="text-lg font-bold mb-4">Fleet Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={collectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="efficiency" stroke="#16a34a" strokeWidth={3} name="Efficiency %" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Average Efficiency</span>
            <span className="text-sm font-medium">92.2%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Distance (Month)</span>
            <span className="text-sm font-medium">2,450 km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Fuel Consumption</span>
            <span className="text-sm font-medium">485 L</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDrivers = () => (
    <Card className="p-4 shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Driver Management</h2>
        <Button className="bg-indigo-600 text-white" onClick={()=>setShowAddDriver(true)}><Plus size={16} className="mr-2" />Add Driver</Button>
      </div>
      {loadingDriversList ? (
        <div className="p-4 text-gray-600">Loading drivers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {driversList.map(d => {
            const name = `${d.personalInfo?.firstName || ''} ${d.personalInfo?.lastName || ''}`.trim() || d.employeeId;
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
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{d.personalInfo?.email || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{d.personalInfo?.phone || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${d.currentStatus==='Available'?'text-green-600':'text-gray-700'}`}>{d.currentStatus}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shift</span><span>{d.employment?.shift || '-'}</span></div>
                </div>
              </div>
            );
          })}
          {driversList.length === 0 && (
            <div className="p-4 text-gray-600">No drivers found</div>
          )}
        </div>
      )}
      {showAddDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[900px] max-w-[95vw] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Driver</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=>setShowAddDriver(false)}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-auto">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.employeeId} onChange={(e)=>setAddDriverForm({...addDriverForm, employeeId: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.firstName} onChange={(e)=>setAddDriverForm({...addDriverForm, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.lastName} onChange={(e)=>setAddDriverForm({...addDriverForm, lastName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.email} onChange={(e)=>setAddDriverForm({...addDriverForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.phone} onChange={(e)=>setAddDriverForm({...addDriverForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.dateOfBirth} onChange={(e)=>setAddDriverForm({...addDriverForm, dateOfBirth: e.target.value})} />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Street</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.address.street} onChange={(e)=>setAddDriverForm({...addDriverForm, address: {...addDriverForm.address, street: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.address.city} onChange={(e)=>setAddDriverForm({...addDriverForm, address: {...addDriverForm.address, city: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.address.state} onChange={(e)=>setAddDriverForm({...addDriverForm, address: {...addDriverForm.address, state: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.address.zipCode} onChange={(e)=>setAddDriverForm({...addDriverForm, address: {...addDriverForm.address, zipCode: e.target.value}})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.licenseNumber} onChange={(e)=>setAddDriverForm({...addDriverForm, licenseNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Type</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.licenseType} onChange={(e)=>setAddDriverForm({...addDriverForm, licenseType: e.target.value})}>
                  <option>Class A</option>
                  <option>Class B</option>
                  <option>Class C</option>
                  <option>CDL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Expiry</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.licenseExpiry} onChange={(e)=>setAddDriverForm({...addDriverForm, licenseExpiry: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hire Date</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.hireDate} onChange={(e)=>setAddDriverForm({...addDriverForm, hireDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employment Status</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.employmentStatus} onChange={(e)=>setAddDriverForm({...addDriverForm, employmentStatus: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>On Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shift</label>
                <select className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.shift} onChange={(e)=>setAddDriverForm({...addDriverForm, shift: e.target.value})}>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Night</option>
                  <option>Flexible</option>
                </select>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.username} onChange={(e)=>setAddDriverForm({...addDriverForm, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input type="password" className="border rounded-lg px-3 py-2 w-full" value={addDriverForm.password} onChange={(e)=>setAddDriverForm({...addDriverForm, password: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button className="border px-4 py-2 rounded-lg" onClick={()=>setShowAddDriver(false)}>Cancel</button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={async ()=>{
                try {
                  const payload = {
                    employeeId: addDriverForm.employeeId,
                    firstName: addDriverForm.firstName,
                    lastName: addDriverForm.lastName,
                    email: addDriverForm.email,
                    phone: addDriverForm.phone,
                    dateOfBirth: addDriverForm.dateOfBirth,
                    address: addDriverForm.address,
                    licenseNumber: addDriverForm.licenseNumber,
                    licenseType: addDriverForm.licenseType,
                    licenseExpiry: addDriverForm.licenseExpiry,
                    hireDate: addDriverForm.hireDate,
                    employmentStatus: addDriverForm.employmentStatus,
                    shift: addDriverForm.shift,
                    username: addDriverForm.username,
                    password: addDriverForm.password,
                  };
                  await axios.post('http://localhost:5000/api/transport/drivers', payload);
                  setShowAddDriver(false);
                  setAddDriverForm({
                    employeeId: "", firstName: "", lastName: "", email: "", phone: "",
                    address: { street: "", city: "", state: "", zipCode: "" }, dateOfBirth: "",
                    licenseNumber: "", licenseType: "Class C", licenseExpiry: "", hireDate: "",
                    employmentStatus: "Active", shift: "Morning", username: "", password: "",
                  });
                  fetchDriversList();
                } catch (err) { console.error('Create driver failed', err); }
              }}>Save Driver</button>
            </div>
          </div>
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
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus size={16} className="mr-2" />Quick Collection
              </Button>
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