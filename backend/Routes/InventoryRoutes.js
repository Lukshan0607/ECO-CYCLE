const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Inventory = require("../Model/InventoryModel");

// Utility to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ================= Multer Storage Config =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // save in backend/uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ================= Auto-generate Item Code =================
const generateItemCode = async () => {
  const lastItem = await Inventory.findOne().sort({ createdAt: -1 });
  const lastCode = lastItem ? parseInt(lastItem.itemCode.split("-")[1]) : 0;
  const nextCode = (lastCode + 1).toString().padStart(5, "0");
  return `RMI-${nextCode}`;
};

// ================= Routes =================

// 📥 Get all inventory items
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Add new inventory item
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    const { name, color, type, weight, stock, lastUpdated } = req.body;

    // Validate required fields (image is optional now)
    if (!name || !color || !type || !stock) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["name", "color", "type", "stock"],
        received: { name, color, type, stock }
      });
    }

    // Backend validation: enforce stock range
    const stockNum = parseFloat(stock);
    if (isNaN(stockNum) || stockNum < 0.01 || stockNum > 100000) {
      return res.status(400).json({ message: "Stock must be between 0.01 and 100000 Kg" });
    }

    // Try to find an existing item (case-insensitive) by name, color, and type
    const nameNorm = name.trim();
    const colorNorm = color.trim();
    const typeNorm = type.trim();

    const existingItem = await Inventory.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(nameNorm)}$`, "i") },
      color: { $regex: new RegExp(`^${escapeRegex(colorNorm)}$`, "i") },
      type: { $regex: new RegExp(`^${escapeRegex(typeNorm)}$`, "i") },
    });

    if (existingItem) {
      // Build update for existing item
      const updateSet = {
        lastUpdated: lastUpdated || new Date().toISOString(),
      };
      if (weight) {
        updateSet.weight = parseFloat(weight);
      }
      if (req.file) {
        updateSet.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedItem = await Inventory.findOneAndUpdate(
        { _id: existingItem._id },
        { $inc: { stock: parseFloat(stock) }, $set: updateSet },
        { new: true }
      );

      return res.status(200).json({
        ...updatedItem.toObject(),
        message: "Stock updated for existing item",
        stockAdded: parseFloat(stock),
      });
    }

    // No existing item, create a new one
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const itemCode = await generateItemCode();

    const newItem = new Inventory({
      itemCode,
      name: nameNorm,
      color: colorNorm,
      type: typeNorm,
      stock: parseFloat(stock),
      lastUpdated: lastUpdated || new Date().toISOString(),
      imageUrl,
    });

    if (weight) {
      newItem.weight = parseFloat(weight);
    }

    console.log("Attempting to save item:", newItem);
    const savedItem = await newItem.save();
    console.log("Item saved successfully:", savedItem);
    
    res.status(201).json({
      ...savedItem.toObject(),
      message: "New item added to inventory",
    });
  } catch (err) {
    console.error("Error adding inventory:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.errors || null
    });
  }
});

// ✏️ Update inventory item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, type, weight, stock, lastUpdated } = req.body;

    let updatedData = { name, color, type, weight, lastUpdated };
    if (typeof stock !== 'undefined') {
      const stockNum = parseFloat(stock);
      if (isNaN(stockNum) || stockNum < 0.01 || stockNum > 100000) {
        return res.status(400).json({ message: "Stock must be between 0.01 and 100000 Kg" });
      }
      updatedData.stock = stockNum;
    }
    if (req.file) {
      updatedData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, updatedData, { new: true });
    res.json(updatedItem);
  } catch (err) {
    console.error("Error updating inventory:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑 Delete inventory item
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Inventory.findByIdAndDelete(id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting inventory:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
