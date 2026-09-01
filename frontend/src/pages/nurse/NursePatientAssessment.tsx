import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Activity, RefreshCw } from "lucide-react";

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

interface AssessmentForm {
  // Vitals
  temperature: string;
  heart_rate: string;
  respiratory_rate: string;
  systolic_bp: string;
  diastolic_bp: string;
  spo2: string;
  urine_output: string;

  // Neurological
  gcs: string;
  consciousness_level: string;

  // Labs
  wbc: string;
  platelets: string;
  creatinine: string;
  bilirubin: string;
  lactate: string;
  crp: string;
  procalcitonin: string;
  glucose: string;

  // Clinical flags
  vasopressor: boolean;
  mechanical_ventilation: boolean;
  antibiotic_given: boolean;
  fluid_given: boolean;

  // Notes
  notes: string;
}

const initialForm: AssessmentForm = {
  temperature: "",
  heart_rate: "",
  respiratory_rate: "",
  systolic_bp: "",
  diastolic_bp: "",
  spo2: "",
  urine_output: "",

  gcs: "",
  consciousness_level: "",

  wbc: "",
  platelets: "",
  creatinine: "",
  bilirubin: "",
  lactate: "",
  crp: "",
  procalcitonin: "",
  glucose: "",

  vasopressor: false,
  mechanical_ventilation: false,
  antibiotic_given: false,
  fluid_given: false,

  notes: "",
};

export default function NursePatientAssessment() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] =
    useState<AssessmentForm>(initialForm);

  // =========================================================
  // LOAD PATIENT
  // =========================================================

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) {
        setError("Patient ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get<Patient>(
          `/api/patients/${patientId}`
        );

        setPatient(response.data);
      } catch (err: any) {
        console.error(
          "Failed to load patient:",
          err
        );

        const detail =
          err?.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Unable to load patient.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // CHECKBOX CHANGE
  // =========================================================

  function handleCheckboxChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: checked,
    }));
  }

  // =========================================================
  // NUMBER HELPER
  // =========================================================

  function numberOrNull(
    value: string
  ): number | null {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  // =========================================================
  // SAVE CLINICAL DATA
  // =========================================================

  async function saveClinicalData() {
    if (!patientId) {
      setError("Patient ID not found.");
      return;
    }

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      // =====================================================
      // COMPLETE CLINICAL PAYLOAD
      // =====================================================

      const payload = {
        // ---------------------------------------------------
        // VITAL SIGNS
        // ---------------------------------------------------

        temperature:
          numberOrNull(form.temperature),

        heart_rate:
          numberOrNull(form.heart_rate),

        respiratory_rate:
          numberOrNull(form.respiratory_rate),

        systolic_bp:
          numberOrNull(form.systolic_bp),

        diastolic_bp:
          numberOrNull(form.diastolic_bp),

        spo2:
          numberOrNull(form.spo2),

        urine_output:
          numberOrNull(form.urine_output),

        // ---------------------------------------------------
        // NEUROLOGICAL
        // ---------------------------------------------------

        gcs:
          numberOrNull(form.gcs),

        consciousness_level:
          form.consciousness_level || null,

        // ---------------------------------------------------
        // LAB RESULTS
        // ---------------------------------------------------

        wbc:
          numberOrNull(form.wbc),

        platelets:
          numberOrNull(form.platelets),

        creatinine:
          numberOrNull(form.creatinine),

        bilirubin:
          numberOrNull(form.bilirubin),

        lactate:
          numberOrNull(form.lactate),

        crp:
          numberOrNull(form.crp),

        procalcitonin:
          numberOrNull(form.procalcitonin),

        glucose:
          numberOrNull(form.glucose),

        // ---------------------------------------------------
        // CLINICAL FLAGS
        // ---------------------------------------------------

        vasopressor:
          form.vasopressor ? 1 : 0,

        mechanical_ventilation:
          form.mechanical_ventilation ? 1 : 0,

        antibiotic_given:
          form.antibiotic_given ? 1 : 0,

        fluid_given:
          form.fluid_given ? 1 : 0,

        // ---------------------------------------------------
        // NOTES
        // ---------------------------------------------------

        notes:
          form.notes.trim() || null,
      };

      console.log(
        "========================================"
      );

      console.log(
        "NURSE CLINICAL DATA"
      );

      console.log(
        "Patient:",
        patientId
      );

      console.log(
        payload
      );

      console.log(
        "========================================"
      );

      // =====================================================
      // SEND TO BACKEND
      // =====================================================

      const response = await api.post(
        `/api/nurse/clinical-data/${patientId}`,
        payload
      );

      console.log(
        "Clinical data saved:",
        response.data
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(
        "Clinical assessment saved successfully. Latest nurse data is now available for AI prediction."
      );

      // =====================================================
      // RESET FORM
      // =====================================================

      setForm({
        ...initialForm,
      });

    } catch (err: any) {
      console.error(
        "Save clinical data error:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      }

      else if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item?.msg ||
                "Validation error"
            )
            .join(", ")
        );
      }

      else if (detail?.message) {
        setError(detail.message);
      }

      else {
        setError(
          "Unable to save patient clinical data."
        );
      }

    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    await saveClinicalData();
  }

  // =========================================================
  // AGE
  // =========================================================

  function calculateAge(
    dateOfBirth: string
  ): number {
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
      (
        month === 0 &&
        today.getDate() < dob.getDate()
      )
    ) {
      age--;
    }

    return age;
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">

        <div className="text-center">

          <Activity
            size={40}
            className="mx-auto mb-4 animate-pulse text-white"
          />

          <p>
            Loading patient...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // PATIENT NOT FOUND
  // =========================================================

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">

        <p>
          {error || "Patient not found."}
        </p>

        <button
          onClick={() =>
            navigate("/nurse")
          }
          className="
            rounded-lg
            bg-white
            px-5
            py-2
            font-semibold
            text-black
            hover:bg-gray-200
          "
        >
          Back to Nurse Dashboard
        </button>

      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-black p-6 text-white">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/nurse")
            }
            className="
              rounded-xl
              border
              border-[#333333]
              bg-[#111111]
              p-3
              text-white
              hover:bg-[#222222]
            "
          >
            <ArrowLeft size={20} />
          </button>

          <div>

            <p className="
              text-sm
              font-semibold
              text-gray-400
            ">
              NURSE MODULE
            </p>

            <h1 className="
              text-3xl
              font-bold
              text-white
            ">
              Nurse Patient Assessment
            </h1>

          </div>

        </div>

        {/* =================================================
            PATIENT INFORMATION
        ================================================= */}

        <section className="
          mb-6
          rounded-2xl
          border
          border-[#333333]
          bg-[#111111]
          p-6
        ">

          <div className="mb-5 flex items-center gap-3">

            <div className="
              rounded-xl
              bg-[#222222]
              p-3
              text-white
            ">
              <Activity size={22} />
            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                text-white
              ">
                Patient Information
              </h2>

              <p className="
                text-sm
                text-gray-400
              ">
                Current admission details
              </p>

            </div>

          </div>

          <div className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          ">

            <Info
              label="Patient ID"
              value={patient.patient_id}
            />

            <Info
              label="Name"
              value={`${patient.first_name} ${patient.last_name}`}
            />

            <Info
              label="Age"
              value={`${calculateAge(
                patient.date_of_birth
              )} years`}
            />

            <Info
              label="Gender"
              value={patient.gender}
            />

            <Info
              label="Department"
              value={
                patient.department ||
                "General"
              }
            />

            <Info
              label="Admission Type"
              value={patient.admission_type}
            />

            <Info
              label="Status"
              value={patient.status}
            />

            <Info
              label="Admission Time"
              value={new Date(
                patient.admitted_at
              ).toLocaleString()}
            />

          </div>

        </section>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="
            mb-6
            rounded-xl
            border
            border-emerald-500/30
            bg-emerald-500/10
            p-4
            text-emerald-400
          ">

            <span className="font-semibold">
              ✓ Saved
            </span>

            <p className="mt-1 text-sm">
              {success}
            </p>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="
            mb-6
            rounded-xl
            border
            border-red-500/30
            bg-red-500/10
            p-4
            text-red-400
          ">

            <p className="font-semibold">
              Error
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              VITAL SIGNS
          ================================================= */}

          <section className="
            rounded-2xl
            border
            border-[#333333]
            bg-[#111111]
            p-6
          ">

            <h2 className="
              mb-2
              text-xl
              font-bold
              text-white
            ">
              Vital Signs
            </h2>

            <p className="
              mb-6
              text-sm
              text-gray-400
            ">
              Enter the latest patient clinical measurements.
            </p>

            <div className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            ">

              <Input
                label="Temperature (°C)"
                name="temperature"
                value={form.temperature}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="e.g. 39.5"
              />

              <Input
                label="Heart Rate (bpm)"
                name="heart_rate"
                value={form.heart_rate}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 125"
              />

              <Input
                label="Respiratory Rate (/min)"
                name="respiratory_rate"
                value={form.respiratory_rate}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 30"
              />

              <Input
                label="Systolic BP (mmHg)"
                name="systolic_bp"
                value={form.systolic_bp}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 85"
              />

              <Input
                label="Diastolic BP (mmHg)"
                name="diastolic_bp"
                value={form.diastolic_bp}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 50"
              />

              <Input
                label="SpO₂ (%)"
                name="spo2"
                value={form.spo2}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="e.g. 88"
              />

              <Input
                label="Urine Output (mL/hr)"
                name="urine_output"
                value={form.urine_output}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="e.g. 15"
              />

              {/* =================================================
                  NEW GCS FIELD
              ================================================= */}

              <Input
                label="GCS (3–15)"
                name="gcs"
                value={form.gcs}
                onChange={handleChange}
                type="number"
                min="3"
                max="15"
                step="1"
                placeholder="e.g. 13"
              />

              <Select
                label="Consciousness Level"
                name="consciousness_level"
                value={form.consciousness_level}
                onChange={handleChange}
                options={[
                  "Alert",
                  "Confused",
                  "Drowsy",
                  "Unresponsive",
                ]}
              />

            </div>

            {/* =================================================
                CLINICAL FLAGS
            ================================================= */}

            <div className="mt-6">

              <h3 className="
                mb-4
                text-sm
                font-semibold
                text-gray-300
              ">
                Clinical Support
              </h3>

              <div className="
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
              ">

                <Checkbox
                  label="Vasopressor"
                  name="vasopressor"
                  checked={form.vasopressor}
                  onChange={handleCheckboxChange}
                />

                <Checkbox
                  label="Mechanical Ventilation"
                  name="mechanical_ventilation"
                  checked={
                    form.mechanical_ventilation
                  }
                  onChange={handleCheckboxChange}
                />

                <Checkbox
                  label="Antibiotic Given"
                  name="antibiotic_given"
                  checked={
                    form.antibiotic_given
                  }
                  onChange={handleCheckboxChange}
                />

                <Checkbox
                  label="Fluid Given"
                  name="fluid_given"
                  checked={
                    form.fluid_given
                  }
                  onChange={handleCheckboxChange}
                />

              </div>

            </div>

            {/* =================================================
                NOTES
            ================================================= */}

            <div className="mt-6">

              <label className="
                mb-2
                block
                text-sm
                font-semibold
                text-gray-300
              ">
                Patient Notes
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Enter important clinical observations..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#333333]
                  bg-[#111111]
                  px-4
                  py-3
                  text-white
                  placeholder:text-gray-600
                  outline-none
                  focus:border-gray-500
                "
              />

            </div>

          </section>

          {/* =================================================
              LAB RESULTS
          ================================================= */}

          <section className="
            rounded-2xl
            border
            border-[#333333]
            bg-[#111111]
            p-6
          ">

            <h2 className="
              mb-2
              text-xl
              font-bold
              text-white
            ">
              Laboratory Results
            </h2>

            <p className="
              mb-6
              text-sm
              text-gray-400
            ">
              Enter latest laboratory values for AI prediction.
            </p>

            <div className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            ">

              <Input
                label="WBC (10⁹/L)"
                name="wbc"
                value={form.wbc}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 15"
              />

              <Input
                label="Platelets (10⁹/L)"
                name="platelets"
                value={form.platelets}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 100"
              />

              <Input
                label="Creatinine (mg/dL)"
                name="creatinine"
                value={form.creatinine}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 2.5"
              />

              <Input
                label="Bilirubin (mg/dL)"
                name="bilirubin"
                value={form.bilirubin}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 3.2"
              />

              <Input
                label="Lactate (mmol/L)"
                name="lactate"
                value={form.lactate}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 5.5"
              />

              <Input
                label="CRP (mg/L)"
                name="crp"
                value={form.crp}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 120"
              />

              <Input
                label="Procalcitonin (ng/mL)"
                name="procalcitonin"
                value={form.procalcitonin}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="e.g. 15"
              />

              <Input
                label="Glucose (mg/dL)"
                name="glucose"
                value={form.glucose}
                onChange={handleChange}
                type="number"
                placeholder="e.g. 180"
              />

            </div>

          </section>

          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              onClick={() =>
                navigate("/nurse")
              }
              className="
                rounded-xl
                border
                border-[#333333]
                bg-[#111111]
                px-6
                py-3
                font-semibold
                text-white
                hover:bg-[#222222]
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-7
                py-3
                font-semibold
                text-black
                hover:bg-gray-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {saving ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />

                  Save Clinical Assessment
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

// =========================================================
// INFO COMPONENT
// =========================================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="
        text-xs
        font-semibold
        uppercase
        text-gray-500
      ">
        {label}
      </p>

      <p className="
        mt-1
        font-semibold
        text-white
      ">
        {value}
      </p>

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
  step,
  min,
  max,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;

  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  type?: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="
        mb-2
        block
        text-sm
        font-semibold
        text-gray-300
      ">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-[#333333]
          bg-[#111111]
          px-4
          py-3
          text-white
          placeholder:text-gray-600
          outline-none
          focus:border-gray-500
        "
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
}: {
  label: string;
  name: string;
  value: string;

  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;

  options: string[];
}) {
  return (
    <div>

      <label className="
        mb-2
        block
        text-sm
        font-semibold
        text-gray-300
      ">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border
          border-[#333333]
          bg-[#111111]
          px-4
          py-3
          text-white
          outline-none
          focus:border-gray-500
        "
      >

        <option
          value=""
          className="bg-[#111111] text-white"
        >
          Select
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#111111] text-white"
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}

// =========================================================
// CHECKBOX COMPONENT
// =========================================================

function Checkbox({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;

  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <label className="
      flex
      cursor-pointer
      items-center
      justify-between
      rounded-xl
      border
      border-[#333333]
      bg-[#111111]
      p-4
      hover:bg-[#222222]
    ">

      <span className="
        text-sm
        font-medium
        text-gray-300
      ">
        {label}
      </span>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-5 w-5"
      />

    </label>
  );
}