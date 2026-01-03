

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || ""; 

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // IMPORTANT: sends cookies (JWT cookie)
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  // Try to parse JSON when possible
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Get single ticket details
 * GET /api/tickets/:id
 */
export function getTicket(id) {
  return request(`/api/tickets/${id}`);
}

/**
 * Update ticket status
 * PATCH /api/tickets/:id/status
 * body: { status: "In Progress" }
 */
export function updateTicketStatus(id, status) {
  return request(`/api/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/**
 * Add internal note (staff only; backend enforces rules)
 * POST /api/tickets/:id/internal-notes
 * body: { note: "..." }
 */
export function addInternalNote(id, note) {
  return request(`/api/tickets/${id}/internal-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

/**
 * (Optional) Technician's assigned tickets
 * GET /api/tickets/assigned
 */
export function getAssignedTickets() {
  return request(`/api/tickets/assigned`);
}

/**
 * (Optional) Customer's tickets list
 * GET /api/tickets
 */
export function getMyTickets() {
  return request(`/api/tickets`);
}

/**
 * (Optional) Create ticket (if you want it here too)
 * POST /api/tickets
 * Supports FormData (for images) OR JSON
 */
export function createTicket(payload) {
  const isFormData = payload instanceof FormData;

  return request(`/api/tickets`, {
    method: "POST",
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: isFormData ? payload : JSON.stringify(payload),
  });
}
