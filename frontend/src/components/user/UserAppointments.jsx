import React, { useCallback, useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { Container, Button, Badge } from "react-bootstrap";
import { Input, message, Modal, Popconfirm, Rate, Select } from "antd";
import api from "../../api";

const variant = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  completed: "primary",
  cancelled: "secondary",
};

const StatusBadge = ({ status }) => (
  <Badge bg={variant[status] || "secondary"}>{status}</Badge>
);

const localToday = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const NoRows = ({ cols }) => (
  <tr>
    <td colSpan={cols}>
      <Alert variant="info" className="mb-0">
        <Alert.Heading>No Appointments to show</Alert.Heading>
      </Alert>
    </td>
  </tr>
);

const UserAppointments = ({ isDoctor }) => {
  const [appointments, setAppointments] = useState([]);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = isDoctor
        ? "/doctor/getdoctorappointments"
        : "/user/getuserappointments";
      const res = await api.get(url);
      if (res.data.success) setAppointments(res.data.data);
    } catch (error) {
      console.log(error);
      message.error("Something went wrong");
    }
  }, [isDoctor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (appointmentId, status) => {
    try {
      const res = await api.post("/doctor/handlestatus", { appointmentId, status });
      if (res.data.success) {
        message.success(res.data.message);
        load();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleReschedule = async (appointmentId, decision) => {
    try {
      const response = await api.post("/doctor/handlerezchedule", {
        appointmentId,
        decision,
      });
      if (response.data.success) {
        message.success(response.data.message);
        load();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not update reschedule request");
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      const res = await api.post("/user/cancelappointment", { appointmentId });
      if (res.data.success) {
        message.success(res.data.message);
        load();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const openReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleDate("");
    setRescheduleTime("");
    setAvailableSlots([]);
  };

  const loadRescheduleSlots = async (date) => {
    setRescheduleDate(date);
    setRescheduleTime("");
    setAvailableSlots([]);
    if (!date) return;
    setLoadingSlots(true);
    try {
      const response = await api.get("/user/getdoctorslots", {
        params: { doctorId: rescheduleTarget.doctorId, date },
      });
      if (response.data.success) setAvailableSlots(response.data.data);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Could not load available times");
    } finally {
      setLoadingSlots(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      return message.warning("Choose an available date and time");
    }
    setSavingReschedule(true);
    try {
      const response = await api.post("/user/requestreschedule", {
        appointmentId: rescheduleTarget._id,
        date: `${rescheduleDate} ${rescheduleTime}`,
      });
      if (response.data.success) {
        message.success(response.data.message);
        setRescheduleTarget(null);
        load();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not request reschedule");
    } finally {
      setSavingReschedule(false);
    }
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSavingReview(true);
    try {
      const response = await api.post("/user/reviewappointment", {
        appointmentId: reviewTarget._id,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (response.data.success) {
        message.success(response.data.message);
        setReviewTarget(null);
        setReviewRating(5);
        setReviewComment("");
        load();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not submit review");
    } finally {
      setSavingReview(false);
    }
  };

  const handleDownload = async (appointment) => {
    try {
      const res = await api.get("/doctor/getdocumentdownload", {
        params: { appointId: appointment._id },
        responseType: "blob",
      });
      const fileUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = appointment.document?.filename || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.log(error);
      message.error("Could not download the document");
    }
  };

  const DocCell = ({ a }) =>
    a.document ? (
      <Button variant="link" className="p-0" onClick={() => handleDownload(a)}>
        {a.document.filename}
      </Button>
    ) : (
      <span className="text-muted">None</span>
    );

  return (
    <div>
      <h2 className="p-3 text-center">{isDoctor ? "Patient Appointments" : "My Appointments"}</h2>
      <Container>
        {isDoctor ? (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Appointment</th>
                <th>Phone</th>
                <th>Document</th>
                <th>Status</th>
                <th>Reschedule request</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{a.userInfo?.fullName}</td>
                    <td>{a.date}</td>
                    <td>{a.userInfo?.phone}</td>
                    <td><DocCell a={a} /></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {a.rescheduleRequest?.status === "pending" ? (
                        <>
                          <div>{a.rescheduleRequest.date}</div>
                          <Button size="sm" className="me-1" variant="success" onClick={() => handleReschedule(a._id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleReschedule(a._id, "rejected")}>Reject</Button>
                        </>
                      ) : (
                        a.rescheduleRequest?.status || "—"
                      )}
                    </td>
                    <td>
                      {a.status === "pending" && (
                        <>
                          <Button size="sm" className="me-1" variant="success" onClick={() => handleStatus(a._id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleStatus(a._id, "rejected")}>Reject</Button>
                        </>
                      )}
                      {a.status === "approved" && (
                        <Button size="sm" variant="primary" onClick={() => handleStatus(a._id, "completed")}>Mark completed</Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <NoRows cols={7} />
              )}
            </tbody>
          </Table>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Date of Appointment</th>
                <th>Document</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{a.docName}</td>
                    <td>{a.date}</td>
                    <td><DocCell a={a} /></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {["pending", "approved"].includes(a.status) && (
                        <>
                          {a.rescheduleRequest?.status === "pending" ? (
                            <div className="mb-1">Reschedule request pending</div>
                          ) : (
                            <Button size="sm" className="me-1" variant="outline-primary" onClick={() => openReschedule(a)}>
                              Reschedule
                            </Button>
                          )}
                          <Popconfirm title="Cancel this appointment?" okText="Yes" cancelText="No" onConfirm={() => handleCancel(a._id)}>
                            <Button size="sm" variant="outline-danger">Cancel</Button>
                          </Popconfirm>
                        </>
                      )}
                      {a.status === "completed" && (
                        a.review ? (
                          <span>Reviewed ({a.review.rating}/5)</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setReviewTarget(a)}
                          >
                            Leave review
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <NoRows cols={5} />
              )}
            </tbody>
          </Table>
        )}
      </Container>
      <Modal
        title="Request a new appointment time"
        open={Boolean(rescheduleTarget)}
        onCancel={() => setRescheduleTarget(null)}
        onOk={submitReschedule}
        confirmLoading={savingReschedule}
        okText="Send request"
      >
        <p>The doctor must approve your requested time.</p>
        <label className="form-label" htmlFor="reschedule-date">New date</label>
        <input
          id="reschedule-date"
          className="form-control mb-3"
          type="date"
          min={localToday()}
          value={rescheduleDate}
          onChange={(event) => loadRescheduleSlots(event.target.value)}
        />
        <label className="form-label">Available time</label>
        <Select
          className="w-100"
          value={rescheduleTime || undefined}
          placeholder={loadingSlots ? "Loading slots..." : "Select a slot"}
          disabled={loadingSlots || !availableSlots.length}
          onChange={setRescheduleTime}
          options={availableSlots.map((slot) => ({ value: slot, label: slot }))}
        />
      </Modal>
      <Modal
        title="Review your appointment"
        open={Boolean(reviewTarget)}
        onCancel={() => setReviewTarget(null)}
        onOk={submitReview}
        confirmLoading={savingReview}
        okText="Submit review"
      >
        <Rate value={reviewRating} onChange={setReviewRating} />
        <Input.TextArea
          className="mt-3"
          rows={4}
          maxLength={1000}
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
          placeholder="Share your experience (optional)"
        />
      </Modal>
    </div>
  );
};

export default UserAppointments;
