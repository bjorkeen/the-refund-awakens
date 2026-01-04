import { Routes, Route } from "react-router-dom";
import AccessGate from "@/components/AccessGate";
import PrivateRoute from "@/components/PrivateRoute";
import AuthPanel from "@/components/AuthPanel";
import Header from "@/components/Layout/Header/Header";
import Footer from "@/components/Layout/Footer/Footer";

import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import Playground from "@/pages/Playground";
import TicketDetailsPage from "@/pages/TicketDetailsPage";
import CreateTicket from "@/components/Tickets/CreateTicketForm";
import ForgotPassword from "@/components/AuthForm/ForgotPassword";
import CustomerRequests from "@/components/Dashboard/CustomerRequests"; 

function App() {
  return (
    <>
      <Header />
      <AccessGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPanel />} />          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* MY REQUESTS: Αυτό πρέπει να φορτώνει ΑΠΕΥΘΕΙΑΣ το CustomerRequests */}
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

          {/* DEVELOPMENT ONLY ROUTE */}
          <Route path="/test" element={<Playground />} />
        </Routes>
      </AccessGate>
      <Footer />
    </>
  );
}

export default App;