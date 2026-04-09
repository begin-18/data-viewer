import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// main.jsx
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Add the basename here */}
    <BrowserRouter basename="/data-viewer">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
