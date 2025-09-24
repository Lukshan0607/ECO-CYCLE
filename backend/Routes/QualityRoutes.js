const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/QualityController');

// /api/quality
router.get('/', ctrl.getRecords);
router.post('/', ctrl.createRecord);
router.get('/:id', ctrl.getRecordById);
router.put('/:id', ctrl.updateRecord);
router.delete('/:id', ctrl.deleteRecord);

module.exports = router;
