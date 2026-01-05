const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// 1. Import τα σωστά middleware (protect ΚΑΙ authorize)
const { protect, authorize } = require('../middleware/authMiddleware');

// 2. Import το upload middleware
const { upload, resizeImage } = require('../middleware/uploadMiddleware');

// --- ROUTES ---

// POST /api/tickets - Create new ticket
router.post('/', protect, upload.array('photos', 5), resizeImage, ticketController.createTicket);

// GET /api/tickets - Get user's tickets
router.get('/', protect, ticketController.getMyTickets);

// Assign technician to ticket
router.patch('/:id/assign', protect, authorize('Employee', 'Staff', 'Admin'), ticketController.assignTechnician);

// GET /api/tickets/all - Staff Route (Employee, Technician, Manager, Admin)
router.get('/all', protect, authorize('Employee', 'Staff','Technician', 'Manager', 'Admin'), ticketController.getAllTickets);

// GET /api/tickets/admin/all - Manager/Admin Route
router.get('/admin/all', protect, authorize('Manager', 'Admin'), ticketController.getAllTicketsAdmin);

// GET /api/tickets/assigned - Get technician's tickets
router.get('/assigned', protect, ticketController.getAssignedTickets);

// GET /api/tickets/:id - Get single ticket details
router.get('/:id', protect, ticketController.getTicketById);

// PATCH /api/tickets/:id/status - Update status
router.patch('/:id/status', protect, ticketController.updateTicketStatus);

module.exports = router;