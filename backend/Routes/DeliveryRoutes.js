const express = require('express');
const router = express.Router();
const DeliveryController = require('../Controllers/DeliveryController');

// Create a new collection record (collector logs bottles)
router.post('/collections', DeliveryController.createCollection);

// Assign a collection to a transport staff/driver
router.post('/deliveries/:id/assign', DeliveryController.assignTransport);

// Mark pickup (optional step to indicate in-transit)
router.post('/deliveries/:id/pickup', DeliveryController.markPickup);

// Mark delivered (applies inventory atomically, idempotent)
router.post('/deliveries/:id/deliver', DeliveryController.markDelivered);

// Query delivery records
router.get('/deliveries', DeliveryController.getDeliveries);

module.exports = router;
