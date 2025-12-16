import { Link } from 'react-router-dom';
import { useAccess } from '../../context/AccessContext';
import styles from './Header.module.css';
import logo from '../../assets/logo.png';


const Header = () => {
  const { hasAccess, logout } = useAccess();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
        <img 
            src={logo} 
            alt="Electronics R&R" 
            className={styles.logoImage}
            />
            <span>
               Electronics <strong>R&amp;R</strong>
            </span>
        </div>
        
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>Home</Link>
          
          {hasAccess ? (
            <>
              <Link to="/dashboard" className={styles.link}>☷ Dashboard</Link>
              <Link to="/requests" className={styles.link}>🎟 Requests</Link>
              <Link to="/create-ticket" className={styles.link}>+ New Request</Link>
              <button onClick={logout} className={styles.authButton}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className={styles.authButton}>
                Sign In
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;