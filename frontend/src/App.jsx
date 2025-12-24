import { Routes, Route } from 'react-router-dom';
import AccessGate from '@/components/AccessGate';
import PrivateRoute from '@/components/PrivateRoute';
import AuthPanel from '@/components/AuthPanel';
import Header from '@/components/Layout/Header/Header';
import Footer from '@/components/Layout/Footer/Footer';

import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage'; 
import Playground from '@/pages/Playground';

import CustomerDashboard from '@/components/Dashboard/CustomerDashboard';
import CreateTicket from '@/components/Tickets/CreateTicketForm';

function App() {
  return (
    <>
      <Header />
      <AccessGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPanel />} />
          
          <Route path="/dashboard" element={<DashboardPage />} />
             
          <Route path="/requests" element={
            <PrivateRoute>
              <CustomerDashboard />
            </PrivateRoute>
          } />

          <Route path="/create-ticket" element={
            <PrivateRoute>
              <CreateTicket />
            </PrivateRoute>
          } />
          
          {/* DEVELOPMENT ONLY ROUTE */}
          <Route path="/test" element={<Playground />} />
          
        </Routes>
      </AccessGate>
      <Footer />
    </>
  );
}

export default App;