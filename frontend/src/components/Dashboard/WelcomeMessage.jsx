import React, { useState, useEffect } from 'react';
import { useAccess } from '@/context/AccessContext';

const WelcomeMessage = () => {
  const { user } = useAccess();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('welcomeShown');
    
    if (!hasSeenWelcome && user?.role === 'Customer') {
      setShow(true);
    }
  }, [user]);

  const handleClose = () => {
    sessionStorage.setItem('welcomeShown', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>
          Welcome, {user?.fullName || 'Πελάτη'}! 👋
        </h2>
        <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '25px' }}>
          Welcome to the <strong>Electronics R&R Portal</strong>. <br/>
          We are here to make your return or repair process as seamless as possible.
        </p>
        <button className="ct-btn ct-btn-primary" onClick={handleClose}>
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

export default WelcomeMessage;