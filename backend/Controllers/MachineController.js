const Machine = require('../Model/MachineModel');

// Create machine
exports.createMachine = async (req, res) => {
  try {
    const { name, code, status, efficiency, lastMaintenance, notes } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code are required' });

    const machine = await Machine.create({ name, code, status, efficiency, lastMaintenance, notes });
    return res.status(201).json({ message: 'Machine created', machine });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Machine code must be unique' });
    console.error('createMachine error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// List machines
exports.getMachines = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ createdAt: -1 });
    return res.status(200).json({ message: 'Machines retrieved', machines, count: machines.length });
  } catch (err) {
    console.error('getMachines error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get one
exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });
    return res.status(200).json({ message: 'Machine retrieved', machine });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('getMachineById error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Update
exports.updateMachine = async (req, res) => {
  try {
    const updates = { ...req.body };
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!machine) return res.status(404).json({ message: 'Machine not found' });
    return res.status(200).json({ message: 'Machine updated', machine });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('updateMachine error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Delete
exports.deleteMachine = async (req, res) => {
  try {
    const del = await Machine.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Machine not found' });
    return res.status(200).json({ message: 'Machine deleted', machine: del });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    console.error('deleteMachine error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
