import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthForm.module.css'; 

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sending reset link to:", email);
    alert("If an account exists for " + email + ", a reset link has been sent.");
    navigate('/'); // Τον γυρνάμε στην αρχική
  };

  return (
    <div className={styles.container}>
      <h2>Reset Password</h2>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <button 
          type="submit" 
          className={styles.authButton} 
          style={{ marginTop: '20px', width: '100%', display: 'block' }}
        >
          Send Reset Link
        </button>
      </form>
      
      <button 
        onClick={() => navigate('/')} 
        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginTop: '15px' }}
      >
        ← Back to Login
      </button>
    </div>
  );
};

export default ForgotPassword;