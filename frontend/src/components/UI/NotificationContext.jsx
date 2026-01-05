import React, { createContext, useState, useContext, useCallback } from 'react';
import styles from '../components/UI/Notification.module.css';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {notification && (
        <div className={`${styles.container} ${styles[notification.type]}`}>
          <div className={`${styles.icon} ${notification.type === 'success' ? styles.iconSuccess : styles.iconError}`}>
            {notification.type === 'success' ? '✓' : '✕'}
          </div>
          <span className={styles.message}>{notification.message}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};