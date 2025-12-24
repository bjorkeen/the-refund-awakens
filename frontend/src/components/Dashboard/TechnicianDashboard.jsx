import { useEffect, useState, useMemo } from 'react';
import { getAssignedTickets } from '@/services/ticketService';
import './TechnicianDashboard.css';

const TechnicianDashboard = () => {
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
        // Optimistic update
        setTickets(prev => prev.map(t => 
            t._id === ticketId ? { ...t, status: newStatus } : t
        ));
        
        // call backend
        await updateTicketStatus(ticketId, newStatus);
        // alert("Status updated!");
    } catch (error) {
        alert("Failed to update status");
        fetchData(); // Revert changes
    }
  };

  const stats = useMemo(() => {
    return {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'Submitted' || t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        completed: tickets.filter(t => t.status === 'Completed' || t.status === 'Resolved').length
    };
  }, [tickets]);

if (loading) return <div className="tech-container">Loading workspace...</div>;

  return (
    <div className="tech-container">
      <div className="tech-header">
        <div>
            <h2 className="tech-title">🔧 Technician Workspace</h2>
            <p className="tech-subtitle">Manage repairs and update workflow status.</p>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="tech-stats-grid">
        <div className="tech-stat-card">
            <div className="tech-stat-label">Total Assigned</div>
            <div className="tech-stat-value">{stats.total}</div>
        </div>
        <div className="tech-stat-card">
            <div className="tech-stat-label" style={{color: '#b45309'}}>In Progress</div>
            <div className="tech-stat-value" style={{color: '#b45309'}}>{stats.inProgress}</div>
        </div>
        <div className="tech-stat-card">
            <div className="tech-stat-label" style={{color: '#15803d'}}>Completed</div>
            <div className="tech-stat-value" style={{color: '#15803d'}}>{stats.completed}</div>
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
                <th>Issue</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket._id}>
                  <td style={{fontFamily: 'monospace', fontWeight: 'bold'}}>{ticket.ticketId || ticket._id.substring(0,8)}</td>
                  <td>
                    <div style={{fontWeight: '600'}}>{ticket.product?.model || ticket.model}</div>
                    <div style={{fontSize: '0.8rem', color:'#6b7280'}}>{ticket.product?.type || ticket.type}</div>
                  </td>
                  <td>{ticket.issue?.description || ticket.description}</td>
                  <td>
                    {/* Badge Εμφάνιση */}
                    <span className={`badge-${ticket.status === 'In Progress' ? 'progress' : ticket.status === 'Completed' ? 'completed' : 'submitted'}`}>
                        {ticket.status}
                    </span>
                  </td>
                  <td>
                    {/* Dropdown για αλλαγή Status */}
                    <select 
                        className="tech-select"
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    >
                        <option value="Submitted" disabled>Submitted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Repair Complete</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
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