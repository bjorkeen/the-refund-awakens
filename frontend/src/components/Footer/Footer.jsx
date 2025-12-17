import React, { useState } from "react";
import "./Footer.css";

const Footer = () => {
  const [showPolicy, setShowPolicy] = useState(false);

  const openPolicy = () => setShowPolicy(true);
  const closePolicy = () => setShowPolicy(false);

  return (
    <>
      <footer className="footer">
        <p>© 2025 Electronics</p>
        <button className="policy-link" onClick={openPolicy}>
          Warranty & Return Policy
        </button>
      </footer>

      {showPolicy && (
        <div className="modal-overlay" onClick={closePolicy}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Warranty & Return Policy</h2>
            <p>
              To insert our system's warranty and return policy text.
            </p>

            <button className="close-btn" onClick={closePolicy}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
