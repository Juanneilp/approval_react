import React from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import LoadingSvg from "../../components/LoadingSvg/LoadingSvg";
import CardHome from "../../components/CardHome";

// Third Party
import Swal from "sweetalert2";

const Home = () => {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        <DashboardHeader />
        <main>
          <div className="activity-grid">
            <CardHome />
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
