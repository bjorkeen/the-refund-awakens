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

exports.createTicket = async (req, res) => {
  try {
    const {
      //filippa new fields destructuring
      serviceType,
      deliveryMethod,
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      postalCode,
      
      serialNumber,
      model,
      purchaseDate,
      type,
      category,
      description,
    } = req.body;

    //filippa warranty check execution
    const warrantyStatus = checkWarranty(purchaseDate, serviceType);

    //christos smart assignment logic start
    console.log(`--- Assignment Logic Triggered for Type: ${type} ---`);
    
    // Find technicians with matching specialty
    const eligibleTechs = await User.find({ role: "Technician", specialty: type });
    console.log(`Found ${eligibleTechs.length} techs for ${type}`);

    let assignedTech = null;

    //check workload less than 5 active tickets
    for (const tech of eligibleTechs) {
      const activeTickets = await Ticket.countDocuments({
        assignedRepairCenter: tech._id,
        // christos fix: Count EVERYTHING except closed/completed tickets (so Shipped is counted)
        status: { 
          $nin: ['Completed', 'Closed', 'Cancelled', 'Rejected'] 
        }
      });
      
      console.log(`Tech ${tech.fullName} has ${activeTickets} active tickets.`);

      if (activeTickets < 5) {
        assignedTech = tech;
        console.log(`-> Assigning to ${tech.fullName}`);
        break; 
      }
    }

    //fallback to "other" specialty if primary techs are full
    if (!assignedTech) {
      console.log("Primary techs full or not found. Checking 'Other'...");
      const generalTechs = await User.find({ role: "Technician", specialty: "Other" });
      
      for (const tech of generalTechs) {
        const activeTickets = await Ticket.countDocuments({
          assignedRepairCenter: tech._id,
          // christos fix: Same fix for fallback technicians
          status: { $nin: ['Completed', 'Closed', 'Cancelled', 'Rejected'] }
        });

        if (activeTickets < 5) {
          assignedTech = tech;
          console.log(`-> Assigned to General Tech: ${tech.fullName}`);
          break;
        }
      }
    }
    //end assignment logic

    const ticketId = `TKT-${Date.now()}`;
    
    //christos extract file paths from middleware
    const filePaths = req.body.attachments || []; 

    const newTicket = new Ticket({
      customer: req.user.userId,
      ticketId,
      
      //filippa service and contact info assignment
      serviceType: serviceType || 'Repair',
      deliveryMethod: deliveryMethod || 'courier',
      contactName: contactName || 'N/A',
      contactEmail: contactEmail || 'N/A',
      phone: contactPhone || 'N/A',
      address: address || '',
      city: city || '',
      postalCode: postalCode || '',
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
    const tickets = await Ticket.find({ customer: req.user.userId })
      .select("-internalComments")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

// despoina all tickets for staff 
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('customer', 'fullName email') 
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Error fetching all tickets" });
  }
};

//despoina assign technician to ticket
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.assignedRepairCenter = technicianId; // Αναθέτουμε τον τεχνικό
    
    // Προσθήκη στο ιστορικό
    ticket.history.push({
      action: "Technician Assigned",
      by: req.user.userId,
      notes: `Assigned to technician ID: ${technicianId}`
    });

    await ticket.save();
    res.json({ success: true, message: "Technician assigned successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning technician' });
  }
};

// despoina all tickets for manager
exports.getAllTicketsAdmin = async (req, res) => {
  try {
    // Φέρνουμε όλα τα tickets και κάνουμε populate τα στοιχεία του πελάτη και του τεχνικού
    const tickets = await Ticket.find({})
      .populate('customer', 'fullName email')
      .populate('assignedRepairCenter', 'fullName email specialty')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
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
      // christos: populate full technician details for sidebar
      .populate('assignedRepairCenter', 'fullName email specialty')
      .populate('internalComments.by', 'fullName email role');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'Customer' && ticket.customer._id.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (req.user.role === 'Customer') {
      const t = ticket.toObject();
      delete t.internalComments;
      return res.json(t);
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add internal comment to ticket 
exports.addInternalComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.internalComments = ticket.internalComments || [];
    ticket.internalComments.push({
      text: text.trim(),
      by: req.user.userId
    });

    await ticket.save();

    // Return updated ticket (populate comment authors)
    const updated = await Ticket.findById(req.params.id)
      .populate("customer", "fullName email")
      .populate("internalComments.by", "fullName role email");

    res.json(updated);
  } catch (error) {
    console.error("Error adding internal comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.submitFeedback = async (req, res) => {
  try{
    const { rating, comment } = req.body;

    // validation ensure rating is 1-5
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // find ticket ensuring it belongs to user AND is completed
    const ticket = await Ticket.findOneAndUpdate(
      { 
        _id: req.params.id, 
        customer: req.user.userId, 
        status: 'Completed' 
      },
      { 
        feedback: { 
          rating, 
          comment, 
          createdAt: new Date() 
        } 
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ msg: 'Ticket unavailable for feedback (must be Completed and owned by you)' });
    res.json(ticket);
  } catch (err) {
    console.error("Feedback Error:", err.message);
    res.status(500).send('Server Error');
  }
};

// KPI stats for admin dashboard
exports.getFeedbackKPIs = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      { $match: { "feedback.rating": { $exists: true } } },
      {
        $group: {
          _id: "$feedback.rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("KPI Error:", err.message);
    res.status(500).send('Server Error');
  }
};