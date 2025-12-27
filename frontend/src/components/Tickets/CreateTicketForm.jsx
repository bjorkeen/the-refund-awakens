import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "@/services/ticketService";
import { useAccess } from "@/context/AccessContext"; 
import "./CreateTicketForm.css";

const PRODUCT_TYPES = ["Smartphone", "Laptop", "TV", "Other"];

const CATEGORIES = [
  "Screen / Display",
  "Battery / Charging",
  "Audio / Speaker",
  "Camera",
  "Connectivity (Wi-Fi / Bluetooth)",
  "Software / Performance",
  "Physical Damage",
  "Other",
];

// ΕΤΟΙΜΑ ΚΕΙΜΕΝΑ (SCRIPTS)
const QUICK_SCRIPTS = {
  Repair: [
    "The screen is cracked and touch is not responding.",
    "The device does not turn on even after charging.",
    "Battery drains very quickly (less than 2 hours).",
    "The device is overheating.",
    "Camera lens is scratched/broken."
  ],
  Return: [
    "Received the wrong item (different model/color).",
    "Product box was damaged upon delivery.",
    "Product is defective / Dead on Arrival.",
    "Changed my mind, product is unopened.",
    "Missing accessories in the box."
  ]
};

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAccess();

  const [mode, setMode] = useState("Repair"); 

  const [formData, setFormData] = useState({
    contactName: "",  
    contactEmail: "",
    serialNumber: "",
    model: "",
    purchaseDate: "",
    type: "",
    category: "",
    description: "",
  });

  const [warrantyCheck, setWarrantyCheck] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- LOGIC CHECKS ---
  const daysSincePurchase = useMemo(() => {
    if (!formData.purchaseDate) return 0;
    const today = new Date();
    const pDate = new Date(formData.purchaseDate);
    const diffTime = Math.abs(today - pDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  }, [formData.purchaseDate]);

  const isWarrantyExpired = useMemo(() => {
    if (mode !== 'Repair' || !formData.purchaseDate) return false;
    const pDate = new Date(formData.purchaseDate);
    const today = new Date();
    const diffMonths = (today.getFullYear() - pDate.getFullYear()) * 12 + (today.getMonth() - pDate.getMonth());
    return diffMonths > 24;
  }, [formData.purchaseDate, mode]);

  const isReturnExpired = mode === 'Return' && daysSincePurchase > 15;

  useEffect(() => {
    if (!formData.purchaseDate) {
        setWarrantyCheck(null);
        return;
    }
    if (mode === 'Return') {
        if (!isReturnExpired) {
            setWarrantyCheck({ msg: "Eligible for Return (Purchased within 15 days)", type: "success" });
        } else {
            setWarrantyCheck({ msg: `Return Period Expired (${daysSincePurchase} days ago).`, type: "warning" });
        }
    } else {
        if (!isWarrantyExpired) {
            setWarrantyCheck({ msg: "Under Warranty (Purchased less than 24 months ago)", type: "success" });
        } else {
            setWarrantyCheck({ msg: "Out of Warranty (Over 24 months).", type: "warning" });
        }
    }
  }, [formData.purchaseDate, mode, isReturnExpired, isWarrantyExpired, daysSincePurchase]);

  const isValid = useMemo(() => {
    const isFormValid = 
      formData.contactName.trim().length > 0 &&
      formData.contactEmail.trim().length > 0 &&
      formData.purchaseDate.trim().length > 0 &&
      formData.serialNumber.trim().length > 0 &&
      formData.description.trim().length >= 10;
      
    if (!isFormValid) return false;
    if (isReturnExpired) return false;
    if (isWarrantyExpired) return false;

    return true;
  }, [formData, isReturnExpired, isWarrantyExpired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //HANDLER ΓΙΑ ΤΑ SCRIPTS 
  const handleAddScript = (text) => {
    setFormData((prev) => ({
      ...prev,
      // Αν υπάρχει ήδη script, προσθέτουμε νέα γραμμή, αλλιώς γραφουμε κείμενο
      description: prev.description ? prev.description + "\n" + text : text
    }));
  };

  const onInvoiceChange = (e) => {
    const file = e.target.files?.[0] || null;
    setInvoiceFile(file);
  };

  const onPhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(files);
  };

  const handleSaveDraft = () => {
    const draft = { mode, formData, savedAt: new Date().toISOString() };
    localStorage.setItem("createTicketDraft", JSON.stringify(draft));
    alert("Draft saved locally.");
  };

  const handleCancel = () => navigate(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isReturnExpired) { setError("Cannot submit: Return period has expired."); return; }
    if (isWarrantyExpired) { setError("Cannot submit: Product is out of warranty."); return; }
    if (!isValid) { setError("Please fill all required fields correctly."); return; }

    try {
      setSubmitting(true);
      const payload = {
        serviceType: mode,
        ...formData,
        invoiceFileName: invoiceFile?.name,
        photos: photoFiles.map((f) => f.name),
      };
      await createTicket(payload);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(typeof err === "string" ? err : "Server error while creating ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const getBlockMessage = () => {
      if (isReturnExpired) return "Cannot submit: Return period expired";
      if (isWarrantyExpired) return "Cannot submit: Out of Warranty (24+ months)";
      return null;
  };
  const blockMsg = getBlockMessage();

  return (
    <div className="ct-page">
      <div className="ct-card">
        
        <div className="ct-tabs">
            <button type="button" className={`ct-tab ${mode === 'Repair' ? 'active' : ''}`} onClick={() => setMode('Repair')}>Repair Request</button>
            <button type="button" className={`ct-tab ${mode === 'Return' ? 'active' : ''}`} onClick={() => setMode('Return')}>Return Request</button>
        </div>

        <div className="ct-header">
          <h1 className="ct-title">{mode === 'Repair' ? 'Create Repair Ticket' : 'Create Return Request'}</h1>
          <p className="ct-subtitle">
            {mode === 'Repair' ? 'Standard warranty check: 24 Months coverage.' : 'Return policy check: Eligible within 15 Days of purchase.'}
          </p>
        </div>

        {error && <div className="ct-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="ct-form">
          {/* CUSTOMER INFO */}
          <div className="ct-section">
            <h2 className="ct-section-title">Customer Information</h2>
            <div className="ct-grid">
                <div className="ct-field">
                    <label className="ct-label">Full Name <span className="ct-required">*</span></label>
                    <input className="ct-input" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Enter your full name" required />
                </div>
                <div className="ct-field">
                    <label className="ct-label">Email Address <span className="ct-required">*</span></label>
                    <input className="ct-input" type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="Enter your email" required />
                </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="ct-section">
            <h2 className="ct-section-title">Product Information</h2>
            <div className="ct-field">
              <label className="ct-label">Product Serial Number <span className="ct-required">*</span></label>
              <input className="ct-input" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="e.g., SN123456789" required />
            </div>
            <div className="ct-grid">
              <div className="ct-field">
                <label className="ct-label">Product Model</label>
                <input className="ct-input" name="model" value={formData.model} onChange={handleChange} />
              </div>
              <div className="ct-field">
                <label className="ct-label">Purchase Date <span className="ct-required">*</span></label>
                <input className="ct-input" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required />
                {warrantyCheck && (
                    <div className={`ct-warranty-alert ${warrantyCheck.type === "success" ? "ct-warranty-success" : "ct-warranty-warning"}`}>
                        {warrantyCheck.msg}
                    </div>
                )}
              </div>
            </div>
            <div className="ct-field">
              <label className="ct-label">Product Type</label>
              <select className="ct-select" name="type" value={formData.type} onChange={handleChange}>
                <option value="">Select product type</option>
                {PRODUCT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="ct-field">
                <label className="ct-label">Upload Invoice (Optional)</label>
                <label className="ct-dropzone">
                <input className="ct-file" type="file" accept=".pdf,.jpg,.png" onChange={onInvoiceChange} />
                <div className="ct-dropzone-inner"><span className="ct-upload-icon">⬆</span><span className="ct-dropzone-text">Click to upload invoice</span></div>
                </label>
                {invoiceFile && <p className="ct-file-selected">Selected: {invoiceFile.name}</p>}
            </div>
          </div>

          {/* ISSUE DETAILS */}
          <div className="ct-section">
            <h2 className="ct-section-title">Issue Details</h2>
            <div className="ct-field">
              <label className="ct-label">Problem Category</label>
              <select className="ct-select" name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>

            <div className="ct-field">
              <label className="ct-label">Description <span className="ct-required">*</span></label>
              
              {/*QUICK SCRIPTS CHIPS */}
              <div className="ct-quick-scripts">
                <span className="ct-quick-label">Quick select:</span>
                <div className="ct-chips-container">
                    {QUICK_SCRIPTS[mode].map((script, idx) => (
                        <button 
                            key={idx} 
                            type="button" 
                            className="ct-chip"
                            onClick={() => handleAddScript(script)}
                            title="Click to add this text"
                        >
                            {script.length > 40 ? script.substring(0, 40) + "..." : script}
                        </button>
                    ))}
                </div>
              </div>

              <textarea
                className="ct-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue... (Min 10 characters)"
                required
              />
              <p className="ct-help">Min 10 characters.</p>
            </div>

             <div className="ct-field">
                <label className="ct-label">Upload Photos (Optional)</label>
                <label className="ct-dropzone">
                <input className="ct-file" type="file" accept=".jpg,.png" multiple onChange={onPhotosChange} />
                <div className="ct-dropzone-inner"><span className="ct-upload-icon">📷</span><span className="ct-dropzone-text">Click to upload photos</span></div>
                </label>
                {photoFiles.length > 0 && <p className="ct-file-selected">{photoFiles.length} photos selected</p>}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="ct-actions">
            <button type="button" className="ct-btn ct-btn-ghost" onClick={handleSaveDraft}>Save Draft</button>
            <div className="ct-actions-right">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {blockMsg && <span className="ct-blocked-msg">{blockMsg}</span>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="ct-btn ct-btn-secondary" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="ct-btn ct-btn-primary" disabled={!isValid || submitting} style={blockMsg ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}