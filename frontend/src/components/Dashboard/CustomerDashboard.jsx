import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTickets, getTicket, submitFeedback } from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext";
import { useNotification } from "@/context/NotificationContext";
import "./CustomerDashboard.css";
import "@/pages/TicketDetails.css";
import WelcomeMessage from "./WelcomeMessage";

// HELPER FUNCTIONS 
function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function normalizeStatus(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).toLowerCase();
  if (s.includes("new") || s.includes("submitted")) return "Submitted";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("complete") || s.includes("resolved")) return "Completed";
  if (s.includes("cancel") || s.includes("reject")) return "Cancelled";
  if (s.includes("validation")) return "Pending Validation";
  if (s.includes("parts")) return "Waiting for Parts";
  return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
}

const statusClass = (statusLabel) => {
  const s = statusLabel.toLowerCase().replace(/ /g, '-');
  return `td-status-badge badge-${s}`;
};

function getTicketId(t) { return t.ticketId || t.ticketNumber || t._id || "-"; }
function getModel(t) { return t.model || t.product?.model || "-"; }
function getSerial(t) { return t.serialNumber || t.product?.serialNumber || "-"; }
function getIssue(t) { return t.category || t.issue?.category || "-"; }
function getServiceType(t) { return t.serviceType || t.type || "Repair"; }

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAccess();
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyTickets();
        const list = Array.isArray(data) ? data : (data?.tickets || data?.data || []);
        // Sort: Πιο πρόσφατα πρώτα
        list.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));
        setTickets(list);
      } catch (err) {
        console.error("Failed to load tickets", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const onViewDetails = async (t) => {
    setSelectedTicket(t);
    setShowModal(true);
    setModalLoading(true);

    try {
      const idToFetch = t._id || t.id;
      if (idToFetch) {
        const fullData = await getTicket(idToFetch);
        setSelectedTicket(prev => ({ ...prev, ...fullData }));
      }
    } catch (err) {
      console.error("Failed to fetch full details", err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => { setShowModal(false); setSelectedTicket(null); };
  //Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratedTicketIds, setRatedTicketIds] = useState(() => {
    const stored = localStorage.getItem('ratedTicketIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  }); // Track which tickets have been rated

  useEffect(() => {
    if (selectedTicket) {
      const status = normalizeStatus(selectedTicket.status);
      const ticketId = selectedTicket._id || selectedTicket.id;
      if (status === "Completed" && ticketId && !ratedTicketIds.has(ticketId)) {
        // Small delay so the user sees the "Completed" status in the main modal first
        const timer = setTimeout(() => {
          setShowRatingModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedTicket, ratedTicketIds]);

  // STATS Calculation
  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(t => {
      const s = (t.status || t.state || "").toLowerCase();
      return !s.includes('complete') && !s.includes('cancel') && !s.includes('closed');
    }).length;
    const completed = tickets.filter(t => {
      const s = (t.status || t.state || "").toLowerCase();
      return s.includes('complete') || s.includes('closed');
    }).length;
    
    return { total, active, completed };
  }, [tickets]);

  // Βοηθητική για χρώματα status (ίδια με Technician)
  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("submit") || s.includes("new")) return "badge-submitted";
    if (s.includes("valid") || s.includes("pending")) return "badge-pending";
    if (s.includes("progress")) return "badge-progress";
    if (s.includes("wait") || s.includes("parts")) return "badge-warning";
    if (s.includes("complete") || s.includes("closed")) return "badge-completed";
    return "badge-default";
  };

  return (
    <div className="dash-container">
      <WelcomeMessage/>

      {/* HEADER */}
      <div className="dash-header">
        <h1 className="dash-title">Overview</h1>
        <button className="new-ticket-btn" onClick={() => navigate('/create-ticket')}>
            + New Request
        </button>
      </div>

      {/* STATS CARDS (GRID) */}
      <div className="dash-stats-grid">
        {/* Total */}
        <div className="dash-stat-card">
            <div className="stat-label">Total Requests</div>
            <div className="stat-value">{stats.total}</div>
        </div>
        
        {/* Active */}
        <div className="dash-stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: "#b45309" }}>{stats.active}</div>
        </div>

        {/* Completed */}
        <div className="dash-stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: "#15803d" }}>{stats.completed}</div>
        </div>
      </div>

      {/*TABLE SECTION (BELOW CARDS) */}
      <div className="dash-table-container">
        <div className="dash-section-header">
            <h3>Recent Tickets</h3>
            {tickets.length > 5 && (
                <button className="view-all-link" onClick={() => navigate('/requests')}>
                    View All History
                </button>
            )}
        </div>

        {loading ? (
           <div style={{padding:'20px', textAlign:'center', color:'#6b7280'}}>Loading...</div>
        ) : tickets.length === 0 ? (
           <div style={{padding:'20px', textAlign:'center', color:'#6b7280'}}>No tickets found.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Product</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 8).map((t) => (
                <tr key={getTicketId(t)}>
                  <td className="font-mono">{getTicketId(t)}</td>
                  <td style={{fontWeight:600}}>{getModel(t)}</td>
                  <td>
                    {getIssue(t)}
                  </td>
                  <td>
                    <span className={statusClass(normalizeStatus(t.status || t.state))}>
                      {normalizeStatus(t.status || t.state)}
                    </span>
                  </td>
                  <td style={{color:'#6b7280', fontSize:'0.9rem'}}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {/* View Button now triggers Modal */}
                    <button className="action-btn" onClick={() => onViewDetails(t)}>
                        View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL*/}
        {showModal && selectedTicket && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box modal-box-large" onClick={(e) => e.stopPropagation()}>
              
              <div className="td-header">
                <div className="td-title">
                  <h1>{getServiceType(selectedTicket) === 'Return' ? 'Return Request' : 'Repair Request'}</h1>
                  <div className="td-id">ID: {getTicketId(selectedTicket)}</div>
                </div>
                <div className="td-header-actions">
                  <div className={statusClass(normalizeStatus(selectedTicket.status))}>
                    {normalizeStatus(selectedTicket.status)}
                  </div>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
              </div>

              <div className="modal-content">
                {/* Timeline */}
                {normalizeStatus(selectedTicket.status) !== 'Cancelled' && normalizeStatus(selectedTicket.status) !== 'Closed' && (
                  <div className="td-timeline">
                     {(() => {
                       // Determine if this is a dropoff ticket
                       const isDropoff = selectedTicket.deliveryMethod === 'dropoff' || 
                                        selectedTicket.address === 'Store Drop-off' || 
                                        selectedTicket.city === '-';
                       
                       const steps = isDropoff 
                         ? ['Submitted', 'In Progress', 'Ready for Pickup', 'Completed']
                         : ['Submitted', 'Shipping', 'In Progress', 'Shipped Back', 'Completed'];
                       
                       let currentStatus = normalizeStatus(selectedTicket.status);
                       
                       // Map substates to main timeline steps
                       if (currentStatus === 'Pending Validation' || currentStatus === 'Waiting for Parts') {
                         currentStatus = 'In Progress';
                       }
                       
                       const currentIndex = steps.findIndex(s => s === currentStatus);
                       const progressWidth = currentIndex < 0 ? 0 : ((currentIndex + 1) / steps.length) * 100;
                       return (
                         <>
                           <div className="td-progress-bar">
                             <div className="td-progress-fill" style={{ width: `${progressWidth}%` }}></div>
                           </div>
                           {steps.map((step, idx) => (
                              <div key={step} className={`td-step ${step === currentStatus ? 'active' : ''}`}>
                                <div className="td-step-circle">{idx + 1}</div>
                                <div className="td-step-label">{step}</div>
                              </div>
                           ))}
                         </>
                       );
                     })()}
                  </div>
                )}
                
                <div className="td-grid">
                  {/* LEFT COLUMN */}
                  <div className="td-main">
                    
                    <div className="td-section">
                      <div className="td-section-title">Issue Description</div>
                      <div className="td-text">
                        {selectedTicket.issue?.description || selectedTicket.description || 'N/A'}
                      </div>
                    </div>

                    <div className="td-section">
                        <div className="td-section-title">Product Details</div>
                        <div className="td-text">
                          <strong>Model:</strong> {getModel(selectedTicket)} <br/>
                          <strong>Serial:</strong> {getSerial(selectedTicket)} <br/>
                          <strong>Category:</strong> {getIssue(selectedTicket)}
                        </div>
                    </div>

                    <div className="td-section">
                        <div className="td-section-title">Customer Details</div>
                        <div className="td-text">
                          {/* Ελέγχουμε αν τα στοιχεία είναι χύμα ή μέσα σε contactInfo */}
                          <strong>Name:</strong> {selectedTicket.contactInfo?.fullName || selectedTicket.contactName || selectedTicket.fullName || 'N/A'} <br/>
                          <strong>Email:</strong> {selectedTicket.contactInfo?.email || selectedTicket.contactEmail || selectedTicket.email || 'N/A'} <br/>
                          <strong>Phone:</strong> {selectedTicket.contactInfo?.phone || selectedTicket.phone || 'N/A'}
                        </div>
                    </div>
                    
                    {/* SHIPPING DETAILS */}
                    <div className="td-section">
                        <div className="td-section-title">Shipping Details</div>
                        <div className="td-text">
                          {(() => {
                            const address = selectedTicket.contactInfo?.address || selectedTicket.address || '-';
                            const city = selectedTicket.contactInfo?.city || selectedTicket.city || '-';
                            const postalCode = selectedTicket.contactInfo?.postalCode || selectedTicket.postalCode || selectedTicket.zipCode || '-';
                            const deliveryMethod = selectedTicket.deliveryMethod || 'courier';
                            const isDropoff = deliveryMethod === 'dropoff' || address === 'Store Drop-off' || city === '-';
                            
                            return isDropoff ? (
                               <div className="td-logistics-dropoff">
                                  <span>Customer will bring to store (Drop-off)</span>
                               </div>
                            ) : (
                               <div>
                                  <div className="td-logistics-courier">
                                      <span>Courier Pickup</span>
                                  </div>
                                  <div className="td-logistics-details">
                                      <strong>Address:</strong> {address} <br/>
                                      <strong>City:</strong> {city} <br/>
                                      <strong>Postal Code:</strong> {postalCode}
                                  </div>
                               </div>
                            );
                          })()}
                        </div>
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR */}
                  <div className="td-sidebar">
                    <div className="td-section">
                      <div className="td-section-title">Request Type</div>
                      <div className={`td-text ${getServiceType(selectedTicket)==='Return' ? 'td-text-return' : 'td-text-repair'}`}>
                          {getServiceType(selectedTicket)}
                      </div>
                    </div>
                    <div className="td-section">
                      <div className="td-section-title">Date Submitted</div>
                      <div className="td-text">{formatDateTime(selectedTicket.createdAt)}</div>
                    </div>
                    <div className="td-section">
                      <div className="td-section-title">Purchase Date</div>
                      <div className="td-text">
                        {/* Έλεγχος σε πολλαπλά σημεία για την ημερομηνία αγοράς */}
                        {(selectedTicket.product?.purchaseDate || selectedTicket.purchaseDate)
                          ? new Date(selectedTicket.product?.purchaseDate || selectedTicket.purchaseDate).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </div>

                    {/* ATTACHMENTS */}
                    <div className="td-section">
                        <div className="td-section-title">Attachments</div>
                        
                        {/* Invoice Check */}
                        {selectedTicket.invoiceFileName && (
                          <div style={{marginBottom: '15px'}}>
                             <div style={{fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px'}}>Invoice</div>
                             <div className="td-file-row">
                                <span className="td-file-icon">📄</span>
                                <span>{selectedTicket.invoiceFileName}</span>
                             </div>
                          </div>
                        )}

                        {/* Issue Attachments Check (Images) */}
                        {(selectedTicket.issue?.attachments && selectedTicket.issue.attachments.length > 0) ? (
                          <div>
                             <div style={{fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px'}}>Photos ({selectedTicket.issue.attachments.length})</div>
                             <div className="td-attachments-grid">
                                {selectedTicket.issue.attachments.map((file, index) => {
                                  const cleanUrl = `http://localhost:5050/${file}`;
                                  return (
                                    <div key={index} className="td-attachment-item">
                                      <img src={cleanUrl} alt="Attachment" onError={(e) => e.target.style.display='none'}/>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        ) : (selectedTicket.photos && selectedTicket.photos.length > 0) ? (
                          <div>
                             <div style={{fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px'}}>Photos ({selectedTicket.photos.length})</div>
                             <div className="td-attachments-grid">
                                {selectedTicket.photos.map((file, index) => {
                                  const imgUrl = typeof file === 'string' ? `http://localhost:5050/${file}` : URL.createObjectURL(file);
                                  return (
                                    <div key={index} className="td-attachment-item">
                                      <img src={imgUrl} alt="Photo" onError={(e) => e.target.style.display='none'}/>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        ) : (
                          !selectedTicket.invoiceFileName && (
                            <div className="td-text" style={{color:'#9ca3af', fontStyle:'italic'}}>No attachments found.</div>
                          )
                        )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Rating Modal */}
              {showRatingModal && (
            <div className="modal-overlay" style={{ zIndex: 1100 }}>
              <div className="modal-box" style={{ maxWidth: '400px' }}>
                <div className="rating-modal-content">
                  <div className="rating-icon">⭐</div>
                  <h2 className="td-title" style={{ fontSize: '20px' }}>Rate your experience</h2>
                  <p className="rating-subtitle">
                    Your request is completed! How would you rate our service?
                  </p>
                  
                  <div className="stars-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="star-btn"
                          onClick={async () => {
                            try {
                              const ticketId = selectedTicket._id || selectedTicket.id;
                              await submitFeedback(ticketId, { rating: star, comment: "" });
                              showNotification("Thank you for your feedback!", "success");
                              if (ticketId) {
                                setRatedTicketIds(prev => {
                                  const newSet = new Set(prev).add(ticketId);
                                  localStorage.setItem('ratedTicketIds', JSON.stringify([...newSet]));
                                  return newSet;
                                });
                              }
                              setShowRatingModal(false);
                            } catch (error) {
                              console.error("Feedback error", error);
                              showNotification("Could not submit feedback. Please try again.", "error");
                            }
                          }}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>

                  <button 
                    className="maybe-later-btn" 
                    onClick={() => {
                      const ticketId = selectedTicket._id || selectedTicket.id;
                      if (ticketId) {
                        setRatedTicketIds(prev => {
                          const newSet = new Set(prev).add(ticketId);
                          localStorage.setItem('ratedTicketIds', JSON.stringify([...newSet]));
                          return newSet;
                        });
                      }
                      setShowRatingModal(false);
                    }}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
              )}
            </div>
      </div>
      )}
    </div>  
  );
}
             