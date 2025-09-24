const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['Running', 'Maintenance', 'Idle', 'Offline'], default: 'Idle' },
    efficiency: { type: Number, min: 0, max: 100, default: 0 },
    lastMaintenance: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Machine', MachineSchema);
