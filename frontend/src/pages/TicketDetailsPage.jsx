import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, updateTicketStatus } from '@/services/ticketService';
import { useAccess } from '@/context/AccessContext';
import './TicketDetails.css';

const STEPS = ['Submitted', 'In Progress', 'Completed', 'Closed'];

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
      fetchTicket(); // Revert
    }
  };

  // Υπολογισμός Timeline Progress
  const getCurrentStepIndex = (status) => {
    if (!status) return 0;
    if (status === 'Pending Validation') return 0;
    if (status === 'Waiting for Parts') return 1;
    if (status === 'Cancelled') return -1;
    
    const idx = STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) return <div className="td-container">Loading details...</div>;
  if (error) return <div className="td-container" style={{color:'red'}}>{error}</div>;
  if (!ticket) return null;

  const stepIndex = getCurrentStepIndex(ticket.status);
  const isCancelled = ticket.status === 'Cancelled';

  return (
    <div className="td-container">
      <button className="td-back-btn" onClick={() => navigate(-1)}>
        ← Back to Dashboard
      </button>

      <div className="td-card">
        {/* Header */}
        <div className="td-header">
          <div className="td-title">
            <h1>Repair Request</h1>
            <div className="td-id">ID: {ticket.ticketId || ticket._id}</div>
          </div>
          <div className={`badge-${ticket.status.toLowerCase().replace(/ /g,'-')} td-status-badge`}>
            {ticket.status}
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
            <div className="td-timeline">
                <div className="td-progress-bar">
                    <div 
                        className="td-progress-fill" 
                        style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
                    ></div>
                </div>
                {STEPS.map((step, idx) => (
                    <div key={step} className={`td-step ${idx <= stepIndex ? (idx === stepIndex ? 'active' : 'completed') : ''}`}>
                        <div className="td-step-circle">
                            {idx < stepIndex ? '✓' : idx + 1}
                        </div>
                        <div className="td-step-label">{step}</div>
                    </div>
                ))}
            </div>
        )}

        <div className="td-grid">
          {/* Main Content */}
          <div className="td-main">
            <div className="td-section">
                <div className="td-section-title">Issue Description</div>
                <div className="td-text">{ticket.issue.description}</div>
            </div>
            
            <div className="td-section">
                <div className="td-section-title">Product Details</div>
                <div className="td-text">
                    <strong>Model:</strong> {ticket.product.model} <br/>
                    <strong>Serial Number:</strong> {ticket.product.serialNumber} <br/>
                    <strong>Category:</strong> {ticket.issue.category}
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="td-sidebar">
            <div className="td-section">
                <div className="td-section-title">Date Submitted</div>
                <div className="td-text">{new Date(ticket.createdAt).toLocaleString()}</div>
            </div>

            {/* TECHNICIAN ONLY CONTROLS */}
            {(user.role === 'Technician' || user.role === 'Admin') && (
                <div className="td-tech-box">
                    <div className="td-section-title" style={{color: '#0369a1'}}>🔧 Technician Actions</div>
                    <label style={{fontSize:'12px', display:'block'}}>Update Workflow Status:</label>
                    <select 
                        className="td-tech-select" 
                        value={ticket.status} 
                        onChange={handleStatusChange}
                    >
                        <option value="Submitted">Submitted</option>
                        <option value="Pending Validation">Pending Validation</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Parts">Waiting for Parts</option>
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
  );
}