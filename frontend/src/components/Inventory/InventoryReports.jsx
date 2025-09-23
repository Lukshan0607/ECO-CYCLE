import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LogoutButton from "../common/LogoutButton";
import { CubeIcon, ClipboardDocumentListIcon, ChartBarIcon, ArrowTrendingUpIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline";

export default function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [productionRequests, setProductionRequests] = useState([]);
  const [summary, setSummary] = useState({ deliveredTotalKg: 0, requestedTotalKg: 0, availableKg: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState("");

  const refMaterials = useRef(null);
  const refStock = useRef(null);
  const refDeliveries = useRef(null);
  const refAll = useRef(null);
  const refProduction = useRef(null);

  const nowString = () => new Date().toLocaleString();

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [inv, reqs, sum, del, prod] = await Promise.all([
        axios.get("http://localhost:5000/api/inventory"),
        axios.get("http://localhost:5000/api/stock-requests"),
        axios.get("http://localhost:5000/api/stock-requests/summary"),
        axios.get("http://localhost:5000/api/transport-requests", { params: { status: "Delivered" } }),
        axios.get("http://localhost:5000/api/production-requests")
      ]);
      const invList = Array.isArray(inv.data) ? inv.data : [];
      setMaterials(invList);
      setRequests(Array.isArray(reqs.data) ? reqs.data : []);
      setSummary({
        deliveredTotalKg: Number(sum.data?.deliveredTotalKg || 0),
        requestedTotalKg: Number(sum.data?.requestedTotalKg || 0),
        availableKg: Number(sum.data?.availableKg || 0)
      });
      setDeliveries(Array.isArray(del.data?.requests) ? del.data.requests : []);
      setProductionRequests(Array.isArray(prod.data) ? prod.data : []);
    } catch (err) {
      console.error("Failed to load reports data", err);
      setError("Failed to load reports data. Make sure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const printFullReport = () => {
    if (!refAll?.current) return;
    const content = refAll.current.innerHTML;
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;
    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><title>Inventory Reports - Full Report</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; }
        .report-section { page-break-after: always; }
        .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .print-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
        img.print-img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
      </style>
    </head><body>
      <h1>Inventory Reports - Full Report</h1>
      <div class="meta">Generated at: ${nowString()}</div>
      <div>${content}</div>
      <script>setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 250);</script>
    </body></html>`);
    win.document.close();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const printSection = (sectionRef, title) => {
    if (!sectionRef?.current) return;
    const content = sectionRef.current.innerHTML;
    const win = window.open("", "_blank", "width=1024,height=768");
    if (!win) return;
    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
        .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .print-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; }
        img.print-img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
      </style>
    </head><body>
      <h1>${title}</h1>
      <div class="meta">Generated at: ${nowString()}</div>
      <div>${content}</div>
      <script>setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200);</script>
    </body></html>`);
    win.document.close();
  };

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
              <p className="text-sm text-gray-500">Reports</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/inventory" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <CubeIcon className="w-5 h-5" />
            <span className="font-medium">Inventory Overview</span>
          </Link>
          <Link to="/inventory/stock" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Stock Management</span>
          </Link>
          <Link to="/inventory/requests" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <DocumentChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Production Requests</span>
          </Link>
          <Link to="/inventory/deliveries" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            <span className="font-medium">Delivery Records</span>
          </Link>
          <Link to="/inventory/analytics" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <ArrowTrendingUpIcon className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link to="/inventory/materials" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100">
            <ArrowTrendingUpIcon className="w-5 h-5" />
            <span className="font-medium">Raw Materials</span>
          </Link>
          <Link to="/inventory/reports" className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
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
              <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
              <p className="text-gray-600">Review and download PDF reports of all inventory sections</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Refresh</button>
              <button onClick={printFullReport} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Download Full Report</button>
            </div>
          </div>
        </header>

        <div ref={refAll} className="p-6 space-y-8">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}
          {loading && <div className="text-gray-600">Loading data...</div>}

          {/* Raw Materials Report */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Raw Materials Report</h2>
                <p className="text-sm text-gray-500">Inventory materials with current stock</p>
              </div>
              <button onClick={() => printSection(refMaterials, 'Raw Materials Report')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Download PDF</button>
            </div>
            <div ref={refMaterials} className="p-4">
              <div className="text-sm text-gray-500 mb-3">Generated at: {nowString()}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((m) => (
                  <div key={m._id} className="border rounded-xl p-4 shadow-sm">
                    {m.imageUrl ? (
                      <img src={`http://localhost:5000${m.imageUrl}`} alt={m.name} className="w-full h-32 object-cover rounded-md mb-3" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400 text-sm">No Image</div>
                    )}
                    <div className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-1">
                      <span className="text-emerald-700 font-bold">{Number(m.stock).toFixed(3)} Kg</span>
                      <span className="text-gray-400">—</span>
                      <span>{m.name}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">Code: <span className="font-mono">{m.itemCode}</span></div>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">{m.color}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">{m.type}</span>
                    </div>
                    <div className="text-xs text-gray-500">Last updated: {m.lastUpdated}</div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="text-gray-500">No materials found</div>
                )}
              </div>
            </div>
          </section>

          {/* Stock Summary & Requests Report */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Stock Summary & Requests</h2>
                <p className="text-sm text-gray-500">Available, delivered, requested totals and request list</p>
              </div>
              <button onClick={() => printSection(refStock, 'Stock Summary & Requests')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Download PDF</button>
            </div>
            <div ref={refStock} className="p-4 overflow-x-auto">
              <div className="text-sm text-gray-500 mb-3">Generated at: {nowString()}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded border p-3">
                  <div className="text-xs text-gray-500">Delivered Total (Kg)</div>
                  <div className="text-xl font-bold">{summary.deliveredTotalKg}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-gray-500">Requested Total (Kg)</div>
                  <div className="text-xl font-bold">{summary.requestedTotalKg}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-gray-500">Available (Kg)</div>
                  <div className="text-xl font-bold">{summary.availableKg}</div>
                </div>
              </div>
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-sm text-gray-700">
                    <th className="py-2 px-3 font-semibold">Request ID</th>
                    <th className="py-2 px-3 font-semibold">Weight (Kg)</th>
                    <th className="py-2 px-3 font-semibold">Request Time</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="border-t text-sm">
                      <td className="py-2 px-3 font-mono">{r.requestId}</td>
                      <td className="py-2 px-3 font-semibold">{r.weightKg}</td>
                      <td className="py-2 px-3">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr><td className="py-4 px-3 text-gray-500" colSpan={3}>No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Production Report */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Production Report</h2>
                <p className="text-sm text-gray-500">Production requests summary and details</p>
              </div>
              <button onClick={() => printSection(refProduction, 'Production Report')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Download PDF</button>
            </div>
            <div ref={refProduction} className="p-4">
              <div className="text-sm text-gray-500 mb-3">Generated at: {nowString()}</div>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded border p-3"><div className="text-xs text-gray-500">Total Requests</div><div className="text-xl font-bold">{productionRequests.length}</div></div>
                <div className="rounded border p-3"><div className="text-xs text-gray-500">Pending</div><div className="text-xl font-bold">{productionRequests.filter(r => (r.status||'').toLowerCase()==='pending').length}</div></div>
                <div className="rounded border p-3"><div className="text-xs text-gray-500">Approved</div><div className="text-xl font-bold">{productionRequests.filter(r => (r.status||'').toLowerCase()==='approved').length}</div></div>
                <div className="rounded border p-3"><div className="text-xs text-gray-500">Rejected</div><div className="text-xl font-bold">{productionRequests.filter(r => (r.status||'').toLowerCase()==='rejected').length}</div></div>
              </div>
              {/* Cards list */}
              <div className="print-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productionRequests.map((pr) => (
                  <div key={pr._id} className="print-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-700 font-semibold">{pr.team}</div>
                      <div className="text-xs text-gray-500 font-mono">{pr.requestId || pr._id?.slice(-6)}</div>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Qty:</span> {pr.requestedQty}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Material:</span> {pr.inventoryItemId?.name || '-'} {pr.inventoryItemId?.type ? `(${pr.inventoryItemId.type})` : ''}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Priority:</span> {pr.priority || 'Medium'}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Status:</span> {pr.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Requested:</span> {pr.requestDate ? new Date(pr.requestDate).toLocaleString() : new Date(pr.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {productionRequests.length === 0 && (
                  <div className="text-gray-500">No production requests found</div>
                )}
              </div>
            </div>
          </section>

          {/* Delivery Records Report */}
          <section className="bg-white rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Delivery Records (Delivered)</h2>
                <p className="text-sm text-gray-500">Transport requests marked as Delivered</p>
              </div>
              <button onClick={() => printSection(refDeliveries, 'Delivery Records (Delivered)')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Download PDF</button>
            </div>
            <div ref={refDeliveries} className="p-4">
              <div className="text-sm text-gray-500 mb-3">Generated at: {nowString()}</div>

              {/* Header: feature the first delivered record */}
              {deliveries.length > 0 && (
                <div className="print-card border rounded-xl p-4 shadow-sm mb-4">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Featured Delivery</h3>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700 font-semibold">{deliveries[0].collectorName || '—'}</div>
                    <div className="text-xs text-gray-500 font-mono">{deliveries[0].requestId || (deliveries[0]._id?.slice(-6) || '—')}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">{deliveries[0].bottleType}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">Qty: {deliveries[0].quantity}</span>
                  </div>
                  <div className="text-xs text-gray-500">Delivered: {deliveries[0].updatedAt ? new Date(deliveries[0].updatedAt).toLocaleString() : (deliveries[0].deliveredAt ? new Date(deliveries[0].deliveredAt).toLocaleString() : '—')}</div>
                </div>
              )}

              {/* Remaining delivered records */}
              <div className="print-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveries.slice(1).map((d) => (
                  <div key={d._id} className="print-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-700 font-semibold">{d.collectorName || '—'}</div>
                      <div className="text-xs text-gray-500 font-mono">{d.requestId || (d._id?.slice(-6) || '—')}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">{d.bottleType}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border text-gray-700">Qty: {d.quantity}</span>
                    </div>
                    <div className="text-xs text-gray-500">Delivered: {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : (d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : '—')}</div>
                  </div>
                ))}
                {deliveries.length === 0 && (
                  <div className="text-gray-500">No delivered records</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
