import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, updateTicketStatus } from '@/services/ticketService';
import { useAccess } from '@/context/AccessContext';
import './TicketDetails.css';

const STEPS = ['Submitted', 'Shipping', 'In Progress', 'Shipped Back', 'Completed'];

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAccess();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Ticket
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      setError('Ticket not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Status change Handler (Technician)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      // Optimistic Update
      setTicket(prev => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
    } catch (err) {
      alert("Failed to update status");
      fetchTicket();
    }
  };

  if (loading) return <div className="td-container">Loading...</div>;
  if (error) return <div className="td-container" style={{color:'red'}}>{error}</div>;
  if (!ticket) return null;

  // Repair ή Return
  const requestType = ticket.serviceType || "Repair"; 

  return (
    <div className="td-page">
      <div className="td-container">
        
        <button onClick={() => navigate(-1)} className="td-back-btn">
          ← Back to Dashboard
        </button>

        <div className="td-card">
          {/* Header */}
          <div className="td-header">
            <div className="td-title">
              <h1>{requestType} Request</h1>
              <div className="td-id">ID: {ticket.ticketId || ticket._id}</div>
            </div>
            
            <div className={`td-status-badge badge-${(ticket.status || 'submitted').toLowerCase().replace(/ /g,'-')}`}>
                {ticket.status}
            </div>
          </div>

          <div className="td-content">
            <div className="td-grid">
                <div className="td-main">
                    <div className="td-section">
                        <div className="td-section-title">Description</div>
                        <div className="td-text">
                            {ticket.issue?.description || ticket.description || "No description provided."}
                        </div>
                    </div>
                    
                    <div className="td-section">
                        <div className="td-section-title">Product Info</div>
                        <div className="td-text">
                            <strong>Model:</strong> {ticket.product?.model} <br/>
                            <strong>Serial:</strong> {ticket.product?.serialNumber} <br/>
                            <strong>Type:</strong> {ticket.product?.type}
                        </div>
                    </div>
                </div>

                <div className="td-sidebar">
                    <div className="td-section">
                        <div className="td-section-title">Request Details</div>
                        <div className="td-text">
                            <strong>Type:</strong> {requestType} <br/>
                            <strong>Date:</strong> {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    
                    {/* Τεχνικά controls (αν ο χρήστης είναι Admin/Technician) */}
                    {(user.role === 'Technician' || user.role === 'Admin') && (
                        <div className="td-section">
                            <div className="td-section-title" style={{color:'#0369a1'}}>Action</div>
                            <select value={ticket.status} onChange={handleStatusChange} style={{padding:'5px', width:'100%'}}>
                                <option value="Submitted">Submitted</option>
                                <option value="Shipping">Shipping</option>
                                <option value="Pending Validation">Pending Validation</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting for Parts">Waiting for Parts</option>
                                <option value="Shipped Back">Shipped Back</option>
                                <option value="Completed">Completed</option>
                                <option value="Closed">Closed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}