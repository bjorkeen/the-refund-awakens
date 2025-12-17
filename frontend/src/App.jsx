import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AccessGate from './components/AccessGate';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import AuthPanel from './components/AuthPanel';

import CreateTicket from './pages/CreateTicket';
import MyTickets from './pages/MyTickets';
import Playground from './pages/Playground';

import Footer from './components/Footer/Footer';

function App() {
  return (
    <>
      <Header />
      <AccessGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPanel />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <MyTickets />
            </PrivateRoute>
          } />

          <Route path="/requests" element={
            <PrivateRoute>
              <MyTickets />
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
          {/* Footer always visible */}
      <Footer />
    </>
  );
}

export default App;