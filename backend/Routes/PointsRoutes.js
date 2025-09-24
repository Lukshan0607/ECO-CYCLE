const express = require('express');
const router = express.Router();
const { awardPoints, getBalance, payProduct, verifyPayment } = require('../Controllers/PointsController');

router.post('/award', awardPoints);
router.get('/balance', getBalance);
router.post('/pay-product', payProduct);
router.post('/verify', verifyPayment);

module.exports = router;
