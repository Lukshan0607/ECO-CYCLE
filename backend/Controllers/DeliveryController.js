const mongoose = require('mongoose');
const DeliveryRecord = require('../Model/DeliveryRecordModel');
const InventoryTransaction = require('../Model/InventoryTransactionModel');
const Inventory = require('../Model/InventoryModel');
const Collector = require('../Model/CollectorModel');

// Create a new collection (initial record)
exports.createCollection = async (req, res) => {
  try {
    const { collectorId, bottleType, quantity, collectedAt } = req.body;
    if (!collectorId || !bottleType || !quantity) {
      return res.status(400).json({ error: 'collectorId, bottleType, and quantity are required' });
    }

    // Ensure collector exists
    const collector = await Collector.findById(collectorId);
    if (!collector) return res.status(404).json({ error: 'Collector not found' });

    const record = await DeliveryRecord.create({
      collectorId,
      bottleType,
      quantity,
      status: 'Collected',
      collectedAt: collectedAt ? new Date(collectedAt) : new Date(),
    });

    res.status(201).json(record);
  } catch (err) {
    console.error('createCollection error:', err);
    res.status(500).json({ error: 'Failed to create collection record' });
  }
};

// Assign to transport staff
exports.assignTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const { transportStaffId } = req.body;
    if (!transportStaffId) return res.status(400).json({ error: 'transportStaffId is required' });

    const record = await DeliveryRecord.findById(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (!['Collected', 'Assigned'].includes(record.status)) {
      return res.status(400).json({ error: 'Only Collected/Assigned can be assigned' });
    }

    record.transportStaffId = transportStaffId;
    record.status = 'Assigned';
    record.assignedAt = new Date();
    await record.save();

    res.json(record);
  } catch (err) {
    console.error('assignTransport error:', err);
    res.status(500).json({ error: 'Failed to assign transport' });
  }
};

// Mark pickup (in-transit)
exports.markPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await DeliveryRecord.findById(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (!['Assigned', 'InTransit'].includes(record.status)) {
      return res.status(400).json({ error: 'Only Assigned can move to InTransit' });
    }

    record.status = 'InTransit';
    record.pickedUpAt = new Date();
    await record.save();

    res.json(record);
  } catch (err) {
    console.error('markPickup error:', err);
    res.status(500).json({ error: 'Failed to mark pickup' });
  }
};

// Mark delivered (idempotent using InventoryTransaction uniqueness)
exports.markDelivered = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const record = await DeliveryRecord.findById(id).session(session);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (!['Assigned', 'InTransit'].includes(record.status)) {
      return res.status(400).json({ error: 'Invalid status to deliver' });
    }

    // Create inventory transaction (unique per deliveryRecordId)
    await InventoryTransaction.create([{
      deliveryRecordId: record._id,
      bottleType: record.bottleType,
      quantity: record.quantity,
      sourceCollectorId: record.collectorId,
      transportStaffId: record.transportStaffId,
      direction: 'IN'
    }], { session });

    // Increment inventory for bottleType
    await Inventory.updateOne(
      { name: record.bottleType }, // adapt: using name as bottleType; change if you keep a separate field
      { $inc: { stock: record.quantity }, $set: { lastUpdated: new Date().toISOString() } },
      { upsert: true, session }
    );

    record.status = 'Delivered';
    record.deliveredAt = new Date();
    record.inventoryApplied = true;
    await record.save({ session });

    await session.commitTransaction();
    res.json({ success: true, record });
  } catch (err) {
    await session.abortTransaction();
    if (err && err.code === 11000) {
      // Transaction already applied
      const { id } = req.params;
      const record = await DeliveryRecord.findById(id);
      return res.json({ success: true, record, message: 'Already delivered' });
    }
    console.error('markDelivered error:', err);
    res.status(500).json({ error: 'Failed to mark delivered' });
  } finally {
    session.endSession();
  }
};

// Get deliveries (with filters)
exports.getDeliveries = async (req, res) => {
  try {
    const { status, collectorId, transportStaffId, from, to } = req.query;
    const q = {};
    if (status) q.status = status;
    if (collectorId) q.collectorId = collectorId;
    if (transportStaffId) q.transportStaffId = transportStaffId;
    if (from || to) q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);

    const deliveries = await DeliveryRecord.find(q)
      .populate('collectorId', 'name')
      .populate('transportStaffId', 'employeeId personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (err) {
    console.error('getDeliveries error:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};
