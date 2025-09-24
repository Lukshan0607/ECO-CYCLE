const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/StockProductionRequestController');

// POST /api/stock-requests -> create a new stock production request (RI-####)
router.post('/', ctrl.create);

// GET /api/stock-requests -> list all requests (newest first)
router.get('/', ctrl.list);

// GET /api/stock-requests/summary -> delivered total, requested total, available
router.get('/summary', ctrl.summary);

// PUT /api/stock-requests/:id -> update weightKg
router.put('/:id', ctrl.update);

// DELETE /api/stock-requests/:id -> remove request
router.delete('/:id', ctrl.remove);

module.exports = router;
