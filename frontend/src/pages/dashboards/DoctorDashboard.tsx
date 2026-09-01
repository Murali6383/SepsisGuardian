import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  BedDouble,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { api } from "../../services/authService";

interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  department?: string;
  admission_type: string;
  status: string;
  admitted_at: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD ADMITTED PATIENTS
  // =====================================================

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Patient[]>("/api/patients/");

      const admittedPatients = response.data.filter(
        (patient: Patient) =>
          patient.status?.toUpperCase() === "ADMITTED"
      );

      setPatients(admittedPatients);
    } catch (err: any) {
      console.error("Failed to load patients:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load admitted patients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  // =====================================================
  // AGE CALCULATION
  // =====================================================

  function calculateAge(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const month =
      today.getMonth() -
      dob.getMonth();

    if (
      month < 0 ||
      (month === 0 &&
        today.getDate() < dob.getDate())
    ) {
      age--;
    }

    return age;
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredPatients = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return patients;
    }

    return patients.filter((patient) => {
      const fullName =
        `${patient.first_name} ${patient.last_name}`
          .toLowerCase();

      return (
        patient.patient_id
          .toLowerCase()
          .includes(searchValue) ||
        fullName.includes(searchValue) ||
        patient.gender
          .toLowerCase()
          .includes(searchValue) ||
        patient.department
          ?.toLowerCase()
          .includes(searchValue) ||
        patient.admission_type
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [patients, search]);

  // =====================================================
  // VIEW PATIENT
  // =====================================================

  function viewPatient(patientId: string) {
    navigate(`/doctor/patient/${patientId}`);
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">

          <Activity
            className="mx-auto mb-4 animate-pulse text-white"
            size={40}
          />

          <p className="text-white">
            Loading admitted patients...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-[#333333] bg-[#111111]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* LEFT SIDE */}

          <div className="flex items-center gap-4">

            <div className="rounded-xl bg-white p-3 text-black">
              <Stethoscope size={24} />
            </div>

            <div>

              <p className="text-xs font-semibold tracking-wider text-gray-400">
                SEPSISGUARDIAN AI
              </p>

              <h1 className="text-2xl font-bold text-white">
                Doctor Dashboard
              </h1>

            </div>

          </div>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-[#333333]
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              hover:bg-[#222222]
            "
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </header>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-gray-400">
            DOCTOR MODULE
          </p>

          <h2 className="mt-1 text-3xl font-bold text-white">
            Clinical Overview
          </h2>

          <p className="mt-2 text-gray-400">
            Monitor all currently admitted patients
            and review their clinical information.
          </p>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div
            className="
              mb-6
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-4
              text-red-400
            "
          >
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">

          {/* TOTAL PATIENTS */}

          <DoctorStatCard
            title="Total Admitted Patients"
            value={patients.length}
            icon={<BedDouble size={22} />}
          />

          {/* CRITICAL PATIENTS */}

          <div
            className="
              rounded-2xl
              border
              border-[#333333]
              bg-[#111111]
              p-6
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Critical Patients
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  0
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  AI prediction will update this
                </p>

              </div>

              <div className="rounded-xl bg-[#222222] p-3 text-white">
                <AlertTriangle size={22} />
              </div>

            </div>

          </div>

          {/* MONITORING */}

          <div
            className="
              rounded-2xl
              border
              border-[#333333]
              bg-[#111111]
              p-6
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Clinical Monitoring
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  Active
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Nurse data available
                </p>

              </div>

              <div className="rounded-xl bg-[#222222] p-3 text-white">
                <Activity size={22} />
              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* PATIENT SECTION */}
        {/* ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[#333333]
            bg-[#111111]
          "
        >

          {/* ================================================= */}
          {/* SECTION HEADER */}
          {/* ================================================= */}

          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-[#333333]
              px-6
              py-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            {/* TITLE */}

            <div>

              <h3 className="text-lg font-semibold text-white">
                All Admitted Patients
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                {filteredPatients.length} patient(s)
              </p>

            </div>

            {/* SEARCH + REFRESH */}

            <div className="flex gap-3">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={18}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                />

                <input
                  type="text"
                  placeholder="Search patient ID or name..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-[#333333]
                    bg-black
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-gray-500
                    focus:border-gray-500
                    lg:w-80
                  "
                />

              </div>

              {/* REFRESH */}

              <button
                onClick={loadPatients}
                className="
                  rounded-xl
                  border
                  border-[#333333]
                  bg-[#111111]
                  p-3
                  text-white
                  hover:bg-[#222222]
                "
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>

            </div>

          </div>

          {/* ================================================= */}
          {/* PATIENT TABLE */}
          {/* ================================================= */}

          {filteredPatients.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <UserRound
                size={45}
                className="mx-auto mb-4 text-gray-600"
              />

              <h3 className="text-lg font-semibold text-white">
                No admitted patients found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are currently no admitted patients
                matching your search.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                {/* ================================================= */}
                {/* TABLE HEADER */}
                {/* ================================================= */}

                <thead
                  className="
                    border-b
                    border-[#333333]
                    bg-black
                  "
                >

                  <tr>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      PATIENT ID
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      PATIENT
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      AGE
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      GENDER
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      DEPARTMENT
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      ADMISSION TYPE
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      STATUS
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      ACTION
                    </th>

                  </tr>

                </thead>

                {/* ================================================= */}
                {/* TABLE BODY */}
                {/* ================================================= */}

                <tbody>

                  {filteredPatients.map((patient) => (

                    <tr
                      key={patient.id}
                      className="
                        border-b
                        border-[#333333]
                        hover:bg-[#222222]
                      "
                    >

                      {/* PATIENT ID */}

                      <td
                        className="
                          px-6
                          py-5
                          font-mono
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        {patient.patient_id}
                      </td>

                      {/* PATIENT NAME */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-full
                              bg-[#222222]
                              text-white
                            "
                          >
                            <UserRound size={18} />
                          </div>

                          <div>

                            <p className="font-semibold text-white">
                              {patient.first_name}{" "}
                              {patient.last_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              Patient
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* AGE */}

                      <td
                        className="
                          px-6
                          py-5
                          text-gray-300
                        "
                      >
                        {calculateAge(
                          patient.date_of_birth
                        )}
                      </td>

                      {/* GENDER */}

                      <td
                        className="
                          px-6
                          py-5
                          text-gray-300
                        "
                      >
                        {patient.gender}
                      </td>

                      {/* DEPARTMENT */}

                      <td
                        className="
                          px-6
                          py-5
                          text-gray-300
                        "
                      >
                        {patient.department || "General"}
                      </td>

                      {/* ADMISSION TYPE */}

                      <td className="px-6 py-5">

                        <span
                          className="
                            rounded-full
                            bg-[#222222]
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-gray-300
                          "
                        >
                          {patient.admission_type}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <span
                          className="
                            rounded-full
                            bg-white
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-black
                          "
                        >
                          {patient.status}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5">

                        <button
                          onClick={() =>
                            viewPatient(
                              patient.patient_id
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-white
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-black
                            hover:bg-gray-200
                          "
                        >

                          <Eye size={16} />

                          View Patient

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}


// =========================================================
// DOCTOR STAT CARD
// =========================================================

function DoctorStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#333333]
        bg-[#111111]
        p-6
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

        </div>

        <div
          className="
            rounded-xl
            bg-[#222222]
            p-3
            text-white
          "
        >
          {icon}
        </div>

      </div>

    </div>
  );
}