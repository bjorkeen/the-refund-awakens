import { Link } from "react-router-dom";
import styles from "./AppBar.module.css";

const AppBar = () => {
  return (
    <header className={styles.appBar}>
      <div className={styles.container}>
        {/* Logo recreated with CSS */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoCircle} />
          <span className={styles.logoText}>electronics</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navLink}>
            ☷ Dashboard
          </Link>
          <Link to="/tickets" className={styles.navLink}>
            🎟 Tickets
          </Link>
          <Link to="/new-ticket" className={styles.navLink}>
            + New Ticket
          </Link>
        </nav>

         {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.signInButton}>Sign In</button>
          <button
            className={styles.profileButton}
            aria-label="User menu"
            title="User menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M4 22c0-4 4-6 8-6s8 2 8 6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppBar;

