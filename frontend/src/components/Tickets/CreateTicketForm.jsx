import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "@/services/ticketService";
//filippa import
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

//filippa: Quick Scripts Data (CHIPS)
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
  //filippa
  const { user } = useAccess();

  //filippa: Tab State
  const [mode, setMode] = useState("Repair"); 

  //filippa: Delivery Method State 
  const [deliveryMethod, setDeliveryMethod] = useState("courier");

  const [formData, setFormData] = useState({
    //filippa new fields
    contactName: "",  
    contactEmail: "",
    phone: "",
    // Address fields (Θα χρησιμοποιηθούν μόνο αν deliveryMethod === 'courier')
    address: "",     
    city: "",        
    postalCode: "", 
    country: "",
    //standard fields
    serialNumber: "",
    model: "",
    purchaseDate: "",
    type: "",
    category: "",
    description: "",
  });

  //filippa Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.fullName || user.name || prev.contactName, 
        contactEmail: user.email || prev.contactEmail
      }));
    }
  }, [user]);

  const [warrantyCheck, setWarrantyCheck] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  
  //christos: files state
  const [photoFiles, setPhotoFiles] = useState([]);
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- filippa: LOGIC CHECKS (Warranty & Return) ---
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

  //christos & filippa validation combined
  const isValid = useMemo(() => {
    const isFormValid = 
      formData.contactName.trim().length > 0 &&
      formData.contactEmail.trim().length > 0 &&
      formData.purchaseDate.trim().length > 0 &&
      formData.serialNumber.trim().length > 0 &&
      formData.description.trim().length >= 10;
      
    if (!isFormValid) return false;
    // Ειδικός έλεγχος για Courier (πρέπει να έχει διεύθυνση)
    if (deliveryMethod === 'courier') {
        const addressValid = 
            formData.address.trim().length > 0 &&
            formData.city.trim().length > 0 &&
            formData.postalCode.trim().length > 0;
        if (!addressValid) return false;
    }
    //filippa blocking logic
    if (isReturnExpired) return false;
    if (isWarrantyExpired) return false;

    return true;
  }, 
  [formData, deliveryMethod, isReturnExpired, isWarrantyExpired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //filippa: HANDLER ΓΙΑ ΤΑ SCRIPTS (CHIPS)
const handleAddScript = (text) => {
    setFormData((prev) => ({
      ...prev,
      // Απλά αντικαθιστούμε το description με το νέο text
      // Διαγράφει ό,τι υπήρχε πριν
      description: text 
    }));
  };

  const onInvoiceChange = (e) => {
    const file = e.target.files?.[0] || null;
    setInvoiceFile(file);
  };

  //christos: photo handler
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

    //filippa blocking checks
    if (isReturnExpired) { setError("Cannot submit: Return period has expired."); return; }
    if (isWarrantyExpired) { setError("Cannot submit: Product is out of warranty."); return; }
    if (!isValid) { setError("Please fill all required fields correctly."); return; }

    try {
      setSubmitting(true);

      //christos: PAYLOAD CONSTRUCTION WITH FILE OBJECTS
      const payload = {
        //filippa fields
        serviceType: mode,
        deliveryMethod,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        address: deliveryMethod === 'dropoff' ? 'Store Drop-off' : formData.address,
        city: deliveryMethod === 'dropoff' ? '-' : formData.city,
        postalCode: deliveryMethod === 'dropoff' ? '-' : formData.postalCode,
        
        //standard fields
        serialNumber: formData.serialNumber.trim(),
        model: formData.model.trim(),
        purchaseDate: formData.purchaseDate,
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        
        //christos: SEND ACTUAL FILES (NOT NAMES)
        photos: photoFiles, 
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

  //filippa: Block Messages
  const getBlockMessage = () => {
      if (isReturnExpired) return "Cannot submit: Return period expired";
      if (isWarrantyExpired) return "Cannot submit: Out of Warranty (24+ months)";
      return null;
  };
  const blockMsg = getBlockMessage();

  return (
    <div className="ct-page">
      <div className="ct-card">
        
        {/* filippa: TABS */}
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
          {/* filippa: CUSTOMER INFO */}
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
                <div className="ct-field">
                    <label className="ct-label">Phone Number <span className="ct-required">*</span></label>
                    <input className="ct-input" type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Enter your phone number" required />
                </div>
            </div>
          </div>

          {/* SHIPPING */}
          <div className="ct-section">
            <h2 className="ct-section-title">Shipping</h2>
            <div className="ct-logistics-options">
                <label 
                    className={`ct-radio-card ${deliveryMethod === 'courier' ? 'active' : ''}`}
                    onClick={() => setDeliveryMethod('courier')}
                >
                    <input type="radio" checked={deliveryMethod === 'courier'} readOnly hidden />
                    <span className="ct-radio-icon">🚚</span>
                    <div>
                        <strong>Courier Pickup</strong>
                        <div className="ct-radio-subtext">We pick it up from your place</div>
                    </div>
                </label>

                <label 
                    className={`ct-radio-card ${deliveryMethod === 'dropoff' ? 'active' : ''}`}
                    onClick={() => setDeliveryMethod('dropoff')}
                >
                    <input type="radio" checked={deliveryMethod === 'dropoff'} readOnly hidden />
                    <span className="ct-radio-icon">🏪</span>
                    <div>
                        <strong>Bring to Store</strong>
                        <div className="ct-radio-subtext">Visit our service center</div>
                    </div>
                </label>
            </div>

            {deliveryMethod === 'courier' ? (
                <div className="ct-fade-in">
                    <div className="ct-field">
                    <label className="ct-label">Street Address <span className="ct-required">*</span></label>
                    <input className="ct-input" name="address" value={formData.address} onChange={handleChange} placeholder="e.g. Tsimiski 45" />
                    </div>
                    <div className="ct-grid">
                        <div className="ct-field">
                            <label className="ct-label">City <span className="ct-required">*</span></label>
                            <input className="ct-input" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Thessaloniki" />
                        </div>
                        <div className="ct-field">
                            <label className="ct-label">Postal Code <span className="ct-required">*</span></label>
                            <input className="ct-input" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="e.g. 54622" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="ct-info-box">
                    <strong>📍 Our Service Center:</strong><br/>
                    Egnatia 123, Thessaloniki, 54630<br/>
                    Open: Mon-Fri 09:00 - 17:00
                </div>
            )}
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
                {/* filippa warranty alert */}
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
              
              {/* filippa: QUICK SCRIPTS CHIPS */}
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

            {/* christos: Upload Logic with GRID PREVIEW */}
            <div className="ct-field">
              <label className="ct-label">Upload Photos (Optional)</label>

              <label className="ct-dropzone">
                <input
                  className="ct-file"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={onPhotosChange}
                />
                <div className="ct-dropzone-inner">
                  <div className="ct-upload-icon">⬆</div>
                  <div className="ct-dropzone-text">
                    <div className="ct-dropzone-strong">Click to upload photos</div>
                    <div className="ct-dropzone-muted">JPG, PNG up to 5MB each</div>
                  </div>
                </div>
              </label>

              {/* christos: Grid Preview */}
              {photoFiles.length > 0 && (
                <div style={{ 
                  marginTop: '15px', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                  gap: '12px' 
                }}>
                  {photoFiles.map((file, index) => (
                    <div key={index} style={{ position: 'relative', textAlign: 'center' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #ccc',
                          display: 'block'
                        }}
                      />
                      <span style={{ 
                        display: 'block', 
                        fontSize: '10px', 
                        marginTop: '4px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="ct-actions">
            <button type="button" className="ct-btn ct-btn-ghost" onClick={handleSaveDraft}>Save Draft</button>
            <div className="ct-actions-right">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {/* filippa block message */}
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