const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Link ticket to the customer
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Ticket Identification
  ticketId: {
    type: String,
    unique: true,
  },

  // Product Details 
  product: {
    serialNumber: { type: String, required: true },
    model: { type: String, required: true }, 
    purchaseDate: { type: Date, required: true },
    type: { 
      type: String,
      enum: ['Smartphone', 'Laptop', 'TV', 'Other'],
      required: true
    }
  },

  // Issue Details
  issue: {
    category: { type: String, required: true },
    description: { type: String, required: true },
    photos: [{ type: String }],
    invoice: { type: String }
  },

  // Status Tracking 
  status: {
    type: String,
    enum: [
      'Submitted', 
      'Pending Validation',
      'In Progress',
      'Waiting for Parts',
      'Completed',
      'Closed'
    ],
    default: 'Submitted'
  },

  // Automation Results
  warrantyStatus: {
    type: String,
    enum: ['Under Warranty', 'Out of Warranty', 'Manual Review'],
    default: 'Manual Review'
  },
  
  assignedRepairCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Audit Log / History
  history: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    notes: String
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp automatically
ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);