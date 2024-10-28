import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";

const Approval4 = () => {
  const [documents, setDocuments] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const [errorMessage, setErrorMessage] = useState(""); // State untuk error

  const handleSelect = (id) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, selected: !doc.selected } : doc
      )
    );
  };

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
  };

  const handleAdd = () => {
    Swal.fire("Success", "Documents added successfully", "success");
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setErrorMessage(""); // Bersihkan pesan error sebelumnya

    try {
      const response = await fetch("https://localhost:50000/b1s/v1/PAYREQ", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update state documents dengan data dari API
        setDocuments(data);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to fetch data");
      }
    } catch (error) {
      setErrorMessage("Network error, please try again later.");
    } finally {
      setIsLoading(false); // Hentikan loading
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
                  Approval 4
                </h2>

                <div className="container">
                  <div className="row mb-4">
                    <div className="col">
                      <label>Period</label>
                      <input type="date" className="form-control" />
                    </div>
                    <div className="col">
                      <label>s/d</label>
                      <input type="date" className="form-control" />
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
                        {isLoading ? "Searching..." : "Search"}
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

                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}

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
                      {documents.length > 0 ? (
                        documents.map((doc, index) => (
                          <tr key={doc.id}>
                            <td>{index + 1}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={doc.selected}
                                onChange={() => handleSelect(doc.id)}
                              />
                            </td>
                            <td>{doc.docNumber}</td>
                            <td>{doc.date}</td>
                            <td>{doc.type}</td>
                            <td>{doc.totalPaid}</td>
                            <td>{doc.docType}</td>
                            <td>{doc.cashFlow}</td>
                            <td>{doc.remarks}</td>
                            <td>{doc.requester}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center">
                            No documents found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Input Remarks */}
                  <div className="row mb-3">
                    <div className="col">
                      <label>Remarks</label>
                      <input
                        type="text"
                        className="form-control"
                        value={remarks}
                        onChange={handleRemarksChange}
                        placeholder="Enter your remarks"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col">
                      <button className="btn btn-primary" onClick={handleAdd}>
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

export default Approval4;
