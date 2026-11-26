import { message } from "antd";
import React, { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import api from "../../api";

// value for <input type="datetime-local" min=...> in LOCAL time
const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DoctorList = ({ doctor }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setShow(false);
    setDate("");
    setTime("");
    setAvailableSlots([]);
    setDocumentFile(null);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!date || !time) return message.warning("Please choose an available date and time");
    setLoading(true);
    try {
      const formData = new FormData();
      if (documentFile) formData.append("image", documentFile);
      formData.append("date", `${date} ${time}`);
      formData.append("doctorId", doctor._id);

      const res = await api.post("/user/getappointment", formData);
      if (res.data.success) {
        message.success(res.data.message);
        handleClose();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (value) => {
    setDate(value);
    setTime("");
    setAvailableSlots([]);
    if (!value) return;

    setLoadingSlots(true);
    try {
      const response = await api.get("/user/getdoctorslots", {
        params: { doctorId: doctor._id, date: value },
      });
      if (response.data.success) setAvailableSlots(response.data.data);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Could not load available times");
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <>
      <Card style={{ width: "18rem" }}>
        <Card.Body>
          <Card.Title>Dr. {doctor.fullName}</Card.Title>
          <div className="mb-3">
            <p className="mb-1">Phone: <b>{doctor.phone}</b></p>
            <p className="mb-1">Address: <b>{doctor.address}</b></p>
            <p className="mb-1">Specialization: <b>{doctor.specialization}</b></p>
            <p className="mb-1">Experience: <b>{doctor.experience} Yrs</b></p>
            <p className="mb-1">Fees: <b>{doctor.fees}</b></p>
            <p className="mb-1">
              Hours:{" "}
              <b>
                {doctor.availability?.length
                  ? doctor.availability
                      .map((day) => `${weekdays[day.dayOfWeek]} ${day.startTime}-${day.endTime}`)
                      .join(", ")
                  : `${doctor.timings?.[0]}-${doctor.timings?.[1]}`}
              </b>
            </p>
            <p className="mb-1">
              Rating:{" "}
              <b>
                {doctor.reviewCount
                  ? `${doctor.averageRating.toFixed(1)} / 5 (${doctor.reviewCount})`
                  : "No reviews"}
              </b>
            </p>
          </div>
          <Button variant="primary" onClick={() => setShow(true)}>Book Now</Button>

          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Booking appointment</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleBook}>
              <Modal.Body>
                <strong><u>Doctor Details:</u></strong>
                <br />
                Name:&nbsp;&nbsp;{doctor.fullName}
                <hr />
                Specialization:&nbsp;<b>{doctor.specialization}</b>
                <hr />
                <Row className="mb-3">
                  <Col md={{ span: 8, offset: 2 }}>
                    <Form.Group controlId={`date-${doctor._id}`} className="mb-3">
                      <Form.Label>Appointment date:</Form.Label>
                      <Form.Control
                        name="date"
                        type="date"
                        size="sm"
                        min={localToday()}
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group controlId={`time-${doctor._id}`} className="mb-3">
                      <Form.Label>Available 30-minute slots:</Form.Label>
                      <Form.Select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        disabled={!date || loadingSlots || availableSlots.length === 0}
                        required
                      >
                        <option value="">
                          {loadingSlots
                            ? "Loading available times..."
                            : availableSlots.length
                              ? "Choose a time"
                              : "No available times"}
                        </option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId={`file-${doctor._id}`} className="mb-3">
                      <Form.Label>Documents (optional, image or PDF, max 5MB)</Form.Label>
                      <Form.Control
                        accept="image/*,.pdf"
                        type="file"
                        size="sm"
                        onChange={(e) => setDocumentFile(e.target.files[0] || null)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Booking..." : "Book"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Card.Body>
      </Card>
    </>
  );
};

export default DoctorList;
