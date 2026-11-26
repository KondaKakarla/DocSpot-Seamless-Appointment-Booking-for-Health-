import { Checkbox, Col, Form, Input, Row, TimePicker, message } from "antd";
import { Container } from "react-bootstrap";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { getStoredUser, setStoredUser } from "../../auth";

function ApplyDoctor({ standalone = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    const { timingsPicker, fees, ...rest } = values;
    if (!timingsPicker || timingsPicker.length !== 2) {
      return message.warning("Please select your working hours");
    }
    if (standalone && selectedDays.length === 0) {
      return message.warning("Select at least one working day");
    }
    const timings = timingsPicker.map((t) => t.format("HH:mm"));
    const availability = selectedDays.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: timings[0],
      endTime: timings[1],
    }));
    setLoading(true);
    try {
      const res = standalone
        ? await api.post("/user/registerdoctor", {
            ...rest,
            fees: Number(fees),
            timings,
            availability,
          })
        : await api.post("/user/registerdoc", {
            doctor: { ...rest, fees: Number(fees), timings },
          });
      if (res.data.success) {
        message.success(res.data.message);
        form.resetFields();
        const currentUser = getStoredUser();
        if (
          standalone &&
          currentUser?.email?.toLowerCase() === String(rest.email).toLowerCase()
        ) {
          setStoredUser({ ...currentUser, doctorStatus: "pending" });
          navigate("/doctor/application");
        }
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

  const req = [{ required: true, message: "Required" }];

  return (
    <Container>
      <h2 className="text-center p-3">
        {standalone ? "Doctor Registration" : "Apply for Doctor"}
      </h2>
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="m-3">
        {standalone && (
          <p>
            Submit your details for admin approval. If you already have an account,
            enter its password to link it to your doctor application.
          </p>
        )}
        <h4>Personal Details:</h4>
        <Row gutter={20}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Full Name" name="fullName" rules={req}>
              <Input placeholder="Enter name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Phone" name="phone" rules={req}>
              <Input type="tel" placeholder="Your phone" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input type="email" placeholder="Your email" />
            </Form.Item>
          </Col>
          {standalone && (
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Enter a password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password placeholder="At least 6 characters" autoComplete="new-password" />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Address" name="address" rules={req}>
              <Input placeholder="Your address" />
            </Form.Item>
          </Col>
        </Row>
        <h4>Professional Details:</h4>
        {standalone && (
          <Form.Item label="Working days">
            <Checkbox.Group
              value={selectedDays}
              onChange={setSelectedDays}
              options={[
                { label: "Sun", value: 0 },
                { label: "Mon", value: 1 },
                { label: "Tue", value: 2 },
                { label: "Wed", value: 3 },
                { label: "Thu", value: 4 },
                { label: "Fri", value: 5 },
                { label: "Sat", value: 6 },
              ]}
            />
          </Form.Item>
        )}
        <Row gutter={20}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Specialization" name="specialization" rules={req}>
              <Input placeholder="Your specialization" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Experience (years)" name="experience" rules={req}>
              <Input type="number" min={0} placeholder="Your experience" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Fees" name="fees" rules={req}>
              <Input type="number" min={0} placeholder="Your fees" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label={standalone ? "Daily working hours" : "Timings"} name="timingsPicker" rules={req}>
              <TimePicker.RangePicker format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>
        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
        {standalone && (
          <p className="mt-3 text-end">
            Already applied? <Link to="/login">Log in to check your application status</Link>.
          </p>
        )}
      </Form>
    </Container>
  );
}

export default ApplyDoctor;
