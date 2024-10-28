import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// React Router Dom
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
