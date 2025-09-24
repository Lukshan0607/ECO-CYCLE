const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/MachineController');

// /api/machines
router.get('/', ctrl.getMachines);
router.post('/', ctrl.createMachine);
router.get('/:id', ctrl.getMachineById);
router.put('/:id', ctrl.updateMachine);
router.delete('/:id', ctrl.deleteMachine);

module.exports = router;
