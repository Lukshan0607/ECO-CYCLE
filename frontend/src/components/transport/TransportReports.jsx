// src/components/transport/TransportReports.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export default function TransportReports() {
  const [binRoutes, setBinRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [requestsPending, setRequestsPending] = useState([]);
  const [assigned, setAssigned] = useState([]);

  const fetchBinRoutes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transport/bin-routes');
      const payload = res?.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setBinRoutes(list);
    } catch (e) { console.error('fetchBinRoutes failed', e); }
  };
  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transport/vehicles');
      const payload = res?.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setVehicles(list);
    } catch (e) { console.error('fetchVehicles failed', e); }
  };
  const fetchDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees', { params: { department: 'transport', position: 'Driver', status: 'active' } });
      const payload = res?.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setDrivers(list);
    } catch (e) { console.error('fetchDrivers failed', e); }
  };
  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Pending' } });
      setRequestsPending(res?.data?.requests || []);
    } catch (e) { console.error('fetchRequests failed', e); }
  };
  const fetchAssigned = async () => {
    try {
      const [aRes, dRes] = await Promise.all([
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Assigned' } }),
        axios.get('http://localhost:5000/api/transport-requests', { params: { status: 'Delivered' } }),
      ]);
      const a = aRes?.data?.requests || [];
      const d = dRes?.data?.requests || [];
      setAssigned([ ...a, ...d ]);
    } catch (e) { console.error('fetchAssigned failed', e); }
  };

  useEffect(() => {
    fetchBinRoutes();
    fetchVehicles();
    fetchDrivers();
    fetchRequests();
    fetchAssigned();
  }, []);

  // PDF helper via print window (user can Save as PDF)
  const openPdfWindow = (title, columns, rows) => {
    const date = new Date().toLocaleString();
    const head = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; }
      </style></head><body>`;
    const tableHead = `<tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr>`;
    const tableRows = rows.map(r=>`<tr>${r.map(v=>`<td>${String(v ?? '')}</td>`).join('')}</tr>`).join('');
    const body = `<h1>${title}</h1><div class="meta">Generated: ${date}</div><table>${tableHead}${tableRows}</table>`;
    const html = `${head}${body}</body></html>`;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const downloadSummaryPdf = () => {
    const totalVehicles = vehicles.length;
    const vehiclesActive = vehicles.filter(v => v.status === 'Active').length;
    const vehiclesInactive = vehicles.filter(v => v.status === 'Inactive').length;
    const vehiclesMaint = vehicles.filter(v => v.status === 'Maintenance').length;
    const totalDrivers = drivers.length;
    const totalBinLocations = binRoutes.length;
    const pendingCount = requestsPending.length;
    const assignedCount = assigned.filter(x => x.status === 'Assigned').length;
    const deliveredCount = assigned.filter(x => x.status === 'Delivered').length;
    const columns = ['Metric','Value'];
    const rows = [
      ['Total Bin Locations', totalBinLocations],
      ['Total Vehicles', totalVehicles],
      ['Vehicles Active', vehiclesActive],
      ['Vehicles Inactive', vehiclesInactive],
      ['Vehicles Maintenance', vehiclesMaint],
      ['Total Drivers', totalDrivers],
      ['Pending Requests', pendingCount],
      ['Assigned Deliveries', assignedCount],
      ['Delivered', deliveredCount],
    ];
    openPdfWindow('Transport Summary', columns, rows);
  };

  const downloadBinLocationsPdf = () => {
    const columns = ['Location ID', 'Location', 'City', 'Collection Manager', 'Status', 'Distance (km)'];
    const rows = binRoutes.map(r => [r.routeId || r.id || '', r.location||'', r.city||'', r.managerName||'', r.status||'', r.distanceKm??'']);
    openPdfWindow('Bin Locations', columns, rows);
  };
  const downloadVehiclesPdf = () => {
    const columns = ['Vehicle ID', 'Type', 'Status', 'License Plate', 'Fuel Level', 'Fuel Type', 'Maintenance'];
    const rows = vehicles.map(v => [v.vehicleId||'', v.type||'', v.status||'', v.specifications?.licensePlate||'', v.fuel?.level ?? '', v.fuel?.fuelType||'', v.maintenance?.status||'']);
    openPdfWindow('Vehicles', columns, rows);
  };
  const downloadDriversPdf = () => {
    const columns = ['Employee ID', 'First Name', 'Last Name', 'Status', 'Phone', 'Email'];
    const rows = drivers.map(d => [d.employeeId||'', d.personalInfo?.firstName||'', d.personalInfo?.lastName||'', d.currentStatus||'', d.phone||d.personalInfo?.phone||'', d.email||d.personalInfo?.email||'']);
    openPdfWindow('Drivers', columns, rows);
  };
  const downloadRequestsPdf = () => {
    const columns = ['Request ID', 'Collector', 'Bottle Type', 'Quantity', 'Location', 'Status', 'Requested At'];
    const rows = requestsPending.map(r => [r.requestId||r._id||'', r.collectorName||'', r.bottleType||'', r.quantity??'', r.location||'', r.status||'', r.createdAt ? new Date(r.createdAt).toISOString() : '']);
    openPdfWindow('Pending Requests', columns, rows);
  };
  const downloadAssignedPdf = () => {
    const columns = ['Stock ID', 'Scheduled Time', 'Driver', 'Collector', 'Bottle Type', 'Quantity', 'Location', 'Status'];
    const rows = assigned.map(r => [r.requestId||r._id||'', r.scheduledAt ? new Date(r.scheduledAt).toISOString() : '', r.assignedDriverId || '', r.collectorName||'', r.bottleType||'', r.quantity??'', r.location||'', r.status||'']);
    openPdfWindow('Assigned & Delivered', columns, rows);
  };

  const totalVehicles = vehicles.length;
  const vehiclesActive = vehicles.filter(v => v.status === 'Active').length;
  const vehiclesInactive = vehicles.filter(v => v.status === 'Inactive').length;
  const vehiclesMaint = vehicles.filter(v => v.status === 'Maintenance').length;
  const totalDrivers = drivers.length;
  const totalBinLocations = binRoutes.length;
  const pendingCount = requestsPending.length;
  const assignedCount = assigned.filter(x => x.status === 'Assigned').length;
  const deliveredCount = assigned.filter(x => x.status === 'Delivered').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transport Reports</h1>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadSummaryPdf}>Download Summary (PDF)</Button>
        </div>

        <Card className="p-4 shadow-lg rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Bin Locations</div>
              <div className="text-2xl font-bold">{totalBinLocations}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Vehicles (Active/Inactive/Maint.)</div>
              <div className="text-2xl font-bold">{vehiclesActive} / {vehiclesInactive} / {vehiclesMaint}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Drivers</div>
              <div className="text-2xl font-bold">{totalDrivers}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Pending Requests</div>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Assigned Deliveries</div>
              <div className="text-2xl font-bold">{assignedCount}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">Delivered</div>
              <div className="text-2xl font-bold">{deliveredCount}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Bin Locations</h3>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadBinLocationsPdf}>Download PDF</Button>
          </div>
          <div className="text-sm text-gray-600">Export the current list of bin locations.</div>
        </Card>

        <Card className="p-4 shadow rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Vehicles</h3>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadVehiclesPdf}>Download PDF</Button>
          </div>
          <div className="text-sm text-gray-600">Export the current vehicle fleet.</div>
        </Card>

        <Card className="p-4 shadow rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Drivers</h3>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadDriversPdf}>Download PDF</Button>
          </div>
          <div className="text-sm text-gray-600">Export transport drivers.</div>
        </Card>

        <Card className="p-4 shadow rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pending Requests</h3>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadRequestsPdf}>Download PDF</Button>
          </div>
          <div className="text-sm text-gray-600">Export current pending collection requests.</div>
        </Card>

        <Card className="p-4 shadow rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Assigned & Delivered</h3>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={downloadAssignedPdf}>Download PDF</Button>
          </div>
          <div className="text-sm text-gray-600">Export assigned and delivered transport records.</div>
        </Card>
      </div>
    </div>
  );
}
