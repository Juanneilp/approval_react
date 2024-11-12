import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";

const Approval2 = () => {
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
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
      };

      // Konversi DateFrom dan DateTo ke format YYYYMMDD
      const formattedDateFrom = formatDateToYYYYMMDD(inputsPayreq.DateFrom);
      const formattedDateTo = formatDateToYYYYMMDD(inputsPayreq.DateTo);

      // Membuat URL berdasarkan apakah DDocType diisi atau tidak
      const searchUrl = `https://localhost:50000/b1s/v1/PAYAPP?$filter= U_SOL_APPDATE ge '${formattedDateFrom}' and U_SOL_APPDATE le '${formattedDateTo}'`;
      //U_SOL_STATUS eq '1' and
      const url = inputsPayreq.DDocType
        ? `${searchUrl} and U_SOL_DEPARTMENT eq '${inputsPayreq.DDocType}'`
        : searchUrl;

      // Fetch data menggunakan URL yang sudah dibuat
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
        fetch(
          `https://localhost:50000/b1s/v1/SQLQueries('GetPAYAPP2')/List?DocEntry=${docEntry}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookieHeader,
            },
            credentials: "include",
          }
        ).then((response) => {
          if (!response.ok)
            throw new Error("Gagal mengambil data untuk DocEntry " + docEntry);
          return response.json();
        })
      );

      const queryResults = await Promise.all(queryPromises);
      console.log("Query Results:", queryResults); // Debugging seluruh struktur data

      // Debug nilai tanggal untuk memastikan formatnya benar
      queryResults.forEach((result, index) => {
          console.log(`Tanggal PAYAPP_PerFrom [${index}]:`, result.value[0]?.PAYAPP_PerFrom);
          console.log(`Tanggal PAYAPP_PerTo [${index}]:`, result.value[0]?.PAYAPP_PerTo);
          console.log(`Tanggal PAYAPP_AppDate [${index}]:`, result.value[0]?.PAYAPP_AppDate);
          console.log(`Tanggal PAYAPP_Date_D [${index}]:`, result.value[0]?.PAYAPP_Date_D);
      });


      // Mengambil Value dari hasil GET Query
      //Table 1
      const PAYAPP_PerFrom = queryResults
        .map((result) => formatDate(result.value[0]?.PAYAPP_PerFrom || null))
        .join(", ");
      const PAYAPP_PerTo = queryResults
        .map((result) => formatDate(result.value[0]?.PAYAPP_PerTo))
        .join(", ");
      const PAYAPP_DocType = queryResults
        .map((result) => result.value[0]?.PAYAPP_DocType)
        .join(", ");
      const PAYAPP_DDocType = queryResults
        .map((result) => result.value[0]?.PAYAPP_DDocType)
        .join(", ");
      const PAYAPP_SeriesName = queryResults
        .map((result) => result.value[0]?.PAYAPP_SeriesName)
        .join(", ");
      const PAYAPP_DocNum = queryResults
        .map((result) => result.value[0]?.PAYAPP_DocNum)
        .join(", ");
      const PAYAPP_Decision = queryResults
        .map((result) => result.value[0]?.PAYAPP_Decision)
        .join(", ");
      const PAYAPP_AppDate = queryResults
        .map((result) => formatDate(result.value[0]?.PAYAPP_AppDate))
        .join(", ");
      const PAYAPP_Remarks = queryResults
        .map((result) => result.value[0]?.PAYAPP_Remarks)
        .join(", ");

      //Table 2
      const PAYAPP_DocNum_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_DocNum_D)
        .join(", ");
      const PAYAPP_Date_D = queryResults
        .map((result) => formatDate(result.value[0]?.PAYAPP_Date_D))
        .join(", ");
      const PAYAPP_Type_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_Type_D)
        .join(", ");
      const PAYAPP_Total_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_Total_D)
        .join(", ");
      const PAYAPP_CashFlow_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_CashFlow_D)
        .join(", ");
      const PAYAPP_RMK_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_RMK_D)
        .join(", ");
      const PAYAPP_REQ_D = queryResults
        .map((result) => result.value[0]?.PAYAPP_REQ_D)
        .join(", ");

      const PAYREQ_DocNum_H = queryResults
        .map((result) => result.value[0]?.PAYREQ_DocNum_H)
        .join(", ");
      //Table 3 (Looping)
      // Data untuk Table 3 - Looping
      const table3Data = queryResults
        .flatMap((result, index) =>
          result.value.map(
            (item, subIndex) => `
        <tr>
          <td>${index + subIndex + 1}</td>
          <td>${item.PAYREQ_VenCode || "-"}</td>
          <td>${item.PAYREQ_VenName || "-"}</td>
          <td>${item.PAYREQ_DocNum || "-"}</td>
          <td>${item.PAYREQ_Type || "-"}</td>
          <td>${formatDate(item.PAYREQ_Date) || "-"}</td>
          <td>${item.PAYREQ_Total || "-"}</td>
          <td>${item.PAYREQ_BalDue || "-"}</td>
          <td>${item.PAYREQ_PayAmou || "-"}</td>
          <td>${item.PAYREQ_BankCharge || "-"}</td>
          <td>${item.PAYREQ_RMK_INV || "-"}</td>
        </tr>
      `
          )
        )
        .join("");

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
          table3HTML,
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

//   const handleAdd = async () => {
//     setIsLoading(true);
//     const token = sessionStorage.getItem("authToken");
//     const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

//     try {
//         // Pastikan token ada
//         if (!token) {
//             throw new Error("Token autentikasi tidak ditemukan di sessionStorage.");
//         }

//         // Langkah 1: Fetch data dari endpoint PAYREQ untuk mendapatkan U_SOL_DDOCTYPE
//         const responsePayreq = await fetch("https://localhost:50000/b1s/v1/PAYAPP", {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 Cookie: cookieHeader,
//             },
//             credentials: "include",
//         });

//         if (!responsePayreq.ok) {
//             // Ambil pesan error dari respons API jika ada
//             const errorData = await responsePayreq.json();
//             throw new Error(errorData.message || "Gagal mengambil data dari PAYREQ");
//         }

//         const payreqData = await responsePayreq.json();
//         const U_SOL_DDOCTYPE = payreqData.value[0]?.U_SOL_DDOCTYPE || "FA";

//         // Langkah 2: Siapkan data untuk POST ke endpoint PAYAPP
//         const selectedDocumentsData = documents
//             .filter((doc) => selectedDocs.includes(doc.DocEntry))
//             .map((doc) => ({
//                 U_SOL_SELECT: "Y",
//                 U_SOL_DESIC: "3",
//                 U_SOL_DOCNUM_D: doc.DocNum,
//                 //U_SOL_BPNAME: doc.U_SOL_BPNAME || "",
//                 //U_SOL_DATE_D: doc.U_SOL_POSTDATE,
//                 //U_SOL_TIPE: doc.Object,
//                 U_SOL_TOTAL: doc.SOL_PAYAPP_DCollection[0]?.U_SOL_TOTAL || 0,
//                 U_SOL_CASHFLOW: doc.U_SOL_CASHFLOW,
//                 U_SOL_RMK: doc.U_SOL_RMK,
//                 U_SOL_REQ: doc.SOL_PAYAPP_DCollection[0]?.U_SOL_REQ || '-',
//             }));

//         const requestBody = {
//             U_SOL_PERFROM: inputsPayreq.DateFrom,
//             U_SOL_PERTO: inputsPayreq.DateTo,
//             U_SOL_DOCTYPE: "Department",
//             U_SOL_DDOCTYPE: U_SOL_DDOCTYPE, // Gunakan nilai dari PAYREQ
//             U_SOL_APPDATE: new Date().toISOString(),
//             U_SOL_DECISION2: "2",
//             U_SOL_DECISION3: "3",
//             U_SOL_DECISION4: "3",
//             U_SOL_RMK: remarks,
//             SOL_PAYAPP_DCollection: selectedDocumentsData,
//         };

//         // Langkah 3: Kirim data ke endpoint PAYAPP
//         const postResponse = await fetch("https://localhost:50000/b1s/v1/PAYAPP2", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Cookie: cookieHeader,
//             },
//             body: JSON.stringify(requestBody),
//             credentials: "include",
//         });

//         if (postResponse.ok) {
//             Swal.fire("Success", "Documents updated and posted successfully!", "success");
//             setSelectedDocs([]);
//             await handleSearch();
//             await sendEmail(); // Mengirim email setelah POST berhasil
//         } else {
//             const errorData = await postResponse.json();
//             throw new Error(errorData.message || "Failed to post data to PAYAPP");
//         }
//     } catch (error) {
//         console.error("Terjadi error:", error.message);
//         setErrorMessage(error.message || "Network error, please try again later.");
//     } finally {
//         setIsLoading(false);
//     }
// };

const handleAdd = async () => {
  setIsLoading(true);
  const token = sessionStorage.getItem("authToken");
  const cookieHeader = "B1SESSION=" + token + "; ROUTEID=.node6";

  try {
      // Pastikan token ada
      if (!token) {
          throw new Error("Token autentikasi tidak ditemukan di sessionStorage.");
      }

      // Langkah 1: Fetch data dari endpoint PAYREQ untuk mendapatkan U_SOL_DDOCTYPE
      // const responsePayreq = await fetch("https://localhost:50000/b1s/v1/PAYREQ", {
      //     method: "GET",
      //     headers: {
      //         "Content-Type": "application/json",
      //         Cookie: cookieHeader,
      //     },
      //     credentials: "include",
      // });

      // if (!responsePayreq.ok) {
      //     const errorData = await responsePayreq.json();
      //     throw new Error(errorData.message || "Gagal mengambil data dari PAYREQ");
      // }

      //const payreqData = await responsePayreq.json();
      //const U_SOL_DDOCTYPE = payreqData.value[0]?.U_SOL_DDOCTYPE || "FA";

      // Langkah 2: Siapkan data untuk POST ke endpoint PAYAPP2
      const selectedDocumentsData = documents
          .filter((doc) => selectedDocs.includes(doc.DocEntry))
          .map((doc) => ({
              U_SOL_SELECT: "Y",
              U_SOL_DOCNUM_D: doc.DocNum,
              U_SOL_DATE_D: doc.U_SOL_APPDATE,
              U_SOL_SERIES: doc.U_SOL_SERIES,
              U_SOL_DEPARTMENT: doc.U_SOL_DEPARTMENT,
              U_SOL_COSTCENTER: doc.U_SOL_COSTCENTER,
              U_SOL_TOTAL: doc.SOL_PAYAPP_DCollection.reduce((sum, record) => sum + (record.U_SOL_TOTAL || 0), 0)
              
          }));

      const requestBody = {
          U_SOL_PERFROM: inputsPayreq.DateFrom,
          U_SOL_PERTO: inputsPayreq.DateTo,
          U_SOL_SERIES: inputsPayreq.Series,
          U_SOL_DEPARTMENT: inputsPayreq.DDocType,
          U_SOL_COSTCENTER: inputsPayreq.CostCenter,
          U_SOL_APPDATE: new Date().toISOString(),
          U_SOL_RMK: remarks || "No Remarks", // Nilai default jika kosong
          SOL_PAYAPP2_DCollection: selectedDocumentsData,
      };

      console.log("Request Body:", JSON.stringify(requestBody, null, 2));

      // Langkah 3: Kirim data ke endpoint PAYAPP2
      const postResponse = await fetch("https://localhost:50000/b1s/v1/PAYAPP2", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Cookie: cookieHeader,
          },
          body: JSON.stringify(requestBody),
          credentials: "include",
      });

      if (postResponse.ok) {
          Swal.fire("Success", "Documents updated and posted successfully!", "success");
          setSelectedDocs([]);
          await handleSearch();
          await sendEmail(); // Mengirim email setelah POST berhasil
      } else {
          const errorData = await postResponse.json();
          console.error("Error response from server:", errorData);
          throw new Error(errorData.message || "Failed to post data to PAYAPP2");
          console.log(requestBody);
      }
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
        "https://localhost:50000/b1s/v1/PAYAPP2?$select=DocNum&$orderby=DocNum desc&$top=1",
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
      // Calculate the sum of U_SOL_TOTAL for the current document's SOL_PAYAPP_DCollection
      const docTotal = doc.SOL_PAYAPP_DCollection.reduce(
        (sum, record) => sum + (record.U_SOL_TOTAL || 0), 
        0
      );
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
                  Payment Approval 2
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
                        <label className="me-2">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          name="DDocType"
                          id="DDocType"
                          required
                          autoComplete="off"
                          autoFocus
                          onChange={(e) =>
                            handleInputPayreq(e.target.value, e.target.name)
                          }
                        />
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
                            {/* <td>{formatCurr(doc.SOL_PAYAPP_DCollection[0]?.U_SOL_TOTAL || 0)}</td> */}
                            <td>
                              {formatCurr(
                                doc.SOL_PAYAPP_DCollection.reduce((sum, record) => sum + (record.U_SOL_TOTAL || 0), 0)
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

export default Approval2;
