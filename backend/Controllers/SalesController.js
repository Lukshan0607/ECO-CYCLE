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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { customerId, customerName, products, shippingAddress, notes } = req.body || {};

    if (!customerId || !customerName) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing customer information' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No products provided for the order' });
    }

    // Validate products and check stock
    for (const product of products) {
      const productId = product.productId;
      const quantity = Math.max(1, parseInt(product.quantity) || 1);
      
      if (!mongoose.isValidObjectId(productId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Invalid product ID: ${productId}` });
      }

      // Check product exists and has sufficient stock
      const dbProduct = await Product.findById(productId).session(session);
      if (!dbProduct) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      if (dbProduct.stock < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${dbProduct.name}. Available: ${dbProduct.stock}, Requested: ${quantity}` 
        });
      }
    }

    // Calculate total amount and prepare order products
    let totalAmount = 0;
    const orderProducts = [];
    
    for (const product of products) {
      const productId = product.productId;
      const quantity = Math.max(1, parseInt(product.quantity) || 1);
      const unitPrice = parseFloat(product.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;

      orderProducts.push({
        productId: new mongoose.Types.ObjectId(productId),
        productName: product.productName,
        quantity,
        unitPrice,
        totalPrice,
      });

      // Reduce product stock
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { session }
      );
    }

    // Generate unique order ID with timestamp and random string
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD${timestamp}${random}`;

    const newOrder = new SalesOrder({
      orderId,
      customerId,
      customerName,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      notes,
      status: 'Processing' // Set initial status
    });

    const savedOrder = await newOrder.save({ session });

    // Update customer statistics
    if (mongoose.isValidObjectId(customerId)) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: { totalOrders: 1, totalSpent: totalAmount },
          lastOrderDate: new Date(),
        },
        { session, new: true }
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedOrder);
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error('Order creation failed:', error);
    res.status(400).json({ 
      message: 'Failed to create order',
      error: error.message 
    });
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

// Get payment proof for an order
const getPaymentProof = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order || !order.paymentProof) {
      return res.status(404).json({ message: 'Payment proof not found' });
    }
    res.json({
      filePath: order.paymentProof.path,
      mimeType: order.paymentProof.mimeType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders with payment info for management
const getOrdersForPaymentManagement = async (req, res) => {
  try {
    const orders = await SalesOrder.find({})
      .select('orderId customerName totalAmount paymentStatus paymentProof status orderDate')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order payment info (method and/or proof file)
const updateOrderPaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentStatus } = req.body || {};

    const update = {};
    if (paymentMethod) {
      update.paymentMethod = paymentMethod; // expected: 'credit_card' | 'bank_transfer' | 'mobile_payment' | 'cash_on_delivery' | 'other'
    }
    if (paymentStatus) {
      update.paymentStatus = paymentStatus; // optional
    }

    if (req.file) {
      update.paymentProof = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
      // mark date when proof uploaded
      update.paymentDate = new Date();
    }

    const order = await SalesOrder.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order payment info:', error);
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
  deleteOrder,
  getPaymentProof,
  updatePaymentStatus,
  getOrdersForPaymentManagement,
  updateOrderPaymentInfo
};
