import { useAccess } from "../context/AccessContext";
import MyTickets from './MyTickets';

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
    if (user.role === 'Employee' || user.role === 'Technician'){
         return <div>Staff Dashboard (Under Construction)</div>;
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