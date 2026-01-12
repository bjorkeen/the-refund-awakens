import api from "./api";

// --- CUSTOMER FUNCTIONS ---

// Create Ticket with FormData (Supports Images)
export const createTicket = async (ticketData) => {
  const formData = new FormData();

  Object.keys(ticketData).forEach((key) => {
    if (key === "photos" && Array.isArray(ticketData.photos)) {
      ticketData.photos.forEach((file) => {
        formData.append("photos", file);
      });
    } else {
      formData.append(key, ticketData[key]);
    }
  });

  const response = await api.post("/tickets", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Get logged-in user's tickets
export const getMyTickets = async () => {
  const response = await api.get("/tickets");
  return response.data;
};

// despoina service call for staff
export const getAllTickets = async () => {
  const response = await api.get("/tickets/all");
  return response.data;
};
// despoina service call for staff to assign technician
export const assignTicket = async (id, technicianId) => {
  const response = await api.patch(`/tickets/${id}/assign`, { technicianId });
  return response.data;
};
// despoina service call for manager
export const getAllTicketsAdmin = async () => {
  const response = await api.get("/tickets/admin/all");
  return response.data;
};

// --- FIX HERE: RENAMED TO getTicket TO MATCH YOUR FRONTEND ---
export const getTicket = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

// --- TECHNICIAN FUNCTIONS ---

export const getAssignedTickets = async () => {
  const response = await api.get("/tickets/assigned");
  return response.data;
};

export const updateTicketStatus = async (id, status) => {
  const response = await api.patch(`/tickets/${id}/status`, { status });
  return response.data;
};
// --- NEW FUNCTION FOR ADDING INTERNAL COMMENTS ---
export const addInternalComment = async (id, text, type) => {
  const response = await api.post(`/tickets/${id}/internal-comments`, {
    text,
    type,
  });
  return response.data;
};

//feedback function

export const submitFeedback = async (id, feedbackData) => {
  // feedbackData format: { rating: 5, comment: "Optional text" }
  const response = await api.post(`/tickets/${id}/feedback`, feedbackData);
  return response.data;
};

export const getFeedbackStats = async () => {
  const response = await api.get("/tickets/analytics/kpi");
  return response.data;
};

// Alias for AdminDashboard compatibility
export const getFeedbackKPIs = getFeedbackStats;

// escalate ticket function
export const escalateTicket = async (id) => {
  const res = await api.post(`/tickets/${id}/escalate`);
  return res.data;
};
