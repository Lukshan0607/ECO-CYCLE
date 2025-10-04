const StockProductionRequest = require('../Model/StockProductionRequestModel');
const TransportRequest = require('../Model/TransportRequestModel');

// Generate unique Request ID in the format RI-#### (four digits)
async function generateUniqueRequestId() {
  const existing = new Set(
    (await StockProductionRequest.find({}, 'requestId').lean()).map((r) => r.requestId)
  );
  let rid;
  let guard = 0;
  do {
    const four = Math.floor(1000 + Math.random() * 9000);
    rid = `RI-${four}`;
    guard += 1;
  } while (existing.has(rid) && guard < 2000);
  return rid;
}

exports.create = async (req, res) => {
  try {
    const { weightKg } = req.body;
    const w = Number(weightKg);
    if (!weightKg || Number.isNaN(w) || w <= 0) {
      return res.status(400).json({ message: 'Invalid weightKg' });
    }
    // Check available before creating
    const delivered = await TransportRequest.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$quantity' } } } }
    ]);
    const deliveredTotal = delivered?.[0]?.total || 0;
    const requestedAgg = await StockProductionRequest.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: '$weightKg' } } } }
    ]);
    const alreadyRequested = requestedAgg?.[0]?.total || 0;
    const available = Number(deliveredTotal) - Number(alreadyRequested);
    if (w > available) {
      return res.status(400).json({ message: 'Requested weight exceeds available stock', available });
    }
    const requestId = await generateUniqueRequestId();
    const doc = await StockProductionRequest.create({ requestId, weightKg: Number(w.toFixed(3)) });
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Create StockProductionRequest error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.list = async (_req, res) => {
  try {
    const list = await StockProductionRequest.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error('List StockProductionRequest error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { weightKg } = req.body;
    const w = Number(weightKg);
    if (!weightKg || Number.isNaN(w) || w <= 0) {
      return res.status(400).json({ message: 'Invalid weightKg' });
    }
    const current = await StockProductionRequest.findById(id);
    if (!current) return res.status(404).json({ message: 'Request not found' });

    // Availability = delivered - (sum(all other requests))
    const delivered = await TransportRequest.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$quantity' } } } }
    ]);
    const deliveredTotal = delivered?.[0]?.total || 0;
    const requestedAgg = await StockProductionRequest.aggregate([
      { $match: { _id: { $ne: current._id } } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$weightKg' } } } }
    ]);
    const alreadyRequestedOthers = requestedAgg?.[0]?.total || 0;
    const available = Number(deliveredTotal) - Number(alreadyRequestedOthers);
    if (w > available) {
      return res.status(400).json({ message: 'Requested weight exceeds available stock', available });
    }

    const updated = await StockProductionRequest.findByIdAndUpdate(
      id,
      { $set: { weightKg: Number(w.toFixed(3)) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Update StockProductionRequest error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StockProductionRequest.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete StockProductionRequest error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Summary endpoint: totals and available for UI
exports.summary = async (_req, res) => {
  try {
    const delivered = await TransportRequest.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$quantity' } } } }
    ]);
    const deliveredTotal = delivered?.[0]?.total || 0;
    const requestedAgg = await StockProductionRequest.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: '$weightKg' } } } }
    ]);
    const requestedTotal = requestedAgg?.[0]?.total || 0;
    const available = Number(deliveredTotal) - Number(requestedTotal);
    // Round to exactly 3 decimal places for consistent client display
    const delivered3 = Number(Number(deliveredTotal).toFixed(3));
    const requested3 = Number(Number(requestedTotal).toFixed(3));
    const available3 = Number(Number(available).toFixed(3));
    return res.json({
      deliveredTotalKg: delivered3,
      requestedTotalKg: requested3,
      availableKg: available3
    });
  } catch (err) {
    console.error('Summary StockProductionRequest error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
