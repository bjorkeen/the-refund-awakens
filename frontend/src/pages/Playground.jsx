import React from 'react';

// Αυτή είναι η σελίδα δοκιμών για τους Developers.
// Κάντε import εδώ τα components σας για να τα τεστάρετε.

import Header from "../components/Header";

export default function Playground() {
  return (
    <div style={{ padding: '40px', minHeight: '100vh', backgroundColor: '#f4f4f5' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#555' }}>
        🛠️ Component Playground
      </h1>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Import your component in this file and render it below to test it.
        <br />
        <strong>Warning:</strong> Do not commit changes to this file unless necessary.
      </p>

      <hr style={{ border: '1px solid #ddd', marginBottom: '2rem' }} />

      {/* --- SPACE FOR TESTING BELOW --- */}
      
      <div style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>Test Area</h3>
        
        {/* Test Header */}
        <div style={{ border: '1px solid red', padding: '10px', margin: '10px 0' }}>
          <p>Header should render here:</p>
          <Header />
          {/* Routes are handled by the main app router */}
        </div>
        
        {/* <Header /> */}
        {/* <Footer /> */}
        
        <p>Your component goes here...</p>
      </div>

    </div>
  );
}