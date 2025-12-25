const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requireAuth } = require('../middleware/authMiddleware');
const { upload, resizeImage } = require('../middleware/uploadMiddleware');


// POST /api/tickets - Create new ticket (Protected)
router.post('/', requireAuth, upload.array('photos', 5), resizeImage, ticketController.createTicket);

// GET /api/tickets - Get user's ticket (Protected)
router.get('/', requireAuth, ticketController.getMyTickets);

// GET /api/tickets/assigned - Get assigned tickets (Protected)
router.get('/assigned', requireAuth, ticketController.getAssignedTickets);

// PUT /api/tickets/:id/status - Update ticket status (Technician only)
router.put('/:id/status', requireAuth, ticketController.updateTicketStatus);

// GET /api/tickets/:id - Get Single Ticket
router.get('/:id', requireAuth, ticketController.getTicketById);
module.exports = router;