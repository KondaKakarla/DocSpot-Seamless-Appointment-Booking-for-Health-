import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { message } from "antd";
import AppNavbar from "./AppNavbar";
import api from "../../api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/user/forgotpassword", { email });
      setSubmitted(true);
      message.success(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <main className="container my-5" style={{ maxWidth: 520 }}>
        <h1>Forgot password?</h1>
        <p>Enter your account email and we'll send a password reset link.</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="forgotPasswordEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Form.Group>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </Form>
        {submitted && (
          <p className="mt-3">
            If an account exists for that email, a reset link has been sent.
          </p>
        )}
        <p className="mt-3"><Link to="/login">Back to login</Link></p>
      </main>
    </>
  );
};

export default ForgotPassword;
