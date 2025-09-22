const Collection = require('../Model/CollectionModel');

// Create a new collection entry
const createCollection = async (req, res) => {
  try {
    const { collectorName, bottleType, quantity, location } = req.body;

    if (!collectorName || !bottleType || !quantity) {
      return res.status(400).json({ success: false, message: 'collectorName, bottleType and quantity are required' });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive number' });
    }

    // Generate next sequential ID: COL0001, COL0002, ... (zero-padded to 4)
    const pad4 = (n) => String(n).padStart(4, '0');
    // Find the latest collectionId with COL prefix (zero-padded lexicographic sort works)
    const last = await Collection.findOne({ collectionId: /^COL\d{4}$/ }).sort({ collectionId: -1 }).select('collectionId');
    let nextNum = 1;
    if (last && last.collectionId) {
      const m = last.collectionId.match(/COL(\d{4})/);
      if (m) nextNum = Number(m[1]) + 1;
    }
    const nextId = `COL${pad4(nextNum)}`;

    const collection = await Collection.create({
      collectionId: nextId,
      collectorName,
      bottleType,
      quantity: qty,
      location: location || '',
    });

    return res.status(201).json({ success: true, collection });
  } catch (err) {
    console.error('createCollection error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List collections with optional filters and awarded user populate
const listCollections = async (req, res) => {
  try {
    const { collectorName, bottleType, limit = 50, dateFrom, dateTo } = req.query;
    const q = {};
    if (collectorName) q.collectorName = collectorName;
    if (bottleType) q.bottleType = bottleType;
    if (dateFrom || dateTo) {
      q.createdAt = {};
      if (dateFrom) {
        // If only yyyy-mm-dd provided, treat as start of day local
        const from = new Date(dateFrom);
        if (!isNaN(from)) q.createdAt.$gte = from;
      }
      if (dateTo) {
        // Include entire end day by setting time to 23:59:59.999 if only a date provided
        let to = new Date(dateTo);
        if (!isNaN(to)) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateTo))) {
            to.setHours(23,59,59,999);
          }
          q.createdAt.$lte = to;
        }
      }
      if (Object.keys(q.createdAt).length === 0) delete q.createdAt;
    }

    const items = await Collection.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(Number(limit) || 50, 200)))
      .populate('awardedToUserId', 'name mobile');

    return res.json({ success: true, collections: items });
  } catch (err) {
    console.error('listCollections error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createCollection, listCollections };

// Update a collection by id (no status field)
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['collectorName','bottleType','quantity','location','awardedPoints'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    if ('quantity' in update) {
      const q = Number(update.quantity);
      if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ success:false, message:'quantity must be a positive number' });
      update.quantity = q;
    }
    // If front-end requests to refresh the collected timestamp, update createdAt
    if (req.body && (req.body.refreshTimestamp === true || req.body.refreshTimestamp === 'true')) {
      update.createdAt = new Date();
    }
    update.updatedAt = new Date();
    const doc = await Collection.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success:false, message:'Collection not found' });
    return res.json({ success:true, collection: doc });
  } catch (err) {
    console.error('updateCollection error:', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
};

// Delete a collection by id
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Collection.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success:false, message:'Collection not found' });
    return res.json({ success:true });
  } catch (err) {
    console.error('deleteCollection error:', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
};

module.exports.updateCollection = updateCollection;
module.exports.deleteCollection = deleteCollection;
