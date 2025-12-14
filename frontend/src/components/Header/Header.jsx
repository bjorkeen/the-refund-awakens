import { Link } from 'react-router-dom';
import { useAccess } from '../../context/AccessContext';
import styles from './Header.module.css';

const Header = () => {
  const { hasAccess, logout } = useAccess();
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>RRMS</Link>
        
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>Home</Link>
          
          {hasAccess ? (
            <>
              <Link to="/dashboard" className={styles.link}>Dashboard</Link>
              <Link to="/create-ticket" className={styles.link}>New Request</Link>
              <button onClick={logout} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <Link to="/auth" className={styles.link}>Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;