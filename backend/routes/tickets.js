const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

// 1. Import τα σωστά middleware (protect ΚΑΙ authorize)
const { protect, authorize } = require("../middleware/authMiddleware");

// 2. Import το upload middleware
const { upload, resizeImage } = require("../middleware/uploadMiddleware");

// --- ROUTES ---

// POST /api/tickets - Create new ticket
//addded auth security patch - Limit ticket creations to verified users
router.post(
  "/",
  protect,
  authorize("Customer", "Employee", "Admin", "Manager"),
  upload.array("photos", 5),
  resizeImage,
  ticketController.createTicket
);

// GET /api/tickets - Get user's tickets
router.get("/", protect, ticketController.getMyTickets);

// POST /api/tickets/:id/escalate - Escalate ticket
router.post(
  "/:id/escalate",
  protect,
  authorize("Technician", "Employee", "Staff", "Manager", "Admin"),
  ticketController.escalateTicket
);

// Assign technician to ticket
router.patch(
  "/:id/assign",
  protect,
  authorize("Employee", "Staff", "Admin"),
  ticketController.assignTechnician
);

// GET /api/tickets/all - Staff Route (Employee, Technician, Manager, Admin)
router.get(
  "/all",
  protect,
  authorize("Employee", "Staff", "Technician", "Manager", "Admin"),
  ticketController.getAllTickets
);

// GET /api/tickets/admin/all - Manager/Admin Route
router.get(
  "/admin/all",
  protect,
  authorize("Manager", "Admin"),
  ticketController.getAllTicketsAdmin
);

// GET /api/tickets/assigned - Get technician's tickets
router.get("/assigned", protect, ticketController.getAssignedTickets);
// POST /api/tickets/:id/internal-comments - Add internal comment
router.post(
  "/:id/internal-comments",
  protect,
  authorize("Employee", "Technician", "Manager", "Admin"),
  ticketController.addInternalComment
);
//KPI routes
router.get(
  "/analytics/kpi",
  protect,
  authorize("Manager", "Admin"),
  ticketController.getFeedbackKPIs
);
router.post("/:id/feedback", protect, ticketController.submitFeedback);

// GET /api/tickets/:id - Get single ticket details
router.get("/:id", protect, ticketController.getTicketById);

// PATCH /api/tickets/:id/status - Update status
//restric customer to from changing ticket status
router.patch(
  "/:id/status",
  protect,
  authorize("Technician", "Employee", "Admin", "Manager"),
  ticketController.updateTicketStatus
);

module.exports = router;
