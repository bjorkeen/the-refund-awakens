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

  //filippa service type logic
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
  
  // Shipping Details
  address: { type: String },
  city: { type: String },
  postalCode: { type: String }, // H φόρμα στέλνει postalCode
  
  // Contact & Photos
  phone: { type: String },
  contactName: { type: String }, 
  contactEmail: { type: String },

  photos: [{ type: String }], 
  invoiceFileName: { type: String }, 

  //filippa contact details
  contactInfo: {
    fullName: { type: String },
    email: { type: String }
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
    
    //christos attachments array definition
    attachments: [{ type: String }], 
    
    invoice: { type: String }
  },

  status: {
    type: String,
    enum: [
      'Submitted', 'Pending Validation', 'In Progress',
      'Waiting for Parts', 'Completed', 'Closed', 'Cancelled'
    ],
    default: 'Submitted'
  },

  //filippa extended warranty status enums
  warrantyStatus: {
    type: String,
    enum: ['Under Warranty', 'Out of Warranty', 'Manual Review', 'Eligible for Return', 'Return Period Expired'],
    default: 'Manual Review'
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

  internalComments: [
    {
      text: { type: String, required: true, trim: true },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);