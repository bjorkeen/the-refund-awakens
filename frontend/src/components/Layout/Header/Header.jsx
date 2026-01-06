import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAccess } from '@/context/AccessContext';
import { logout as logoutService } from '@/services/authService';
import logo from '@/assets/logo.png';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout: contextLogout, hasAccess } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logoutService();
    contextLogout();
    navigate('/');
  };

  const shouldShowMenu = hasAccess && 
                        location.pathname !== "/" && 
                        location.pathname !== "/login";

  return (
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


                <button onClick={handleLogout} className={styles.authButton}>Sign Out</button>

              <div className={styles.dropdownContainer}>
                <button className={styles.profileIconBtn} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>👤</button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>{user?.fullName || 'User'}</div>
                    <div className={styles.dropdownSub}>{user?.email}</div>
                    <hr className={styles.divider} />
                    <button onClick={handleLogout} className={styles.dropdownItem} style={{color: 'red'}}>
                      Sign Out
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
  );
};

export default Header;