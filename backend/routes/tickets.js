const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

// IMPORT YOUR UPLOAD MIDDLEWARE
const { upload, resizeImage } = require('../middleware/uploadMiddleware');

// POST /api/tickets - Create new ticket (Protected)
// RESTORE THE UPLOAD CHAIN: Auth -> Upload -> Resize -> Controller
router.post('/', protect, upload.array('photos', 5), resizeImage, ticketController.createTicket);

// GET /api/tickets - Get user's ticket (Protected)
router.get('/', protect, ticketController.getMyTickets);

// despoina all tickets for staff route
router.get('/all', requireAuth, ticketController.getAllTickets);

// despoina all tickets for manager route
router.get('/admin/all', requireAuth, ticketController.getAllTicketsAdmin);

// GET /api/tickets/assigned - Get technician's tickets
router.get('/assigned', protect, ticketController.getAssignedTickets);

// GET /api/tickets/:id - Get single ticket details
router.get('/:id', protect, ticketController.getTicketById);

// PATCH /api/tickets/:id/status - Update status (Technician only)
router.patch('/:id/status', protect, ticketController.updateTicketStatus);

module.exports = router;