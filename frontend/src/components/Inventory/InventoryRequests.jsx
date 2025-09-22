import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../common/LogoutButton";
import {
  CubeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const InventoryRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProductionRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/production-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch production requests:", err);
      setError("Failed to fetch production requests. Ensure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action, approvedBy = "Inventory Manager") => {
    try {
      const payload = {
        status: action,
        approvedBy,
      };
      if (action === "Approved" || action === "Rejected") {
        payload.approvedAt = new Date().toISOString();
      }

      await axios.put(`http://localhost:5000/api/production-requests/${requestId}/status`, payload);
      await fetchProductionRequests();
      alert(`Request ${action.toLowerCase()} successfully!`);
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} request:`, err);
      alert(`Failed to ${action.toLowerCase()} request. Please try again.`);
    }
  };

  useEffect(() => {
    fetchProductionRequests();
    const interval = setInterval(fetchProductionRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar (Inventory section) */}
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
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
          >
            <DocumentChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Production Requests</span>
          </Link>
          <Link
            to="/inventory/deliveries"
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100"
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Production Requests</h1>
              <p className="text-gray-600 mt-1">Approve or reject production requests</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-600">Loading requests...</div>
          ) : (
            <div className="space-y-4">
              {requests.length === 0 && (
                <div className="p-6 bg-white rounded-2xl border text-gray-600">No production requests found.</div>
              )}
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-800">{req.team}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Item:</span> {req.inventoryItemId?.name || "Unknown Item"}
                      </div>
                      <div className="text-sm text-gray-600 flex gap-4">
                        <span><span className="font-medium">Qty:</span> {req.requestedQty}</span>
                        <span><span className="font-medium">Priority:</span> {req.priority}</span>
                      </div>
                      {req.notes && (
                        <div className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {req.notes}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <div>
                          <span className="font-medium">Request Time:</span>{' '}
                          {(req.createdAt || req.createdDate)
                            ? new Date(req.createdAt || req.createdDate).toLocaleString()
                            : '-'}
                        </div>
                        <div>
                          <span className="font-medium">Approved/Rejected Time:</span>{' '}
                          {(req.approvedAt || req.approvedDate)
                            ? new Date(req.approvedAt || req.approvedDate).toLocaleString()
                            : (req.status === 'Approved' || req.status === 'Rejected' ? '—' : '-')}
                        </div>
                        <div>
                          <span className="font-medium">Approved By:</span>{' '}
                          {req.approvedBy || (req.status === 'Approved' ? '—' : '-')}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.status === "Pending" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRequestAction(req._id, "Approved")}
                        className="p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRequestAction(req._id, "Rejected")}
                        className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryRequests;
