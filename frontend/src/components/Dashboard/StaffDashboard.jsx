import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllTickets,
  updateTicketStatus,
  assignTicket,
} from "../../services/ticketService";
import { useNotification } from "@/context/NotificationContext";
import styles from "./StaffDashboard.module.css";

function getServiceType(t) {
  return t.serviceType || t.type || "Repair";
}

const StaffDashboard = () => {
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("all");
  // values: "all" | "active" | "completed" | "escalated"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const technicians = [
    {
      id: "695b284f2c732806f5047901",
      name: "Bob Smartphone",
      email: "mobile@demo.com",
    },
    {
      id: "695b287f2c732806f5047903",
      name: "George Smartphone",
      email: "mobile2@demo.com",
    },
    {
      id: "695b288c2c732806f5047905",
      name: "John Laptop",
      email: "laptop@demo.com",
    },
    { id: "695b2ec94d069c998bd864a2", name: "Xaris", email: "tv@demo.com" },
  ];

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets();
      const list = Array.isArray(data) ? data : data.tickets || [];
      setTickets(list);
    } catch (error) {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAssign = async (ticketId, techId) => {
    if (!techId) return;
    try {
      await assignTicket(ticketId, techId);
      showNotification("Technician assigned successfully!", "success");
      fetchTickets();
    } catch (error) {
      showNotification("Assignment failed.", "error");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
      );
      if (newStatus === "Completed") {
        showNotification("An email has been sent to the customer that the process is completed successfully.", "success");
      } else {
        showNotification("Status updated successfully!", "success");
      }
    } catch (error) {
      showNotification("Status update failed.", "error");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        // view filter first
        if (activeView === "active") {
          return ["Submitted", "Pending Validation", "In Progress"].includes(
            ticket.status
          );
        }
        if (activeView === "completed") {
          return ["Completed", "Closed"].includes(ticket.status);
        }
        if (activeView === "escalated") {
          return ticket.escalated === true;
        }
        return true; // "all"
      })
      .filter((ticket) => {
        // existing search filter
        const customerName = (
          ticket.customer?.fullName ||
          ticket.contactInfo?.fullName ||
          "Guest"
        ).toLowerCase();
        const ticketId = (ticket.ticketId || ticket._id).toLowerCase();
        const search = searchTerm.toLowerCase();
        return customerName.includes(search) || ticketId.includes(search);
      })
      .filter((ticket) => {
        // type filter
        if (filterType === "All") return true;
        const ticketType = getServiceType(ticket);
        return ticketType === filterType;
      });
  }, [tickets, searchTerm, activeView, filterType]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      active: tickets.filter((t) =>
        ["Submitted", "Pending Validation", "In Progress"].includes(t.status)
      ).length,
      completed: tickets.filter((t) =>
        ["Completed", "Closed"].includes(t.status)
      ).length,
      escalated: tickets.filter((t) => t.escalated === true).length,
    }),
    [tickets]
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  if (loading)
    return <div className={styles.container}>Loading Workspace...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>👨‍💼 Staff Workspace</h2>
        <p className={styles.subtitle}>Management & Technical Allocation</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div
          className={`${styles.statCard} ${
            activeView === "all" ? styles.statCardActive : ""
          }`}
          onClick={() => setActiveView("all")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statLabel}>Total Requests</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>

        <div
          className={`${styles.statCard} ${
            activeView === "active" ? styles.statCardActive : ""
          }`}
          onClick={() => setActiveView("active")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statValue}>{stats.active}</div>
        </div>

        <div
          className={`${styles.statCard} ${
            activeView === "completed" ? styles.statCardActive : ""
          }`}
          onClick={() => setActiveView("completed")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statLabel}>Completed</div>
          <div className={styles.statValue}>{stats.completed}</div>
        </div>

        <div
          className={`${styles.statCard} ${
            activeView === "escalated" ? styles.statCardActive : ""
          }`}
          onClick={() => setActiveView("escalated")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statLabel}>Escalated</div>
          <div className={styles.statValue}>{stats.escalated}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by customer name or Ticket ID..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Repair">Repair</option>
          <option value="Return">Return</option>
        </select>
      </div>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Assign Technician</th>
              <th>Status Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.map((ticket) => (
              <tr key={ticket._id}>
                <td style={{ fontWeight: "bold" }}>
                  #
                  {ticket.ticketId ||
                    ticket._id.substring(ticket._id.length - 8).toUpperCase()}
                </td>

                <td>
                  <div style={{ fontWeight: "600" }}>
                    {ticket.customer?.fullName ||
                      ticket.contactInfo?.fullName ||
                      "Guest"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {ticket.customer?.email || ticket.contactInfo?.email}
                  </div>
                </td>

                <td>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        getServiceType(ticket) === "Return"
                          ? "#fef2f2"
                          : "#eff6ff",
                      color:
                        getServiceType(ticket) === "Return"
                          ? "#dc2626"
                          : "#2563eb",
                      border: "1px solid currentColor",
                    }}
                  >
                    {getServiceType(ticket).toUpperCase()}
                  </span>
                </td>

                {/* ASSIGN TECHNICIAN BY EMAIL */}
                <td>
                  <select
                    className={styles.statusSelect}
                    value={
                      ticket.assignedRepairCenter?._id ||
                      ticket.assignedRepairCenter ||
                      ""
                    }
                    onChange={(e) => handleAssign(ticket._id, e.target.value)}
                    style={{ border: "1px solid #6366f1" }}
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.email}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <select
                    className={styles.statusSelect}
                    value={ticket.status}
                    onChange={(e) =>
                      handleStatusChange(ticket._id, e.target.value)
                    }
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Pending Validation">
                      Pending Validation
                    </option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Parts">Waiting for Parts</option>
                    <option value="Shipped Back">Shipped Back</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>

                <td>
                  <button
                    className={styles.detailsBtn}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    View
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
              {Math.min(indexOfLastTicket, filteredTickets.length)} of{" "}
              {filteredTickets.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
    </div>
  );
};

export default StaffDashboard;
