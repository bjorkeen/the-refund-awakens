import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import styles from './StaffDashboard.module.css';

const StaffDashboard = () => {
  // State for tickets and loading status
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tickets on component mount
  useEffect(() => {
    const fetchAllTickets = async () => {
      try {
        // Requires backend endpoint: GET /api/tickets/all
        const response = await api.get('/tickets/all'); 
        setTickets(response.data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        // Fallback mock data for development visibility
        setTickets([
          { _id: '1', product: 'iPhone X', issue: 'Screen', status: 'pending', user: { fullName: 'Nikos A.' } },
          { _id: '2', product: 'MacBook', issue: 'Battery', status: 'in_progress', user: { fullName: 'Maria K.' } }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTickets();
  }, []);

  // Handle status updates
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      // API call to update status
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      
      // Optimistic UI update
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
      alert('Status updated successfully');
    } catch (error) {
      console.error("Update failed:", error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{padding:'20px'}}>Loading dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Technician Dashboard</h1>
        <span>Total Tickets: {tickets.length}</span>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Device</th>
              <th>Issue</th>
              <th>Current Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id} className={styles[`status-${ticket.status}`]}>
                <td>#{ticket._id.slice(-6)}</td>
                <td>{ticket.user?.fullName || 'Unknown'}</td>
                <td>{ticket.product}</td>
                <td>{ticket.issue}</td>
                
                <td style={{fontWeight:'bold', textTransform:'uppercase', fontSize:'0.8rem'}}>
                  {ticket.status.replace('_', ' ')}
                </td>

                <td>
                  <select 
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    className={styles.statusSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {tickets.length === 0 && (
          <p style={{padding:'20px', textAlign:'center', color:'#666'}}>No tickets found.</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;