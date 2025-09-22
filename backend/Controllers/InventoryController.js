const Inventory = require("../Model/InventoryModel");

// Generate unique item code RML-001, RML-002
const generateItemCode = async () => {
  const lastItem = await Inventory.findOne().sort({ _id: -1 });
  if (!lastItem) return "RML-001";
  const lastNumber = parseInt(lastItem.itemCode.split("-")[1]);
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
  return `RML-${nextNumber}`;
};

// Add inventory item
exports.addInventory = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    const { name, color, type, stock, lastUpdated, weight } = req.body;
    
    // Validate required fields
    if (!name || !color || !type || !stock) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        required: ["name", "color", "type", "stock"],
        received: { name, color, type, stock }
      });
    }

    // Check if an item with the same name, color, and type already exists
    const existingItem = await Inventory.findOne({
      name: name.trim(),
      color: color.trim(),
      type: type.trim()
    });

    if (existingItem) {
      // Update the existing item's stock by adding the new stock quantity
      existingItem.stock += parseFloat(stock);
      if (weight) existingItem.weight = parseFloat(weight);
      existingItem.lastUpdated = lastUpdated || new Date().toISOString();
      
      // Update image if a new one is provided
      if (req.file) {
        existingItem.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedItem = await existingItem.save();
      console.log("Existing item stock updated:", updatedItem);
      
      return res.status(200).json({
        ...updatedItem.toObject(),
        message: "Stock updated for existing item",
        stockAdded: parseFloat(stock)
      });
    }

    // If no existing item found, create a new one
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const itemCode = await generateItemCode();

    const newItem = new Inventory({
      itemCode,
      name: name.trim(),
      color: color.trim(),
      type: type.trim(),
      stock: parseInt(stock),
      lastUpdated: lastUpdated || new Date().toISOString(),
      imageUrl,
    });

    if (weight) newItem.weight = parseFloat(weight);

    console.log("Attempting to save new item:", newItem);
    const savedItem = await newItem.save();
    console.log("New item saved successfully:", savedItem);
    
    res.status(201).json({
      ...savedItem.toObject(),
      message: "New item added to inventory"
    });
  } catch (err) {
    console.error("Error saving inventory item:", err);
    res.status(500).json({ 
      message: err.message,
      error: err.name,
      details: err.errors || null
    });
  }
};

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ _id: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const { name, color, type, weight, stock, lastUpdated } = req.body;

    item.name = name || item.name;
    item.color = color || item.color;
    item.type = type || item.type;
    if (weight) item.weight = parseFloat(weight);
    if (stock) item.stock = parseFloat(stock);
    if (lastUpdated) item.lastUpdated = new Date(lastUpdated).toISOString();
    if (req.file) item.imageUrl = `/uploads/${req.file.filename}`;

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
