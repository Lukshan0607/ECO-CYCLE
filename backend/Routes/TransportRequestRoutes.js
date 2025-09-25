const express = require('express');
const router = express.Router();
const { createTransportRequest, listTransportRequests, assignTransportRequest, updateTransportRequestStatus, assignDriverAndSchedule } = require('../Controllers/TransportRequestController');

router.post('/', createTransportRequest);
router.get('/', listTransportRequests);
router.post('/:id/assign', assignTransportRequest);
router.post('/:id/status', updateTransportRequestStatus);
router.post('/:id/assign-driver', assignDriverAndSchedule);

module.exports = router;
