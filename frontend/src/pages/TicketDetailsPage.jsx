import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  updateTicketStatus,
  addInternalComment,
  escalateTicket,
} from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext";
import { useNotification } from "@/context/NotificationContext";
import "./TicketDetails.css";

// logic : define strict allowed transitions matching backend exactly
const STATUS_TRANSITIONS = {
  "Submitted": ["Pending Validation", "Shipping", "In Progress", "Cancelled"],
  "Pending Validation": ["In Progress", "Cancelled", "Completed"],
  "Shipping": ["In Progress", "Cancelled"], 
  "In Progress": ["Waiting for Parts", "Shipped Back", "Ready for Pickup", "Completed", "Cancelled"],
  "Waiting for Parts": ["In Progress","Ready for Pickup","Cancelled"],
  "Shipped Back": ["Completed", "Cancelled"],
  "Ready for Pickup": ["Completed", "Cancelled"],
  "Completed": ["Closed"],
  "Closed": [],
  "Cancelled": [],
};

// logic : helper to list all statuses for admin usage
const ALL_STATUSES = Object.keys(STATUS_TRANSITIONS);

// logic : helper for timeline visualization
function normalizeStatus(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).toLowerCase();
  if (s.includes("submitted")) return "Submitted";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("validation")) return "Pending Validation";
  if (s.includes("parts")) return "Waiting for Parts";
  if (s.includes("shipping") && !s.includes("back")) return "Shipping";
  if (s.includes("shipped back")) return "Shipped Back";
  if (s.includes("pickup")) return "Ready for Pickup";
  if (s.includes("complete")) return "Completed";
  return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAccess();
  const { showNotification } = useNotification();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // logic : comment state
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentType, setCommentType] = useState("Note");

  // logic : lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // logic : fetch ticket data
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

  // logic : restore CSS class helper for comments
  const getCommentTypeClass = (type) => {
    switch (type) {
      case "Waiting for Parts":
        return "td-chip-waiting";
      case "Escalation":
        return "td-chip-escalation";
      case "SLA Risk":
        return "td-chip-sla";
      default:
        return "td-chip-note";
    }
  };

  // logic : status update handler
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      setTicket((prev) => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
      if (newStatus === "Completed") {
        showNotification("An email has been sent to the customer that the process is completed successfully.", "success");
      }
    } catch (err) {
      showNotification(err?.response?.data?.message || "Failed to update status", "error");
      fetchTicket(); // revert
    }
  };

  const handleEscalate = async () => {
    try {
      const updated = await escalateTicket(id);
      setTicket(updated);
      showNotification("Ticket escalated successfully!", "success");
    } catch (err) {
      showNotification("Failed to escalate ticket.", "error");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSavingComment(true);
      const updated = await addInternalComment(id, commentText, commentType);
      setTicket(updated);
      setCommentText("");
    } catch (err) {
      showNotification("Failed to add comment.", "error");
    } finally {
      setSavingComment(false);
    }
  };

  // logic : lightbox handlers
  const openLightbox = (url) => {
    setSelectedImage(url);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  if (loading) return <div className="td-container">Loading...</div>;
  if (error) return <div className="td-container" style={{ color: "red" }}>{error}</div>;
  if (!ticket) return null;

  // logic : calculate allowed next statuses
  const currentStatus = ticket.status || "Submitted";
  const requestType = ticket.serviceType || "Repair";
  const isDropoff = ticket.deliveryMethod && ticket.deliveryMethod.toLowerCase() !== "courier";

  let allowedNextStatuses = [];

  if (user) {
    if (user.role === "Technician") {
      // logic : technicians follow strict graph (forward only)
      allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
    } else {
      // logic : staff/admin can jump to any status
      allowedNextStatuses = ALL_STATUSES.filter((s) => s !== currentStatus);
    }
  }

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

          {/* --- TIMELINE --- */}
          {normalizeStatus(ticket.status) !== "Cancelled" &&
            normalizeStatus(ticket.status) !== "Closed" && (
              <div className="td-timeline-wrapper">
                <div className="td-timeline-container">
                  {(() => {
                    const steps = isDropoff
                      ? ["Submitted", "In Progress", "Ready for Pickup", "Completed"]
                      : ["Submitted", "Shipping", "In Progress", "Shipped Back", "Completed"];

                    let activeStatus = normalizeStatus(ticket.status);
                    
                    if (activeStatus === "Pending Validation" || activeStatus === "Waiting for Parts") {
                      activeStatus = "In Progress";
                    }

                    const currentIndex = steps.findIndex((s) => s === activeStatus);
                    const progressWidth = currentIndex < 0 ? 0 : ((currentIndex + 1) / steps.length) * 100;

                    return (
                      <>
                        <div className="td-timeline-progress-track">
                          <div
                            className="td-timeline-progress-fill"
                            style={{ width: `${progressWidth}%` }}
                          ></div>
                        </div>

                        <div className="td-timeline-steps">
                          {steps.map((step, idx) => (
                            <div key={step} className="td-timeline-step">
                              <div
                                className={`td-timeline-step-circle ${
                                  step === activeStatus || idx <= currentIndex ? "active" : ""
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div
                                className={`td-timeline-step-label ${
                                  step === activeStatus ? "active" : ""
                                }`}
                              >
                                {step}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

          <div className="td-content">
            <div className="td-grid">
              {/* MAIN CONTENT */}
              <div className="td-main">
                {/* Description */}
                <div className="td-section">
                  <div className="td-section-title">Description</div>
                  <div className="td-text">
                    {ticket.issue?.description || ticket.description || "No description."}
                  </div>
                </div>

                {/* Attachments */}
                {ticket.issue?.attachments?.length > 0 && (
                  <div className="td-section">
                    <div className="td-section-title">Attachments</div>
                    <div className="td-attachments-grid">
                      {ticket.issue.attachments.map((file, index) => {
                        const cleanUrl = file.startsWith("http")
                          ? file
                          : `http://localhost:5050/${file.replace(/\\/g, "/")}`;
                        return (
                          <div
                            key={index}
                            className="td-attachment-item"
                            onClick={() => openLightbox(cleanUrl)}
                          >
                            <img
                              src={cleanUrl}
                              alt="Attachment"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Internal Comments */}
                {user?.role !== "Customer" && (
                  <div className="td-section">
                    <div className="td-section-title">Internal Comments</div>
                    <div className="td-comments-list">
                      {ticket.internalComments?.length ? (
                        ticket.internalComments.map((c, idx) => (
                          <div key={idx} className="td-comment">
                            <div className="td-comment-meta">
                              <strong>{c.by?.fullName || "User"}</strong>
                              <span className="td-comment-date">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                              <span className={`td-comment-chip ${getCommentTypeClass(c.type)}`}>
                                {c.type}
                              </span>
                            </div>
                            <div className="td-comment-text">{c.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="td-text">No internal comments yet.</div>
                      )}
                    </div>

                    <div className="td-comment-box">
                      <select
                        value={commentType}
                        onChange={(e) => setCommentType(e.target.value)}
                        className="td-comment-type"
                      >
                        <option value="Note">Note</option>
                        <option value="Waiting for Parts">Waiting for Parts</option>
                        <option value="Escalation">Escalation</option>
                        <option value="SLA Risk">SLA Risk</option>
                      </select>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add an internal note..."
                        disabled={savingComment}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={savingComment || !commentText.trim()}
                        className="td-comment-btn"
                      >
                        {savingComment ? "Saving..." : "Add Comment"}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Logistics */}
                <div className="td-section">
                  <div className="td-section-title">Logistics</div>
                  <div className="td-text">
                    <strong>Method:</strong> {isDropoff ? "Drop-off" : "Courier"} <br />
                    <strong>Address:</strong> {ticket.contactInfo?.address || "-"}, {ticket.contactInfo?.city || "-"} <br />
                    <strong>Contact:</strong> {ticket.contactInfo?.fullName} ({ticket.contactInfo?.phone})
                  </div>
                </div>
              </div>

              {/* SIDEBAR */}
              <div className="td-sidebar">
                <div className="td-section">
                  <div className="td-section-title">Product Info</div>
                  <div className="td-text">
                    <strong>Model:</strong> {ticket.product?.model} <br />
                    <strong>Serial:</strong> {ticket.product?.serialNumber} <br />
                    <strong>Type:</strong> {ticket.product?.type}
                  </div>
                </div>

                <div className="td-section">
                  <div className="td-section-title">Technician</div>
                  <div className="td-text">
                    {ticket.assignedRepairCenter ? (
                      <>
                        {ticket.assignedRepairCenter.fullName} <br />
                        <small>{ticket.assignedRepairCenter.email}</small>
                      </>
                    ) : (
                      <span style={{ color: "#999" }}>Pending Assignment</span>
                    )}
                  </div>
                </div>

                {/* --- RETURN LOGIC BOX --- */}
                {ticket.serviceType === "Return" && (
                  <div className="td-section return-alert-box">
                    <div className="td-section-title" style={{ color: "#d97706" }}>
                      Return Request Details
                    </div>
                    <div className="td-text">
                      <strong>Customer Preference:</strong> <br />
                      <span className="badge-preference">
                        {ticket.customerSelection || "Not Specified"}
                      </span>
                      <div style={{ marginTop: "15px", borderTop: "1px dashed #fcd34d", paddingTop: "10px" }}>
                        <strong>Validation Check:</strong> <br />
                        {(() => {
                          const pDate = new Date(ticket.product?.purchaseDate);
                          const created = new Date(ticket.createdAt);
                          const diff = Math.ceil((created - pDate) / (1000 * 60 * 60 * 24));
                          return (
                            <span style={{ fontSize: "13px", color: "#666" }}>
                              Purchased <b>{diff} days</b> before request.
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION PANEL */}
                {(user.role === "Technician" || user.role === "Admin" || user.role === "Employee") && (
                  <div className="td-section action-box">
                    <div className="td-section-title" style={{ color: "#0369a1" }}>
                      Update Status
                    </div>
                    
                    <select
                      value={currentStatus}
                      onChange={handleStatusChange}
                      style={{ padding: "10px", width: "100%", borderRadius: "6px", border: "1px solid #ccc" }}
                      disabled={allowedNextStatuses.length === 0 && user.role === "Technician"}
                    >
                      <option value={currentStatus} disabled>
                        {currentStatus} (Current)
                      </option>
                      {allowedNextStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    {user.role === "Technician" && allowedNextStatuses.length === 0 && (
                      <div style={{ marginTop: "5px", color: "orange", fontSize: "0.85rem" }}>
                        No forward actions available.
                      </div>
                    )}

                    {user.role === "Technician" && (
                      <button
                        type="button"
                        onClick={handleEscalate}
                        disabled={ticket.escalated}
                        className={`escalate-btn ${ticket.escalated ? "escalated" : ""}`}
                        style={{ width: "100%", marginTop: "10px", padding: "10px", backgroundColor: ticket.escalated ? "#fee2e2" : "#ef4444", color: ticket.escalated ? "#991b1b" : "white", border: "none", borderRadius: "6px", cursor: ticket.escalated ? "default" : "pointer" }}
                      >
                        {ticket.escalated ? "🚨 Already Escalated" : "🚨 Escalate Ticket"}
                      </button>
                    )}
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
            <img src={selectedImage} alt="Full view" />
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}