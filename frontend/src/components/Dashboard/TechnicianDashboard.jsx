import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssignedTickets,
  updateTicketStatus,
} from "@/services/ticketService";
import "./TechnicianDashboard.css";

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      alert("Failed to update status");
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
              {tickets.map((ticket) => (
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
                      <option value="Submitted">Submitted</option>
                      <option value="Pending Validation">
                        Pending Validation
                      </option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting for Parts">
                        Waiting for Parts
                      </option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                      <option value="Cancelled">Cancelled</option>
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
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;