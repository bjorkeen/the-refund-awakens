import { useAccess } from '@/context/AccessContext';

const AccessGate = ({ children }) => {
  const { loading } = useAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-600">Checking access...</p>
      </div>
    );
  }

  return children;
};

export default AccessGate;
