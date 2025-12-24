import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { checkAccess, logout as apiLogout } from '@/services/authService';

const AccessContext = createContext();

export const AccessProvider = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const refreshAccess = async () => {
    try {
      const response = await checkAccess();
      setHasAccess(true);
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch {
      setHasAccess(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setHasAccess(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout failed", error);
    }
    setHasAccess(false);
    setUser(null);
  };

  useEffect(() => {
    refreshAccess();
  }, []);

  const contextValue = useMemo(
    () => ({ 
      hasAccess, 
      setHasAccess, 
      refreshAccess, 
      loading, 
      user, 
      login, 
      logout 
    }),
    [hasAccess, loading, user]
  );

  return (
    <AccessContext.Provider value={contextValue}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => useContext(AccessContext);