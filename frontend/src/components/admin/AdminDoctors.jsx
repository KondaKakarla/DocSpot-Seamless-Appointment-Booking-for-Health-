import React, { useCallback, useEffect, useState } from "react";
import { Button, Container, Badge } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { message } from "antd";
import api from "../../api";

const variant = { pending: "warning", approved: "success", rejected: "danger" };

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);

  const getDoctors = useCallback(async () => {
    try {
      const res = await api.get("/admin/getalldoctors");
      if (res.data.success) setDoctors(res.data.data);
    } catch (error) {
      console.log(error);
      message.error("something went wrong");
    }
  }, []);

  const changeStatus = async (doctorId, action) => {
    try {
      const res = await api.post(`/admin/${action}`, { doctorId });
      if (res.data.success) {
        message.success(res.data.message);
        getDoctors();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error("something went wrong");
    }
  };

  useEffect(() => {
    getDoctors();
  }, [getDoctors]);

  return (
    <div>
      <h2 className="p-3 text-center">All Doctors</h2>
      <Container>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length > 0 ? (
              doctors.map((d) => (
                <tr key={d._id}>
                  <td>{d.fullName}</td>
                  <td>{d.specialization}</td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td><Badge bg={variant[d.status] || "secondary"}>{d.status}</Badge></td>
                  <td>
                    {d.status !== "approved" && (
                      <Button onClick={() => changeStatus(d._id, "getapprove")} className="mx-1" size="sm" variant="outline-success">
                        Approve
                      </Button>
                    )}
                    {d.status !== "rejected" && (
                      <Button onClick={() => changeStatus(d._id, "getreject")} className="mx-1" size="sm" variant="outline-danger">
                        Reject
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <Alert variant="info" className="mb-0">
                    <Alert.Heading>No Doctors to show</Alert.Heading>
                  </Alert>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default AdminDoctors;
