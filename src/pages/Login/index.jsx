import React, { useState, useEffect } from "react";
import ImageLogin from "../../assets/images/admin-login.gif";
import LoadingSvg from "../../components/LoadingSvg/LoadingSvg";
import { useNavigate } from "react-router-dom";

// Universal Cookies
import Cookies from "universal-cookie";

const Login = () => {
  const [inputs, setInputs] = useState({
    CompanyDB: "SBODEMOAU",
    Password: "",
    UserName: "",
  });

  const handleInput = (value, key) => {
    const newInputs = { ...inputs };

    newInputs[key] = value;

    setInputs(newInputs);
  };

  let navigate = useNavigate();

  const [passwordShown, setPasswordShown] = useState(false);

  const togglePassword = () => {
    setPasswordShown(!passwordShown);
  };

  const cookies = new Cookies();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://localhost:50000/b1s/v1/Login", {
        method: "POST",
        //mode: "no-cors", // Add this
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
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
        sessionStorage.setItem("authUser", inputs.UserName);
        sessionStorage.setItem("authPass", inputs.Password);
        navigate("/home");
      } else {
        console.error("Login failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);

      console.log(inputs);
    }
  };

  // useEffect(() => {
  //   const getAuth = sessionStorage.getItem("authToken");
  //   if (getAuth) {
  //     navigate("/home");
  //   }
  // }, []);

  return (
    <div className="container">
      <section className="login mt-5 pt-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-5">
              <img
                src={ImageLogin}
                alt="gambar login"
                className="login-image"
              />
            </div>
            <div className="col-md-4">
              <form className="form-login">
                <div className="form-group">
                  <h2 className="label-login-selamat-datang">
                    Selamat Datang!
                  </h2>
                  <label htmlFor="UserName" className="label-login-username">
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="UserName"
                    id="UserName"
                    required
                    autoComplete="off"
                    autoFocus
                    onChange={(e) => handleInput(e.target.value, e.target.name)}
                  />
                </div>
                <div className="form-group mt-2">
                  <label htmlFor="Password" className="label-login-password">
                    Password
                  </label>
                  <input
                    type={passwordShown ? "text" : "password"}
                    className="form-control"
                    name="Password"
                    id="Password"
                    required
                    autoComplete="off"
                    onChange={(e) => handleInput(e.target.value, e.target.name)}
                  />
                </div>
                <input
                  className="form-check-input login-check-box"
                  type="checkbox"
                  value=""
                  id="flexCheckDefault"
                  onClick={togglePassword}
                />
                <label
                  className="form-check-label label-tampilkan-password"
                  htmlFor="flexCheckDefault"
                >
                  Tampilkan Password
                </label>

                <button
                  type="submit"
                  name="login"
                  className="btn btn-primary btn-login pt-2 pb-2"
                  onClick={handleLogin}
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
