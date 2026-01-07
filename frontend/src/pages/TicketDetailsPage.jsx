import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicket, updateTicketStatus, addInternalComment } from "@/services/ticketService";
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

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getCurrentStepIndex = (status, isDropoff) => {
    if (!status) return 0;
    const steps = isDropoff ? STEPS_DROPOFF : STEPS_COURIER;
    
    // Normalization logic
    let normStatus = status;
    if (status === 'Pending Validation' || status === 'Waiting for Parts') normStatus = 'In Progress';
    
    const index = steps.indexOf(normStatus);
    if (index !== -1) return index;

    if (['Cancelled', 'Closed', 'Rejected'].includes(status)) return -1;
    return 0; // Default fallback
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      console.error(err);
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
      setTicket((prev) => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
    } catch (err) {
      alert("Failed to update status");
      fetchTicket();
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
      alert("Failed to add comment.");
    } finally {
      setSavingComment(false);
    }
  };

  // Lightbox Handlers
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

  // --- DATA NORMALIZATION (Safe Access) ---
  const requestType = ticket.serviceType || "Repair";
  // Check specifically inside contactInfo first (New Schema), then root (Old Schema backup)
  const deliveryMethod = ticket.deliveryMethod || 'courier';
  const address = ticket.contactInfo?.address || ticket.address || '-';
  const city = ticket.contactInfo?.city || ticket.city || '-';
  
  const isDropoff = deliveryMethod === 'dropoff' || address === 'Store Drop-off';
  const currentStep = getCurrentStepIndex(ticket.status, isDropoff);
  const STEPS = isDropoff ? STEPS_DROPOFF : STEPS_COURIER;

  return (
    <div className="td-page">
      <div className="td-container">
        <button onClick={() => navigate(-1)} className="td-back-btn">← Back</button>

        <div className="td-card">
          {/* HEADER */}
          <div className="td-header">
            <div className="td-title">
              <h1>{requestType} Request</h1>
              <div className="td-id">ID: {ticket.ticketId || ticket._id}</div>
            </div>
            <div className={`td-status-badge badge-${(ticket.status || "submitted").toLowerCase().replace(/ /g, "-")}`}>
              {ticket.status}
            </div>
          </div>

          {/* TIMELINE */}
          {currentStep !== -1 && (
            <div className="td-timeline">
                <div className="td-progress-bar">
                    <div className="td-progress-fill" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
                </div>
                {STEPS.map((step, index) => (
                    <div key={step} className={`td-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}>
                        <div className="td-step-circle">{index < currentStep ? '✓' : index + 1}</div>
                        <div className="td-step-label">{step}</div>
                    </div>
                ))}
            </div>
          )}

          <div className="td-content">
            <div className="td-grid">
              <div className="td-main">
                {/* DESCRIPTION */}
                <div className="td-section">
                  <div className="td-section-title">Description</div>
                  
                  {/* Internal Comments (Tech Only) */}
                  {user?.role !== "Customer" && (
                    <div className="td-internal-wrapper" style={{marginBottom:'20px', borderBottom:'1px solid #eee'}}>
                      <div className="td-section-title">Internal Comments</div>
                      <div className="td-comments-list">
                        {ticket.internalComments?.length ? (
                          ticket.internalComments.map((c, idx) => (
                            <div key={idx} className="td-comment">
                              <div className="td-comment-meta">
                                <strong>{c.by?.fullName || "User"}</strong>
                                <span>{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="td-comment-text">{c.text}</div>
                            </div>
                          ))
                        ) : (<div className="td-text">No comments yet.</div>)}
                      </div>
                      <div className="td-comment-box">
                        <textarea 
                          value={commentText} 
                          onChange={(e) => setCommentText(e.target.value)} 
                          placeholder="Internal note..." 
                        />
                        <button onClick={handleAddComment} disabled={savingComment || !commentText.trim()}>
                          {savingComment ? "..." : "Add"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="td-text">
                    {ticket.issue?.description || ticket.description || "No description."}
                  </div>
                </div>

                {/* ATTACHMENTS (Images) */}
                {ticket.issue?.attachments && ticket.issue.attachments.length > 0 && (
                  <div className="td-section">
                    <div className="td-section-title">Attachments</div>
                    <div className="td-attachments-grid">
                      {ticket.issue.attachments.map((file, index) => {
                         const cleanUrl = `http://localhost:5050/${file}`; // Adjust port if needed
                         return (
                            <div key={index} className="td-attachment-item" onClick={() => openLightbox(cleanUrl)}>
                              <img src={cleanUrl} alt="Attachment" onError={(e) => e.target.style.display='none'}/>
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

              {/* SIDEBAR */}
              <div className="td-sidebar">
                
                {/* //christos [return & refund UI ] */}
                {ticket.serviceType === 'Return' && (
                  <div className="td-section return-alert-box">
                    <div className="td-section-title" style={{ color: '#d97706' }}>
                       Return Request Details
                    </div>
                    <div className="td-text">
                      <strong>Customer Preference:</strong> <br/>
                      <span className="badge-preference">
                        {ticket.customerSelection || 'Not Specified'}
                      </span>
                      
                      <div style={{ marginTop: '15px', borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>
                         <strong>Validation Check:</strong> <br/>
                         {(() => {
                            const pDate = new Date(ticket.product?.purchaseDate);
                            const created = new Date(ticket.createdAt);
                            const diff = Math.ceil((created - pDate) / (1000 * 60 * 60 * 24));
                            return (
                              <span style={{ fontSize: '13px', color: '#666' }}>
                                Purchased <b>{diff} days</b> before request.
                              </span>
                            );
                         })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="td-section">
                    <div className="td-section-title">Logistics</div>
                    <div className="td-text">
                        <strong>Method:</strong> {isDropoff ? 'Drop-off' : 'Courier'} <br/>
                        {!isDropoff && (
                            <>
                              <strong>Address:</strong> {address}, {city} <br/>
                            </>
                        )}
                        <strong>Contact:</strong> {ticket.contactInfo?.fullName} <br/>
                        <strong>Phone:</strong> {ticket.contactInfo?.phone || '-'}
                    </div>
                </div>

                {/* Assigned Tech */}
                <div className="td-section">
                    <div className="td-section-title">Assigned Technician</div>
                    <div className="td-text">
                        {ticket.assignedRepairCenter ? (
                            <>
                            <strong>Name:</strong> {ticket.assignedRepairCenter.fullName} <br/>
                            <span style={{fontSize:'0.85rem', color:'#666'}}>{ticket.assignedRepairCenter.email}</span>
                            </>
                        ) : (
                            <span style={{color: '#999'}}>Pending Assignment...</span>
                        )}
                    </div>
                </div>

                {/* Actions (Tech/Admin) */}
                {(['Technician', 'Admin', 'Manager', 'Employee'].includes(user?.role)) && (
                    <div className="td-section">
                        <div className="td-section-title" style={{color:'#0369a1'}}>Action</div>
                        <select value={ticket.status} onChange={handleStatusChange} style={{padding:'8px', width:'100%'}}>
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

      {/* Lightbox Modal */}
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