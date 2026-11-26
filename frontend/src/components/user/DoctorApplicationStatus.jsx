import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { message } from "antd";
import api from "../../api";
import { getStoredUser, setStoredUser } from "../../auth";
import AppNavbar from "../common/AppNavbar";

const DoctorApplicationStatus = () => {
  const [user, setUser] = useState(getStoredUser() || {});

  const refresh = useCallback(async () => {
    try {
      const response = await api.post("/user/getuserdata", {});
      if (response.data.success) {
        setUser(response.data.data);
        setStoredUser(response.data.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not load application status");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const status = user.doctorStatus;
  const content = {
    pending: {
      variant: "warning",
      title: "Application pending",
      message: "Your doctor application is waiting for admin approval.",
    },
    rejected: {
      variant: "danger",
      title: "Application not approved",
      message: "Your application was rejected. You can update your details and apply again.",
    },
    approved: {
      variant: "success",
      title: "Application approved",
      message: "Your doctor account is approved. Open your dashboard to manage appointments.",
    },
  }[status] || {
    variant: "info",
    title: "No application found",
    message: "Submit a doctor application to see its status here.",
  };

  return (
    <>
      <AppNavbar />
      <Container className="my-5" style={{ maxWidth: 700 }}>
        <h1 className="mb-4">Doctor Application Status</h1>
        <Alert variant={content.variant}>
          <Alert.Heading>{content.title}</Alert.Heading>
          <p>{content.message}</p>
        </Alert>
        {status === "approved" && (
          <Button as={Link} to="/userhome">Open doctor dashboard</Button>
        )}
        {status === "rejected" && (
          <Button as={Link} to="/doctor/register">Apply again</Button>
        )}
        {!status && (
          <Button as={Link} to="/doctor/register">Apply as a doctor</Button>
        )}
      </Container>
    </>
  );
};

export default DoctorApplicationStatus;
