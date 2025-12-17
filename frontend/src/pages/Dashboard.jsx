import { useAccess } from "../context/AccessContext";
import MyTickets from './MyTickets';
import StaffDashboard from './StaffDashboard';

const Dashboard = () => {
    const {user} = useAccess();

    if (!user) {
        return <div style={{ padding: '20px' }}>Loading user profile...</div>
    }

    //customer case
    if (user.role === 'Customer'){
        return <MyTickets/>;
    }
    
    //staff case
    if (user.role === 'Staff'){
        return <StaffDashboard />;
    }

    //manager case
    if (user.role === 'Manager') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Manager Dashboard</h1>
        <p>Manager features are currently under development.</p>
        <p>You have full access permissions.</p>
      </div>
        )
    }
}

export default Dashboard;