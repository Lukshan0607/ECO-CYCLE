const QualityRecord = require('../Model/QualityRecordModel');
const Product = require('../Model/ProductModel');

// Create quality record
exports.createRecord = async (req, res) => {
  try {
    const { batchNo, productId, productName, status, defects, defectCount, inspectionDate, inspector, notes, checks } = req.body;

    if (!batchNo || !inspector || (!productId && !productName)) {
      return res.status(400).json({ message: 'batchNo, inspector and product (id or name) are required' });
    }

    let resolvedName = productName;
    let resolvedProductId = null;
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      resolvedName = product.name;
      resolvedProductId = product._id;
    }

    // Auto-evaluate status if not provided: if any check fails -> 'Rework', if defectCount > 0 and no checks -> 'Rework'
    let computedStatus = status;
    if (!computedStatus) {
      const c = checks || {};
      const anyFail = ['visual','dimensions','functional','packaging','safety'].some(k => c[k] === false);
      if (anyFail) computedStatus = 'Rework';
      else if ((defectCount ?? 0) > 0) computedStatus = 'Rework';
      else computedStatus = 'Passed';
    }

    const record = await QualityRecord.create({
      batchNo: String(batchNo).trim(),
      productId: resolvedProductId,
      productName: resolvedName,
      status: computedStatus,
      defects: Array.isArray(defects) ? defects : (defects ? String(defects).split(',').map(s => s.trim()).filter(Boolean) : []),
      defectCount: defectCount ?? 0,
      inspectionDate: inspectionDate || new Date(),
      inspector: String(inspector).trim(),
      notes: notes || '',
      checks: {
        visual: checks?.visual ?? true,
        dimensions: checks?.dimensions ?? true,
        functional: checks?.functional ?? true,
        packaging: checks?.packaging ?? true,
        safety: checks?.safety ?? true,
      },
      inspectedQuantity: Number(req.body.inspectedQuantity || 0),
      planId: req.body.planId || undefined,
    });

    // Auto stock increment when Passed and quantity present; idempotent via stockApplied flag
    try {
      if (record.status === 'Passed' && Number(record.inspectedQuantity) > 0 && !record.stockApplied) {
        let pid = record.productId;
        if (!pid) {
          const prod = await Product.findOne({ name: record.productName });
          if (prod) pid = prod._id;
        }
        if (pid) {
          await Product.findByIdAndUpdate(pid, { $inc: { stock: Number(record.inspectedQuantity) } });
          record.stockApplied = true;
          await record.save();
        }
      }
    } catch (incErr) {
      console.error('Quality create: stock increment failed', incErr);
      // continue without failing the request
    }

    return res.status(201).json({ message: 'Quality record created', record });
  } catch (err) {
    console.error('createRecord error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// List quality records
exports.getRecords = async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const records = await QualityRecord.find(q).sort({ createdAt: -1 }).populate('productId');
    return res.status(200).json({ message: 'Quality records retrieved', records, count: records.length });
  } catch (err) {
    console.error('getRecords error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get by id
exports.getRecordById = async (req, res) => {
  try {
    const rec = await QualityRecord.findById(req.params.id).populate('productId');
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    return res.status(200).json({ message: 'Quality record retrieved', record: rec });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('getRecordById error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Update
exports.updateRecord = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.productId) {
      const prod = await Product.findById(updates.productId);
      if (!prod) return res.status(404).json({ message: 'Product not found' });
      updates.productName = prod.name;
    }

    const before = await QualityRecord.findById(req.params.id);
    if (!before) return res.status(404).json({ message: 'Record not found' });

    const rec = await QualityRecord.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('productId');

    if (!rec) return res.status(404).json({ message: 'Record not found' });

    // If now Passed and quantity provided, and not already applied, increment stock
    try {
      const becamePassed = (before.status !== 'Passed' && rec.status === 'Passed') || rec.status === 'Passed';
      const qty = Number(rec.inspectedQuantity || req.body.inspectedQuantity || 0);
      if (becamePassed && qty > 0 && !rec.stockApplied) {
        let pid = rec.productId?._id || rec.productId || updates.productId;
        if (!pid) {
          const prod = await Product.findOne({ name: rec.productName });
          if (prod) pid = prod._id;
        }
        if (pid) {
          await Product.findByIdAndUpdate(pid, { $inc: { stock: qty } });
          rec.stockApplied = true;
          await rec.save();
        }
      }
    } catch (incErr) {
      console.error('Quality update: stock increment failed', incErr);
      // continue without failing the request
    }

    return res.status(200).json({ message: 'Quality record updated', record: rec });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('updateRecord error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Delete
exports.deleteRecord = async (req, res) => {
  try {
    const del = await QualityRecord.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Record not found' });
    return res.status(200).json({ message: 'Quality record deleted', record: del });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('deleteRecord error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
