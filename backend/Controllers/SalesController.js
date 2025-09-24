const mongoose = require('mongoose');
const { SalesOrder, Customer, Product, SalesAnalytics } = require('../Model/SalesModel');

// Get all sales orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customerId', 'name email phone company');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new sales order
const createOrder = async (req, res) => {
  try {
    const { customerId, customerName, products, shippingAddress, notes } = req.body || {};

    if (!customerId || !customerName) {
      return res.status(400).json({ message: 'Missing customer information' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided for the order' });
    }

    // Calculate total amount and sanitize products
    let totalAmount = 0;
    const orderProducts = products.map((product) => {
      const quantity = Math.max(1, parseInt(product.quantity) || 1);
      const unitPrice = parseFloat(product.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;

      // Cast productId to ObjectId only if it looks valid
      let castProductId;
      if (product.productId && typeof product.productId === 'string' && /^[a-fA-F0-9]{24}$/.test(product.productId)) {
        castProductId = new mongoose.Types.ObjectId(product.productId);
      }

      return {
        productId: castProductId,
        productName: product.productName,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    // Generate order ID in a collision-resistant way (no counter needed)
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;

    const newOrder = new SalesOrder({
      orderId,
      customerId,
      customerName,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      notes
    });

    const savedOrder = await newOrder.save();

    // Try to update customer statistics, but do not fail the order if this errors
    (async () => {
      try {
        if (mongoose.isValidObjectId(customerId)) {
          await Customer.findByIdAndUpdate(customerId, {
            $inc: { totalOrders: 1, totalSpent: totalAmount },
            lastOrderDate: new Date(),
          });
        }
      } catch (e) {
        console.warn('Customer stats update failed:', e?.message || e);
      }
    })();

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchCondition = {};
    if (startDate && endDate) {
      matchCondition.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await SalesOrder.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly sales data
    const monthlySales = await SalesOrder.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      summary: analytics[0] || {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        completedOrders: 0
      },
      monthlySales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ totalSpent: -1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ totalSold: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getSalesAnalytics,
  getAllCustomers,
  createCustomer,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteOrder
};
