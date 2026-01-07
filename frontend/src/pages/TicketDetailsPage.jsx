import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  updateTicketStatus,
  addInternalComment,
} from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext";
import "./TicketDetails.css";

const STEPS_COURIER = ['Submitted', 'Shipping', 'In Progress', 'Shipped Back', 'Completed'];
const STEPS_DROPOFF = ['Submitted', 'In Progress', 'Ready for Pickup', 'Completed'];

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAccess();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const getCurrentStepIndex = (status, isDropoff) => {
    if (!status) return 0;
    
    if (isDropoff) {
      switch (status) {
        case 'Submitted': return 0;
        case 'Pending Validation': 
        case 'Waiting for Parts': 
        case 'In Progress': return 1;
        case 'Ready for Pickup': return 2;
        case 'Completed': return 3;
        case 'Cancelled':
        case 'Closed': return -1;
        default: return 0;
      }
    } else {
      switch (status) {
        case 'Submitted': return 0;
        case 'Shipping': return 1;
        case 'Pending Validation': 
        case 'Waiting for Parts': 
        case 'In Progress': return 2;
        case 'Shipped Back': return 3;
        case 'Completed': return 4;
        case 'Cancelled':
        case 'Closed': return -1;
        default: return 0;
      }
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

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      //optimistic update
      setTicket((prev) => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
    } catch (err) {
      alert("Failed to update status");
      fetchTicket();
    }
  };

  //christos lightbox handlers
  const openLightbox = (imgUrl) => {
    setSelectedImage(imgUrl);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  if (loading) return <div className="td-container">Loading...</div>;
  if (error) return <div className="td-container" style={{ color: "red" }}>{error}</div>;
  if (!ticket) return null;

  const requestType = ticket.serviceType || "Repair";
  const isDropoff = ticket.deliveryMethod === 'dropoff' || ticket.address === 'Store Drop-off' || ticket.city === '-';
  const STEPS = isDropoff ? STEPS_DROPOFF : STEPS_COURIER;
  const currentStep = getCurrentStepIndex(ticket.status, isDropoff);

  return (
    <div className="td-page">
      <div className="td-container">
        <button onClick={() => navigate(-1)} className="td-back-btn">
          ← Back to Dashboard
        </button>

        <div className="td-card">
          <div className="td-header">
            <div className="td-title">
              <h1>{requestType} Request</h1>
              <div className="td-id">ID: {ticket.ticketId || ticket._id}</div>
            </div>

            <div className={`td-status-badge badge-${(ticket.status || "submitted").toLowerCase().replace(/ /g, "-")}`}>
              {ticket.status}
            </div>
          </div>

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
                  
                  {/* internal comments logic (tech only) */}
                  {user?.role !== "Customer" && (
                    <div className="td-section" style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px'}}>
                      <div className="td-section-title">Internal Comments</div>

                      <div className="td-comments-list">
                        {ticket?.internalComments?.length ? (
                          ticket.internalComments.map((c, idx) => (
                            <div key={idx} className="td-comment">
                              <div className="td-comment-meta">
                                <strong>{c?.by?.fullName || c?.by?.email?.split("@")[0] || "User"}</strong>
                                <span>{c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</span>
                              </div>
                              <div className="td-comment-text">{c.text}</div>
                            </div>
                          ))
                        ) : (
                          <div className="td-text">No internal comments yet.</div>
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
                    {ticket.issue?.description || ticket.description || "No description provided."}
                  </div>
                </div>

                {/* christos attachments gallery */}
                {ticket.issue?.attachments && ticket.issue.attachments.length > 0 && (
                  <div className="td-section">
                    <div className="td-section-title">Attachments</div>
                    <div className="td-attachments-grid">
                      {ticket.issue.attachments.map((file, index) => {
                         //ensure valid url for static folder
                         const cleanUrl = `http://localhost:5050/${file}`;

                         return (
                            <div key={index} className="td-attachment-item" onClick={() => openLightbox(cleanUrl)}>
                              <img src={cleanUrl} alt={`Attachment ${index + 1}`} />
                            </div>
                         );
                      })}
                    </div>
                  </div>
                )}

                <div className="td-section">
                  <div className="td-section-title">Product Info</div>
                  <div className="td-text">
                    <strong>Model:</strong> {ticket.product?.model} <br />
                    <strong>Serial:</strong> {ticket.product?.serialNumber} <br />
                    <strong>Type:</strong> {ticket.product?.type}
                  </div>
                </div>
              </div>

                <div className="td-sidebar">
                    {/* christos show assigned tech details */}
                    <div className="td-section">
                        <div className="td-section-title">Assigned Technician</div>
                        <div className="td-text">
                           {ticket.assignedRepairCenter ? (
                             <>
                               <strong>Name:</strong> {ticket.assignedRepairCenter.fullName || ticket.assignedRepairCenter.name} <br/>
                               {ticket.assignedRepairCenter.email && (
                                 <><strong>Email:</strong> {ticket.assignedRepairCenter.email} <br/></>
                               )}
                               {ticket.assignedRepairCenter.specialty && (
                                 <><strong>Specialty:</strong> {ticket.assignedRepairCenter.specialty}</>
                               )}
                             </>
                           ) : (
                             <span style={{color: '#999'}}>Pending Assignment...</span>
                           )}
                        </div>
                    </div>

                    <div className="td-section">
                        <div className="td-section-title">Request Details</div>
                        <div className="td-text">
                            <strong>Type:</strong> {requestType} <br/>
                            <strong>Date:</strong> {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    
                    {(user.role === 'Technician' || user.role === 'Admin' || user.role === 'Manager') && (
                        <div className="td-section">
                            <div className="td-section-title" style={{color:'#0369a1'}}>Action</div>
                            <select value={ticket.status} onChange={handleStatusChange} style={{padding:'5px', width:'100%'}}>
                                <option value="Submitted">Submitted</option>
                                {!isDropoff && <option value="Shipping">Shipping</option>}
                                <option value="Pending Validation">Pending Validation</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting for Parts">Waiting for Parts</option>
                                {isDropoff && <option value="Ready for Pickup">Ready for Pickup</option>}
                                {!isDropoff && <option value="Shipped Back">Shipped Back</option>}
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

      {/* simple lightbox modal */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full size" />
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          </div>
        </div>
      )}

    </div>
  );
}