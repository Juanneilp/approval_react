import { useState } from "react";
//import "./App.css";

import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Approval1 from "./pages/Approval1";
import Approval2 from "./pages/Approval2";
import Approval3 from "./pages/Approval3";
import Approval4 from "./pages/Approval4";
import UserManagement from "./pages/UserManagement";

function App() {
  const [loginData, setLoginData] = useState({
    CompanyDB: "SBODemoAU",
    Password: "P@ssw0rd",
    UserName: "manager",
  });

  const handleLogin = async () => {
    try {
      const response = await fetch("https://muhamadjaya:50000/b1s/v1/Login", {
        method: "POST",
        //mode: "no-cors", // Add this
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
        xhrFields: {
          withCredentials: true,
        },
        credentials: "include", // Include cookies for session
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Login successful:", result);
        console.log("SessionId", result.SessionId);
        sessionStorage.setItem("authToken", result.SessionId); // Store token if returned
      } else {
        console.error("Login failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGetDataPayReq = async () => {
    try {
      // Assuming you receive a token during login
      const token = sessionStorage.getItem("authToken"); // If you need this for other headers

      // Set the cookie header directly
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

      const response = await fetch(
        "https://muhamadjaya:50000/b1s/v1/PAYREQ(1)",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader, // Set the cookie header
            // If the API requires authorization, uncomment the next line and ensure it's correctly set
            // Authorization: `Bearer ${token}`,
          },
          credentials: "include", // To include cookies in the request
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Data retrieved successfully:", result);
      } else {
        console.error("Failed to retrieve data:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/approval1" element={<Approval1 />} />
      <Route path="/approval2" element={<Approval2 />} />
      <Route path="/approval3" element={<Approval3 />} />
      <Route path="/approval4" element={<Approval4 />} />
      <Route path="/user-management" element={<UserManagement />} />
    </Routes>
  );
}

export default App;
