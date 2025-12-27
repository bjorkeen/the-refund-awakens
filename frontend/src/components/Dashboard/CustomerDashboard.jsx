import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDashboard.css";
import { getMyTickets } from "@/services/ticketService";

// Helper Functions
function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function normalizeStatus(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).toLowerCase();
  if (s.includes("new") || s.includes("submitted")) return "Submitted";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("complete") || s.includes("resolved")) return "Completed";
  if (s.includes("cancel") || s.includes("reject")) return "Cancelled";
  return String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
}

function statusClass(statusLabel) {
  const s = statusLabel.toLowerCase();
  if (s.includes("progress")) return "status-pill status-blue";
  if (s.includes("complete")) return "status-pill status-green";
  if (s.includes("cancel")) return "status-pill status-gray";
  if (s.includes("submit")) return "status-pill status-blue";
  return "status-pill status-blue";
}

function getTicketId(t) {
  return t.ticketId || t.ticketNumber || t._id || "-";
}

function getModel(t) {
  return t.model || t.product?.model || "-";
}

function getSerial(t) {
  return t.serialNumber || t.product?.serialNumber || "-";
}

function getIssue(t) {
  return t.category || t.issue?.category || "-";
}

function getLastUpdate(t) {
  return t.updatedAt || t.lastUpdatedAt || t.createdAt || null;
}

//Main Component 
export default function CustomerDashboard() {
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      // Όταν ανοίγει το Modal, κρύβουμε την εξωτερική μπάρα
      document.body.style.overflow = 'hidden'; 
    } else {
      // Όταν κλείνει, την επαναφέρουμε
      document.body.style.overflow = 'unset'; 
    }

    // Καθαρισμός αν φύγουμε από τη σελίδα
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]); 


  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await getMyTickets();
        
        // Λογική για να βρούμε τον πίνακα δεδομένων
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.tickets)
          ? data.tickets
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (alive) setTickets(list);
      } catch (err) {
        if (alive) {
          setTickets([]);
          setErrorMsg("Failed to load tickets.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => { alive = false; };
  }, []); 

  const availableStatuses = useMemo(() => {
    const set = new Set(
      tickets.map((t) => normalizeStatus(t.status || t.state))
    );
    return ["All", ...Array.from(set)];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return tickets.filter((t) => {
      const id = getTicketId(t);
      const serial = getSerial(t);
      const model = getModel(t);

      // Filter: Search
      if (q) {
        const hay = `${id} ${serial} ${model}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Filter: Status
      const statusLabel = normalizeStatus(t.status || t.state);
      if (statusFilter !== "All" && statusLabel !== statusFilter) return false;

      // Filter: Date Range
      if (from || to) {
        const d = getLastUpdate(t) ? new Date(getLastUpdate(t)) : null;
        if (!d || Number.isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [tickets, query, statusFilter, dateFrom, dateTo]);

  const onViewDetails = (t) => {
    setSelectedTicket(t);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  return (
    <div className="mt-page">
      <div className="mt-container">
        <h1 className="mt-title">My Requests</h1>
        <p className="mt-subtitle">
          View and track all your repair and return requests
        </p>

        {/* Filters Card */}
        <div className="mt-filters">
          <div className="mt-filter">
            <label className="mt-label">Search</label>
            <div className="mt-inputwrap">
              <span className="mt-icon">🔍</span>
              <input
                className="mt-input"
                placeholder="Ticket ID or Serial Number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-filter">
            <label className="mt-label">Status</label>
            <select
              className="mt-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-filter">
            <label className="mt-label">Date Range</label>
            <div className="mt-daterow">
              <input
                className="mt-input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                className="mt-input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="mt-tablecard">
          {loading && <div className="mt-state">Loading tickets…</div>}
          {!loading && errorMsg && <div className="mt-state mt-error">{errorMsg}</div>}
          {!loading && !errorMsg && filteredTickets.length === 0 && (
            <div className="mt-state">No tickets found.</div>
          )}

          {!loading && !errorMsg && filteredTickets.length > 0 && (
            <table className="mt-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Product</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Last Update</th>
                  <th className="mt-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => {
                  const id = getTicketId(t);
                  const model = getModel(t);
                  const serial = getSerial(t);
                  const issue = getIssue(t);
                  const statusLabel = normalizeStatus(t.status || t.state);
                  const last = getLastUpdate(t);

                  return (
                    <tr key={id}>
                      <td className="mt-mono">{id}</td>
                      <td>
                        <div className="mt-product">
                          <div className="mt-product-model">{model}</div>
                          <div className="mt-product-serial">{serial}</div>
                        </div>
                      </td>
                      <td>{issue}</td>
                      <td>
                        <span className={statusClass(statusLabel)}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="mt-datetime">{formatDateTime(last)}</td>
                      <td className="mt-actions-col">
                        <button
                          className="mt-link"
                          onClick={() => onViewDetails(t)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedTicket && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box modal-box-large" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="td-header">
                <div className="td-title">
                  <h1>Repair Request</h1>
                  <div className="td-id">ID: {getTicketId(selectedTicket)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`badge-${(selectedTicket.status || '').toLowerCase().replace(/ /g,'-')} td-status-badge`}>
                    {selectedTicket.status || 'Unknown'}
                  </div>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
              </div>

              <div className="modal-content">
                {/* Timeline */}
                {selectedTicket.status !== 'Cancelled' && (
                  <div className="td-timeline">
                    <div className="td-progress-bar">
                      <div 
                        className="td-progress-fill" 
                        style={{ 
                          width: `${(() => {
                            const STEPS = ['Submitted', 'In Progress', 'Completed', 'Closed'];
                            const status = selectedTicket.status || 'Submitted';
                            let idx = STEPS.indexOf(status);
                            if (idx < 0) {
                              if (status === 'Pending Validation') idx = 0;
                              else if (status === 'Waiting for Parts') idx = 1;
                              else idx = 0;
                            }
                            return (idx / (STEPS.length - 1)) * 100;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                    {['Submitted', 'In Progress', 'Completed', 'Closed'].map((step, idx) => {
                      const STEPS = ['Submitted', 'In Progress', 'Completed', 'Closed'];
                      const status = selectedTicket.status || 'Submitted';
                      let currentIdx = STEPS.indexOf(status);
                      if (currentIdx < 0) {
                        if (status === 'Pending Validation') currentIdx = 0;
                        else if (status === 'Waiting for Parts') currentIdx = 1;
                        else currentIdx = 0;
                      }
                      
                      return (
                        <div key={step} className={`td-step ${idx <= currentIdx ? (idx === currentIdx ? 'active' : 'completed') : ''}`}>
                          <div className="td-step-circle">
                            {idx < currentIdx ? '✓' : idx + 1}
                          </div>
                          <div className="td-step-label">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Grid Layout */}
                <div className="td-grid">
                  {/* Main Content */}
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
                        <strong>Serial Number:</strong> {getSerial(selectedTicket)} <br/>
                        <strong>Category:</strong> {getIssue(selectedTicket)}
                      </div>
                    </div>

                    <div className="td-section">
                      <div className="td-section-title">Customer Details</div>
                      <div className="td-text">
                        <strong>Name:</strong> {selectedTicket.contactInfo?.fullName || 'N/A'} <br/>
                        <strong>Email:</strong> {selectedTicket.contactInfo?.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="td-sidebar">
                    <div className="td-section">
                      <div className="td-section-title">Date Submitted</div>
                      <div className="td-text">{formatDateTime(selectedTicket.createdAt)}</div>
                    </div>

                    <div className="td-section">
                      <div className="td-section-title">Purchase Date</div>
                      <div className="td-text">
                        {selectedTicket.product?.purchaseDate 
                          ? new Date(selectedTicket.product.purchaseDate).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}