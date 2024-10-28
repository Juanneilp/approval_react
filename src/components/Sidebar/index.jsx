import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <>
      <input type="checkbox" id="sidebar-toggle" />
      <div className="sidebar">
        <div className="sidebar-header">
          <h3 className="brand">
            <span className="brand-title">Payment Approval</span>
          </h3>
          <label htmlFor="sidebar-toggle" className="ti-menu-alt"></label>
        </div>

        <div className="sidebar-menu">
          <ul>
            <li>
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-house"></i>

                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/approval1"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-user-pen"></i>

                <span>Approval 1</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/approval2"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-user-pen"></i>
                <span>Approval 2</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/approval3"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-user-pen"></i>
                <span>Approval 3</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/approval4"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-user-pen"></i>
                <span>Approval 4</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user-management"
                className={({ isActive }) =>
                  isActive ? "side-link active" : "side-link"
                }
              >
                <i className="fa-solid fa-users-between-lines"></i>
                <span>User Management</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
