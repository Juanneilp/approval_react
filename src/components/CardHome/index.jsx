import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Universal Cookies
import Cookies from "universal-cookie";

const CardHome = () => {
  return (
    <section className="tambahberita mb-3 pb-3 mt-3 pt-3">
      <div className="container">
        <div className="card" style={{ width: "18rem" }}>
          <div className="card-body">
            <h5 className="card-title pb-3">Welcome Back !</h5>
            <h1 className="card-subtitle mb-2 text-body-secondary">
              <i className="fa-regular fa-circle-user"></i>
            </h1>
            <p className="card-text pt-3">Manager</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardHome;
