import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  updateTicketStatus,
  addInternalComment,
} from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext";
import "./TicketDetails.css";

const STEPS = ["Submitted", "In Progress", "Completed", "Closed"];

const ALL_STATUSES = [
  "Submitted",
  "Pending Validation",
  "In Progress",
  "Waiting for Parts",
  "Shipping",
  "Shipped Back",
  "Ready for Pickup",
  "Completed",
  "Closed",
  "Cancelled",
];

const STATUS_TRANSITIONS = {
  Submitted: ["Pending Validation", "Cancelled"],
  "Pending Validation": ["In Progress", "Cancelled"],
  "In Progress": [
    "Waiting for Parts",
    "Shipping",
    "Ready for Pickup",
    "Completed",
    "Cancelled",
  ],
  "Waiting for Parts": ["In Progress", "Cancelled"],
  Shipping: ["Pending Validation", "In Progress", "Cancelled"],
  "Shipped Back": ["Completed"],
  "Ready for Pickup": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export default function TicketDetailsPage() {
  // hooks
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAccess();

  // state
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentType, setCommentType] = useState("Note");

  // Lightbox state (RESTORATION)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  // Handlers for Comments
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSavingComment(true);
      const updated = await addInternalComment(id, commentText, commentType);
      setTicket(updated);
      setCommentText("");
    } catch (err) {
      alert("Failed to add internal comment.");
    } finally {
      setSavingComment(false);
    }
  };

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

  // Status change Handler (Technician)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      // Optimistic Update
      setTicket((prev) => ({ ...prev, status: newStatus }));
      await updateTicketStatus(id, newStatus);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update status";
      alert(msg);
      fetchTicket();
    }
  };

  // Lightbox Handlers (RESTORATION)
  const openLightbox = (url) => {
    setSelectedImage(url);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  if (loading) return <div className="td-container">Loading...</div>;
  if (error)
    return (
      <div className="td-container" style={{ color: "red" }}>
        {error}
      </div>
    );
  if (!ticket) return null;

  // --- Helpers & Logic ---
  const currentStatus = ticket.status || "Submitted";
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
  const requestType = ticket.serviceType || "Repair";

  // Logistics logic (RESTORATION)
  const isDropoff = ticket.deliveryMethod === "Drop-off";
  const address = ticket.contactInfo?.address || "";
  const city = ticket.contactInfo?.city || "";

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

          <div className="td-content">
            <div className="td-grid">
              <div className="td-main">
                {/* 1. Description Section */}
                <div className="td-section">
                  <div className="td-section-title">Description</div>
                  <div className="td-text">
                    {ticket.issue?.description ||
                      ticket.description ||
                      "No description provided."}
                  </div>
                </div>

                {/* 2. Attachments Section (RESTORED) */}
                {ticket.issue?.attachments && ticket.issue.attachments.length > 0 && (
                  <div className="td-section">
                    <div className="td-section-title">Attachments</div>
                    <div className="td-attachments-grid">
                      {ticket.issue.attachments.map((file, index) => {
                        // Adjust URL based on your backend logic
                        const cleanUrl = file.startsWith("http")
                          ? file
                          : `http://localhost:5050/${file}`;
                        return (
                          <div
                            key={index}
                            className="td-attachment-item"
                            onClick={() => openLightbox(cleanUrl)}
                          >
                            <img
                              src={cleanUrl}
                              alt="Attachment"
                              onError={(e) =>
                                (e.target.style.display = "none")
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Internal Comments Section */}
                {user?.role !== "Customer" && (
                  <div className="td-section">
                    <div className="td-section-title">Internal Comments</div>

                    <div className="td-comments-list">
                      {ticket?.internalComments?.length ? (
                        ticket.internalComments.map((c, idx) => (
                          <div key={idx} className="td-comment">
                            <div className="td-comment-meta">
                              <div className="td-comment-meta-left">
                                <strong>
                                  {c?.by?.fullName ||
                                    c?.by?.email?.split("@")[0] ||
                                    "User"}
                                </strong>
                                <span
                                  className={`td-comment-chip ${getCommentTypeClass(
                                    c?.type
                                  )}`}
                                >
                                  {c?.type || "Note"}
                                </span>
                              </div>
                              <span>
                                {new Date(c.createdAt).toLocaleString()}
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
                        disabled={savingComment}
                        className="td-comment-type"
                      >
                        <option value="Note">Note</option>
                        <option value="Waiting for Parts">
                          Waiting for Parts
                        </option>
                        <option value="Escalation">Escalation</option>
                        <option value="SLA Risk">SLA Risk</option>
                      </select>

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

                {/* 4. Product Info */}
                <div className="td-section">
                  <div className="td-section-title">Product Info</div>
                  <div className="td-text">
                    <strong>Model:</strong> {ticket.product?.model} <br />
                    <strong>Serial:</strong> {ticket.product?.serialNumber}{" "}
                    <br />
                    <strong>Type:</strong> {ticket.product?.type}
                  </div>
                </div>

                {/* 5. Logistics Info (RESTORED) */}
                <div className="td-section">
                  <div className="td-section-title">Logistics</div>
                  <div className="td-text">
                    <strong>Method:</strong>{" "}
                    {isDropoff ? "Drop-off" : "Courier"} <br />
                    {!isDropoff && (
                      <>
                        <strong>Address:</strong> {address}, {city} <br />
                      </>
                    )}
                    <strong>Contact:</strong> {ticket.contactInfo?.fullName}{" "}
                    <br />
                    <strong>Phone:</strong> {ticket.contactInfo?.phone || "-"}
                  </div>
                </div>
              </div>

              {/* SIDEBAR */}
              <div className="td-sidebar">
                {/* Request Details */}
                <div className="td-section">
                  <div className="td-section-title">Request Details</div>
                  <div className="td-text">
                    <strong>Type:</strong> {requestType} <br />
                    <strong>Date:</strong>{" "}
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Assigned Technician (RESTORED) */}
                <div className="td-section">
                  <div className="td-section-title">Assigned Technician</div>
                  <div className="td-text">
                    {ticket.assignedRepairCenter ? (
                      <>
                        <strong>Name:</strong>{" "}
                        {ticket.assignedRepairCenter.fullName} <br />
                        <span style={{ fontSize: "0.85rem", color: "#666" }}>
                          {ticket.assignedRepairCenter.email}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "#999" }}>
                        Pending Assignment...
                      </span>
                    )}
                  </div>
                </div>

                {/* Return Logic (RESTORED - Specific for Returns) */}
                {ticket.serviceType === "Return" && (
                  <div className="td-section return-alert-box">
                    <div
                      className="td-section-title"
                      style={{ color: "#d97706" }}
                    >
                      Return Request Details
                    </div>
                    <div className="td-text">
                      <strong>Customer Preference:</strong> <br />
                      <span className="badge-preference">
                        {ticket.customerSelection || "Not Specified"}
                      </span>
                      <div
                        style={{
                          marginTop: "15px",
                          borderTop: "1px dashed #fcd34d",
                          paddingTop: "10px",
                        }}
                      >
                        <strong>Validation Check:</strong> <br />
                        {(() => {
                          const pDate = new Date(ticket.product?.purchaseDate);
                          const created = new Date(ticket.createdAt);
                          const diff = Math.ceil(
                            (created - pDate) / (1000 * 60 * 60 * 24)
                          );
                          return (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Purchased <b>{diff} days</b> before request.
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Controls (Action) - Updated Logic Kept */}
                {(user.role === "Technician" || user.role === "Admin") && (
                  <div className="td-section">
                    <div
                      className="td-section-title"
                      style={{ color: "#0369a1" }}
                    >
                      Action
                    </div>
                    <select
                      value={ticket.status}
                      onChange={handleStatusChange}
                      style={{ padding: "8px", width: "100%" }}
                    >
                      <option value={currentStatus}>{currentStatus}</option>

                      {user?.role === "Technician"
                        ? allowedNextStatuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))
                        : ALL_STATUSES.filter((s) => s !== currentStatus).map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal (RESTORED) */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedImage} alt="Full size" />
            <button className="lightbox-close" onClick={closeLightbox}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}