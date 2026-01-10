import { Navigate } from 'react-router-dom';
import { useAccess } from '@/context/AccessContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAccess(); //strictly user object has acces, not just a boolean
  if (loading) return <div> Loading dashboard </div>;

  //patched for existing user object before rendering protected content 
  return user ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
