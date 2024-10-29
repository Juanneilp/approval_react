import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

const Approval1 = () => {
  const [documents, setDocuments] = useState([]); // State untuk menyimpan data hasil fetch
  const [inputsPayreq, setInputsPayreq] = useState({
    DateFrom: "",
    DateTo: "",
  });
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const [errorMessage, setErrorMessage] = useState(""); // State untuk error
  const [selectedDocs, setSelectedDocs] = useState([]); // State untuk menyimpan DocEntry yang dicentang
  const [latestDocNum, setLatestDocNum] = useState(""); // State for latest DocNum

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

  // Fungsi untuk mengonversi format tanggal dari YYYYMMDD ke DD Month YYYY
const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return dateStr;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Buat objek Date dari string tanggal
  const date = new Date(`${year}-${month}-${day}`);

  // Mendapatkan nama bulan dalam bahasa Inggris
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);

  // Mengembalikan dalam format DD-Month-YYYY
  return `${day}-${monthName}-${year}`;
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
        //`https://localhost:50000/b1s/v1/PAYREQ?$filter= U_SOL_STATUS eq '1' and U_SOL_POSTDATE ge '${formattedDateFrom}' and U_SOL_POSTDATE le '${formattedDateTo}'`,
        `https://localhost:50000/b1s/v1/PAYREQ?$filter= U_SOL_POSTDATE ge '${formattedDateFrom}' and U_SOL_POSTDATE le '${formattedDateTo}'`,
        
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
      //setErrorMessage("Network error, please try again later.");
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

  const sendEmail = async () => {
    setIsLoading(true);
  
    try {
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
  
      // Lakukan GET request untuk setiap DocEntry yang dicentang
      const queryPromises = selectedDocs.map((docEntry) =>
        fetch(`https://localhost:50000/b1s/v1/SQLQueries('GetPAYAPP1')/List?DocEntry=${docEntry}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          credentials: "include",
        }).then(response => {
          if (!response.ok) throw new Error("Gagal mengambil data untuk DocEntry " + docEntry);
          return response.json();
        })
      );
  
      const queryResults = await Promise.all(queryPromises);
      console.log("Query Results:", queryResults); // Debugging untuk cek struktur data

      // Mengambil Value dari hasil GET Query
      //Table 1
      const PAYAPP_PerFrom = queryResults.map(result => formatDate(result.value[0]?.PAYAPP_PerFrom)).join(", ");
      const PAYAPP_PerTo = queryResults.map(result => formatDate(result.value[0]?.PAYAPP_PerTo)).join(", ");
      const PAYAPP_DocType = queryResults.map(result => result.value[0]?.PAYAPP_DocType).join(", "); 
      const PAYAPP_DDocType = queryResults.map(result => result.value[0]?.PAYAPP_DDocType).join(", "); 
      const PAYAPP_SeriesName = queryResults.map(result => result.value[0]?.PAYAPP_SeriesName).join(", "); 
      const PAYAPP_DocNum = queryResults.map(result => result.value[0]?.PAYAPP_DocNum).join(", "); 
      const PAYAPP_Decision = queryResults.map(result => result.value[0]?.PAYAPP_Decision).join(", "); 
      const PAYAPP_AppDate = queryResults.map(result => formatDate(result.value[0]?.PAYAPP_AppDate)).join(", "); 
      const PAYAPP_Remarks = queryResults.map(result => result.value[0]?.PAYAPP_Remarks).join(", "); 

      //Table 2
      const PAYAPP_DocNum_D = queryResults.map(result => result.value[0]?.PAYAPP_DocNum_D).join(", ");
      const PAYAPP_Date_D = queryResults.map(result => formatDate(result.value[0]?.PAYAPP_Date_D)).join(", ");
      const PAYAPP_Type_D = queryResults.map(result => result.value[0]?.PAYAPP_Type_D).join(", ");
      const PAYAPP_Total_D = queryResults.map(result => result.value[0]?.PAYAPP_Total_D).join(", ");
      const PAYAPP_CashFlow_D = queryResults.map(result => result.value[0]?.PAYAPP_CashFlow_D).join(", ");
      const PAYAPP_RMK_D = queryResults.map(result => result.value[0]?.PAYAPP_RMK_D).join(", ");
      const PAYAPP_REQ_D = queryResults.map(result => result.value[0]?.PAYAPP_REQ_D).join(", ");
      
      const PAYREQ_DocNum_H = queryResults.map(result => result.value[0]?.PAYREQ_DocNum_H).join(", ");
      //Table 3 (Looping)
      // Data untuk Table 3 - Looping
      const table3Data = queryResults.flatMap((result, index) => 
      result.value.map((item, subIndex) => `
        <tr>
          <td>${index + subIndex + 1}</td>
          <td>${item.PAYREQ_VenCode || "-"}</td>
          <td>${item.PAYREQ_VenName || "-"}</td>
          <td>${item.PAYREQ_DocNum || "-"}</td>
          <td>${item.PAYREQ_Type || "-"}</td>
          <td>${formatDate(item.PAYREQ_Date) || "-"}</td>
          <td>${item.PAYREQ_NoOut || "-"}</td>
          <td>${formatDate(item.PAYREQ_DateOut) || "-"}</td>
          <td>${item.PAYREQ_Total || "-"}</td>
          <td>${item.PAYREQ_BalDue || "-"}</td>
          <td>${item.PAYREQ_PayAmou || "-"}</td>
          <td>${item.PAYREQ_BankCharge || "-"}</td>
          <td>${item.PAYREQ_RMK_INV || "-"}</td>
        </tr>
      `)
    ).join("");


      // Tabel HTML untuk "Table 3"
      const table3HTML = `
        <table border="1" width="100%" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>No.</th>
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th>Document No</th>
              <th>Type</th>
              <th>Due Date</th>
              <th>No Outgoing</th>
              <th>Date Outgoing</th>
              <th>Total</th>
              <th>Balance Due</th>
              <th>Payment Amount</th>
              <th>Bank Charge</th>
              <th>Remarks Invoice</th>
            </tr>
          </thead>
          <tbody>
            ${table3Data}
          </tbody>
        </table>
      `;

      console.log("Generated Table 3 HTML:", table3HTML);

      // Mengirim email dengan data tambahan
      const result = await emailjs.send(
        "mjservice99",
        "templatemj99",
        {
          name: "User 2",
          PAYAPP_PerFrom,
          PAYAPP_PerTo,
          PAYAPP_DocType,
          PAYAPP_DDocType,
          PAYAPP_SeriesName,
          PAYAPP_DocNum,
          PAYAPP_Decision,
          PAYAPP_AppDate,
          PAYAPP_Remarks,
          // Data dari Table 2
          PAYAPP_DocNum_D,
          PAYAPP_Date_D,
          PAYAPP_Type_D,
          PAYAPP_Total_D,
          PAYAPP_CashFlow_D,
          PAYAPP_RMK_D,
          PAYAPP_REQ_D,
          PAYREQ_DocNum_H,
          // Data dari Table 3
          table3HTML
        },
        "wpMFQF0XbgvLIRP-G"
      );
  
      console.log("Email terkirim:", result.text);
      Swal.fire("Sukses", "Email berhasil dikirim!", "success");
    } catch (error) {
      console.error("Error pengiriman email:", error);
      Swal.fire("Error", "Gagal mengirim email!", "error");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleAdd = async () => {
    setIsLoading(true);
    const token = sessionStorage.getItem("authToken");
    const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

    const selectedDocumentsData = documents
      .filter((doc) => selectedDocs.includes(doc.DocEntry))
      .map((doc) => ({
        U_SOL_SELECT: "Y",
        U_SOL_DESIC: "3",
        U_SOL_DOCNUM_D: doc.DocNum,
        U_SOL_BPNAME: doc.U_SOL_BPNAME || "",
        U_SOL_DATE_D: doc.U_SOL_POSTDATE,
        U_SOL_TIPE: doc.Object,
        U_SOL_TOTAL: doc.U_SOL_TOTPAID,
        U_SOL_CASHFLOW: doc.U_SOL_CASHFLOW,
        U_SOL_RMK: doc.U_SOL_RMK,
        U_SOL_REQ: doc.U_SOL_REQ,
      }));

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

    try {
      await Promise.all(patchPromises);
      const requestBody = {
        U_SOL_PERFROM: inputsPayreq.DateFrom + "T00:00:00Z",
        U_SOL_PERTO: inputsPayreq.DateTo + "T00:00:00Z",
        U_SOL_DOCTYPE: "Department",
        U_SOL_DDOCTYPE: "FA",
        U_SOL_APPDATE: new Date().toISOString(),
        U_SOL_DECISION: "1",
        U_SOL_DECISION2: "1",
        U_SOL_DECISION3: "3",
        U_SOL_DECISION4: "3",
        U_SOL_RMK: "Approval 1 qp",
        SOL_PAYAPP_DCollection: selectedDocumentsData,
      };

      // const postResponse = await fetch("https://localhost:50000/b1s/v1/PAYAPP", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Cookie: cookieHeader,
      //   },
      //   body: JSON.stringify(requestBody),
      //   credentials: "include",
      // });

      // if (postResponse.ok) {
      //   Swal.fire("Success", "Documents updated and posted successfully!", "success");
      //   setSelectedDocs([]);
      //   await handleSearch();
      //   await sendEmail(); // Send email after successful POST
      // } else {
      //   const errorData = await postResponse.json();
      //   setErrorMessage(errorData.message || "Failed to post data");
      // }
      await sendEmail(); // Send email after successful POST
    } catch (error) {
      setErrorMessage("Network error, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
  const todayDate = new Date().toISOString().split("T")[0];
  
  useEffect(() => {
    fetchLatestDocNum(); // Fetch the latest DocNum on component mount
  }, []);

  const fetchLatestDocNum = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

      const response = await fetch(
        "https://localhost:50000/b1s/v1/PAYAPP?$select=DocNum&$orderby=DocNum desc&$top=1",
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
        setLatestDocNum(result.value[0].DocNum || ""); // Set the latest DocNum to state
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to fetch DocNum");
      }
    } catch (error) {
      setErrorMessage("Network error, please try again later.");
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
                          <option>Primary</option>
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          value={latestDocNum} // Bind the latest DocNum here
                          readOnly // Make input readonly if you don't want user to edit
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                    <div className="col">
                      <label>Approval Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={todayDate} // Set tanggal hari ini
                        readOnly // Membuat input tidak bisa diubah
                        style={{ backgroundColor: "#e9ecef" }} // Grayout warna background
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label>Document Type</label>
                      <select className="form-control">
                        <option>Department</option>
                      </select>
                    </div>

                    {/* New Field */}
                    <div className="col-md-6">
                      <label> </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Document Type"
                      />
                  </div>

                    
                  <div className="row mb-3">
                    <div className="col">
                      <label>Decision</label>
                      <select className="form-control">
                        <option>Approved</option>
                        <option>Pending</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="col">
                      <label>&nbsp;</label>
                      <button className="btn btn-primary btn-block" onClick={handleSearch}>
                        {isLoading ? "Searching..." : "Search"}
                      </button>
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
                      <button className="btn btn-primary" style={{marginRight: "10px"}} onClick={handleAdd}>
                        Add
                      </button>
                      <button className="btn btn-secondary ml-2">Cancel</button>
                    </div>
                    
                  </div>
                  <br></br>
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
