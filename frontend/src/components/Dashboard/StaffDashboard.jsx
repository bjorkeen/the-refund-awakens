import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useMemo } from 'react';
import { getAllTickets } from '../../services/ticketService';
import './TechnicianDashboard.css'; // Χρησιμοποιούμε το υπάρχον CSS για τα κουτάκια

const StaffDashboard = () => {
  // despoina all tickets for staff state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getAllTickets();
        // Διασφαλίζουμε ότι τα δεδομένα είναι πίνακας
        const list = Array.isArray(data) ? data : (data.tickets || []);
        setTickets(list);
      } catch (error) {
        console.error("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Υπολογισμός στατιστικών για τα "κουτάκια" 
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'Submitted' || t.status === 'Pending Validation').length,
      completed: tickets.filter(t => t.status === 'Completed' || t.status === 'Closed').length
    };
  }, [tickets]);

  if (loading) return <div className="tech-container">Φόρτωση δεδομένων...</div>;

  return (
    <div className="tech-container">
      <div className="tech-header">
        <div>
          <h2 className="tech-title">👨‍💼 Staff Workspace</h2>
          <p className="tech-subtitle">Overview of all customer requests and system status.</p>
        </div>
      </div>

      {/* Τα κουτάκια στατιστικών που ζήτησες */}
      <div className="tech-stats-grid">
        <div className="tech-stat-card">
          <div className="tech-stat-label">Total Requests</div>
          <div className="tech-stat-value">{stats.total}</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-label" style={{ color: "#b45309" }}>Pending Review</div>
          <div className="tech-stat-value" style={{ color: "#b45309" }}>{stats.pending}</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-label" style={{ color: "#15803d" }}>Completed</div>
          <div className="tech-stat-value" style={{ color: "#15803d" }}>{stats.completed}</div>
        </div>
      </div>

      <div className="tech-table-container">
        <table className="tech-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {ticket.ticketId || ticket._id.substring(0, 8)}
                </td>
                <td>
                  <div style={{ fontWeight: "600" }}>{ticket.customer?.fullName || 'N/A'}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{ticket.customer?.email}</div>
                </td>
                <td>{ticket.product?.model || 'N/A'}</td>
                <td>
                    <span className="badge-submitted">
                        {ticket.status}
                    </span>
                </td>
                <td>
                  <button 
                     className="mt-link" 
                     onClick={() => navigate(`/tickets/${ticket._id}`)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDashboard;