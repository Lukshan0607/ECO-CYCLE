const { UserPoints, PointsTransaction } = require('../Model/UserProfileModel');
const User = require('../Model/UserModel');
const Collection = require('../Model/CollectionModel');
const PointsPayment = require('../Model/PointsPaymentModel');
const { SalesOrder, Product } = require('../Model/SalesModel');
const LoyaltySettings = require('../Model/LoyaltySettingsModel');
const mongoose = require('mongoose');

const normalizePhone = (p) => (p || '').replace(/[^0-9]/g, '');

// POST /api/points/award
// Body: { phone, points, reason, collectionId?, collectionMongoId? }
const awardPoints = async (req, res) => {
  try {
    const { phone, points, reason, collectionId, collectionMongoId } = req.body;
    const pts = Number(points || 0);
    if (!phone || !pts || pts <= 0) {
      return res.status(400).json({ success: false, message: 'phone and positive points are required' });
    }

    const raw = normalizePhone(phone);
    const last10 = raw.slice(-10);

    const user = await User.findOne({ mobile: last10 });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found for given phone' });
    }

    // Upsert UserPoints
    let up = await UserPoints.findOne({ userId: user._id });
    if (!up) {
      up = await UserPoints.create({ userId: user._id, totalPoints: 0, availablePoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 });
    }

    up.totalPoints += pts;
    up.availablePoints += pts;
    up.lifetimeEarned += pts;
    await up.save();

    // Log transaction
    const tx = await PointsTransaction.create({
      userId: user._id,
      type: 'earned',
      points: pts,
      source: 'bonus',
      description: reason || 'Bottle collection',
    });

    // If a collection reference was provided, annotate the collection document
    if (collectionId || collectionMongoId) {
      const now = new Date();
      const update = {
        awardedPoints: pts,
        awardedToUserId: user._id,
        awardedAt: now,
      };
      try {
        if (collectionMongoId) {
          await Collection.findByIdAndUpdate(collectionMongoId, update);
        } else if (collectionId) {
          await Collection.findOneAndUpdate({ collectionId }, update);
        }
      } catch (linkErr) {
        console.error('Failed to link points to collection:', linkErr);
      }
    }

    return res.status(200).json({ success: true, message: 'Points awarded', userId: user._id, balance: up.availablePoints, transaction: tx });
  } catch (err) {
    console.error('awardPoints error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { awardPoints };

// GET /api/points/balance?userId=<ObjectId>
async function getBalance(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

    let up = await UserPoints.findOne({ userId });
    if (!up) {
      up = await UserPoints.create({ userId, totalPoints: 0, availablePoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 });
    }
    return res.status(200).json({ success: true, balance: up.availablePoints });
  } catch (err) {
    console.error('getBalance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/points/pay-product { userId, productId, quantity? }
// Immediately deducts points and creates a paid/completed order (no verification step)
async function payProduct(req, res) {
  try {
    const { userId, productId, quantity } = req.body || {};
    const qty = Number(quantity || 1);
    if (!userId || !productId) return res.status(400).json({ success: false, message: 'userId and productId are required' });
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'quantity must be > 0' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (Number(product.stock) < qty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for this product' });
    }

    const subtotal = Number(product.price) * qty;
    const rate = Number(process.env.POINTS_PER_RUPEE || 0.10); // default: 0.10 points per 1 LKR
    const requiredPoints = Math.round(subtotal * rate);
    if (requiredPoints <= 0) return res.status(400).json({ success: false, message: 'Calculated required points is invalid' });

    let up = await UserPoints.findOne({ userId });
    if (!up) {
      up = await UserPoints.create({ userId, totalPoints: 0, availablePoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 });
    }
    if (up.availablePoints < requiredPoints) {
      return res.status(400).json({ success: false, message: `Insufficient points. Need ${requiredPoints}, have ${up.availablePoints}` });
    }

    // Atomically decrement stock to prevent overselling
    const stockUpdate = await Product.updateOne({ _id: productId, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (!stockUpdate?.modifiedCount) {
      return res.status(400).json({ success: false, message: 'Insufficient stock (race condition), please try again' });
    }

    const orderCount = await SalesOrder.countDocuments();
    const orderIdStr = `ORD${String(orderCount + 1).padStart(6, '0')}`;
    const order = await SalesOrder.create({
      orderId: orderIdStr,
      customerId: String(userId),
      customerName: 'Customer',
      products: [{
        productId: product._id,
        productName: product.name || product.productName || 'Item',
        quantity: qty,
        unitPrice: Number(product.price),
        totalPrice: 0,
      }],
      totalAmount: subtotal,
      status: 'Completed',
      paymentStatus: 'Paid',
      notes: `Paid with points: ${requiredPoints} pts @ rate ${rate}`,
    });

    // Deduct points immediately and log transaction
    up.availablePoints -= requiredPoints;
    up.lifetimeRedeemed += requiredPoints;
    await up.save();
    await PointsTransaction.create({
      userId,
      type: 'redeemed',
      points: requiredPoints,
      source: 'reward_redemption',
      description: `Redeemed for order ${order.orderId} (subtotal LKR ${subtotal.toFixed(2)} @ rate ${rate})`,
    });

    // Optional: create an approved PointsPayment record for audit trail
    try {
      await PointsPayment.create({
        userId,
        orderId: order._id,
        requiredPoints,
        subtotalSnapshot: subtotal,
        rateSnapshot: rate,
        status: 'approved',
      });
    } catch (e) {
      // non-fatal
    }

    return res.status(200).json({ success: true, message: 'Purchased with points successfully', orderId: order.orderId, requiredPoints, balance: up.availablePoints });
  } catch (err) {
    console.error('payProduct error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/points/verify { paymentId, approved }
async function verifyPayment(req, res) {
  try {
    const { paymentId, approved } = req.body || {};
    if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId is required' });

    const payment = await PointsPayment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(400).json({ success: false, message: `Payment is already ${payment.status}` });

    const order = await SalesOrder.findById(payment.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!approved) {
      payment.status = 'rejected';
      await payment.save();
      order.status = 'Cancelled';
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(200).json({ success: true, message: 'Payment rejected, order cancelled' });
    }

    // Approve path: deduct points and mark order paid
    let up = await UserPoints.findOne({ userId: payment.userId });
    if (!up) return res.status(400).json({ success: false, message: 'User points record not found' });
    if (up.availablePoints < payment.requiredPoints) {
      return res.status(400).json({ success: false, message: `Insufficient points at approval. Need ${payment.requiredPoints}, have ${up.availablePoints}` });
    }

    up.availablePoints -= payment.requiredPoints;
    up.lifetimeRedeemed += payment.requiredPoints;
    await up.save();
    await PointsTransaction.create({
      userId: payment.userId,
      type: 'redeemed',
      points: payment.requiredPoints,
      source: 'reward_redemption',
      description: `Redeemed for order ${order.orderId} (subtotal LKR ${payment.subtotalSnapshot.toFixed(2)} @ rate ${payment.rateSnapshot})`,
    });

    payment.status = 'approved';
    await payment.save();

    order.paymentStatus = 'Paid';
    order.status = 'Completed';
    await order.save();

    return res.status(200).json({ success: true, message: 'Payment approved and points deducted', orderId: order.orderId, balance: up.availablePoints });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports.getBalance = getBalance;
module.exports.payProduct = payProduct;
module.exports.verifyPayment = verifyPayment;

// GET /api/points/settings
async function getSettings(req, res) {
  try {
    let s = await LoyaltySettings.findOne();
    if (!s) {
      s = await LoyaltySettings.create({ pointsPerRupee: 0.1 });
    }
    return res.status(200).json({ success: true, settings: { pointsPerRupee: s.pointsPerRupee, updatedAt: s.updatedAt } });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/points/settings { pointsPerRupee }
async function saveSettings(req, res) {
  try {
    const raw = req.body?.pointsPerRupee;
    const rate = Number(raw);
    if (!Number.isFinite(rate) || rate < 0) {
      return res.status(400).json({ success: false, message: 'pointsPerRupee must be a non-negative number' });
    }

    let s = await LoyaltySettings.findOne();
    if (!s) {
      s = await LoyaltySettings.create({ pointsPerRupee: rate });
    } else {
      s.pointsPerRupee = rate;
      await s.save();
    }

    // Recalculate and persist product points based on current price and new rate
    const products = await Product.find({}, { _id: 1, price: 1 });
    let updated = 0;
    for (const p of products) {
      const pts = Math.max(0, Math.round(Number(p.price || 0) * rate));
      const resu = await Product.updateOne({ _id: p._id }, { $set: { points: pts } });
      if (resu?.modifiedCount) updated += 1;
    }

    return res.status(200).json({ success: true, settings: { pointsPerRupee: s.pointsPerRupee, updatedAt: s.updatedAt }, updatedProducts: updated });
  } catch (err) {
    console.error('saveSettings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports.getSettings = getSettings;
module.exports.saveSettings = saveSettings;
