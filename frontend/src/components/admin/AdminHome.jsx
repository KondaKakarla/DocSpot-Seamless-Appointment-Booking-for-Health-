import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MedicationIcon from "@mui/icons-material/Medication";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Badge } from "antd";
import Notification from "../common/Notification";
import AdminUsers from "./AdminUsers";
import AdminDoctors from "./AdminDoctors";
import AdminAppointments from "./AdminAppointments";
import AdminSummary from "./AdminSummary";
import api from "../../api";
import { getStoredUser, setStoredUser, logout } from "../../auth";

const AdminHome = () => {
  const [userdata, setUserData] = useState(getStoredUser() || {});
  const [activeMenuItem, setActiveMenuItem] = useState("adminsummary");

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.post("/user/getuserdata", {});
      if (res.data.success) {
        setStoredUser(res.data.data);
        setUserData(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const select = (item) => {
    setActiveMenuItem(item);
    refreshUser();
  };

  return (
    <div className="main">
      <div className="layout">
        <div className="sidebar">
          <div className="logo">
            <h2>DocSpot</h2>
          </div>
          <div className="menu">
            <div className={`menu-items ${activeMenuItem === "adminsummary" ? "active" : ""}`} onClick={() => select("adminsummary")}>
              <DashboardIcon className="icon" /><Link to="#">Summary</Link>
            </div>
            <div className={`menu-items ${activeMenuItem === "adminappointments" ? "active" : ""}`} onClick={() => select("adminappointments")}>
              <CalendarMonthIcon className="icon" /><Link to="#">Appointments</Link>
            </div>
            <div className={`menu-items ${activeMenuItem === "adminusers" ? "active" : ""}`} onClick={() => select("adminusers")}>
              <PeopleIcon className="icon" /><Link to="#">Users</Link>
            </div>
            <div className={`menu-items ${activeMenuItem === "admindoctors" ? "active" : ""}`} onClick={() => select("admindoctors")}>
              <MedicationIcon className="icon" /><Link to="#">Doctors</Link>
            </div>
            <div className="menu-items" onClick={logout}>
              <LogoutIcon className="icon" /><Link to="#">Logout</Link>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="header">
            <div className="header-content" style={{ cursor: "pointer" }}>
              <Badge className={`notify ${activeMenuItem === "notification" ? "active" : ""}`} onClick={() => select("notification")} count={userdata?.notification?.length || 0}>
                <NotificationsIcon className="icon" />
              </Badge>
              <h3>Hi, {userdata.fullName}</h3>
            </div>
          </div>
          <div className="body">
            {activeMenuItem === "notification" && <Notification user={userdata} onUserChange={setUserData} />}
            {activeMenuItem === "adminusers" && <AdminUsers />}
            {activeMenuItem === "admindoctors" && <AdminDoctors />}
            {activeMenuItem === "adminappointments" && <AdminAppointments />}
            {activeMenuItem === "adminsummary" && <AdminSummary />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
