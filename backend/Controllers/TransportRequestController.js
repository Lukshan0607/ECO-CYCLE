const TransportRequest = require('../Model/TransportRequestModel');

// Create a new transport request (status defaults to Pending)
const createTransportRequest = async (req, res) => {
  try {
    const { collectionId, collectorName, bottleType, quantity, location, notes, requestId } = req.body;
    if (!collectorName || !bottleType || !Number(quantity)) {
      return res.status(400).json({ success: false, message: 'collectorName, bottleType and positive quantity are required' });
    }
    // Determine requestId: if provided, use it; otherwise generate next CSTxxxx
    let finalRequestId = String(requestId || '').trim();
    const pad4 = (n) => String(n).padStart(4, '0');
    const genNextReqId = async () => {
      const last = await TransportRequest.findOne({ requestId: /^CST\d{4}$/ }).sort({ requestId: -1 }).select('requestId');
      let nextNum = 1;
      if (last && last.requestId) {
        const m = last.requestId.match(/CST(\d{4})/);
        if (m) nextNum = Number(m[1]) + 1;
      }
      return `CST${pad4(nextNum)}`;
    };
    if (!finalRequestId) {
      finalRequestId = await genNextReqId();
    } else {
      // If provided ID already exists, fallback to generating the next
      const exists = await TransportRequest.findOne({ requestId: finalRequestId }).select('_id');
      if (exists) finalRequestId = await genNextReqId();
    }
    const doc = await TransportRequest.create({
      requestId: finalRequestId,
      collectionId: collectionId || null,
      collectorName,
      bottleType,
      quantity: Number(quantity),
      location: location || '',
      notes: notes || '',
      status: 'Pending',
    });
    return res.status(201).json({ success: true, request: doc });
  } catch (err) {
    console.error('createTransportRequest error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List transport requests (optionally filter by status)
const listTransportRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const items = await TransportRequest.find(q).sort({ createdAt: -1 });
    return res.json({ success: true, requests: items });
  } catch (err) {
    console.error('listTransportRequests error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createTransportRequest, listTransportRequests };
// Assign a transport staff ID to a request and set status to Assigned
const assignTransportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { transportStaffId } = req.body;
    if (!transportStaffId) return res.status(400).json({ success: false, message: 'transportStaffId is required' });
    const doc = await TransportRequest.findByIdAndUpdate(id, { transportStaffId, status: 'Assigned' }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    return res.json({ success: true, request: doc });
  } catch (err) {
    console.error('assignTransportRequest error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update status for a transport request
const updateTransportRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['Pending', 'Assigned', 'PickedUp', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const doc = await TransportRequest.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    return res.json({ success: true, request: doc });
  } catch (err) {
    console.error('updateTransportRequestStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.assignTransportRequest = assignTransportRequest;
module.exports.updateTransportRequestStatus = updateTransportRequestStatus;
// Assign a driver and schedule pickup time for a transport request
const assignDriverAndSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, scheduledAt } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: 'driverId is required' });
    const update = { assignedDriverId: String(driverId), status: 'Assigned' };
    if (scheduledAt) {
      const dt = new Date(scheduledAt);
      if (!isNaN(dt)) update.scheduledAt = dt;
    }
    const doc = await TransportRequest.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    return res.json({ success: true, request: doc });
  } catch (err) {
    console.error('assignDriverAndSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.assignDriverAndSchedule = assignDriverAndSchedule;
