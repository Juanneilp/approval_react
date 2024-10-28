import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";

const Approval2 = () => {
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://localhost:50000/b1s/v1/Login", {
        method: "POST",
        //mode: "no-cors", // Add this
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CompanyDB: "SBODEMOAU",
          Password: sessionStorage.getItem("authPass"),
          UserName: sessionStorage.getItem("authUser"),
        }),
        xhrFields: {
          withCredentials: true,
        },
        credentials: "include", // Include cookies for session
      });

      if (response.ok) {        
        sessionStorage.removeItem("authToken");
        const result = await response.json();
        console.log("Login successful:", result);
        sessionStorage.setItem("authToken", result.SessionId);
        //navigate("/home");
      } else {
        console.error("Login failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);

      //console.log(inputs);
    }
  };

  const [inputsPayreq, setInputsPayreq] = useState({
    DateFrom: "",
    DateTo: "",
  });

  const handleInputPayreq = (value, key) => {
    const newInputsPayreq = { ...inputsPayreq };

    newInputsPayreq[key] = value;

    setInputsPayreq(newInputsPayreq);
  };

  const handleSearch = async (e) => {
    try {
      e.preventDefault();

      handleLogin(e);

      const token = sessionStorage.getItem("authToken");

      // Set the cookie header directly
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
      // Fungsi untuk mengubah tanggal ke format YYYYMMDD
      const formatDateToYYYYMMDD = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };
      // Konversi DateFrom dan DateTo ke format YYYYMMDD
      const formattedDateFrom = formatDateToYYYYMMDD(inputsPayreq.DateFrom);
      const formattedDateTo = formatDateToYYYYMMDD(inputsPayreq.DateTo);
      const response = await fetch(
        "https://localhost:50000/b1s/v1/PAYREQ?$filter= U_SOL_POSTDATE ge " + 20241001 + " and U_SOL_POSTDATE le "  + 20241025 ,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          credentials: "include",
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
    <>
      <Sidebar />
      <div className="main-content">
        <DashboardHeader />
        <main>
          <section className="recent">
            <div className="activity-grid">
              <div className="activity-card">
                {/* Tambahkan Judul */}
                <h2 style={{ padding: "10px", textAlign: "center" }}>
                  Approval 2
                </h2>

                <div className="container">
                  <div className="row mb-4">
                    <div className="col">
                      <label>Period</label>
                      <input
                        type="date"
                        className="form-control"
                        name="DateFrom"
                        id="DateFrom"
                        required
                        autoComplete="off"
                        autoFocus
                        onChange={(e) => handleInputPayreq(e.target.value, e.target.name)}
                      />
                    </div>
                    <div className="col">
                      <label>s/d</label>
                      <input
                        type="date"
                        className="form-control"
                        name="DateTo"
                        id="DateTo"
                        required
                        autoComplete="off"
                        autoFocus
                        onChange={(e) => handleInputPayreq(e.target.value, e.target.name)}
                      />
                    </div>
                    <div className="col">
                      <label>Document No.</label>
                      <div className="d-flex">
                        <select className="form-control mr-2">
                          <option>PA</option>
                          <option>PB</option>
                        </select>
                        <input type="text" className="form-control" placeholder="24000001" />
                      </div>
                    </div>
                    <div className="col">
                      <label>Approval Date</label>
                      <input type="date" className="form-control" />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col">
                      <label>Document Type</label>
                      <select className="form-control">
                        <option>Department</option>
                        <option>FA</option>
                      </select>
                    </div>
                    <div className="col">
                      <label>&nbsp;</label>
                      <button className="btn btn-primary btn-block" onClick={handleSearch}>
                        {"Search"}
                      </button>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col">
                      <label>Decision</label>
                      <select className="form-control">
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  </div>

                  

                  {/* Tabel Dokumen */}
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Selected</th>
                        <th>Document No.</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Total Paid</th>
                        <th>Document Type</th>
                        <th>Cash Flow</th>
                        <th>Remarks</th>
                        <th>Requester</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                    </tbody>
                  </table>

                  {/* Input Remarks */}
                  <div className="row mb-3">
                    <div className="col">
                      <label>Remarks</label>
                      <input
                        type="text"
                        className="form-control"
                        
                        placeholder="Enter your remarks"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col">
                      <button className="btn btn-primary" >
                        Add
                      </button>
                      <button className="btn btn-secondary ml-2">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Approval2;
