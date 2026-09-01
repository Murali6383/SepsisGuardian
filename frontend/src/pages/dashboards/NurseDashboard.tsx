import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Activity,
  Clock,
  Search,
  HeartPulse,
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
}

export default function NurseDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD ALL PATIENTS
  // =====================================================

  async function loadPatients() {
    try {
      setLoading(true);

      const response = await api.get<Patient[]>(
        "/api/patients/"
      );

      setPatients(response.data);
    } catch (error) {
      console.error(
        "Failed to load patients",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  // =====================================================
  // CALCULATE AGE
  // =====================================================

  function calculateAge(
    dateOfBirth: string
  ): number {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const monthDifference =
      today.getMonth() -
      dob.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < dob.getDate()
      )
    ) {
      age--;
    }

    return age;
  }

  // =====================================================
  // SEARCH PATIENTS
  // =====================================================

  const filteredPatients = patients.filter(
    (patient) => {
      const searchValue = `
        ${patient.patient_id}
        ${patient.first_name}
        ${patient.last_name}
        ${patient.department || ""}
        ${patient.admission_type}
      `.toLowerCase();

      return searchValue.includes(
        search.toLowerCase()
      );
    }
  );

  // =====================================================
  // DASHBOARD COUNTS
  // =====================================================

  const totalPatients = patients.length;

  const activePatients = patients.filter(
    (patient) =>
      patient.status === "ADMITTED"
  ).length;

  const emergencyPatients = patients.filter(
    (patient) =>
      patient.admission_type === "EMERGENCY"
  ).length;

  // =====================================================
  // OPEN PATIENT ASSESSMENT
  // =====================================================

  function openPatient(
    patientId: string
  ) {
    navigate(
      `/nurse/patient/${patientId}`
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-black p-6">

      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="
          mb-8
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        ">

          <div>

            <p className="
              text-sm
              font-semibold
              text-gray-400
            ">
              NURSE MODULE
            </p>

            <h1 className="
              mt-1
              text-3xl
              font-bold
              text-white
            ">
              Nurse Dashboard
            </h1>

            <p className="
              mt-2
              text-gray-400
            ">
              View patients and record vital signs.
            </p>

          </div>

          <button
            onClick={loadPatients}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-white
              px-5
              py-3
              font-semibold
              text-black
              hover:bg-gray-200
            "
          >
            <Activity size={18} />
            Refresh
          </button>

        </div>

        {/* ================================================= */}
        {/* STAT CARDS */}
        {/* ================================================= */}

        <div className="
          mb-8
          grid
          gap-5
          md:grid-cols-3
        ">

          <StatCard
            title="Total Patients"
            value={totalPatients}
            icon={<Users size={22} />}
          />

          <StatCard
            title="Active Patients"
            value={activePatients}
            icon={<HeartPulse size={22} />}
          />

          <StatCard
            title="Emergency Patients"
            value={emergencyPatients}
            icon={<Clock size={22} />}
          />

        </div>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="
          mb-5
          relative
        ">

          <Search
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
            size={20}
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search patient ID or name..."
            className="
              w-full
              rounded-xl
              border
              border-[#333333]
              bg-[#111111]
              py-4
              pl-12
              pr-4
              text-white
              outline-none
              focus:border-gray-500
            "
          />

        </div>

        {/* ================================================= */}
        {/* PATIENT LIST */}
        {/* ================================================= */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-[#333333]
          bg-[#111111]
        ">

          {/* TABLE HEADER */}

          <div className="
            flex
            items-center
            justify-between
            border-b
            border-[#333333]
            px-6
            py-5
          ">

            <div>

              <h2 className="
                text-lg
                font-semibold
                text-white
              ">
                All Patients
              </h2>

              <p className="
                mt-1
                text-sm
                text-gray-400
              ">
                {filteredPatients.length} patient(s)
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* TABLE */}
          {/* ================================================= */}

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="
                border-b
                border-[#333333]
                bg-black
              ">

                <tr>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    PATIENT ID
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    PATIENT
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    AGE
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    GENDER
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    DEPARTMENT
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    ADMISSION TYPE
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    STATUS
                  </th>

                  <th className="
                    px-6
                    py-4
                    text-xs
                    font-semibold
                    text-gray-400
                  ">
                    ACTION
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* LOADING */}

                {loading ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="
                        px-6
                        py-10
                        text-center
                        text-gray-400
                      "
                    >
                      Loading patients...
                    </td>

                  </tr>

                ) : filteredPatients.length === 0 ? (

                  /* NO PATIENTS */

                  <tr>

                    <td
                      colSpan={8}
                      className="
                        px-6
                        py-10
                        text-center
                        text-gray-400
                      "
                    >
                      No patients found.
                    </td>

                  </tr>

                ) : (

                  /* PATIENTS */

                  filteredPatients.map(
                    (patient) => (

                      <tr
                        key={patient.id}
                        className="
                          border-b
                          border-[#333333]
                          hover:bg-[#222222]
                        "
                      >

                        {/* PATIENT ID */}

                        <td className="
                          px-6
                          py-5
                          font-mono
                          text-sm
                          font-semibold
                          text-white
                        ">
                          {patient.patient_id}
                        </td>

                        {/* PATIENT NAME */}

                        <td className="
                          px-6
                          py-5
                        ">

                          <div className="
                            font-semibold
                            text-white
                          ">
                            {patient.first_name}{" "}
                            {patient.last_name}
                          </div>

                        </td>

                        {/* AGE */}

                        <td className="
                          px-6
                          py-5
                          text-gray-300
                        ">
                          {calculateAge(
                            patient.date_of_birth
                          )}
                        </td>

                        {/* GENDER */}

                        <td className="
                          px-6
                          py-5
                          text-gray-300
                        ">
                          {patient.gender}
                        </td>

                        {/* DEPARTMENT */}

                        <td className="
                          px-6
                          py-5
                          text-gray-300
                        ">
                          {patient.department ||
                            "General"}
                        </td>

                        {/* ADMISSION TYPE */}

                        <td className="
                          px-6
                          py-5
                        ">

                          <span className="
                            rounded-full
                            bg-[#222222]
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-gray-300
                          ">
                            {patient.admission_type}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="
                          px-6
                          py-5
                        ">

                          <span className="
                            rounded-full
                            bg-white
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-black
                          ">
                            {patient.status}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="
                          px-6
                          py-5
                        ">

                          <div className="
                            flex
                            gap-2
                          ">

                            {/* VIEW */}

                            <button
                              onClick={() =>
                                openPatient(
                                  patient.patient_id
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-[#333333]
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-white
                                hover:bg-[#222222]
                              "
                            >
                              View Patient
                            </button>

                            {/* ENTER VITALS */}

                            <button
                              onClick={() =>
                                openPatient(
                                  patient.patient_id
                                )
                              }
                              className="
                                rounded-lg
                                bg-white
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-black
                                hover:bg-gray-200
                              "
                            >
                              Enter Vitals
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}


// =========================================================
// STAT CARD COMPONENT
// =========================================================

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {

  return (

    <div className="
      rounded-2xl
      border
      border-[#333333]
      bg-[#111111]
      p-6
    ">

      <div className="
        flex
        items-center
        justify-between
      ">

        <div>

          <p className="
            text-sm
            text-gray-400
          ">
            {title}
          </p>

          <p className="
            mt-2
            text-3xl
            font-bold
            text-white
          ">
            {value}
          </p>

        </div>

        <div className="
          rounded-xl
          bg-[#222222]
          p-3
          text-white
        ">
          {icon}
        </div>

      </div>

    </div>

  );
}