import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, updateTicketStatus, assignTicket } from '../../services/ticketService';
import styles from './StaffDashboard.module.css';


function getServiceType(t) { 
  return t.serviceType || t.type || "Repair"; 
}

const StaffDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const navigate = useNavigate();

  const technicians = [
    { id: '695b284f2c732806f5047901', name: 'Bob Smartphone', email: 'mobile@demo.com' },
    { id: '695b287f2c732806f5047903', name: 'George Smartphone', email: 'mobile2@demo.com' },
    { id: '695b288c2c732806f5047905', name: 'John Laptop', email: 'laptop@demo.com' },
    { id: '695b2ec94d069c998bd864a2', name: 'Xaris', email: 'tv@demo.com' }
  ];

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets();
      const list = Array.isArray(data) ? data : (data.tickets || []);
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
      alert("Technician assigned successfully!");
      fetchTickets(); 
    } catch (error) {
      alert("Assignment failed.");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
    } catch (error) {
      alert("Status update failed.");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const customerName = (ticket.customer?.fullName || ticket.contactInfo?.fullName || "Guest").toLowerCase();
      const ticketId = (ticket.ticketId || ticket._id).toLowerCase();
      const search = searchTerm.toLowerCase();
      return customerName.includes(search) || ticketId.includes(search);
    });
  }, [tickets, searchTerm]);

  const stats = useMemo(() => ({
    total: tickets.length,
    active: tickets.filter(t => ['Submitted', 'Pending Validation', 'In Progress'].includes(t.status)).length,
    completed: tickets.filter(t => ['Completed', 'Closed'].includes(t.status)).length
  }), [tickets]);

  if (loading) return <div className={styles.container}>Loading Workspace...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>👨‍💼 Staff Workspace</h2>
        <p className={styles.subtitle}>Management & Technical Allocation</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Requests</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#f59e0b' }}>
          <div className={styles.statLabel} style={{ color: '#b45309' }}>Active</div>
          <div className={styles.statValue}>{stats.active}</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#10b981' }}>
          <div className={styles.statLabel} style={{ color: '#15803d' }}>Completed</div>
          <div className={styles.statValue}>{stats.completed}</div>
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
            {filteredTickets.map((ticket) => (
              <tr key={ticket._id}>
                <td style={{ fontWeight: 'bold' }}>
                   #{ticket.ticketId || ticket._id.substring(ticket._id.length - 8).toUpperCase()}
                </td>
                
                <td>
                  <div style={{ fontWeight: "600" }}>{ticket.customer?.fullName || ticket.contactInfo?.fullName || 'Guest'}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{ticket.customer?.email || ticket.contactInfo?.email}</div>
                </td>

                <td>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px',
                    backgroundColor: getServiceType(ticket) === 'Return' ? '#fef2f2' : '#eff6ff',
                    color: getServiceType(ticket) === 'Return' ? '#dc2626' : '#2563eb',
                    border: '1px solid currentColor'
                  }}>
                    {getServiceType(ticket).toUpperCase()}
                  </span>
                </td>

                {/* ASSIGN TECHNICIAN BY EMAIL */}
                <td>
                  <select 
                    className={styles.statusSelect}
                    value={ticket.assignedRepairCenter?._id || ticket.assignedRepairCenter || ""}
                    onChange={(e) => handleAssign(ticket._id, e.target.value)}
                    style={{ border: '1px solid #6366f1' }}
                  >
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
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
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Pending Validation">Pending Validation</option>
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
                  <button className={styles.detailsBtn} onClick={() => navigate(`/tickets/${ticket._id}`)}>
                    View
                  </button>
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