import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { Container } from "react-bootstrap";
import api from "../../api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/getallusers");
        if (res.data.success) setUsers(res.data.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <div>
      <h4 className="p-3 text-center">All Users</h4>
      <Container>
        <Table className="my-3" striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>isDoctor</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.type}</td>
                  <td>{user.isdoctor === true ? "Yes" : "No"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <Alert variant="info" className="mb-0">
                    <Alert.Heading>No Users to show</Alert.Heading>
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

export default AdminUsers;
