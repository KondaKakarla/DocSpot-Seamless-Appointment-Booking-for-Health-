import React, { useEffect, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MedicationIcon from "@mui/icons-material/Medication";
import PeopleIcon from "@mui/icons-material/People";
import { message } from "antd";
import api from "../../api";
import "./AdminSummary.css";

const cards = [
  {
    label: "Registered users",
    detail: "Patient and doctor accounts",
    key: "userCount",
    Icon: PeopleIcon,
    tone: "blue",
  },
  {
    label: "Approved doctors",
    detail: "Ready to see patients",
    key: "doctorCount",
    Icon: MedicationIcon,
    tone: "teal",
  },
  {
    label: "Pending applications",
    detail: "Awaiting admin review",
    key: "pendingApplications",
    Icon: AccessTimeIcon,
    tone: "amber",
  },
  {
    label: "Appointments",
    detail: "All appointment records",
    key: "appointmentCount",
    Icon: CalendarMonthIcon,
    tone: "green",
  },
];

const AdminSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api.get("/admin/summary")
      .then((response) => {
        if (response.data.success) setSummary(response.data.data);
        else {
          setErrorMessage(response.data.message || "Could not load dashboard summary");
          message.error(response.data.message);
        }
      })
      .catch((error) => {
        const detail = error.response?.data?.message || "Could not load dashboard summary";
        setErrorMessage(detail);
        message.error(detail);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Container fluid className="admin-summary">
      <header className="admin-summary__header">
        <div>
          <p className="admin-summary__eyebrow">DOCSPOT ADMINISTRATION</p>
          <h2 className="admin-summary__title">Dashboard overview</h2>
          <p className="admin-summary__description">
            A clear snapshot of users, doctors, and appointments.
          </p>
        </div>
        <span className="admin-summary__badge">Platform overview</span>
      </header>
      {loading && (
        <div className="admin-summary__loading" role="status">
          <Spinner animation="border" size="sm" />
          <span>Loading dashboard metrics...</span>
        </div>
      )}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {summary && (
        <Row className="g-3">
          {cards.map(({ label, detail, key, Icon, tone }) => (
            <Col key={key} xs={12} sm={6} xl={3}>
              <Card className={`admin-summary__card admin-summary__card--${tone}`}>
                <Card.Body>
                  <div className="admin-summary__card-heading">
                    <div>
                      <Card.Title className="admin-summary__card-title">{label}</Card.Title>
                      <p className="admin-summary__card-detail">{detail}</p>
                    </div>
                    <span className="admin-summary__icon">
                      <Icon aria-hidden="true" />
                    </span>
                  </div>
                  <p className="admin-summary__count">{summary[key].toLocaleString()}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default AdminSummary;
