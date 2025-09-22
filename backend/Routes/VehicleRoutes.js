const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleLocation,
  deleteVehicle,
} = require('../Controllers/VehicleController');

// Base path mounted at /api/transport
router.get('/vehicles', getAllVehicles);
router.get('/vehicles/:id', getVehicleById);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.put('/vehicles/:id/location', updateVehicleLocation);
router.delete('/vehicles/:id', deleteVehicle);

module.exports = router;
