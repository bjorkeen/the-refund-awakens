import AuthPanel from '@/components/AuthPanel';
import styles from './HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        
        {/* Αριστερό Μέρος: Το Μήνυμα */}
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome to <br />
            <span>Electronics R&R</span>
          </h1>
          <p className={styles.welcomeText}>
            Your all-in-one solution for seamless <strong>Returns</strong> and <strong>Repairs</strong>. 
            Track your requests and manage your devices with ease.
          </p>
          <div className={styles.accentLine}></div>
        </div>

        {/* Δεξί Μέρος: Η Φόρμα (Sign In) */}
        <div className={styles.authSection}>
          <AuthPanel />
        </div>

      </div>
    </div>
  );
};

export default HomePage;