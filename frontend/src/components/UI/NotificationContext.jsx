import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../components/UI/Notification.module.css';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotification({ message, type, id: Date.now() });

    timerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  }, []);

  const notificationVariants = {
    initial: { opacity: 0, y: 60, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            className={`${styles.container} ${styles[notification.type]}`}
            
            // --- Animations ---
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}

            // --- Drag / Swipe Logic ---
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ right: 0.7 }}
            onDragEnd={(event, info) => {
              if (info.offset.x > 100) {
                dismissNotification();
              }
            }}
            // auto-close if hover/drag
            onHoverStart={() => { if(timerRef.current) clearTimeout(timerRef.current); }}
          >
            <div className={`${styles.icon} ${notification.type === 'success' ? styles.iconSuccess : styles.iconError}`}>
              {notification.type === 'success' ? '✓' : '✕'}
            </div>
            <span className={styles.message}>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};