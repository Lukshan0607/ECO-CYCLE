import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import { CubeIcon, ClipboardDocumentListIcon, ChartBarIcon, ArrowTrendingUpIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline";

export default function InventoryStockManagement() {
  const [loading, setLoading] = useState(true);
  const [deliveredTotalKg, setDeliveredTotalKg] = useState(0);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const fetchDeliveredTotal = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/transport-requests", { params: { status: "Delivered" } });
      const rows = res?.data?.requests || [];
      const total = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      setDeliveredTotalKg(total);
    } catch (err) {
      console.error("Failed to fetch delivered total", err);
      setDeliveredTotalKg(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const res = await axios.get("http://localhost:5000/api/inventory");
      // Inventory items are considered raw materials list
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.materials) ? res.data.materials : []);
      setMaterials(list);
    } catch (err) {
      console.error("Failed to fetch materials", err);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchDeliveredTotal();
    fetchMaterials();
    const handler = () => { fetchMaterials(); };
    window.addEventListener('inventory:materials-updated', handler);
    return () => window.removeEventListener('inventory:materials-updated', handler);
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
            className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
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

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
              <p className="text-gray-600">Track current stock levels and inbound materials</p>
            </div>
            <button onClick={()=>{ fetchDeliveredTotal(); fetchMaterials(); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Refresh</button>
          </div>
        </header>

        <div className="p-6">
          {/* Centered KPI card */}
          <div className="grid grid-cols-1 place-items-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full max-w-xl text-center">
              <div className="text-sm text-gray-500">Total Items in Stock</div>
              <div className="mt-2 text-3xl font-bold">{loading ? '...' : `${deliveredTotalKg} Kg`}</div>
              <div className="mt-2 text-xs text-gray-500">Total delivered to inventory (kg)</div>
            </div>
          </div>

          {/* CTA button below card */}
          <div className="mt-4 flex justify-center">
            <Link
              to="/inventory/materials"
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Request to produce raw material
            </Link>
          </div>

          {/* Horizontal raw materials cards */}
          <div className="mt-6">
            {loadingMaterials ? (
              <div className="text-gray-600 text-center">Loading raw materials...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-4">
                  {materials.map((m) => {
                    const name = m.name || m.itemName || m.title || 'Material';
                    const code = m.itemCode || m.code || m.sku || '-';
                    // Stock is in Kg in Raw Materials table
                    const kg = Number(m.stock) || Number(m.weight) || Number(m.totalWeightKg) || 0;
                    return (
                      <div key={m._id || code}
                        className="min-w-[220px] bg-white rounded-2xl shadow-lg border border-gray-100 p-5 text-center">
                        <div className="text-xl font-bold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500 mt-1">Code: {code}</div>
                        <div className="mt-3 text-3xl font-extrabold text-gray-900">{kg} Kg</div>
                      </div>
                    );
                  })}
                  {materials.length === 0 && (
                    <div className="text-gray-600 text-center w-full">No raw materials found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!loading && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-bold mb-3">Overview</h2>
              <p className="text-gray-600 text-sm">This section will display your stock tables and charts. We set up the page scaffold to match the look and feel of other Inventory sections.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
