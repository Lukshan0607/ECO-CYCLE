const express = require('express');
const router = express.Router();
const {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollectionStatus,
  getAllDrivers,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getAllRoutes,
  createRoute,
  updateRoute,
  getTransportAnalytics,
  getDashboardSummary,
  deleteCollection
} = require('../Controllers/TransportController');

// Collection Routes
router.get('/collections', getAllCollections);
router.get('/collections/:id', getCollectionById);
router.post('/collections', createCollection);
router.put('/collections/:id/status', updateCollectionStatus);
router.delete('/collections/:id', deleteCollection);

// Driver Routes
router.get('/drivers', getAllDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.put('/drivers/:id/status', updateDriverStatus);

// Route Management Routes
router.get('/routes', getAllRoutes);
router.post('/routes', createRoute);
router.put('/routes/:id', updateRoute);

// Analytics Routes
router.get('/analytics', getTransportAnalytics);
router.get('/dashboard', getDashboardSummary);

module.exports = router;
