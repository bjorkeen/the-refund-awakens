const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { sendStatusUpdateEmail } = require("../utils/emailService");

// logic : warranty check helper (15 days vs 24 months)
const checkWarranty = (purchaseDate, serviceType) => {
  const today = new Date();
  const pDate = new Date(purchaseDate);

  if (serviceType === "Return") {
    const diffTime = Math.abs(today - pDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 15 ? "Eligible for Return" : "Return Period Expired";
  } else {
    // logic : standard 24 month warranty for repairs
    const diffMonths =
      (today.getFullYear() - pDate.getFullYear()) * 12 +
      (today.getMonth() - pDate.getMonth());
    return diffMonths <= 24 ? "Under Warranty" : "Out of Warranty";
  }
};

const STATUS_TRANSITIONS = {
  Submitted: ["Pending Validation", "Cancelled"],
  "Pending Validation": ["In Progress", "Cancelled"],
  "In Progress": [
    "Waiting for Parts",
    "Shipping",
    "Ready for Pickup",
    "Completed",
    "Cancelled",
  ],
  "Waiting for Parts": ["In Progress", "Cancelled"],
  Shipping: ["Shipped Back", "Completed", "Cancelled"],
  "Shipped Back": ["Completed"],
  "Ready for Pickup": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
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

    // logic : execute warranty check
    const warrantyStatus = checkWarranty(purchaseDate, serviceType);

    let assignedTech = null;
    let resolutionOptions = [];
    let initialStatus = "Submitted";

    if (serviceType === "Return") {
      // logic : calculate days since purchase
      const pDate = new Date(purchaseDate);
      const diffDays = Math.ceil((new Date() - pDate) / (1000 * 60 * 60 * 24));

      // logic : hard block if return period > 15 days
      if (diffDays > 15) {
        return res.status(400).json({
          success: false,
          message:
            "Return period expired (15 days). Please submit a Repair request instead.",
        });
      }

      // logic : set resolution options for valid returns
      resolutionOptions = ["Refund", "Replacement"];

      // logic : returns skip auto-assignment to wait for staff validation
      initialStatus = "Pending Validation";
      assignedTech = null;
    } else {
      // logic : smart assignment logic for repairs
      resolutionOptions = ["Repair"];
      initialStatus = "Submitted";

      // logic : find technicians with matching specialty
      const eligibleTechs = await User.find({
        role: "Technician",
        specialty: type,
      });

      // logic : check workload less than 5 active tickets
      for (const tech of eligibleTechs) {
        const activeTickets = await Ticket.countDocuments({
          assignedRepairCenter: tech._id,
          // logic : exclude completed/closed tickets from workload count
          status: { $nin: ["Completed", "Closed", "Cancelled", "Rejected"] },
        });

        if (activeTickets < 5) {
          assignedTech = tech;
          break;
        }
      }

      // logic : fallback to general technician if specialists are full
      if (!assignedTech) {
        const generalTechs = await User.find({
          role: "Technician",
          specialty: "Other",
        });
        for (const tech of generalTechs) {
          const activeTickets = await Ticket.countDocuments({
            assignedRepairCenter: tech._id,
            status: { $nin: ["Completed", "Closed", "Cancelled", "Rejected"] },
          });
          if (activeTickets < 5) {
            assignedTech = tech;
            break;
          }
        }
      }
    }

    const ticketId = `TKT-${Date.now()}`;
    // logic : extract file paths

    // fix : get files from req.files provided by multer, not req.body
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
      assignedRepairCenter: assignedTech
        ? assignedTech.fullName
        : "Pending Assignment",
      uploadedFiles: filePaths,
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
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer", "fullName email")
      .populate("assignedRepairCenter", "fullName email specialty")
      .populate("internalComments.by", "fullName email role");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (
      req.user.role === "Customer" &&
      ticket.customer._id.toString() !== req.user.userId
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.user.role === "Customer") {
      const t = ticket.toObject();
      delete t.internalComments;
      return res.json(t);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    // logic: ensure customers cannot access this route (redundant if middleware exists but safe)
    if (req.user.role === "Customer")
      return res.status(403).json({ message: "Access denied" });

    const tickets = await Ticket.find()
      .populate("customer", "fullName email")
      .populate("assignedRepairCenter", "fullName email specialty")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all tickets" });
  }
};

exports.getAllTicketsAdmin = exports.getAllTickets;

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate("customer");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // security patch prevent technician from updating unassigned tickets
    if (
      req.user.role === "Technician" &&
      ticket.assignedRepairCenter?.toString() !== req.user.userId
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this ticket" });
    }

    const newStatus = status;
    const currentStatus = ticket.status || "Submitted";

    if (req.user.role === "Technician") {
      const allowed = STATUS_TRANSITIONS[currentStatus] || [];

      // Allow no-op (same status)
      if (newStatus !== currentStatus && !allowed.includes(newStatus)) {
        return res.status(400).json({
          message: `Invalid status transition: '${currentStatus}' → '${newStatus}'`,
          allowedNextStatuses: allowed,
        });
      }
    }

    const oldStatus = ticket.status;

    ticket.history.push({
      action: "Status Updated",
      by: req.user.userId,
      notes: `Status changed from ${ticket.status} to ${status}`,
    });

    ticket.status = status;
    await ticket.save();
    if (status !== oldStatus && ticket.customer && ticket.customer.email) {
      const customerName =
        ticket.customer.fullName || ticket.contactInfo?.fullName || "Customer";
      const model = ticket.product?.model || ticket.model || "Device";
      const ticketDisplayId = ticket.ticketId || ticket._id;

      sendStatusUpdateEmail(
        ticket.customer.email,
        customerName,
        ticketDisplayId,
        model,
        status
      ).catch((err) => console.error("Email service failed silently:", err));
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({ message: "Server error updating status" });
  }
};

exports.addInternalComment = async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const allowedTypes = [
      "Note",
      "Waiting for Parts",
      "Escalation",
      "SLA Risk",
    ];
    const safeType = allowedTypes.includes(type) ? type : "Note";

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.internalComments = ticket.internalComments || [];
    ticket.internalComments.push({
      by: req.user.userId,
      text: text.trim(),
      type: safeType,
    });

    await ticket.save();

    const updated = await Ticket.findById(req.params.id).populate(
      "internalComments.by",
      "fullName email role"
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

exports.getAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedRepairCenter: req.user.userId })
      .populate("customer", "fullName email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned tickets" });
  }
};

// logic : manual technician assignment by staff
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.assignedRepairCenter = technicianId;

    ticket.history.push({
      action: "Technician Assigned",
      by: req.user.userId,
      notes: `Assigned to technician ID: ${technicianId}`,
    });

    await ticket.save();
    res.json({
      success: true,
      message: "Technician assigned successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning technician" });
  }
};

// logic : feedback submission for completed tickets
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: req.user.userId,
        status: "Completed",
      },
      {
        feedback: {
          rating,
          comment,
          createdAt: new Date(),
        },
      },
      { new: true }
    );

    if (!ticket)
      return res.status(404).json({ msg: "Ticket unavailable for feedback" });
    res.json(ticket);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// logic : KPI stats for admin dashboard
exports.getFeedbackKPIs = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      { $match: { "feedback.rating": { $exists: true } } },
      {
        $group: {
          _id: "$feedback.rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

exports.escalateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (req.user.role === "Customer") {
      return res
        .status(403)
        .json({ message: "Customers cannot escalate tickets." });
    }

    ticket.escalated = true;
    ticket.escalatedAt = new Date();

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate("customer", "fullName email")
      .populate("assignedRepairCenter", "fullName")
      .populate("internalComments.by", "fullName email role");

    res.json(updated);
  } catch (err) {
    console.error("escalateTicket error:", err);
    res.status(500).json({ message: "Server error escalating ticket" });
  }
};
