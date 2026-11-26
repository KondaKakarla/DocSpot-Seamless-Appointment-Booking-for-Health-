import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { Container } from "react-bootstrap";
import api from "../../api";

const AdminAppointments = () => {
  const [allAppointments, setAllAppointments] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/getallAppointmentsAdmin");
        if (res.data.success) setAllAppointments(res.data.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <div>
      <h2 className="p-3 text-center">All Appointments</h2>
      <Container>
        <Table className="my-3" striped bordered hover responsive>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allAppointments.length > 0 ? (
              allAppointments.map((a) => (
                <tr key={a._id}>
                  <td>{a.userInfo?.fullName}</td>
                  <td>{a.doctorInfo?.fullName}</td>
                  <td>{a.date}</td>
                  <td>{a.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <Alert variant="info" className="mb-0">
                    <Alert.Heading>No Appointments to show</Alert.Heading>
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

export default AdminAppointments;
