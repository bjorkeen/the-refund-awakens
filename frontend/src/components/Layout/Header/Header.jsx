import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAccess } from '@/context/AccessContext';
import { logout as logoutService, createUser } from '@/services/authService';
import logo from '@/assets/logo.png';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout: contextLogout, hasAccess } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATES ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loader State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Technician',
    specialty: 'Smartphone'
  });

  // --- HANDLERS ---
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logoutService();
    contextLogout();
    navigate('/');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Ασφάλεια: Μην επιτρέπεις δεύτερο request

    setIsSubmitting(true); // Ξεκινάει το loading
    try {
      const dataToSend = {
        ...formData,
        specialty: formData.role === 'Technician' ? formData.specialty : null
      };

      await createUser(dataToSend);
      
      alert(`User ${formData.fullName} created successfully!`);
      setShowCreateModal(false);
      setFormData({ 
        fullName: '', email: '', password: '', 
        role: 'Technician', specialty: 'Smartphone' 
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false); // Τερματίζει το loading πάντα
    }
  };

  const shouldShowMenu = hasAccess && 
                        location.pathname !== "/" && 
                        location.pathname !== "/login" && 
                        location.pathname !== "/forgot-password";

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Electronics R&R" className={styles.logoImage} />
            <span>Electronics <strong>R&amp;R</strong></span>
          </Link>

          <nav className={styles.nav}>
            {shouldShowMenu ? (
              <>
                <Link to="/dashboard" className={styles.link}>☷ Dashboard</Link>
                {user?.role !== 'Technician' && (
        <>
          <Link to="/requests" className={styles.link}>🎟 Requests</Link>
          <Link to="/create-ticket" className={styles.link}>+ New Request</Link>
        </>
      )}

                {['Admin', 'Manager'].includes(user?.role)&& (
                  <button className={styles.btnCreateUser} onClick={() => setShowCreateModal(true)}>
                    + Create User
                  </button>
                )}

                <button onClick={handleLogout} className={styles.authButton}>Sign Out</button>

                <div className={styles.dropdownContainer}>
                  <button className={styles.profileIconBtn} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>👤</button>

                  {isDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownHeader}>{user?.fullName || 'User Profile'}</div>
                      <div className={styles.dropdownSub}>{user?.email || ''}</div>
                      <hr className={styles.divider} />
                      <button 
                        onClick={() => { setIsDropdownOpen(false); navigate('/dashboard'); }}
                        className={styles.dropdownItem}
                      >
                        ⚙️ Account Settings
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              location.pathname !== "/" && (
                <Link to="/login" className={styles.authButton}>Sign In</Link>
              )
            )}
          </nav>
        </div>
      </header>

      {/* MODAL ΜΕ LOADER ΛΟΓΙΚΗ */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" required value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  disabled={isSubmitting} // Disable input κατά το submit
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <input type="password" required value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isSubmitting}>
                  <option value="Customer">Customer</option>
                  <option value="Technician">Technician</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {formData.role === 'Technician' && (
                <div className={`${styles.formGroup} ${styles.highlightGroup}`}>
                  <label>Technician Specialty</label>
                  <select value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} disabled={isSubmitting}>
                    <option value="Smartphone">Smartphone</option>
                    <option value="Laptop">Laptop</option>
                    <option value="TV">TV</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.btnCancel} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className={styles.spinnerWrapper}>
                      <span className={styles.spinner}></span> Creating...
                    </span>
                  ) : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;