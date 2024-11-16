import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

const Approval3 = () => {
  const [totalSum, setTotalSum] = useState(0);

  const [documents, setDocuments] = useState([]); // State untuk menyimpan data hasil fetch
  const [inputsPayreq, setInputsPayreq] = useState({
    DateFrom: "",
    DateTo: "",
    Series: "",
    DDocType: "",
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
    try {
      //e.preventDefault();
      setIsLoading(true);
      handleLogin(e);
  
      const token = sessionStorage.getItem("authToken");
      const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";
  
      const formatDateToYYYYMMDD = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
      };
  
      const formattedDateFrom = formatDateToYYYYMMDD(inputsPayreq.DateFrom);
      const formattedDateTo = formatDateToYYYYMMDD(inputsPayreq.DateTo);
  
      const searchUrl = `https://localhost:50000/b1s/v1/PAYAPP?$filter= U_SOL_DECISION eq '1' and U_SOL_DECISION2 eq '1' and U_SOL_DECISION3 eq '3'  and U_SOL_APPDATE ge '${formattedDateFrom}' and U_SOL_APPDATE le '${formattedDateTo}'`;
      const url = inputsPayreq.DDocType
        ? `${searchUrl} and U_SOL_DEPARTMENT eq '${inputsPayreq.DDocType}'`
        : searchUrl;
  
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log("Documents fetched:", result.value); // Tambahkan logging untuk melihat data yang diambil
  
        setDocuments(result.value || []); // Pastikan kita set array kosong jika result.value undefined
        setErrorMessage(""); // Bersihkan error
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setErrorMessage("Network error, please try again later.");
    } finally {
      setIsLoading(false);
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

// Modifikasi sendEmail agar bisa menerima data dari Get3 sebagai parameter
const sendEmail = async (queryResults) => {
  setIsLoading(true);

  try {
    // Ekstraksi data dari queryResults untuk email payload
    const PAYAPP_PerFrom = formatDate(queryResults[0]?.PAYAPP_PerFrom || null);
    const PAYAPP_PerTo = formatDate(queryResults[0]?.PAYAPP_PerTo || null);
    const PAYAPP_SeriesName = queryResults[0]?.PAYAPP_SeriesName || "-";
    const PAYAPP_DocNum = queryResults[0]?.PAYAPP_DocNum || "-";
    const PAYAPP_Department = queryResults[0]?.PAYAPP_Department || "-";
    const PAYAPP_AppDate = formatDate(queryResults[0]?.PAYAPP_AppDate || null);
    const PAYAPP_Remarks = queryResults[0]?.PAYAPP_Remarks || "-";
    const PAYREQ_DocNum_H = queryResults[0]?.PAYREQ_DocNum_H || "-";
    
    const PAYAPP_DocNum_D = queryResults[0]?.PAYAPP_DocNum_D || "-";
    const PAYAPP_Date_D = formatDate(queryResults[0]?.PAYAPP_Date_D || null);
    const PAYAPP_Department_D = queryResults[0]?.PAYAPP_Department_D || "-";
    const PAYAPP_Total_D = queryResults[0]?.PAYAPP_Total_D || "-";
    

    // Tabel untuk Detail Payment Request
    const table3Data = queryResults.flatMap((result, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${result.PAYREQ_VenCode || "-"}</td>
        <td>${result.PAYREQ_VenName || "-"}</td>
        <td>${result.PAYREQ_DocNum || "-"}</td>
        <td>${result.PAYREQ_Type || "-"}</td>
        <td>${formatDate(result.PAYREQ_Date) || "-"}</td>
        <td>${formatCurr(result.PAYREQ_Total) || "-"}</td>
        <td>${formatCurr(result.PAYREQ_BalDue) || "-"}</td>
        <td>${formatCurr(result.PAYREQ_PayAmou) || "-"}</td>
        <td>${formatCurr(result.PAYREQ_BankCharge) || "-"}</td>
        <td>${result.PAYREQ_RMK_INV || "-"}</td>
      </tr>
    `).join("");

    const table3HTML = `
      <table border="1" width="100%" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>No.</th>
            <th>Vendor Code</th>
            <th>Vendor Name</th>
            <th>Document No</th>
            <th>Type</th>
            <th>Date</th>
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

    // Payload email
    const emailPayload = {
      name: "Fira",
      PAYAPP_PerFrom,
      PAYAPP_PerTo,
      PAYAPP_SeriesName,
      PAYAPP_DocNum,
      PAYAPP_Department,
      PAYAPP_AppDate,
      PAYAPP_Remarks,
      PAYAPP_DocNum_D,
      PAYAPP_Date_D,
      PAYAPP_Department_D,
      PAYAPP_Total_D,
      PAYREQ_DocNum_H,
      table3HTML,
    };

    // Kirim email
    const result = await emailjs.send(
      "service_jnp123",
      "template_payapp4",
      emailPayload,
      "jfJAqe-4dTe3AgE-W"
    );
    console.log("Email sent:", result.text);
    Swal.fire("Sukses", "Email berhasil dikirim!", "success");
  } catch (error) {
    console.error("Error sending email:", error);
    Swal.fire("Error", "Gagal mengirim email!", "error");
  } finally {
    setIsLoading(false);
  }
};

const handleAdd = async () => {
  setIsLoading(true);
  const token = sessionStorage.getItem("authToken");
  const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

  try {
    // Pastikan token ada
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan di sessionStorage.");
    }

    // Fetch data dari endpoint PAYREQ untuk mendapatkan U_SOL_DDOCTYPE
    const responsePayreq = await fetch("https://localhost:50000/b1s/v1/PAYAPP2", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      credentials: "include",
    });

    if (!responsePayreq.ok) {
      const errorData = await responsePayreq.json();
      throw new Error(errorData.message || "Gagal mengambil data dari PAYAPP2");
    }

    const payreqData = await responsePayreq.json();

    // Siapkan data untuk POST ke endpoint PAYAPP2
    const selectedDocumentsData = documents
      .filter((doc) => selectedDocs.includes(doc.DocEntry))
      .map((doc) => ({
        U_SOL_SELECT: "Y",
        U_SOL_DOCNUM_D: doc.DocNum,
        U_SOL_DATE_D: doc.U_SOL_APPDATE,
        U_SOL_SERIES: doc.U_SOL_SERIES,
        U_SOL_DEPARTMENT: doc.U_SOL_DEPARTMENT,
        U_SOL_COSTCENTER: doc.U_SOL_COSTCENTER,
        U_SOL_TOTAL: Array.isArray(doc.SOL_PAYAPP_DCollection)
          ? doc.SOL_PAYAPP_DCollection.reduce(
              (sum, record) => sum + (record.U_SOL_TOTAL || 0),
              0
            )
          : 0,
        DocEntry: doc.DocEntry,
      }));

    if (selectedDocumentsData.length === 0) {
      console.error("Tidak ada dokumen yang dipilih untuk ditambahkan.");
      Swal.fire("Error", "Pilih setidaknya satu dokumen untuk ditambahkan.", "error");
      return;
    }

    const requestBody = {
      U_SOL_PERFROM: inputsPayreq.DateFrom,
      U_SOL_PERTO: inputsPayreq.DateTo,
      U_SOL_SERIES: inputsPayreq.Series,
      U_SOL_DEPARTMENT: inputsPayreq.DDocType,
      U_SOL_COSTCENTER: inputsPayreq.CostCenter,
      U_SOL_APPDATE: new Date().toISOString(),
      U_SOL_DECISION: "1",
      U_SOL_RMK: remarks || "", // Nilai default jika kosong
      SOL_PAYAPP3_DCollection: selectedDocumentsData,
    };

    console.log("Request Body Sent:", JSON.stringify(requestBody, null, 2));

    // Langkah 1: POST ke endpoint PAYAPP3
    const postResponse = await fetch("https://localhost:50000/b1s/v1/PAYAPP3", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      console.error("Error response from server (POST PAYAPP3):", errorData);
      throw new Error(errorData.error?.message?.value || "Failed to post data to PAYAPP3");
    }

    // Langkah 2: Ambil DocEntry dari respons POST
    const postResult = await postResponse.json();
    const newDocEntry = postResult.DocEntry; // Ambil DocEntry dari hasil POST
    console.log("DocEntry dari POST:", newDocEntry);

    // Langkah 3: Lakukan GET request ke SQL GetPAYAPP2 dengan DocEntry yang baru
    const getResponse = await fetch(`https://localhost:50000/b1s/v1/SQLQueries('GetPAYAPP3')/List?DocEntry=${newDocEntry}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      credentials: "include",
    });

    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      console.error("Error response from server (GET GetPAYAPP3):", errorData);
      throw new Error(errorData.message || "Failed to get data from GetPAYAPP3");
    }

    // Langkah 4: Ambil data dari respons GET
    const getResult = await getResponse.json();
    console.log("Data dari GET GetPAYAPP3:", getResult);

    // Langkah 5: Kirim email setelah data GET diterima
    await sendEmail(getResult.value); // Lanjutkan ke fungsi sendEmail dengan data dari GetPAYAPP2

    // Langkah 6: UPDATE field U_SOL_DECISION3 pada endpoint PAYAPP menggunakan DocEntry dari dokumen yang dipilih
    for (const doc of selectedDocumentsData) {
      const updatePayload = {
        U_SOL_DECISION3: "1"
      };

      const updateResponse = await fetch(`https://localhost:50000/b1s/v1/PAYAPP(${doc.DocEntry})`, {
        method: "PATCH", // Menggunakan PATCH untuk melakukan update sebagian
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify(updatePayload),
        credentials: "include",
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error(`Error updating DocEntry ${doc.DocEntry}:`, errorData);
        throw new Error(errorData.message || `Failed to update U_SOL_DECISION3 for DocEntry ${doc.DocEntry}`);
      }

      console.log(`Update berhasil pada field U_SOL_DECISION3 untuk DocEntry ${doc.DocEntry}`);
    }

    Swal.fire("Success", "Documents updated, posted, and email sent successfully!", "success");
    setSelectedDocs([]);
    await handleSearch(); // Refresh setelah berhasil
  } catch (error) {
    console.error("Terjadi error:", error.message);
    setErrorMessage(error.message || "Network error, please try again later.");
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
        "https://localhost:50000/b1s/v1/PAYAPP3?$select=DocNum&$orderby=DocNum desc&$top=1",
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

  useEffect(() => {
    const calculatedTotalSum = documents.reduce((docSum, doc) => {
      const docTotal = Array.isArray(doc.SOL_PAYAPP_DCollection)
        ? doc.SOL_PAYAPP_DCollection.reduce(
            (sum, record) => sum + (record.U_SOL_TOTAL || 0),
            0
          )
        : 0;
      return docSum + docTotal;
    }, 0);
  
    setTotalSum(calculatedTotalSum);
  }, [documents]);
  
  

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
                  Payment Approval 3
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
                          id="Series"
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
                          id="CostCenter"
                          required
                          autoComplete="off"
                          autoFocus
                          onChange={(e) =>
                            handleInputPayreq(e.target.value, e.target.name)
                          }
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
                        <th>Series</th>
                        <th>Department</th>
                        <th>Cost Center</th>
                        <th>Total Paid</th>
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
                            <td>{formatDate(doc.U_SOL_APPDATE)}</td>
                            <td>{doc.U_SOL_SERIES}</td>
                            <td>{doc.U_SOL_DEPARTMENT}</td>
                            <td>{doc.U_SOL_COSTCENTER}</td>
                            <td>
                              {formatCurr(
                                Array.isArray(doc.SOL_PAYAPP_DCollection)
                                  ? doc.SOL_PAYAPP_DCollection.reduce((sum, record) => sum + (record.U_SOL_TOTAL || 0), 0)
                                  : 0
                              )}
                            </td>

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

export default Approval3;
