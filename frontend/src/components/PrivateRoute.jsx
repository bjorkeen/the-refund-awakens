import { Navigate } from 'react-router-dom';
import { useAccess } from '@/context/AccessContext';

const PrivateRoute = ({ children }) => {
  const { hasAccess } = useAccess();
  return hasAccess ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
