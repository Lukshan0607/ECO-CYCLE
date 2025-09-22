import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import { ClipboardDocumentListIcon, CubeIcon, ChartBarIcon, ArrowTrendingUpIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline";

export default function InventoryDeliveryRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/deliveries");
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
      setError("Failed to fetch deliveries. Ensure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <CubeIcon className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inventory Hub</h2>
              <p className="text-sm text-gray-500">Material Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to="/inventory"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <CubeIcon className="w-5 h-5" />
            <span className="font-medium">Inventory Overview</span>
          </Link>
          <Link
            to="/inventory/stock"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Stock Management</span>
          </Link>
          <Link
            to="/inventory/requests"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <DocumentChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Production Requests</span>
          </Link>
          <Link
            to="/inventory/deliveries"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
          >
            <ClipboardDocumentListIcon className="w-5 h-5" />
            <span className="font-medium">Delivery Records</span>
          </Link>
          
          <Link
            to="/inventory/analytics"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <ArrowTrendingUpIcon className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link
            to="/inventory/materials"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <ArrowTrendingUpIcon className="w-5 h-5" />
            <span className="font-medium">Raw Materials</span>
          </Link>
          <Link
            to="/inventory/reports"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
          >
            <DocumentChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </Link>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Records</h1>
              <p className="text-gray-600">End-to-end tracking from collectors to inventory</p>
            </div>
            <button onClick={fetchDeliveries} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Refresh</button>
          </div>
        </header>

        <div className="p-6">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            {loading ? (
              <div className="p-6 text-gray-600">Loading records...</div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm text-gray-700">
                    <th className="py-3 px-4 font-semibold">Collector</th>
                    <th className="py-3 px-4 font-semibold">Bottle Type</th>
                    <th className="py-3 px-4 font-semibold">Quantity</th>
                    <th className="py-3 px-4 font-semibold">Transport Staff</th>
                    <th className="py-3 px-4 font-semibold">Collected</th>
                    <th className="py-3 px-4 font-semibold">Assigned</th>
                    <th className="py-3 px-4 font-semibold">Delivered</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className="border-t text-sm">
                      <td className="py-3 px-4">{r.collectorId?.name || r.collectorId || '-'}</td>
                      <td className="py-3 px-4">{r.bottleType}</td>
                      <td className="py-3 px-4 font-semibold">{r.quantity}</td>
                      <td className="py-3 px-4">{r.transportStaffId || '-'}</td>
                      <td className="py-3 px-4">{r.collectedAt ? new Date(r.collectedAt).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4">{r.assignedAt ? new Date(r.assignedAt).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'Delivered' ? 'bg-green-100 text-green-700' : r.status === 'Assigned' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td className="py-6 px-4 text-gray-500" colSpan={8}>No delivery records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
