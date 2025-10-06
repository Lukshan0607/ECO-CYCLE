const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getSalesAnalytics,
  getAllCustomers,
  createCustomer,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteOrder,
  updateOrderPaymentInfo
} = require('../Controllers/SalesController');

// Multer storage for payment proofs (images or PDFs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Sales Orders Routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.post('/orders', createOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/payment-status', updatePaymentStatus);
// Update payment method and/or upload payment proof for an order
router.put('/orders/:id/payment', upload.single('paymentProof'), updateOrderPaymentInfo);
router.delete('/orders/:id', deleteOrder);

// Analytics Routes
router.get('/analytics', getSalesAnalytics);

// Customer Routes
router.get('/customers', getAllCustomers);
router.post('/customers', createCustomer);

// Product Routes
router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);

module.exports = router;
