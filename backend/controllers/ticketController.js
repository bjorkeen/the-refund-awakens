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
    // Technician: only their assigned tickets
const tickets = await Ticket.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
res.json(tickets);

  } catch (error) {
    res.status(500).json({ message: "Server error fetching tickets" });
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
if (!ticket) return res.status(404).json({ message: "Ticket not found" });

// Customers cannot change status
if (req.user.role === "Customer") {
  return res.status(403).json({ message: "Customers cannot update status" });
}

// Technician can only update if assigned
if (req.user.role === "Technician") {
  if (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update tickets assigned to you" });
  }
}

ticket.status = req.body.status;

// log status history if you track it
ticket.history.push({
  action: "Status Updated",
  by: req.user._id,
  date: new Date(),
  details: `New status: ${req.body.status}`,
});

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

export const addInternalNote = async (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({ message: "Note is required" });
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // Customers cannot add internal notes
  if (req.user.role === "Customer") {
    return res.status(403).json({ message: "Customers cannot add internal notes" });
  }

  // Technician: only if assigned
  if (req.user.role === "Technician") {
    if (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only add notes to tickets assigned to you" });
    }
  }

  ticket.internalNotes.push({ note: note.trim(), by: req.user._id });

  // add to history too
  ticket.history.push({
    action: "Internal Note Added",
    by: req.user._id,
    date: new Date(),
  });

  await ticket.save();
  res.json(ticket);
};
