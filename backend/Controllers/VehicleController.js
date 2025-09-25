const { Vehicle } = require('../Model/TransportModel');

// GET /vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const q = {};
    if (status) q.status = status;
    if (type) q.type = type;
    if (search) {
      q.$or = [
        { vehicleId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'specifications.model': { $regex: search, $options: 'i' } },
        { 'specifications.licensePlate': { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(q)
      .populate('assignedDriver', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ vehicleId: 1 });
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /vehicles/:id
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'personalInfo.firstName personalInfo.lastName employeeId');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /vehicles
exports.createVehicle = async (req, res) => {
  try {
    const b = req.body || {};
    // basic required checks
    if (!b.vehicleId || !b.type || !b.capacity || b.capacity.bottles == null || b.capacity.weight == null) {
      return res.status(400).json({ success: false, message: 'vehicleId, type, capacity.bottles and capacity.weight are required' });
    }

    // require license plate to satisfy unique index on plateNumber
    if (!b.specifications || !b.specifications.licensePlate || !String(b.specifications.licensePlate).trim()) {
      return res.status(400).json({ success: false, message: 'licensePlate is required' });
    }

    // uniqueness
    const exists = await Vehicle.findOne({ vehicleId: b.vehicleId });
    if (exists) return res.status(400).json({ success: false, message: 'Vehicle ID already exists' });

    // Align plateNumber with nested specifications.licensePlate to satisfy unique index
    if (b.specifications && b.specifications.licensePlate) {
      b.plateNumber = b.specifications.licensePlate;
    } else if (b.plateNumber == null) {
      // Avoid saving explicit null when unique non-sparse index may exist
      delete b.plateNumber;
    }

    const vehicle = new Vehicle(b);
    const saved = await vehicle.save();
    res.status(201).json({ success: true, message: 'Vehicle created successfully', data: saved });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate vehicleId' });
    }
    res.status(500).json({ success: false, message: 'Failed to create vehicle' });
  }
};

// PUT /vehicles/:id
exports.updateVehicle = async (req, res) => {
  try {
    const updates = req.body || {};
    // Do not allow changing vehicleId here to keep unique index stable
    if (updates.vehicleId) delete updates.vehicleId;

    // Keep top-level plateNumber in sync if licensePlate provided
    if (updates.specifications && updates.specifications.licensePlate) {
      updates.plateNumber = updates.specifications.licensePlate;
    } else if (updates.plateNumber === null) {
      delete updates.plateNumber;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /vehicles/:id/location
exports.updateVehicleLocation = async (req, res) => {
  try {
    const { location, coordinates } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        'currentLocation.name': location,
        'currentLocation.coordinates': coordinates,
        'currentLocation.lastUpdated': new Date(),
      },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle location:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /vehicles/:id
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
