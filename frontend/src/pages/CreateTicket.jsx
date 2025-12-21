import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../services/ticketService";
import "./CreateTicket.css";

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

export default function CreateTicket() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    serialNumber: "",
    model: "",
    purchaseDate: "",
    type: "",          // REQUIRED by backend
    category: "",
    description: "",
  });

  const [invoiceFile, setInvoiceFile] = useState(null); // optional (not sent to backend yet)
  const [photoFiles, setPhotoFiles] = useState([]);     // optional (we send filenames)
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => {
    return (
      formData.serialNumber.trim().length > 0 &&
      formData.model.trim().length > 0 &&            // backend requires model
      formData.purchaseDate.trim().length > 0 &&
      formData.type.trim().length > 0 &&             // backend requires type
      formData.category.trim().length > 0 &&
      formData.description.trim().length >= 10
    );
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const draft = {
      formData,
      invoiceFileName: invoiceFile?.name || null,
      photoFileNames: photoFiles.map((f) => f.name),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("createTicketDraft", JSON.stringify(draft));
    alert("Draft saved locally.");
  };

  const handleCancel = () => navigate(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValid) {
      setError("Please fill all required fields. Description must be at least 10 characters.");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ IMPORTANT: send FLAT payload (matches backend controller)
      const payload = {
        serialNumber: formData.serialNumber.trim(),
        model: formData.model.trim(),
        purchaseDate: formData.purchaseDate, // ISO date string is OK
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        photos: photoFiles.map((f) => f.name), // backend expects "photos"
        // invoice not used in backend yet → we keep it local for now
      };

      await createTicket(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(typeof err === "string" ? err : "Server error while creating ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-card">
        <div className="ct-header">
          <h1 className="ct-title">Create New Request</h1>
          <p className="ct-subtitle">
            Submit a repair or return request for your product
          </p>
        </div>

        {error && <div className="ct-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="ct-form">
          {/* Product Information */}
          <div className="ct-section">
            <h2 className="ct-section-title">Product Information</h2>

            <div className="ct-field">
              <label className="ct-label">
                Product Serial Number <span className="ct-required">*</span>
              </label>
              <input
                className="ct-input"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="e.g., SN123456789"
                required
              />
              <p className="ct-help">
                Serial number can be found on the product label or original packaging.
              </p>
            </div>

            <div className="ct-grid">
              <div className="ct-field">
                <label className="ct-label">
                  Product Model <span className="ct-required">*</span>
                </label>
                <input
                  className="ct-input"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 14 Pro, MacBook Pro 2021"
                  required
                />
              </div>

              <div className="ct-field">
                <label className="ct-label">
                  Purchase Date <span className="ct-required">*</span>
                </label>
                <input
                  className="ct-input"
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="ct-field">
              <label className="ct-label">
                Product Type <span className="ct-required">*</span>
              </label>
              <select
                className="ct-select"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select product type</option>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="ct-field">
              <label className="ct-label">Upload Invoice (Optional)</label>

              <label className="ct-dropzone">
                <input
                  className="ct-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onInvoiceChange}
                />
                <div className="ct-dropzone-inner">
                  <div className="ct-upload-icon">⬆</div>
                  <div className="ct-dropzone-text">
                    <div className="ct-dropzone-strong">
                      Click to upload or drag and drop
                    </div>
                    <div className="ct-dropzone-muted">PDF, JPG, PNG up to 10MB</div>
                  </div>
                </div>
              </label>

              {invoiceFile && (
                <p className="ct-file-selected">
                  Selected invoice: <strong>{invoiceFile.name}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Issue Details */}
          <div className="ct-section">
            <h2 className="ct-section-title">Issue Details</h2>

            <div className="ct-field">
              <label className="ct-label">
                Problem Category <span className="ct-required">*</span>
              </label>
              <select
                className="ct-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ct-field">
              <label className="ct-label">
                Issue Description <span className="ct-required">*</span>
              </label>
              <textarea
                className="ct-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please describe the issue in detail..."
                required
              />
              <p className="ct-help">Minimum 10 characters. Be as specific as possible.</p>
            </div>

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

              {photoFiles.length > 0 && (
                <p className="ct-file-selected">
                  Selected photos:{" "}
                  <strong>{photoFiles.map((f) => f.name).join(", ")}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ct-actions">
            <button type="button" className="ct-btn ct-btn-ghost" onClick={handleSaveDraft}>
              Save Draft
            </button>

            <div className="ct-actions-right">
              <button type="button" className="ct-btn ct-btn-secondary" onClick={handleCancel}>
                Cancel
              </button>

              <button
                type="submit"
                className="ct-btn ct-btn-primary"
                disabled={!isValid || submitting}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
