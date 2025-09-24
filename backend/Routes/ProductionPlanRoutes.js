const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/ProductionPlanController');

// /api/production-plans
router.get('/', ctrl.getPlans);
router.post('/', ctrl.createPlan);
router.get('/:id', ctrl.getPlanById);
router.put('/:id', ctrl.updatePlan);
router.delete('/:id', ctrl.deletePlan);

module.exports = router;
