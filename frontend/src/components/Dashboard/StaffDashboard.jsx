import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, updateTicketStatus } from '../../services/ticketService';
import styles from './StaffDashboard.module.css';

const StaffDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets();
      const list = Array.isArray(data) ? data : (data.tickets || []);
      setTickets(list);
    } catch (error) {
      console.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const customerName = (ticket.customer?.fullName || ticket.contactInfo?.fullName || "Guest").toLowerCase();
      const ticketId = (ticket.ticketId || ticket._id).toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return customerName.includes(search) || ticketId.includes(search);
    });
  }, [tickets, searchTerm]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const stats = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter(t => ['Submitted', 'Pending Validation', 'In Progress'].includes(t.status)).length,
    completed: tickets.filter(t => ['Completed', 'Closed'].includes(t.status)).length
  }), [tickets]);

  if (loading) return <div className={styles.container}>Loading Global Workspace...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>👨‍💼 Staff Workspace</h2>
        <p className={styles.subtitle}>Full access to all repair and return requests.</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Requests</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: "#f59e0b" }}>
          <div className={styles.statLabel} style={{ color: "#b45309" }}>Active</div>
          <div className={styles.statValue}>{stats.pending}</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: "#10b981" }}>
          <div className={styles.statLabel} style={{ color: "#15803d" }}>Completed</div>
          <div className={styles.statValue}>{stats.completed}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search customer name or Ticket ID..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Status Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket._id}>
                <td style={{ fontWeight: 'bold' }}>
                   #{ticket.ticketId || ticket._id.substring(0, 8).toUpperCase()}
                </td>
                <td>
                  <div style={{ fontWeight: "600" }}>{ticket.customer?.fullName || ticket.contactInfo?.fullName || 'Guest'}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{ticket.customer?.email || ticket.contactInfo?.email}</div>
                </td>
                <td>{ticket.product?.model || 'N/A'}</td>
                <td>
                  <select 
                    className={styles.statusSelect}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Pending Validation">Pending Validation</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Parts">Waiting for Parts</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <button className={styles.detailsBtn} onClick={() => navigate(`/tickets/${ticket._id}`)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No matches found.</div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;