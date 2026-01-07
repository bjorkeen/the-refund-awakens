const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  ticketId: {
    type: String,
    unique: true,
  },

  // filippa service logic
  serviceType: {
    type: String,
    enum: ['Repair', 'Return'],
    default: 'Repair'
  },

  // filippa delivery method 
  deliveryMethod: {
    type: String,
    enum: ['courier', 'dropoff'],
    default: 'courier'
  },
  
  // refactored contact info in one place
  contactInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },      
    address: { type: String },    
    city: { type: String },       
    postalCode: { type: String }  
  },

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

  issue: {
    category: { type: String, required: true },
    description: { type: String, required: true },
    // christos attachments array definition (Main storage)
    attachments: [{ type: String }], 
  },

  status: {
    type: String,
    enum: [
      'Submitted', 'Shipping', 'Pending Validation', 'In Progress',
      'Waiting for Parts', 'Shipped Back', 'Ready for Pickup', 'Completed', 'Closed', 'Cancelled'
    ],
    default: 'Submitted'
  },

  // filippa extended warranty status enums
  warrantyStatus: {
    type: String,
    enum: ['Under Warranty', 'Out of Warranty', 'Manual Review', 'Eligible for Return', 'Return Period Expired'],
    default: 'Manual Review'
  },

  //return and refund options logic 
  resolutionOptions: [{ 
    type: String, 
    enum: ['Refund', 'Replacement', 'Repair'],
    default: []
  }],

  // store the specific choice made by the customer
  customerSelection: {
    type: String,
    enum: ['Refund', 'Replacement', 'None'],
    default: 'None'
  },

  
  assignedRepairCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  history: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    notes: String
  }],

  // added star rating feedback
  feedback: {
    rating: { type: Number, min : 1, max : 5 },
    comment: { type: String, trim: true },
    createdAt: { type: Date }
  },

  internalComments: [
    {
      text: { type: String, required: true, trim: true },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);