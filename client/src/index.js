import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <>
      <div style={{textAlign: 'center', marginTop: '2rem', fontSize: '1.5rem', color: '#1976d2'}}>
        Welcome to Canteen Pro!
      </div>
      <App />
    </>
  </React.StrictMode>
);
