const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/BinRouteController');

// GET /api/transport/bin-routes?status=&city=&manager=&search=
router.get('/bin-routes', ctrl.list);

// POST /api/transport/bin-routes
router.post('/bin-routes', ctrl.create);

// PUT /api/transport/bin-routes/:id
router.put('/bin-routes/:id', ctrl.update);

// DELETE /api/transport/bin-routes/:id
router.delete('/bin-routes/:id', ctrl.remove);

module.exports = router;
