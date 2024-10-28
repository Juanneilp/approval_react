import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";

const Approval1 = () => {
  const [documents, setDocuments] = useState([]); // State untuk menyimpan data hasil fetch
  const [inputsPayreq, setInputsPayreq] = useState({
    DateFrom: "",
    DateTo: "",
  });
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const [errorMessage, setErrorMessage] = useState(""); // State untuk error
  const [selectedDocs, setSelectedDocs] = useState([]); // State untuk menyimpan DocEntry yang dicentang

  const handleInputPayreq = (value, key) => {
    const newInputsPayreq = { ...inputsPayreq };
    newInputsPayreq[key] = value;
    setInputsPayreq(newInputsPayreq);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://localhost:50000/b1s/v1/Login", {
        method: "POST",
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
        credentials: "include", // Sertakan cookies untuk sesi
      });

      if (response.ok) {
        sessionStorage.removeItem("authToken");
        const result = await response.json();
        sessionStorage.setItem("authToken", result.SessionId);
      } else {
        console.error("Login failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSearch = async (e) => {
    try {
      e.preventDefault();
      setIsLoading(true);
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
        `https://localhost:50000/b1s/v1/PAYREQ?$filter=U_SOL_STATUS eq '1' and U_SOL_POSTDATE ge '${formattedDateFrom}' and U_SOL_POSTDATE le '${formattedDateTo}'`,
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
        setDocuments(result.value); // Menyimpan data hasil fetch ke state documents
        setErrorMessage(""); // Bersihkan error
        console.log(result.value);
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

  const handleSelect = (docEntry) => {
    setSelectedDocs((prevSelected) => {
      if (prevSelected.includes(docEntry)) {
        return prevSelected.filter((entry) => entry !== docEntry);
      } else {
        return [...prevSelected, docEntry];
      }
    });
  };


  const handleAdd = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
      // Ambil dokumen yang dicentang dan formatkan untuk body request
      const selectedDocumentsData = documents
        .filter((doc) => selectedDocs.includes(doc.DocEntry))
        .map((doc) => ({
          U_SOL_SELECT: "Y",
          U_SOL_DESIC: "3", // Ganti dengan nilai yang sesuai jika perlu
          U_SOL_DOCNUM_D: doc.DocNum,
          U_SOL_BPNAME: doc.U_SOL_BPNAME || "", // Tambahkan field yang sesuai jika ada
          U_SOL_DATE_D: doc.U_SOL_POSTDATE,
          U_SOL_TIPE: doc.Object,
          U_SOL_TOTAL: doc.U_SOL_TOTPAID,
          U_SOL_CASHFLOW: doc.U_SOL_CASHFLOW,
          U_SOL_RMK: doc.U_SOL_RMK,
          U_SOL_RMKAPP: null, // Ganti dengan nilai yang sesuai jika ada
          U_SOL_REQ: doc.U_SOL_REQ,
        }));
  
      // PATCH untuk mengupdate U_SOL_STATUS menjadi 2 pada dokumen yang dipilih
      const patchPromises = selectedDocs.map((docEntry) =>
        fetch(`https://localhost:50000/b1s/v1/PAYREQ(${docEntry})`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ U_SOL_STATUS: 2 }),
          credentials: "include",
        })
      );
  
      await Promise.all(patchPromises); // Tunggu semua PATCH selesai
  
      // Format JSON body untuk POST
      const requestBody = {
        U_SOL_PERFROM: inputsPayreq.DateFrom + "T00:00:00Z",
        U_SOL_PERTO: inputsPayreq.DateTo + "T00:00:00Z",
        U_SOL_DOCTYPE: "Department", // Ganti sesuai input user
        U_SOL_DDOCTYPE: "FA", // Ganti sesuai input user
        U_SOL_APPDATE: new Date().toISOString(), // Tanggal saat ini
        U_SOL_DECISION: "1", // Ganti sesuai input user
        U_SOL_DECISION2: "1", // Ganti sesuai input user
        U_SOL_DECISION3: "3", // Ganti sesuai input user
        U_SOL_DECISION4: "3", // Ganti sesuai input user
        U_SOL_RMK: "Approval 1 qp", // Ganti sesuai input user
        SOL_PAYAPP_DCollection: selectedDocumentsData,
      };
  
      // Kirim request POST ke endpoint /PAYAPP
      const postResponse = await fetch("https://localhost:50000/b1s/v1/PAYAPP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });
  
      if (postResponse.ok) {
        const result = await postResponse.json();
        Swal.fire("Success", "Documents updated and posted successfully!", "success");
        setSelectedDocs([]); // Reset selectedDocs
        await handleSearch(); // Ambil ulang data jika perlu
      } else {
        const errorData = await postResponse.json();
        setErrorMessage(errorData.message || "Failed to post data");
      }
    } catch (error) {
      //setErrorMessage("Network error, please try again later.");
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
                <h2 style={{ padding: "10px", textAlign: "center" }}>Approval 1</h2>
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
                          <tr key={doc.DocEntry}>
                            <td>{index + 1}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDocs.includes(doc.DocEntry)} // Menandai checkbox yang dicentang
                                onChange={() => handleSelect(doc.DocEntry)}
                              />
                            </td>
                            <td>{doc.DocNum}</td>
                            <td>{doc.U_SOL_POSTDATE}</td>
                            <td>{doc.Object}</td>
                            <td>{doc.U_SOL_TOTPAID}</td>
                            <td>{doc.U_SOL_DOCTYPE}</td>
                            <td>{doc.U_SOL_CASHFLOW}</td>
                            <td>{doc.U_SOL_RMK}</td>
                            <td>{doc.U_SOL_REQ}</td>
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

export default Approval1;
