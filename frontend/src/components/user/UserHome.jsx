import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "antd";
import { Link } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Container, Form, Row, Col } from "react-bootstrap";

import Notification from "../common/Notification";
import UserAppointments from "./UserAppointments";
import DoctorAvailability from "./DoctorAvailability";
import DoctorList from "./DoctorList";
import api from "../../api";
import { getStoredUser, setStoredUser, logout } from "../../auth";

const UserHome = () => {
  const [doctors, setDoctors] = useState([]);
  const [userdata, setUserData] = useState(getStoredUser() || {});
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [search, setSearch] = useState("");

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

  const getDoctorData = useCallback(async () => {
    try {
      const res = await api.get("/user/getalldoctorsu");
      if (res.data.success) setDoctors(res.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    getDoctorData();
  }, [refreshUser, getDoctorData]);

  const select = (item) => {
    setActiveMenuItem(item);
    refreshUser();
    if (item === "home") getDoctorData();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.fullName, d.specialization, d.address].some((f) =>
        String(f || "").toLowerCase().includes(q)
      )
    );
  }, [doctors, search]);

  const isDoctor = userdata.isdoctor === true;

  return (
    <div className="main">
      <div className="layout">
        <div className="sidebar">
          <div className="logo">
            <h2>DocSpot</h2>
          </div>
          <div className="menu">
            {!isDoctor && (
              <div className={`menu-items ${activeMenuItem === "home" ? "active" : ""}`} onClick={() => select("home")}>
                <HomeIcon className="icon" /><Link to="#">Find Doctors</Link>
              </div>
            )}
            <div className={`menu-items ${activeMenuItem === "userappointments" ? "active" : ""}`} onClick={() => select("userappointments")}>
              <CalendarMonthIcon className="icon" /><Link to="#">Appointments</Link>
            </div>
            {isDoctor && (
              <div className={`menu-items ${activeMenuItem === "availability" ? "active" : ""}`} onClick={() => select("availability")}>
                <AccessTimeIcon className="icon" /><Link to="#">Availability</Link>
              </div>
            )}
            <div className="menu-items" onClick={logout}>
              <LogoutIcon className="icon" /><Link to="#">Logout</Link>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="header">
            <div className="header-content">
              <Badge className={`notify ${activeMenuItem === "notification" ? "active" : ""}`} onClick={() => select("notification")} count={userdata?.notification?.length || 0}>
                <NotificationsIcon className="icon" />
              </Badge>
              <h3>{isDoctor ? "Dr. " : ""}{userdata.fullName}</h3>
            </div>
          </div>
          <div className="body">
            {activeMenuItem === "notification" && <Notification user={userdata} onUserChange={setUserData} />}
            {activeMenuItem === "availability" && isDoctor && <DoctorAvailability />}
            {(activeMenuItem === "userappointments" || (isDoctor && activeMenuItem === "home")) && (
              <UserAppointments isDoctor={isDoctor} key={`${isDoctor}-${activeMenuItem}`} />
            )}
            {activeMenuItem === "home" && !isDoctor && (
              <Container>
                <h2 className="text-center p-2">Find a Doctor</h2>
                <Row className="justify-content-center mb-3">
                  <Col md={6}>
                    <Form.Control
                      type="search"
                      placeholder="Search by name, specialization or location"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Col>
                </Row>
                {filtered.length === 0 ? (
                  <p className="text-center text-muted">No doctors found.</p>
                ) : (
                  <div className="doctor-grid pb-3">
                    {filtered.map((doctor) => (
                      <DoctorList doctor={doctor} key={doctor._id} />
                    ))}
                  </div>
                )}
              </Container>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHome;
