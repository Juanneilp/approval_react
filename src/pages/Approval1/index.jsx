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
    DDocType: "",
    Series: "",
    CostCenter:""
  });
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const [errorMessage, setErrorMessage] = useState(""); // State untuk error
  const [selectedDocs, setSelectedDocs] = useState([]); // State untuk menyimpan DocEntry yang dicentang
  const [latestDocNum, setLatestDocNum] = useState(""); // State for latest DocNum
  const [cashFlowNames, setCashFlowNames] = useState({}); // Store LineItemName by DocEntry
  const [remarks, setRemarks] = useState(""); // State untuk Remarks
  const [departmentOptions, setDepartmentOptions] = useState([]); 

  // Fetch data department dari endpoint SQL Query
  const fetchDepartments = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

      const response = await fetch(
        "https://localhost:50000/b1s/v1/SQLQueries('GetDepartment')/List",
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
        const data = await response.json();
        const departments = data.value.map((item) => item.Name);
        setDepartmentOptions(departments);

        // Set nilai default jika belum diatur
        if (!inputsPayreq.DDocType && departments.length > 0) {
          setInputsPayreq((prev) => ({
            ...prev,
            //DDocType: departments[0], // Default ke opsi pertama
          }));
        }
      } else {
        console.error("Failed to fetch departments:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);
  
  
  const handleInputPayreq = (value, key) => {
    if (key === "DDocType" && !departmentOptions.includes(value)) {
      console.error("Invalid value for Department:", value);
      return; // Abaikan jika nilai tidak valid
    }
  
    const newInputsPayreq = { ...inputsPayreq };
    newInputsPayreq[key] = value;
    setInputsPayreq(newInputsPayreq);
  };
  
 

  const handleLogin = async (e) => {
    //e.preventDefault();

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

  const formatDate = (dateStr) => {
    if (!dateStr) {
        console.warn("Tanggal tidak valid atau tidak didefinisikan:", dateStr);
        return "-";
    }

    // Jika format tanggal adalah 'YYYYMMDD', ubah ke 'YYYY-MM-DD'
    if (/^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        console.warn("Tanggal tidak valid setelah konversi:", dateStr);
        return "-";
    }

    const day = date.getUTCDate().toString().padStart(2, "0");
    const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
    const year = date.getUTCFullYear();
    return `${day}-${monthName}-${year}`;
};


  

  // Function to format currency
  const formatCurr = (value) => {
    if (value == null) return "";
  
    // Format the number with thousand separators and two decimal places
    let formattedValue = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  
    // Remove ",00" if the value has no decimal part
    if (formattedValue.endsWith(",00")) {
      formattedValue = formattedValue.slice(0, -3);
    }
  
    return formattedValue;
  };


  const handleSearch = async (e) => {
    //e.preventDefault();
    setIsLoading(true);
    handleLogin(e);
    try {
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
      // Fungsi untuk format tanggal ke YYYYMMDD
      const formatDateToYYYYMMDD = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
      };
  
      // Format DateFrom dan DateTo
      const formattedDateFrom = formatDateToYYYYMMDD(inputsPayreq.DateFrom);
      const formattedDateTo = formatDateToYYYYMMDD(inputsPayreq.DateTo);
  
      // Membuat filter URL untuk API
      let searchUrl = `https://localhost:50000/b1s/v1/PAYREQ?$filter=U_SOL_STATUS eq '1' and U_SOL_POSTDATE ge '${formattedDateFrom}' and U_SOL_POSTDATE le '${formattedDateTo}'`;
  
      // Tambahkan filter Department jika ada
      if (inputsPayreq.DDocType) {
        searchUrl += ` and U_SOL_DEPARTMENT eq '${inputsPayreq.DDocType}'`;
      }      
  
      // Fetch data berdasarkan URL yang sudah difilter
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      });
  
      if (response.ok) {
        const result = await response.json();
        setDocuments(result.value); // Simpan hasil ke state documents
        setErrorMessage(""); // Reset error
        console.log("Search Results:", result.value);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error during search:", error);
      setErrorMessage("Network error, please try again later.");
    } finally {
      setIsLoading(false); // Set loading selesai
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
    setIsLoading(true);
    const token = sessionStorage.getItem("authToken");
    const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
    try {
      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan di sessionStorage.");
      }
  
      // Langkah 1: Fetch data dari endpoint PAYREQ untuk mendapatkan U_SOL_DDOCTYPE
      const responsePayreq = await fetch("https://localhost:50000/b1s/v1/PAYREQ", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      });
  
      if (!responsePayreq.ok) {
        const errorData = await responsePayreq.json();
        throw new Error(errorData.message || "Gagal mengambil data dari PAYREQ");
      }

      const payreqData = await responsePayreq.json();
  
      const selectedDocumentsData = documents
      .filter((doc) => selectedDocs.includes(doc.DocEntry))
      .map((doc) => {
        // Ambil cashFlowName dari state `cashFlowNames` menggunakan `doc.DocEntry`
        const cashFlowName = cashFlowNames[doc.DocEntry] || "Unknown"; // Fallback jika tidak ditemukan
        console.log("CashFlowName for DocEntry", doc.DocEntry, ":", cashFlowName);

        return {
          U_SOL_SELECT: "Y",
          U_SOL_DESIC: "3",
          U_SOL_DOCNUM_D: doc.DocNum,
          U_SOL_BPNAME: doc.U_SOL_BPNAME || "",
          U_SOL_DATE_D: doc.U_SOL_POSTDATE,
          U_SOL_TIPE: doc.Object,
          U_SOL_TOTAL: doc.U_SOL_TOTPAID,
          U_SOL_CASHFLOW: cashFlowName,
          U_SOL_RMK: doc.U_SOL_RMK,
          U_SOL_REQ: doc.U_SOL_REQ,
        };
      });
  
      const requestBody = {
        U_SOL_PERFROM: inputsPayreq.DateFrom,
        U_SOL_PERTO: inputsPayreq.DateTo,
        U_SOL_APPDATE: new Date().toISOString(),
        U_SOL_SERIES: inputsPayreq.Series,
        U_SOL_DEPARTMENT: inputsPayreq.DDocType,
        U_SOL_COSTCENTER: inputsPayreq.CostCenter,
        U_SOL_DECISION: "1",
        U_SOL_DECISION2: "3",
        U_SOL_DECISION3: "3",
        U_SOL_DECISION4: "3",
        U_SOL_RMK: remarks,
        SOL_PAYAPP_DCollection: selectedDocumentsData,
      };
  
      // Langkah 3: Kirim data ke endpoint PAYAPP
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
        const postResult = await postResponse.json();
        const docEntry = postResult.DocEntry;
  
        // Logging DocEntry untuk debugging
        console.log("DocEntry yang baru saja di-POST:", docEntry);
  
        Swal.fire("Success", "Documents updated and posted successfully!", "success");
        setSelectedDocs([]);
  
        // Langkah 4: Panggil fungsi sendEmail dengan DocEntry
        await sendEmail(docEntry);
  
        // Refresh data setelah sukses
        await handleSearch();
      } else {
        const errorData = await postResponse.json();
        throw new Error(errorData.message || "Failed to post data to PAYAPP");
      }
    } catch (error) {
      console.error("Terjadi error:", error.message);
      setErrorMessage(error.message || "Network error, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const sendEmail = async (docEntry) => {
    setIsLoading(true);
  
    try {
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
      // Langkah 1: GET data berdasarkan DocEntry
      const response = await fetch(
        `https://localhost:50000/b1s/v1/SQLQueries('GetPAYAPP1')/List?DocEntry=${docEntry}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          credentials: "include",
        }
      );
  
      if (!response.ok) {
        throw new Error(`Gagal mengambil data untuk DocEntry ${docEntry}`);
      }
  
      const queryResult = await response.json();
      const data = queryResult.value;
  
      if (!data || data.length === 0) {
        throw new Error(`Data untuk DocEntry ${docEntry} tidak ditemukan`);
      }
  
      // Langkah 2: Ekstrak data untuk email
      const PAYAPP_PerFrom = formatDate(data[0]?.PAYAPP_PerFrom);
      const PAYAPP_PerTo = formatDate(data[0]?.PAYAPP_PerTo);
      const PAYAPP_DocType = data[0]?.PAYAPP_DocType || "-";
      const PAYAPP_DDocType = data[0]?.PAYAPP_DDocType || "-";
      const PAYAPP_SeriesName = data[0]?.PAYAPP_SeriesName || "-";
      const PAYAPP_DocNum = data[0]?.PAYAPP_DocNum || "-";
      const PAYAPP_Decision = data[0]?.PAYAPP_Decision || "-";
      const PAYAPP_AppDate = formatDate(data[0]?.PAYAPP_AppDate);
      const PAYAPP_Remarks = data[0]?.PAYAPP_Remarks || "-";
      const PAYREQ_DocNum_H = data[0]?.PAYREQ_DocNum_H || "-";
      const PAYAPP_Department = data[0]?.PAYAPP_Department || "-";
      
      // Data untuk Table 2 (Langsung dari data[0] tanpa `SOL_PAYAPP_DCollection`)
      const PAYAPP_DocNum_D = data[0]?.PAYAPP_DocNum_D || "-";
      const PAYAPP_Date_D = formatDate(data[0]?.PAYAPP_Date_D) || "-";
      const PAYAPP_Type_D = data[0]?.PAYAPP_Type_D || "-";
      const PAYAPP_Total_D = formatCurr(data[0]?.PAYAPP_Total_D) || "-";
      const PAYAPP_CashFlow_D = data[0]?.PAYAPP_CashFlow_D || "-";
      const PAYAPP_RMK_D = data[0]?.PAYAPP_RMK_D || "-";
      const PAYAPP_REQ_D = data[0]?.PAYAPP_REQ_D || "-";

      
      const table3HTML = `
        <table border="1" width="100%" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>No.</th>
              <th>Vendor Code</th>
              <th>Vendor Name</th>
              <th>Document No</th>
              <th>Type</th>
              <th>Date Outgoing</th>
              <th>Total</th>
              <th>Balance Due</th>
              <th>Payment Amount</th>
              <th>Bank Charge</th>
              <th>Remarks Invoice</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.PAYREQ_VenCode || "-"}</td>
                  <td>${item.PAYREQ_VenName || "-"}</td>
                  <td>${item.PAYREQ_DocNum || "-"}</td>
                  <td>${item.PAYREQ_Type || "-"}</td>
                  <td>${formatDate(item.PAYREQ_Date) || "-"}</td>
                  <td>${formatCurr(item.PAYREQ_Total) || "-"}</td>
                  <td>${formatCurr(item.PAYREQ_BalDue) || "-"}</td>
                  <td>${formatCurr(item.PAYREQ_PayAmou) || "-"}</td>
                  <td>${formatCurr(item.PAYREQ_BankCharge) || "-"}</td>
                  <td>${item.PAYREQ_RMK_INV || "-"}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      `;
  
      // Langkah 3: Kirim email
      const result = await emailjs.send(
        "mjservice99",
        "template_payapp2",
        {
          name: "Juan",
          PAYAPP_PerFrom,
          PAYAPP_PerTo,
          PAYAPP_DocType,
          PAYAPP_DDocType,
          PAYAPP_SeriesName,
          PAYAPP_DocNum,
          PAYAPP_Decision,
          PAYAPP_Department,
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
          table3HTML,
        },
        "wpMFQF0XbgvLIRP-G"
      );
  
      console.log("Email terkirim:", result.text);
      Swal.fire("Sukses", "Email berhasil dikirim!", "success");
    } catch (error) {
      console.error("Error pengiriman email:", error);
      Swal.fire("Error", `Gagal mengirim email: ${error.message}`, "error");
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
        const latestDocNum = result.value[0]?.DocNum || 0; // Jika null, gunakan 0 sebagai default
        setLatestDocNum(Number(latestDocNum) + 1); // Tambahkan 1 ke DocNum
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to fetch DocNum");
      }
    } catch (error) {
      setErrorMessage("Network error, please try again later.");
    }
  };
  // Function to get Cash Flow Line Items
// Function to get Cash Flow Line Items and return LineItemName
const GetCashFlow = async (lineItemId) => {
  try {
    if (!lineItemId) return null;
    const token = sessionStorage.getItem("authToken");
    const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

    const response = await fetch(
      `https://localhost:50000/b1s/v1/CashFlowLineItems(${lineItemId})`,
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
      return result.LineItemName;
    } else {
      const errorData = await response.json();
      console.error("Failed to fetch Cash Flow Line Items:", errorData.message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching Cash Flow Line Items:", error);
    return null;
  }
};

  // Effect to fetch LineItemName for each document when documents change
  useEffect(() => {
    const fetchAllCashFlowNames = async () => {
      const newCashFlowNames = {};
      for (const doc of documents) {
        if (doc.U_SOL_CASHFLOW) {
          const lineItemName = await GetCashFlow(doc.U_SOL_CASHFLOW);
          if (lineItemName) {
            newCashFlowNames[doc.DocEntry] = lineItemName;
          }
        }
      }
      setCashFlowNames(newCashFlowNames);
    };

    if (documents.length > 0) {
      fetchAllCashFlowNames();
    }
  }, [documents]); // Run effect when documents change
  

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <DashboardHeader />
        <main>
          <section className="recent">
            <div className="activity-grid">
              <div className="activity-card">
                <h2 style={{ padding: "10px", textAlign: "center" }}>
                  Payment Approval 1
                </h2>
                <div className="container">
                  {/* Header Inputs */}
                  
                  <div className="row mb-4">
                    <div className="col-5">
                      <div className="d-flex align-items-center mb-2">
                      <label className="me-2" style={{ width: "300px" }}>
                          Periode <span style={{ color: "red" }}>*</span>
                        </label>
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

                        <span className="mx-2">s/d</span>
                        <input
                          type="date"
                          className="form-control"
                          name="DateTo"
                          id="DateTo"
                          required
                          autoComplete="off"
                          autoFocus
                          onChange={(e) =>
                            handleInputPayreq(e.target.value, e.target.name)
                          }
                        />
                      </div>

                      <div className="d-flex align-items-center mb-2">
                        <label className="me-2" style={{ width: "120px" }}>
                          Series
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="Series"
                        />
                      </div>

                      <div className="d-flex align-items-center mb-2">
                      <label className="me-2" style={{ width: "120px" }}>
                        Department <span style={{ color: "red" }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        name="DDocType"
                        value={inputsPayreq.DDocType}
                        onChange={(e) => handleInputPayreq(e.target.value, e.target.name)}
                      >
                        <option value="" disabled>
                          Select Department
                        </option>
                        {departmentOptions.map((department, index) => (
                          <option key={index} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>



                      <div className="d-flex align-items-center mb-2">
                        <label className="me-2">CostCenter</label>
                        <input
                          type="text"
                          className="form-control"
                          name="CostCenter"
                        />
                      </div>
                    </div>

                    <div className="col-2"></div>

                    <div className="col-5">
                      <div className="d-flex align-items-center mb-2">
                        <label className="me-2" style={{ width: "320px" }}>
                          DocNum
                        </label>
                        <select className="form-control me-2">
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

                      <div className="d-flex align-items-center">
                        <label className="me-2" style={{ width: "150px" }}>
                          Approval Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={todayDate} // Set tanggal hari ini
                          readOnly // Membuat input tidak bisa diubah
                          style={{ backgroundColor: "#e9ecef" }} // Grayout warna background
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decision Dropdown */}
                  <div className="row mb-3">
                    <div className="col-5">
                      <div className="d-flex align-items-center">
                        <label className="me-2" style={{ width: "114px" }}>
                          Decision
                        </label>
                        <select className="form-control">
                          <option>Approved</option>
                          <option>Pending</option>
                          <option>Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="col">
                      <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                      >
                        {isLoading ? "Searching..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  {/* Document Table */}
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Selected</th>
                        <th>Document No.</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Department</th>
                        <th>Total Paid</th>
                        <th>Cash Flow</th>
                        <th>Remarks Requester</th>
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
                                checked={selectedDocs.includes(doc.DocEntry)}
                                onChange={() => handleSelect(doc.DocEntry)}
                              />
                            </td>
                            <td>{doc.DocNum}</td>
                            <td>{formatDate(doc.U_SOL_POSTDATE)}</td>
                            <td>{doc.Object}</td>
                            <td>{doc.U_SOL_DEPARTMENT}</td>
                            <td>{formatCurr(doc.U_SOL_TOTPAID)}</td>
                            {/* Display LineItemName or "Loading..." */}
                            <td>{cashFlowNames[doc.DocEntry] || "Loading..."}</td>
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

                  {/* Remarks Input */}
                  <div className="row mb-3">
                    <div className="col">
                      <label>Remarks:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your remarks"
                        value={remarks} // Hubungkan dengan state remarks
                        onChange={(e) => setRemarks(e.target.value)} // Update state saat user mengetik
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="row">
                    <div className="col">
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: "10px" }}
                        onClick={handleAdd}
                      >
                        Add
                      </button>
                      <button className="btn btn-secondary">Cancel</button>
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