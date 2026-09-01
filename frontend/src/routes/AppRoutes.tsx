import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/auth/Login";
import Unauthorized from "../pages/Unauthorized";

import AdminDashboard from "../pages/dashboards/AdminDashboard";
import AdmissionDashboard from "../pages/dashboards/AdmissionDashboard";
import NurseDashboard from "../pages/dashboards/NurseDashboard";
import DoctorDashboard from "../pages/dashboards/DoctorDashboard";

import NursePatientAssessment from "../pages/nurse/NursePatientAssessment";
import DoctorPatientDetails from "../pages/doctor/DoctorPatientDetails";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />


      {/* ================= ADMIN ================= */}

      <Route
        element={
          <ProtectedRoute roles={["ADMIN"]} />
        }
      >
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />
      </Route>


      {/* ================= ADMISSION ================= */}

      <Route
        element={
          <ProtectedRoute
            roles={["ADMIN", "ADMISSION"]}
          />
        }
      >
        <Route
          path="/admission"
          element={<AdmissionDashboard />}
        />
      </Route>


      {/* ================= NURSE ================= */}

      <Route
        element={
          <ProtectedRoute
            roles={["ADMIN", "NURSE"]}
          />
        }
      >

        <Route
          path="/nurse"
          element={<NurseDashboard />}
        />

        <Route
          path="/nurse/patient/:patientId"
          element={<NursePatientAssessment />}
        />

      </Route>


      {/* ================= DOCTOR ================= */}

      <Route
        element={
          <ProtectedRoute
            roles={["ADMIN", "DOCTOR"]}
          />
        }
      >

        {/* Doctor Main Dashboard */}

        <Route
          path="/doctor"
          element={<DoctorDashboard />}
        />

        {/* Doctor Patient Details */}

        <Route
          path="/doctor/patient/:patientId"
          element={<DoctorPatientDetails />}
        />

      </Route>


      {/* ================= DEFAULT ================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}