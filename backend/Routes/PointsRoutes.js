const express = require('express');
const router = express.Router();
const { awardPoints, getBalance, payProduct, verifyPayment, getSettings, saveSettings } = require('../Controllers/PointsController');

router.post('/award', awardPoints);
router.get('/balance', getBalance);
router.post('/pay-product', payProduct);
router.post('/verify', verifyPayment);
router.get('/settings', getSettings);
router.post('/settings', saveSettings);

module.exports = router;
