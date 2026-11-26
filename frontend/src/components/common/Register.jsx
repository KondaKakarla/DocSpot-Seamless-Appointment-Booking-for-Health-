import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import { message } from "antd";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { MDBContainer, MDBCard, MDBCardBody, MDBCardImage, MDBRow, MDBCol, MDBInput, MDBRadio } from "mdb-react-ui-kit";
import p2 from "../../images/p2.png";
import api from "../../api";
import AppNavbar from "./AppNavbar";

const Register = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullName: "", email: "", password: "", phone: "", type: "user" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.fullName || !user.email || !user.password || !user.phone) {
      return message.warning("Please fill in all fields");
    }
    if (user.password.length < 6) {
      return message.warning("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      const res = await api.post("/user/register", user);
      if (res.data.success) {
        message.success("Registered Successfully");
        navigate("/login");
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

  return (
    <>
      <AppNavbar />
      <MDBContainer className="my-5">
        <MDBCard style={{ border: "none" }}>
          <MDBRow style={{ background: "rgb(190, 203, 203)" }} className="g-0 border-none p-3">
            <MDBCol md="6">
              <MDBCardBody className="d-flex mx-3 flex-column">
                <div className="d-flex flex-row mb-2">
                  <span className="h1 text-center fw-bold">Sign up to your account</span>
                </div>
                <div className="p-2">
                  <Form onSubmit={handleSubmit}>
                    <label className="my-1 form-label" htmlFor="regName">Full name</label>
                    <MDBInput style={{ height: "40px" }} name="fullName" value={user.fullName} onChange={handleChange} id="regName" type="text" size="sm" />

                    <label className="my-1 form-label" htmlFor="regEmail">Email</label>
                    <MDBInput style={{ height: "40px" }} name="email" value={user.email} onChange={handleChange} id="regEmail" type="email" size="sm" />

                    <label className="my-1 form-label" htmlFor="regPassword">Password (min 6 characters)</label>
                    <MDBInput style={{ height: "40px" }} name="password" value={user.password} onChange={handleChange} id="regPassword" type="password" size="sm" />

                    <label className="my-1 form-label" htmlFor="regPhone">Phone</label>
                    <MDBInput style={{ height: "40px" }} name="phone" value={user.phone} onChange={handleChange} id="regPhone" type="tel" size="sm" />

                    <Container className="my-3">
                      <MDBRadio name="type" id="inlineRadio1" checked={user.type === "admin"} value="admin" onChange={handleChange} label="Admin (first account only)" inline />
                      <MDBRadio name="type" id="inlineRadio2" checked={user.type === "user"} value="user" onChange={handleChange} label="User" inline />
                    </Container>

                    <Button style={{ marginTop: "20px" }} className="mb-4 bg-dark" variant="dark" size="lg" type="submit" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </Button>
                  </Form>
                  <p className="mb-5 pb-md-2" style={{ color: "#393f81" }}>
                    Have an account? <Link to="/login" style={{ color: "#393f81" }}>Login here</Link>
                  </p>
                  <p>
                    Are you a doctor? <Link to="/doctor/register">Apply as a doctor</Link>
                  </p>
                </div>
              </MDBCardBody>
            </MDBCol>
            <MDBCol md="6">
              <MDBCardImage style={{ mixBlendMode: "darken" }} src={p2} alt="register form" className="rounded-start w-100" />
            </MDBCol>
          </MDBRow>
        </MDBCard>
      </MDBContainer>
    </>
  );
};

export default Register;
