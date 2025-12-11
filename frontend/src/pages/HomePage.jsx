import AuthPanel from '../components/AuthPanel';

const HomePage = () => {
  return (
    <div className="page-container">
      {/* Λογότυπο έξω από την κάρτα */}
      <div className="logo-area">
        <h1>Electronics R&R</h1>
        <p>Returns & Repairs Management</p>
      </div>

      {/* Η κάρτα εισόδου */}
      <AuthPanel />
    </div>
  );
};

export default HomePage;