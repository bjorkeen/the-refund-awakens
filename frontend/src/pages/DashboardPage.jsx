import { useAccess } from "@/context/AccessContext.jsx";
import CustomerDashboard from "@/components/Dashboard/CustomerDashboard";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import TechnicianDashboard from "@/components/Dashboard/TechnicianDashboard";
import StaffDashboard from "@/components/Dashboard/StaffDashboard";


const DashboardPage = () => {
  const { user } = useAccess();

  if (!user)
    return <div className="p-8 text-center">Loading user profile...</div>;

  // Smart Switching Logic
  switch (user.role) {
    case 'Technician':
      return <TechnicianDashboard />;
    case 'Admin':
    case 'Manager':
      return <AdminDashboard />;
    case 'Employee':
      return <StaffDashboard />;
    case 'Customer':
      return <CustomerDashboard />;
    default:
      return <Navigate to="/" replace />; //redirecting invalid/uknown roles to login
  }
};

export default DashboardPage;