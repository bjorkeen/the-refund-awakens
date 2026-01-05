const Ticket = require("../models/Ticket");
const User = require("../models/User");

//filippa warranty check logic (15 days vs 24 months)
const checkWarranty = (purchaseDate, serviceType) => {
  const today = new Date();
  const pDate = new Date(purchaseDate);

  const diffTime = Math.abs(today - pDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (serviceType === 'Return') {
    return diffDays <= 15 ? 'Eligible for Return' : 'Return Period Expired';
  } else {
    const diffMonths = (today.getFullYear() - pDate.getFullYear()) * 12 + (today.getMonth() - pDate.getMonth());
    return diffMonths <= 24 ? 'Under Warranty' : 'Out of Warranty';
  }
};

const assignRepairCenter = (productType) => {
  switch (productType) {
    case "Smartphone": return "Repair Center A";
    case "Laptop": return "Repair Center B";
    case "TV": return "Repair Center C";
    default: return "Deferred Assignment Queue";
  }
};

exports.createTicket = async (req, res) => {
  try {
    const {
      //filippa new fields destructuring
      serviceType,
      contactName,
      contactEmail,
      
      serialNumber,
      model,
      purchaseDate,
      type,
      category,
      description,
    } = req.body;

    //filippa warranty check execution
    const warrantyStatus = checkWarranty(purchaseDate, serviceType);

    let assignedTech = await User.findOne({ role: "Technician", specialty: type });
    if (!assignedTech) {
      assignedTech = await User.findOne({ role: "Technician", specialty: "Other" });
    }

    const ticketId = `TKT-${Date.now()}`;
    
    //christos extract file paths from middleware
    const filePaths = req.body.attachments || []; 

    const newTicket = new Ticket({
      customer: req.user.userId,
      ticketId,
      
      //filippa service and contact info assignment
      serviceType: serviceType || 'Repair',
      contactInfo: {
        fullName: contactName || 'N/A',
        email: contactEmail || 'N/A'
      },

      product: { serialNumber, model, purchaseDate, type },
      
      issue: {
        category,
        description,
        //christos attach correct file paths
        attachments: filePaths, 
      },

      warrantyStatus,
      assignedRepairCenter: assignedTech ? assignedTech._id : null,
      status: "Submitted",
      history: [{
          action: "Ticket Created",
          by: req.user.userId,
          notes: "Initial submission by customer",
      }],
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      _id: newTicket._id,
      ticketId: newTicket.ticketId,
      warrantyStatus,
      assignedRepairCenter: assignedTech ? assignedTech.fullName : "Pending Assignment",
      uploadedFiles : filePaths 
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: "Server error while creating ticket" });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user.userId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

//despoina all tickets for staff
exports.getAllTickets = async (req, res) => {
  try {
    if (req.user.role === 'Customer') {
      return res.status(403).json({ message: "Access denied. Staff only." });
    }

    const tickets = await Ticket.find()
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Error fetching all tickets" });
  }
};
// despoina all tickets for manager
exports.getAllTicketsAdmin = async (req, res) => {
  try {
    // Φέρνουμε όλα τα tickets και κάνουμε populate τα στοιχεία του πελάτη και του τεχνικού
    const tickets = await Ticket.find({})
      .populate('customer', 'fullName email')
      .populate('assignedRepairCenter', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση όλων των tickets" });
  }
};

exports.getAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedRepairCenter: req.user.userId })
      .populate('customer', 'fullName email') 
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assigned tickets' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating status' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'fullName email')
      .populate('assignedRepairCenter', 'fullName');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'Customer' && ticket.customer._id.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};