const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Helper: Warranty Validation (DMN)
// Rule: < 24 months = Under Warranty
const checkWarranty = (purchaseDate) => {
  const today = new Date();
  const pDate = new Date(purchaseDate);

  // difference in months
  const diffMonths =
    (today.getFullYear() - pDate.getFullYear()) * 12 +
    (today.getMonth() - pDate.getMonth());

  if (diffMonths <= 24) return "Under Warranty";
  return "Out of Warranty";
};

// Helper: Repair Center Assignment (DMN)
// Rule: Smartphone -> A, Laptop -> B, TV -> C
const assignRepairCenter = (productType) => {
  switch (productType) {
    case "Smartphone":
      return "Repair Center A";
    case "Laptop":
      return "Repair Center B";
    case "TV":
      return "Repair Center C";
    default:
      return "Deferred Assignment Queue"; // Rule R4
  }
};

// Submit Return/Repair Request
exports.createTicket = async (req, res) => {
  try {
    const {
      serialNumber,
      model,
      purchaseDate,
      type,
      category,
      description,
    } = req.body;

    // 1. autovalidate warranty & assign center
    const warrantyStatus = checkWarranty(purchaseDate);

    // 2. Smart Assignment
    let assignedTech = await User.findOne({
      role: "Technician",
      specialty: type,
    });

    if (!assignedTech) {
      assignedTech = await User.findOne({
        role: "Technician",
        specialty: "Other",
      });
    }

    // 3. create Ticket ID (TKT-TIMESTAMP)
    const ticketId = `TKT-${Date.now()}`;
    const filePaths = req.body.attachments || []; //get paths from middleware | if none uploaded -> null array []

    // 4. create Ticket record in DB
    const newTicket = new Ticket({
      customer: req.user.userId,
      ticketId,
      product: {
        serialNumber,
        model,
        purchaseDate,
        type,
      },
      issue: {
        category,
        description,
        photos: filePaths,  //fill old legacy field to avoid crash/conflicts with frontend
      },

      attachments : filePaths,  //fill new schema fields


      //  Results
      warrantyStatus,
      assignedRepairCenter: assignedTech ? assignedTech._id : null,
      status: "Submitted",
      history: [
        {
          action: "Ticket Created",
          by: req.user.userId,
          notes: "Initial submission by customer",
        },
      ],
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticketId: newTicket.ticketId,
      warrantyStatus,
      assignedRepairCenter: assignedTech
        ? assignedTech.fullName
        : "Pending Assignment",
      uploadedFiles : filePaths //return paths for validation  
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: "Server error while creating ticket" });
  }
};

// Track Ticket Status (Get tickets for logged-in user)
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

// Get tickets assigned to the logged-in technician
exports.getAssignedTickets = async (req, res) => {
  try {

    const tickets = await Ticket.find({ assignedRepairCenter: req.user.userId })
      .populate('customer', 'fullName email') // (Optional) Φέρνουμε και στοιχεία πελάτη
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Fetch Assigned Error:', error);
    res.status(500).json({ message: 'Error fetching assigned tickets' });
  }
};

// Update Ticket Status (Technician)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // find ticket
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // update the status
    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

// Get Single Ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'fullName email')
      .populate('assignedRepairCenter', 'fullName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (req.user.role === 'Customer' && ticket.customer._id.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};