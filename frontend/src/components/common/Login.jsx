import React, { useState } from "react";
import { message } from "antd";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { MDBContainer, MDBCard, MDBCardBody, MDBCardImage, MDBRow, MDBCol, MDBInput } from "mdb-react-ui-kit";
import photo1 from "../../images/photo1.png";
import api from "../../api";
import AppNavbar from "./AppNavbar";

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email || !user.password) {
      return message.warning("Please enter email and password");
    }
    setLoading(true);
    try {
      const res = await api.post("/user/login", user);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userData", JSON.stringify(res.data.userData));
        message.success("Login successfully");
        const destination = res.data.userData.type === "admin"
          ? "/adminhome"
          : ["pending", "rejected"].includes(res.data.userData.doctorStatus)
            ? "/doctor/application"
            : "/userhome";
        navigate(destination, { replace: true });
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
              <MDBCardImage src={photo1} alt="login form" className="rounded-start w-100" />
            </MDBCol>
            <MDBCol md="6">
              <MDBCardBody className="d-flex mx-5 flex-column">
                <div className="d-flex flex-row mt-2 mb-5">
                  <span className="h1 fw-bold mb-0">Sign in to your account</span>
                </div>
                <Form onSubmit={handleSubmit}>
                  <label className="form-label" htmlFor="loginEmail">Email</label>
                  <MDBInput style={{ margin: "5px auto" }} name="email" value={user.email} onChange={handleChange} id="loginEmail" type="email" size="md" autoComplete="email" />
                  <label className="form-label" htmlFor="loginPassword">Password</label>
                  <MDBInput style={{ margin: "5px auto" }} name="password" value={user.password} onChange={handleChange} id="loginPassword" type="password" size="md" autoComplete="current-password" />
                  <Link to="/forgot-password" className="d-inline-block mt-2">
                    Forgot password?
                  </Link>
                  <Button className="mb-4 mt-3 px-5 bg-dark" size="lg" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                  </Button>
                </Form>
                <p className="mb-5 pb-lg-2" style={{ color: "#393f81" }}>
                  Don't have an account? <Link to="/register" style={{ color: "#393f81" }}>Register here</Link>
                </p>
              </MDBCardBody>
            </MDBCol>
          </MDBRow>
        </MDBCard>
      </MDBContainer>
    </>
  );
};

export default Login;
