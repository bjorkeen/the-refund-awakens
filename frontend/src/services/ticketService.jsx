import api from './api';

// Create Ticket
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create ticket';
  }
};

// Get logged-in user's tickets
export const getMyTickets = async () => {
  try {
    const response = await api.get('/tickets');

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.tickets)) return data.tickets;

    return [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch tickets';
  }
};

// Get tickets assigned to the logged-in technician
export const getAssignedTickets = async () => {
  const response = await api.get('/tickets/assigned');
  return response.data;
};

// Update ticket status
export const updateTicketStatus = async (ticketId, status) => {
  const token = localStorage.getItem('token'); // Ή cookie αν το έχεις ρυθμίσει αλλιώς
  const response = await fetch(`${API_URL}/${ticketId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status }),
  });
  return response.json();
};