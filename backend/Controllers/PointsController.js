const { UserPoints, PointsTransaction } = require('../Model/UserProfileModel');
const User = require('../Model/UserModel');
const Collection = require('../Model/CollectionModel');

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
