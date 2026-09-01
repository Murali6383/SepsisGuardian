import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  Activity,
  Search,
  X,
  RefreshCw,
} from "lucide-react";

import { api } from "../../services/authService";

interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  department?: string;
  admission_type: string;
  status: string;
  chief_complaint?: string;
  medical_history?: string;
  allergies?: string;
}

interface PatientForm {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  admission_type: string;
  department: string;
  chief_complaint: string;
  medical_history: string;
  allergies: string;
}

const initialForm: PatientForm = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  blood_group: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  admission_type: "GENERAL",
  department: "",
  chief_complaint: "",
  medical_history: "",
  allergies: "",
};

export default function AdmissionDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<PatientForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // LOAD PATIENTS
  // =====================================================

  async function loadPatients() {
    try {
      setLoading(true);

      const response = await api.get<Patient[]>("/api/patients/");

      setPatients(response.data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  // =====================================================
  // FORM INPUT
  // =====================================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =====================================================
  // REGISTER PATIENT
  // =====================================================

  async function handleRegisterPatient(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const response = await api.post<Patient>(
        "/api/patients/",
        {
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_birth: form.date_of_birth,
          gender: form.gender,

          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,

          blood_group: form.blood_group || null,

          emergency_contact_name:
            form.emergency_contact_name || null,

          emergency_contact_phone:
            form.emergency_contact_phone || null,

          admission_type: form.admission_type,
          department: form.department || null,

          chief_complaint:
            form.chief_complaint || null,

          medical_history:
            form.medical_history || null,

          allergies:
            form.allergies || null,
        }
      );

      console.log(
        "PATIENT CREATED:",
        response.data
      );

      setSuccessMessage(
        `Patient ${response.data.patient_id} registered successfully.`
      );

      setForm(initialForm);

      setShowForm(false);

      await loadPatients();
    } catch (error: any) {
      console.error(
        "PATIENT REGISTRATION ERROR:",
        error
      );

      const backendError =
        error?.response?.data?.detail;

      if (typeof backendError === "string") {
        setFormError(backendError);
      } else if (Array.isArray(backendError)) {
        setFormError(
          backendError
            .map((item: any) => item.msg)
            .join(", ")
        );
      } else {
        setFormError(
          "Failed to register patient. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredPatients = patients.filter(
    (patient) => {
      const value = `
        ${patient.patient_id}
        ${patient.first_name}
        ${patient.last_name}
      `.toLowerCase();

      return value.includes(
        search.toLowerCase()
      );
    }
  );

  // =====================================================
  // CLOSE FORM
  // =====================================================

  function closeForm() {
    setShowForm(false);
    setForm(initialForm);
    setFormError("");
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold text-gray-400">
              ADMISSION MODULE
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Patient Admission
            </h1>

            <p className="mt-2 text-gray-400">
              Register and manage admitted patients.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={loadPatients}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#111111] px-4 py-3 font-semibold text-white hover:bg-[#222222]"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setFormError("");
                setSuccessMessage("");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-gray-200"
            >
              <UserPlus size={18} />
              Register Patient
            </button>

          </div>
        </div>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-[#444444] bg-[#222222] px-5 py-4 text-sm font-medium text-gray-200">
            {successMessage}
          </div>
        )}

        {/* STAT CARDS */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <StatCard
            title="Total Patients"
            value={patients.length}
            icon={<Users size={22} />}
          />

          <StatCard
            title="Active Admissions"
            value={
              patients.filter(
                (p) => p.status === "ADMITTED"
              ).length
            }
            icon={<Activity size={22} />}
          />

          <StatCard
            title="Emergency"
            value={
              patients.filter(
                (p) =>
                  p.admission_type === "EMERGENCY"
              ).length
            }
            icon={<Activity size={22} />}
          />

        </div>

        {/* SEARCH */}

        <div className="relative mb-5">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search patient ID or name..."
            className="w-full rounded-xl border border-[#333333] bg-[#111111] py-4 pl-12 pr-4 text-white outline-none focus:border-gray-500"
          />

        </div>

        {/* PATIENT TABLE */}

        <div className="overflow-hidden rounded-2xl border border-[#333333] bg-[#111111]">

          <div className="border-b border-[#333333] px-6 py-4">
            <h2 className="font-semibold text-white">
              Patient List
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredPatients.length} patient(s)
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-[#333333] bg-black">

                <tr>

                  <th className="px-6 py-4 text-xs font-semibold text-gray-400">
                    PATIENT ID
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-gray-400">
                    PATIENT
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-gray-400">
                    DEPARTMENT
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-gray-400">
                    TYPE
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-gray-400">
                    STATUS
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      Loading patients...
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(
                    (patient) => (
                      <tr
                        key={patient.id}
                        className="border-b border-[#333333] hover:bg-[#222222]"
                      >

                        <td className="px-6 py-5 font-mono text-sm text-white">
                          {patient.patient_id}
                        </td>

                        <td className="px-6 py-5">

                          <div className="font-semibold text-white">
                            {patient.first_name}{" "}
                            {patient.last_name}
                          </div>

                          <div className="text-sm text-gray-400">
                            {patient.gender}
                            {" • "}
                            {patient.blood_group || "N/A"}
                          </div>

                        </td>

                        <td className="px-6 py-5 text-gray-300">
                          {patient.department || "General"}
                        </td>

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-[#222222] px-3 py-1 text-xs font-semibold text-gray-300">
                            {patient.admission_type}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                            {patient.status}
                          </span>

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

      {/* ================================================= */}
      {/* REGISTER PATIENT MODAL */}
      {/* ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#333333] bg-[#111111]">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#333333] bg-[#111111] px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-white">
                  Register Patient
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Enter patient admission details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#222222] hover:text-white"
              >
                <X size={22} />
              </button>

            </div>

            {/* ERROR */}

            {formError && (
              <div className="mx-6 mt-5 rounded-xl border border-[#444444] bg-[#222222] px-4 py-3 text-sm text-gray-200">
                {formError}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleRegisterPatient}
              className="space-y-6 p-6"
            >

              {/* PERSONAL INFORMATION */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Personal Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <Input
                    label="First Name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Last Name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    required
                  />

                  <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                    options={[
                      ["", "Select Gender"],
                      ["MALE", "Male"],
                      ["FEMALE", "Female"],
                      ["OTHER", "Other"],
                    ]}
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />

                  <Select
                    label="Blood Group"
                    name="blood_group"
                    value={form.blood_group}
                    onChange={handleChange}
                    options={[
                      ["", "Select Blood Group"],
                      ["A+", "A+"],
                      ["A-", "A-"],
                      ["B+", "B+"],
                      ["B-", "B-"],
                      ["AB+", "AB+"],
                      ["AB-", "AB-"],
                      ["O+", "O+"],
                      ["O-", "O-"],
                    ]}
                  />

                </div>

                <div className="mt-4">
                  <TextArea
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* ADMISSION INFORMATION */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Admission Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <Select
                    label="Admission Type"
                    name="admission_type"
                    value={form.admission_type}
                    onChange={handleChange}
                    required
                    options={[
                      ["GENERAL", "General"],
                      ["EMERGENCY", "Emergency"],
                    ]}
                  />

                  <Input
                    label="Department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. ICU"
                  />

                </div>

                <div className="mt-4">
                  <TextArea
                    label="Chief Complaint"
                    name="chief_complaint"
                    value={form.chief_complaint}
                    onChange={handleChange}
                    placeholder="Patient's main complaint"
                  />
                </div>

              </div>

              {/* EMERGENCY CONTACT */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Emergency Contact
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <Input
                    label="Contact Name"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Contact Phone"
                    name="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                  />

                </div>

              </div>

              {/* MEDICAL INFORMATION */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Medical Information
                </h3>

                <div className="space-y-4">

                  <TextArea
                    label="Medical History"
                    name="medical_history"
                    value={form.medical_history}
                    onChange={handleChange}
                  />

                  <TextArea
                    label="Allergies"
                    name="allergies"
                    value={form.allergies}
                    onChange={handleChange}
                  />

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-[#333333] pt-6">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-[#333333] px-5 py-3 font-semibold text-gray-300 hover:bg-[#222222]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Register Patient"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}


// =========================================================
// INPUT COMPONENT
// =========================================================

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-300">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#333333] bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-gray-400"
      />
    </div>
  );
}


// =========================================================
// SELECT COMPONENT
// =========================================================

function Select({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  options: [string, string][];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-300">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-[#333333] bg-black px-4 py-3 text-white outline-none focus:border-gray-400"
      >
        {options.map(([value, label]) => (
          <option
            key={value}
            value={value}
          >
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}


// =========================================================
// TEXTAREA COMPONENT
// =========================================================

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-300">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-[#333333] bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-gray-400"
      />
    </div>
  );
}


// =========================================================
// STAT CARD
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
    <div className="rounded-2xl border border-[#333333] bg-[#111111] p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

        </div>

        <div className="rounded-xl bg-[#222222] p-3 text-white">
          {icon}
        </div>

      </div>

    </div>
  );
}