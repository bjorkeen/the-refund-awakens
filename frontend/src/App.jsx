import { Routes, Route } from "react-router-dom";
import AccessGate from "@/components/AccessGate";
import PrivateRoute from "@/components/PrivateRoute";
import AuthPanel from "@/components/AuthPanel";
import Header from "@/components/Layout/Header/Header";
import Footer from "@/components/Layout/Footer/Footer";
import { AccessProvider } from './context/AccessContext';
import { NotificationProvider } from './context/NotificationContext';

import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import TicketDetailsPage from "@/pages/TicketDetailsPage";
import CreateTicket from "@/components/Tickets/CreateTicketForm";
import ForgotPassword from "@/components/AuthForm/ForgotPassword";
import CustomerRequests from "@/components/Dashboard/CustomerRequests";

function App() {
  return (
    <AccessProvider>
      <NotificationProvider>
        <div className="app-container">
          
          <Header />
          
          <AccessGate>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPanel />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              
              <Route
                path="/requests"
                element={
                  <PrivateRoute>
                    <CustomerRequests />
                  </PrivateRoute>
                }
              />

              <Route
                path="/create-ticket"
                element={
                  <PrivateRoute>
                    <CreateTicket />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tickets/:id"
                element={
                  <PrivateRoute>
                    <TicketDetailsPage />
                  </PrivateRoute>
                }
              />

            </Routes>
          </AccessGate>
          
          <Footer />
          
        </div>
      </NotificationProvider>
    </AccessProvider>
  );
}

export default App;