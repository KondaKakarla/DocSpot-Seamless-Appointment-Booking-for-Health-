import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { message } from "antd";
import AppNavbar from "./AppNavbar";
import api from "../../api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      return message.error("This reset link is invalid or expired");
    }
    if (password !== confirmPassword) {
      return message.warning("Passwords do not match");
    }

    setLoading(true);
    try {
      const response = await api.post("/user/resetpassword", { token, password });
      if (response.data.success) {
        message.success(response.data.message);
        navigate("/login", { replace: true });
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <main className="container my-5" style={{ maxWidth: 520 }}>
        <h1>Set a new password</h1>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="confirmPassword">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Form.Group>
          <Button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </Form>
        <p className="mt-3">
          Reset link expired? <Link to="/forgot-password">Request another one</Link>.
        </p>
      </main>
    </>
  );
};

export default ResetPassword;
