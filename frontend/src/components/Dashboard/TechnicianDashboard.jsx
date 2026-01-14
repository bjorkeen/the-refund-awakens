import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssignedTickets,
  updateTicketStatus,
} from "@/services/ticketService";
import { useNotification } from "@/context/NotificationContext";
import "./TechnicianDashboard.css";

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

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const fetchData = async () => {
    try {
      const data = await getAssignedTickets();
      const list = Array.isArray(data) ? data : data.tickets || [];
      setTickets(list);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
      );
      await updateTicketStatus(ticketId, newStatus);
      if (newStatus === "Completed") {
        showNotification("An email has been sent to the customer that the process is completed successfully.", "success");
      }
    } catch (error) {
      showNotification("Failed to update status", "error");
      fetchData();
    }
  };

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      pending: tickets.filter(
        (t) => t.status === "Submitted" || t.status === "Open"
      ).length,
      inProgress: tickets.filter((t) => t.status === "In Progress").length,
      completed: tickets.filter(
        (t) => t.status === "Completed" || t.status === "Resolved"
      ).length,
    };
  }, [tickets]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Submitted":
        return "badge-submitted";
      case "Pending Validation":
        return "badge-pending";
      case "In Progress":
        return "badge-progress";
      case "Waiting for Parts":
        return "badge-waiting";
      case "Completed":
        return "badge-completed";
      case "Closed":
        return "badge-closed";
      case "Cancelled":
        return "badge-cancelled";
      default:
        return "badge-submitted";
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);

  if (loading)
    return <div className="tech-container">Loading workspace...</div>;

  return (
    <div className="tech-container">
      <div className="tech-header">
        <div>
          <h2 className="tech-title">🔧 Technician Workspace</h2>
          <p className="tech-subtitle">
            Manage repairs and update workflow status.
          </p>
        </div>
      </div>

      <div className="tech-stats-grid">
        <div className="tech-stat-card">
          <div className="tech-stat-label">Total Assigned</div>
          <div className="tech-stat-value">{stats.total}</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-label" style={{ color: "#b45309" }}>
            In Progress
          </div>
          <div className="tech-stat-value" style={{ color: "#b45309" }}>
            {stats.inProgress}
          </div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-label" style={{ color: "#15803d" }}>
            Completed
          </div>
          <div className="tech-stat-value" style={{ color: "#15803d" }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="tech-empty">No tickets assigned to you yet.</div>
      ) : (
        <div className="tech-table-container">
          <table className="tech-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Device</th>
                <th>Current Status</th>
                <th>Update Workflow</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td style={{ fontFamily: "monospace", fontWeight: "bold" }}>
                    {ticket.ticketId || ticket._id.substring(0, 8)}
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>
                      {ticket.product?.model || ticket.model}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {ticket.product?.type || ticket.type}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(ticket.status)}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="tech-select"
                      value={ticket.status}
                      onChange={(e) =>
                        handleStatusChange(ticket._id, e.target.value)
                      }
                    >
                      <option value={ticket.status}>{ticket.status}</option>
                      {(STATUS_TRANSITIONS[ticket.status] || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontWeight: "bold",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                background: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Showing {indexOfFirstTicket + 1} to{" "}
                {Math.min(indexOfLastTicket, tickets.length)} of{" "}
                {tickets.length}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <button
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        background: currentPage === i + 1 ? "#2563eb" : "white",
                        color: currentPage === i + 1 ? "white" : "#374151",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
