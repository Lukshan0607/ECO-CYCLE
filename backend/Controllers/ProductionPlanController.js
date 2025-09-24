const ProductionPlan = require('../Model/ProductionPlanModel');
const Product = require('../Model/ProductModel');

// Create plan
exports.createPlan = async (req, res) => {
  try {
    const { productId, productName, quantity, startDate, endDate, priority, status, notes } = req.body;

    if (!productName && !productId) {
      return res.status(400).json({ message: 'productName or productId is required' });
    }
    if (!quantity || !startDate || !endDate) {
      return res.status(400).json({ message: 'quantity, startDate, endDate are required' });
    }

    let resolvedName = productName;
    let resolvedProductId = null;

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      resolvedName = product.name;
      resolvedProductId = product._id;
    }

    const plan = await ProductionPlan.create({
      productName: resolvedName,
      productId: resolvedProductId,
      quantity,
      startDate,
      endDate,
      priority,
      status,
      notes,
    });

    return res.status(201).json({ message: 'Plan created', plan });
  } catch (err) {
    console.error('createPlan error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// List plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await ProductionPlan.find().sort({ createdAt: -1 }).populate('productId');
    return res.status(200).json({ message: 'Plans retrieved', plans, count: plans.length });
  } catch (err) {
    console.error('getPlans error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get one
exports.getPlanById = async (req, res) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id).populate('productId');
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    return res.status(200).json({ message: 'Plan retrieved', plan });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('getPlanById error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Update
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Load current plan to detect status transition and resolve product linkage
    const existing = await ProductionPlan.findById(id);
    if (!existing) return res.status(404).json({ message: 'Plan not found' });

    // If productId is provided/changed, validate and sync productName
    if (updates.productId) {
      const product = await Product.findById(updates.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      updates.productName = product.name;
    }

    // Perform update
    const plan = await ProductionPlan.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('productId');

    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // No automatic stock increment. Only update and return plan.
    return res.status(200).json({ message: 'Plan updated', plan });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('updatePlan error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Delete
exports.deletePlan = async (req, res) => {
  try {
    const del = await ProductionPlan.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Plan not found' });
    return res.status(200).json({ message: 'Plan deleted', plan: del });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('deletePlan error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
