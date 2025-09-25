const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true,
    unique: true  // This will automatically create an index
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    unique: true  // This will automatically create an index
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Operations', 'Transport', 'Inventory', 'Production', 'Finance'],
    default: 'Operations'
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Bank account number is required'],
    trim: true,
    unique: true  // This will automatically create an index
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Clean up old indexes and ensure only the required ones exist
const cleanupIndexes = async () => {
  try {
    const collection = mongoose.connection.collection('employees');
    const indexes = await collection.indexes();
    
    // Drop any index that's not email or employeeId
    for (const index of indexes) {
      const indexName = index.name;
      // Skip default _id_ index and our desired indexes
      if (indexName !== '_id_' && indexName !== 'email_1' && indexName !== 'employeeId_1') {
        try {
          await collection.dropIndex(indexName);
          console.log(`Dropped index: ${indexName}`);
        } catch (err) {
          // Ignore errors for indexes that don't exist
          if (err.codeName !== 'NamespaceNotFound' && err.codeName !== 'IndexNotFound') {
            console.error(`Error dropping index ${indexName}:`, err.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error managing indexes:', error.message);
  }
};

// Run cleanup when the model is loaded
if (mongoose.connection.readyState === 1) {
  cleanupIndexes();
} else {
  mongoose.connection.once('connected', cleanupIndexes);
}

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
