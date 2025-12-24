import React, { useState } from "react";
import "./Footer.css";

const Footer = () => {
  // null | "policy" | "contact"
  const [openModal, setOpenModal] = useState(null);

  const openPolicy = () => setOpenModal("policy");
  const openContact = () => setOpenModal("contact");
  const closeModal = () => setOpenModal(null);

  return (
    <>
      <footer className="footer">
        <div className="footer-inner">
          <h2 className="footer-title">Service Made Simple</h2>
          <p className="footer-subtitle">
            We centralize returns and repair handling into one clear, automated workflow.
            Customers get transparency, employees get efficiency, and the company gains
            full process visibility.
          </p>

          <div className="footer-buttons">
            <button className="footer-btn primary" onClick={openPolicy}>
              <span className="footer-btn-emoji">🔍</span>
              <span>Warranty &amp; Repair Policy</span>
            </button>

            <button className="footer-btn secondary" onClick={openContact}>
              <span className="footer-btn-emoji">📨</span>
              <span>Contact</span>
            </button>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <span className="footer-copy">© 2025 Electronics R&amp;R</span>

            <div className="footer-social">
              <button className="social-btn" aria-label="Facebook">
                f
              </button>
              <button className="social-btn" aria-label="LinkedIn">
                in
              </button>
              <button className="social-btn" aria-label="Twitter">
                t
              </button>
            </div>
          </div>
        </div>
      </footer>

      {openModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {openModal === "policy" && (
              <>
                <div className="policy-page">
                  <h1 className="policy-title">Repair &amp; Warranty Policy</h1>
                  <p className="policy-subtitle">
                    Everything you need to know about returns, repairs, and warranties.
                  </p>

                  {/* Return Policy */}
                  <section className="policy-card">
                    <div className="policy-card-header">
                      <span className="policy-icon">🔁</span>
                      <div>
                        <h2>Return Policy</h2>
                        <p className="policy-card-caption">
                          Within 15 days of purchase
                        </p>
                      </div>
                      <span className="policy-pill">Return within 15 days</span>
                    </div>

                    <div className="policy-body">
                      <h3>Standard Returns</h3>
                      <p>
                        Products can be returned within <strong>15 days</strong> of
                        purchase if unused and in original packaging.
                      </p>
                      <ul>
                        <li>
                          Include all original accessories, manuals, and packaging.
                        </li>
                        <li>Attach proof of purchase (receipt or invoice).</li>
                        <li>
                          Initiate a return request by creating a ticket in the system
                          and selecting{" "}
                          <strong>&quot;Return within 15 days&quot;</strong>.
                        </li>
                      </ul>
                      <p>
                        Refunds are processed within{" "}
                        <strong>5–7 business days</strong> after your return has been
                        approved and received at our facility.
                      </p>

                      <h3>Late Returns</h3>
                      <p>
                        Returns requested after <strong>15 days</strong> are generally
                        not accepted. In exceptional cases, a return may be reviewed on a
                        case-by-case basis and may be subject to restocking fees.
                      </p>

                      <div className="policy-tip policy-tip-info">
                        <span className="tip-label">Pro Tip</span>
                        <p>
                          Test your product within the first days after purchase to
                          ensure you are eligible for a full refund or replacement if
                          needed.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Repair Policy */}
                  <section className="policy-card">
                    <div className="policy-card-header">
                      <span className="policy-icon">🛠️</span>
                      <div>
                        <h2>Repair Policy</h2>
                        <p className="policy-card-caption">
                          For faulty or damaged products
                        </p>
                      </div>
                    </div>

                    <div className="policy-body">
                      <h3>How to Submit a Repair Request</h3>
                      <ul>
                        <li>
                          If your product is faulty, create a ticket and select{" "}
                          <strong>&quot;Faulty Product&quot;</strong>.
                        </li>
                        <li>
                          Upload up to 5 photos showing the issue for faster processing.
                        </li>
                        <li>
                          Provide a detailed description of the problem (minimum 10
                          characters).
                        </li>
                      </ul>
                      <p>
                        Our system will automatically check warranty eligibility based on
                        your purchase date and product information.
                      </p>

                      <h3>Warranty Coverage</h3>
                      <p>
                        <strong>Within warranty:</strong> Your product may be repaired or
                        replaced at no cost, depending on the manufacturer’s terms.
                      </p>
                      <p>
                        <strong>Out of warranty:</strong> Repair requests will be rejected. Please
                        contact us for additional details.
                      </p>

                      <div className="policy-tip policy-tip-warning">
                        <span className="tip-label">Important</span>
                        <p>
                          Warranty does not cover physical damage caused by accidents,
                          misuse, or unauthorized repairs.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Warranty Duration */}
                  <section className="policy-card">
                    <div className="policy-card-header">
                      <span className="policy-icon">⏱️</span>
                      <div>
                        <h2>Warranty Duration</h2>
                        <p className="policy-card-caption">
                          Coverage period by product category
                        </p>
                      </div>
                    </div>

                    <div className="policy-body">
                      <p>
                        Standard warranty periods are{" "}
                        <strong>defined per product</strong> in our catalog. Most items
                        come with a <strong>12–24 month manufacturer’s warranty</strong>,
                        starting from the original purchase date.
                      </p>
                      <p>
                        Extended warranty options may be available at the time of
                        purchase and will be shown on your invoice.
                      </p>

                      <h3>What&apos;s Covered</h3>
                      <div className="policy-columns">
                        <div className="policy-box policy-box-green">
                          <h4>Covered</h4>
                          <ul>
                            <li>Manufacturing defects</li>
                            <li>Component failures not caused by misuse</li>
                            <li>Normal software or firmware issues</li>
                          </ul>
                        </div>

                        <div className="policy-box policy-box-red">
                          <h4>Not Covered</h4>
                          <ul>
                            <li>Physical or accidental damage</li>
                            <li>Water or fire damage</li>
                            <li>Unauthorized repairs or modifications</li>
                            <li>Loss or theft of the device</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}

            {openModal === "contact" && (
              <div className="contact-modal">
                <h1 className="policy-title">Contact Us</h1>
                <p className="policy-subtitle">
                  If you have questions about returns, repairs, or ticket updates, you
                  can reach our support team using the details below.
                </p>

                <div className="contact-box">
  <div className="contact-box-inner">
    <div className="contact-modal-line">
      <span className="contact-modal-label">Email</span>
      <span className="contact-modal-value">support@electronics-hub.com</span>
    </div>
    <div className="contact-modal-line">
      <span className="contact-modal-label">Hours</span>
      <span className="contact-modal-value">Mon–Fri, 09:00–17:00 EET</span>
    </div>
  </div>
</div>
              </div>
            )}

            <div className="policy-actions">
              <button className="close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;


