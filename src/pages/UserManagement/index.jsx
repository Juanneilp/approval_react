import React, { useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import LoadingSvg from "../../components/LoadingSvg/LoadingSvg";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser"; // Import EmailJS

const UserManagement = () => {
  const form = useRef(); // Referensi untuk form
  const [loading, setLoading] = useState(false); // State loading

  // Fungsi untuk mengirim email
  const sendEmail = (e) => {
    e.preventDefault(); // Cegah reload halaman
    setLoading(true); // Aktifkan loading

    // Memanggil emailjs.send tanpa parameter tambahan
    emailjs
      .send(
        "mjservice99", 
        "templatemj99", 
        {
            name: "Aldous",
            email: "aldous@gmail.com",
            subject: "P Approve 1",
            message: " -kak gem",

        }, 
        "wpMFQF0XbgvLIRP-G") // Kosongkan object params
      .then(
        (result) => {
          console.log(result.text);
          Swal.fire("Success", "Email sent successfully!", "success");
          setLoading(false); // Matikan loading
        },
        (error) => {
          console.error(error.text);
          Swal.fire("Error", "Failed to send email!", "error");
          setLoading(false); // Matikan loading
        }
      );
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
                <h2>UserManagement Page</h2>
                <form ref={form} onSubmit={sendEmail}>
                  <button type="submit" disabled={loading}>
                    {loading ? <LoadingSvg /> : "Send Email"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default UserManagement;
