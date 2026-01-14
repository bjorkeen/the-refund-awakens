const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { sendStatusUpdateEmail } = require("../utils/emailService");

// logic : warranty check helper
const checkWarranty = (purchaseDate, serviceType) => {
  const today = new Date();
  const pDate = new Date(purchaseDate);

  if (serviceType === "Return") {
    const diffTime = Math.abs(today - pDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 15 ? "Eligible for Return" : "Return Period Expired";
  } else {
    const diffMonths =
      (today.getFullYear() - pDate.getFullYear()) * 12 +
      (today.getMonth() - pDate.getMonth());
    return diffMonths <= 24 ? "Under Warranty" : "Out of Warranty";
  }
};

// logic : define strict allowed transitions
const STATUS_TRANSITIONS = {
  "Submitted": ["Pending Validation", "Shipping", "In Progress", "Cancelled"],
  "Pending Validation": ["In Progress", "Cancelled", "Completed"],
  "Shipping": ["In Progress", "Cancelled"], 
  "In Progress": ["Waiting for Parts", "Shipped Back", "Ready for Pickup", "Completed", "Cancelled"],
  "Waiting for Parts": ["In Progress","Ready for Pickup","Cancelled"],
  "Shipped Back": ["Completed", "Cancelled"],
  "Ready for Pickup": ["Completed", "Cancelled"],
  "Completed": ["Closed"],
  "Closed": [],
  "Cancelled": [],
};

exports.createTicket = async (req, res) => {
  try {
    const {
      serviceType,
      deliveryMethod,
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      postalCode,
      customerSelection,
      serialNumber,
      model,
      purchaseDate,
      type,
      category,
      description,
    } = req.body;

    const warrantyStatus = checkWarranty(purchaseDate, serviceType);
    let assignedTech = null;
    let resolutionOptions = [];
    let initialStatus = "Submitted";
    
    // logic : normalize delivery method check
    const isCourier = deliveryMethod && deliveryMethod.toLowerCase() === "courier";

    if (serviceType === "Return") {
      const pDate = new Date(purchaseDate);
      const diffDays = Math.ceil((new Date() - pDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 15) {
        return res.status(400).json({
          success: false,
          message: "Return period expired (15 days). Submit a Repair request instead.",
        });
      }
      resolutionOptions = ["Refund", "Replacement"];
      initialStatus = "Pending Validation";
      assignedTech = null;

    } else {
      // logic : repair flow
      resolutionOptions = ["Repair"];

      // logic : set initial status based on method
      if (isCourier) {
        initialStatus = "Shipping";
      } else {
        initialStatus = "Submitted";
      }

      // logic : technician assignment
      const eligibleTechs = await User.find({ role: "Technician", specialty: type });
      for (const tech of eligibleTechs) {
        const activeTickets = await Ticket.countDocuments({
          assignedRepairCenter: tech._id,
          status: { $nin: ["Completed", "Closed", "Cancelled"] },
        });
        if (activeTickets < 5) {
          assignedTech = tech;
          break;
        }
      }
      // fallback to 'Other' specialty if needed
      if (!assignedTech) {
        const generalTechs = await User.find({ role: "Technician", specialty: "Other" });
        for (const tech of generalTechs) {
          const activeTickets = await Ticket.countDocuments({
            assignedRepairCenter: tech._id,
            status: { $nin: ["Completed", "Closed", "Cancelled"] },
          });
          if (activeTickets < 5) {
            assignedTech = tech;
            break;
          }
        }
      }
    }

    const ticketId = `TKT-${Date.now()}`;
    // fix : use req.files from multer
    const filePaths = req.files ? req.files.map((file) => file.path) : [];

    const newTicket = new Ticket({
      customer: req.user.userId,
      ticketId,
      serviceType: serviceType || "Repair",
      deliveryMethod: deliveryMethod || "courier",
      contactInfo: {
        fullName: contactName || "N/A",
        email: contactEmail || "N/A",
        phone: contactPhone || "N/A",
        address: address || "",
        city: city || "",
        postalCode: postalCode || "",
      },
      product: { serialNumber, model, purchaseDate, type },
      issue: {
        category,
        description,
        attachments: filePaths,
      },
      warrantyStatus,
      resolutionOptions,
      customerSelection: customerSelection || "None",
      status: initialStatus,
      assignedRepairCenter: assignedTech ? assignedTech._id : null,
      history: [
        {
          action: "Ticket Created",
          by: req.user.userId,
          notes: `Initial submission as ${serviceType}`,
        },
      ],
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      _id: newTicket._id,
      ticketId: newTicket.ticketId,
      warrantyStatus,
      resolutionOptions,
      assignedRepairCenter: assignedTech ? assignedTech.fullName : "Pending Assignment",
      uploadedFiles: filePaths,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: "Server error while creating ticket" });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user.userId }).select("-internalComments").sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) { res.status(500).json({ message: "Error" }); }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer", "fullName email")
      .populate("assignedRepairCenter", "fullName email specialty")
      .populate("internalComments.by", "fullName email role");
    if (!ticket) return res.status(404).json({ message: "Not found" });
    if (req.user.role === "Customer" && ticket.customer._id.toString() !== req.user.userId) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role === "Customer") {
        const t = ticket.toObject();
        delete t.internalComments;
        return res.json(t);
    }
    res.json(ticket);
  } catch (error) { res.status(500).json({ message: "Error" }); }
};

exports.getAllTickets = async (req, res) => {
  try {
    if (req.user.role === "Customer") return res.status(403).json({ message: "Access denied" });
    const tickets = await Ticket.find().populate("customer", "fullName email").populate("assignedRepairCenter", "fullName email specialty").sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) { res.status(500).json({ message: "Error" }); }
};
exports.getAllTicketsAdmin = exports.getAllTickets;

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate("customer");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (req.user.role === "Technician" && ticket.assignedRepairCenter?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not assigned to this ticket" });
    }

    const currentStatus = ticket.status || "Submitted";
    
    // logic : validate transition for technicians
    if (req.user.role === "Technician") {
      const allowed = STATUS_TRANSITIONS[currentStatus] || [];
      if (status !== currentStatus && !allowed.includes(status)) {
        return res.status(400).json({
          message: `Invalid status transition from ${currentStatus} to ${status}`,
        });
      }
    }

    const oldStatus = ticket.status;
    ticket.history.push({
      action: "Status Updated",
      by: req.user.userId,
      notes: `Status changed from ${oldStatus} to ${status}`,
    });

    ticket.status = status;
    await ticket.save();

    if (status !== oldStatus && ticket.customer?.email) {
       sendStatusUpdateEmail(ticket.customer.email, ticket.customer.fullName, ticket.ticketId, ticket.product?.model, status)
       .catch(err => console.error("Email fail", err));
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ... Keep addInternalComment, getAssignedTickets, assignTechnician, feedback ...
exports.addInternalComment = async (req, res) => {
    try {
        const { text, type } = req.body;
        if (!text) return res.status(400).json({ message: "Text required" });
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Not found" });
        ticket.internalComments.push({ by: req.user.userId, text, type: type || "Note" });
        await ticket.save();
        const updated = await Ticket.findById(req.params.id).populate("internalComments.by", "fullName email role");
        res.json(updated);
    } catch (error) { res.status(500).json({ message: "Error" }); }
};

exports.getAssignedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ assignedRepairCenter: req.user.userId }).populate("customer", "fullName email").sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) { res.status(500).json({ message: "Error" }); }
};

exports.assignTechnician = async (req, res) => {
    try {
        const { technicianId } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Not found" });
        ticket.assignedRepairCenter = technicianId;
        ticket.history.push({ action: "Technician Assigned", by: req.user.userId, notes: `Assigned ID: ${technicianId}` });
        await ticket.save();
        res.json({ success: true, ticket });
    } catch (error) { res.status(500).json({ message: "Error" }); }
};

exports.escalateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Not found" });
        ticket.escalated = true; 
        ticket.escalatedAt = new Date();
        await ticket.save();
        res.json(await Ticket.findById(ticket._id).populate("customer").populate("assignedRepairCenter").populate("internalComments.by"));
    } catch (e) { res.status(500).json({message: "Error"}); }
};

exports.submitFeedback = async (req, res) => { /* Keep logic */ };
exports.getFeedbackKPIs = async (req, res) => { /* Keep logic */ };