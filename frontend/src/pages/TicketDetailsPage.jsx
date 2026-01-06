import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  updateTicketStatus,
  addInternalComment,
} from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext";
import "./TicketDetails.css";

const STEPS = ['Submitted', 'Shipping', 'In Progress', 'Shipped Back', 'Completed'];

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAccess();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const getCurrentStepIndex = (status) => {
    if (!status) return 0;
    switch (status) {
      case 'Submitted': return 0;
      case 'Pending Validation': 
      case 'Waiting for Parts': 
      case 'In Progress': return 1;
      case 'Completed': return 2;
      case 'Closed': return 3;
      case 'Cancelled': return -1;
      default: return 0;
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSavingComment(true);
      const updated = await addInternalComment(id, commentText);
      setTicket(updated);
      setCommentText("");
    } catch (err) {
      alert("Failed to add internal comment.");
    } finally {
      setSavingComment(false);
    }
  };

  // Fetch Ticket
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      setError("Ticket not found or unauthorized.");
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
      setTicket((prev) => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
    } catch (err) {
      alert("Failed to update status");
      fetchTicket();
    }
  };

  if (loading) return <div className="td-container">Loading...</div>;
  if (error)
    return (
      <div className="td-container" style={{ color: "red" }}>
        {error}
      </div>
    );
  if (!ticket) return null;

  // Repair ή Return
  const requestType = ticket.serviceType || "Repair";
  const currentStep = getCurrentStepIndex(ticket.status);

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

            <div
              className={`td-status-badge badge-${(ticket.status || "submitted")
                .toLowerCase()
                .replace(/ /g, "-")}`}
            >
              {ticket.status}
            </div>
          </div>

          {/* --- TIMELINE SECTION --- */}
          {currentStep !== -1 && (
            <div className="td-timeline">
                <div className="td-progress-bar">
                    <div 
                        className="td-progress-fill" 
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    ></div>
                </div>
                {STEPS.map((step, index) => (
                    <div 
                        key={step} 
                        className={`td-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                    >
                        <div className="td-step-circle">
                            {index < currentStep ? '✓' : index + 1}
                        </div>
                        <div className="td-step-label">{step}</div>
                    </div>
                ))}
            </div>
          )}

          <div className="td-content">
            <div className="td-grid">
              <div className="td-main">
                <div className="td-section">
                  <div className="td-section-title">Description</div>
                  {user?.role !== "Customer" && (
                    <div className="td-section">
                      <div className="td-section-title">Internal Comments</div>

                      <div className="td-comments-list">
                        {ticket?.internalComments?.length ? (
                          ticket.internalComments.map((c, idx) => (
                            <div key={idx} className="td-comment">
                              <div className="td-comment-meta">
                                <strong>
                                  {c?.by?.fullName ||
                                    c?.by?.email?.split("@")[0] ||
                                    "User"}
                                </strong>
                                <span>
                                  {c?.createdAt
                                    ? new Date(c.createdAt).toLocaleString()
                                    : ""}
                                </span>
                              </div>
                              <div className="td-comment-text">{c.text}</div>
                            </div>
                          ))
                        ) : (
                          <div className="td-text">
                            No internal comments yet.
                          </div>
                        )}
                      </div>

                      <div className="td-comment-box">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write an internal note (not visible to customers)…"
                          disabled={savingComment}
                        />
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={savingComment || !commentText.trim()}
                          className="td-comment-btn"
                        >
                          {savingComment ? "Saving..." : "Add Comment"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="td-text">
                    {ticket.issue?.description ||
                      ticket.description ||
                      "No description provided."}
                  </div>
                </div>

                <div className="td-section">
                  <div className="td-section-title">Product Info</div>
                  <div className="td-text">
                    <strong>Model:</strong> {ticket.product?.model} <br />
                    <strong>Serial:</strong> {ticket.product?.serialNumber}{" "}
                    <br />
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