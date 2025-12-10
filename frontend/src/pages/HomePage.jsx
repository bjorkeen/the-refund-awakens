import AuthPanel from "../components/AuthPanel";

const HomePage = () => {
  return (
    <div className="page-container">
      <div className="panel">
        <h1>Electronics R&R</h1>
        <p style={{ marginTop: "0", marginBottom: "20px", color: "#888" }}>
          {" Returns & Repairs Management "}
        </p>
        <AuthPanel />
      </div>
    </div>
  );
};

export default HomePage;
