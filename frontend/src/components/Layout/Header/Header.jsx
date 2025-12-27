import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAccess } from '@/context/AccessContext';
import logo from '@/assets/logo.png';
import styles from './Header.module.css';

const Header = () => {
  const { hasAccess, logout } = useAccess();
  const navigate = useNavigate();
  const location = useLocation(); // Χρειαζόμαστε αυτό για να ξέρουμε σε ποιο URL είμαστε

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* ΑΡΙΣΤΕΡΑ: Το Logo */}
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Electronics R&R" className={styles.logoImage} />
          <span>
            Electronics <strong>R&amp;R</strong>
          </span>
        </Link>

        {/* ΔΕΞΙΑ: Το Μενού */}
        <nav className={styles.nav}>
          {/* Εμφάνιση μενού ΜΟΝΟ αν:
              1. Ο χρήστης έχει πρόσβαση (hasAccess)
              2. ΔΕΝ είναι στην αρχική 
              3. ΔΕΝ είναι στο forgot password 
          */}
          {hasAccess && 
           location.pathname !== "/" && 
           location.pathname !== "/forgot-password" ? (
            <>
              <Link to="/dashboard" className={styles.link}>
                ☷ Dashboard
              </Link>
              <Link to="/requests" className={styles.link}>
                🎟 Requests
              </Link>
              <Link to="/create-ticket" className={styles.link}>
                + New Request
              </Link>
              <button onClick={handleLogout} className={styles.authButton}>
                Sign Out
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
};

export default Header;