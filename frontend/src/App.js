import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Home from "./components/common/Home";
import Login from "./components/common/Login";
import Register from "./components/common/Register";
import ForgotPassword from "./components/common/ForgotPassword";
import ResetPassword from "./components/common/ResetPassword";
import ApplyDoctor from "./components/user/ApplyDoctor";
import UserHome from "./components/user/UserHome";
import DoctorApplicationStatus from "./components/user/DoctorApplicationStatus";
import AdminHome from "./components/admin/AdminHome";
import { getStoredUser, isLoggedIn } from "./auth";

// Evaluated on every render of the route, so it works right after login
const ProtectedRoute = ({ role, children, allowApplicant = false }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const user = getStoredUser();
  if (
    role === "user" &&
    !allowApplicant &&
    ["pending", "rejected"].includes(user.doctorStatus)
  ) {
    return <Navigate to="/doctor/application" replace />;
  }
  if (role && user.type !== role) {
    return <Navigate to={user.type === "admin" ? "/adminhome" : "/userhome"} replace />;
  }
  return children;
};

// Logged-in users skip the login/register pages
const PublicOnly = ({ children }) => {
  if (isLoggedIn()) {
    const user = getStoredUser();
    const destination = user.type === "admin"
      ? "/adminhome"
      : ["pending", "rejected"].includes(user.doctorStatus)
        ? "/doctor/application"
        : "/userhome";
    return <Navigate to={destination} replace />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <Router>
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/doctor/register" element={<ApplyDoctor standalone />} />
            <Route
              path="/doctor/application"
              element={<ProtectedRoute role="user" allowApplicant><DoctorApplicationStatus /></ProtectedRoute>}
            />
            <Route
              path="/adminhome"
              element={<ProtectedRoute role="admin"><AdminHome /></ProtectedRoute>}
            />
            <Route
              path="/userhome"
              element={<ProtectedRoute role="user"><UserHome /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <footer className="bg-light text-center text-lg-start">
          <div className="text-center p-3">© 2025 Copyright: DocSpot</div>
        </footer>
      </Router>
    </div>
  );
}

export default App;
