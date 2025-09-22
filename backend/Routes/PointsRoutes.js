const express = require('express');
const router = express.Router();
const { awardPoints } = require('../Controllers/PointsController');

router.post('/award', awardPoints);

module.exports = router;
