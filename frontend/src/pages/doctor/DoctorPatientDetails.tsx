import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import DigitalTwinSimulation from "../../components/DigitalTwinSimulation";

import {
  ArrowLeft,
  Activity,
  HeartPulse,
  Wind,
  Droplets,
  Brain,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { api } from "../../services/authService";

// =====================================================
// TYPES
// =====================================================

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

// =====================================================
// NURSE VITALS
// =====================================================

interface NurseVitals {
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;

  systolic_bp: number | null;
  diastolic_bp: number | null;

  spo2: number | null;
  urine_output: number | null;

  map: number | null;
  gcs: number | null;

  consciousness_level: string | null;

  vasopressor: number;
  mechanical_ventilation: number;
  antibiotic_given: number;
  fluid_given: number;

  recorded_by?: string | null;
  recorded_at?: string | null;
}

// =====================================================
// NURSE LABS
// =====================================================

interface NurseLabs {
  wbc: number | null;
  platelets: number | null;

  creatinine: number | null;
  bilirubin: number | null;

  lactate: number | null;
  crp: number | null;
  procalcitonin: number | null;

  glucose: number | null;

  recorded_by?: string | null;
  recorded_at?: string | null;
}

// =====================================================
// CLINICAL DATA RESPONSE
// =====================================================

interface ClinicalDataResponse {
  status: string;
  patient_id: string;

  message?: string;

  vitals: NurseVitals | null;
  labs: NurseLabs | null;
}

// =====================================================
// DISPLAY VITALS
// =====================================================

interface Vitals {
  age: number;
  gender: string;

  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  map: number | null;

  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;

  wbc: number | null;
  lactate: number | null;
  creatinine: number | null;
  bilirubin: number | null;
  platelets: number | null;
  glucose: number | null;
  crp: number | null;
  urine_output: number | null;
  gcs: number | null;

  vasopressor: number;
  mechanical_ventilation: number;
  antibiotic_given: number;
  fluid_given: number;
}

// =====================================================
// ORGAN RISK
// =====================================================

interface OrganRisk {
  prediction: string;
  probability: number | null;
  risk_level: string;
  missing_features?: string[];
  error?: string;
}

// =====================================================
// PREDICTION
// =====================================================

interface PredictionResult {
  status?: string;
  patient_id?: string;
  patient_name?: string;

  sepsis?: {
    prediction: string;
    probability: number;
    risk_level: string;
  };

  organ_risks?: {
    kidney?: OrganRisk;
    liver?: OrganRisk;
    lung?: OrganRisk;
    cardiovascular?: OrganRisk;
  };

  source?: {
    vitals?: string;
    labs?: string;
  };
}

// =====================================================
// RISK CLASS
// =====================================================

function riskClass(
  risk?: string
): string {
  switch (
    risk?.toUpperCase()
  ) {
    case "CRITICAL":
      return "border-red-500/40 bg-red-500/10 text-red-400";

    case "HIGH":
    case "HIGH_RISK":
      return "border-orange-500/40 bg-orange-500/10 text-orange-400";

    case "MODERATE":
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";

    case "LOW":
    case "LOW_RISK":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";

    case "UNKNOWN":
      return "border-[#333333] bg-[#111111] text-gray-400";

    default:
      return "border-[#333333] bg-[#111111] text-gray-400";
  }
}

// =====================================================
// COMPONENT
// =====================================================

export default function DoctorPatientDetails() {
  const { patientId } =
    useParams<{
      patientId: string;
    }>();

  const navigate =
    useNavigate();

  // ===================================================
  // STATES
  // ===================================================

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [clinicalLoading, setClinicalLoading] =
    useState(true);

  const [predicting, setPredicting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [clinicalError, setClinicalError] =
    useState("");

  const [predictionError, setPredictionError] =
    useState("");

  const [prediction, setPrediction] =
    useState<PredictionResult | null>(null);

  // ===================================================
  // VITALS
  // NO HARD-CODED PATIENT VALUES
  // ===================================================

  const [vitals, setVitals] =
    useState<Vitals>({
      age: 0,
      gender: "",

      heart_rate: null,
      systolic_bp: null,
      diastolic_bp: null,
      map: null,

      respiratory_rate: null,
      temperature: null,
      spo2: null,

      wbc: null,
      lactate: null,
      creatinine: null,
      bilirubin: null,
      platelets: null,
      glucose: null,
      crp: null,
      urine_output: null,
      gcs: null,

      vasopressor: 0,
      mechanical_ventilation: 0,
      antibiotic_given: 0,
      fluid_given: 0,
    });

  // ===================================================
  // LOAD PATIENT
  // ===================================================

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) {
        setError(
          "Patient ID not found."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<Patient>(
            `/api/patients/${patientId}`
          );

        const patientData =
          response.data;

        setPatient(
          patientData
        );

        const age =
          calculateAge(
            patientData.date_of_birth
          );

        setVitals(
          (previous) => ({
            ...previous,

            age,

            gender:
              patientData.gender?.toUpperCase() ||
              "",
          })
        );
      } catch (err: any) {
        console.error(
          "Patient loading error:",
          err
        );

        const detail =
          err?.response?.data
            ?.detail;

        setError(
          typeof detail ===
            "string"
            ? detail
            : "Unable to load patient details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  // ===================================================
  // LOAD LATEST NURSE CLINICAL DATA
  // ===================================================

  useEffect(() => {
    async function loadClinicalData() {
      if (!patientId) {
        return;
      }

      try {
        setClinicalLoading(true);
        setClinicalError("");

        console.log(
          "Loading latest nurse clinical data:",
          patientId
        );

        const response =
          await api.get<ClinicalDataResponse>(
            `/api/nurse/clinical-data/${patientId}`
          );

        console.log(
          "Latest nurse clinical data:",
          response.data
        );

        const data =
          response.data;

        if (
          data.status ===
            "no_data" ||
          (!data.vitals &&
            !data.labs)
        ) {
          setClinicalError(
            "No nurse clinical data found for this patient."
          );

          return;
        }

        setVitals(
          (previous) => ({
            ...previous,

            heart_rate:
              data.vitals?.heart_rate ??
              null,

            systolic_bp:
              data.vitals?.systolic_bp ??
              null,

            diastolic_bp:
              data.vitals?.diastolic_bp ??
              null,

            map:
              data.vitals?.map ??
              null,

            respiratory_rate:
              data.vitals
                ?.respiratory_rate ??
              null,

            temperature:
              data.vitals?.temperature ??
              null,

            spo2:
              data.vitals?.spo2 ??
              null,

            urine_output:
              data.vitals
                ?.urine_output ??
              null,

            gcs:
              data.vitals?.gcs ??
              null,

            wbc:
              data.labs?.wbc ??
              null,

            lactate:
              data.labs?.lactate ??
              null,

            creatinine:
              data.labs?.creatinine ??
              null,

            bilirubin:
              data.labs?.bilirubin ??
              null,

            platelets:
              data.labs?.platelets ??
              null,

            glucose:
              data.labs?.glucose ??
              null,

            crp:
              data.labs?.crp ??
              null,

            vasopressor:
              data.vitals?.vasopressor ??
              0,

            mechanical_ventilation:
              data.vitals
                ?.mechanical_ventilation ??
              0,

            antibiotic_given:
              data.vitals
                ?.antibiotic_given ??
              0,

            fluid_given:
              data.vitals
                ?.fluid_given ??
              0,
          })
        );
      } catch (err: any) {
        console.error(
          "Clinical data loading error:",
          err
        );

        const detail =
          err?.response?.data
            ?.detail;

        setClinicalError(
          typeof detail ===
            "string"
            ? detail
            : "Unable to load nurse clinical data."
        );
      } finally {
        setClinicalLoading(false);
      }
    }

    loadClinicalData();
  }, [patientId]);

  // ===================================================
  // AGE
  // ===================================================

  function calculateAge(
    dateOfBirth: string
  ): number {
    const dob =
      new Date(dateOfBirth);

    const today =
      new Date();

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
        today.getDate() <
          dob.getDate()
      )
    ) {
      age--;
    }

    return age;
  }

  // ===================================================
  // PREDICT
  // ===================================================

  async function predictRisk() {
    if (!patientId) {
      setPredictionError(
        "Patient ID not found."
      );

      return;
    }

    try {
      setPredicting(true);

      setPredictionError("");

      setPrediction(null);

      console.log(
        "========================================"
      );

      console.log(
        "AI PREDICTION START"
      );

      console.log(
        "Patient:",
        patientId
      );

      console.log(
        "========================================"
      );

      const response =
        await api.post<PredictionResult>(
          `/api/ai/predict/${patientId}`
        );

      console.log(
        "AI prediction response:",
        response.data
      );

      setPrediction(
        response.data
      );
    } catch (err: any) {
      console.error(
        "Prediction error:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data
          ?.detail;

      let message =
        "Unable to generate AI prediction.";

      if (
        typeof detail ===
        "string"
      ) {
        message = detail;
      } else if (
        Array.isArray(detail)
      ) {
        message =
          detail
            .map(
              (item: any) =>
                item?.msg ||
                "Validation error"
            )
            .join(", ");
      } else if (
        detail?.message
      ) {
        message =
          detail.message;

        if (
          Array.isArray(
            detail.missing_fields
          )
        ) {
          message +=
            `: ${detail.missing_fields.join(
              ", "
            )}`;
        }

        if (
          detail.error
        ) {
          message +=
            ` - ${detail.error}`;
        }
      }

      if (status === 404) {
        message =
          `AI prediction endpoint not found: ${message}`;
      }

      if (status === 500) {
        message =
          `Backend AI prediction failed: ${message}`;
      }

      setPredictionError(
        message
      );
    } finally {
      setPredicting(false);
    }
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <Activity
            className="mx-auto mb-4 animate-pulse text-white"
            size={40}
          />

          <p>
            Loading patient...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (
    error ||
    !patient
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">

        <p>
          {error ||
            "Patient not found."}
        </p>

        <button
          onClick={() =>
            navigate("/doctor")
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
          Back to Doctor Dashboard
        </button>

      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-[#333333] bg-[#111111]">

        <div className="mx-auto max-w-7xl px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                navigate("/doctor")
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
              <ArrowLeft
                size={20}
              />
            </button>

            <div>

              <p className="
                text-xs
                font-semibold
                tracking-wider
                text-gray-400
              ">
                SEPSISGUARDIAN AI
              </p>

              <h1 className="
                text-2xl
                font-bold
                text-white
              ">
                Doctor Patient Details
              </h1>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ================================================= */}
        {/* PATIENT INFORMATION */}
        {/* ================================================= */}

        <section className="
          mb-8
          rounded-2xl
          border
          border-[#333333]
          bg-[#111111]
          p-6
        ">

          <div className="mb-6 flex items-center gap-3">

            <div className="
              rounded-xl
              bg-[#222222]
              p-3
              text-white
            ">
              <Activity
                size={22}
              />
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Info
              label="Patient ID"
              value={
                patient.patient_id
              }
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
              value={
                patient.gender
              }
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
              value={
                patient.admission_type
              }
            />

            <Info
              label="Status"
              value={
                patient.status
              }
            />

            <Info
              label="Admission Time"
              value={new Date(
                patient.admitted_at
              ).toLocaleString()}
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* CLINICAL VITALS */}
        {/* ================================================= */}

        <section className="
          mb-8
          rounded-2xl
          border
          border-[#333333]
          bg-[#111111]
          p-6
        ">

          <div className="mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="
                rounded-xl
                bg-[#222222]
                p-3
                text-white
              ">
                <HeartPulse
                  size={22}
                />
              </div>

              <div>

                <h2 className="
                  text-xl
                  font-bold
                  text-white
                ">
                  Digital Twin — Clinical Vitals
                </h2>

                <p className="
                  text-sm
                  text-gray-400
                ">
                  Latest clinical measurements entered by nurse.
                </p>

              </div>

            </div>

            <div className="
              rounded-full
              border
              border-[#333333]
              bg-[#222222]
              px-3
              py-1
              text-xs
              font-semibold
              text-gray-300
            ">
              DIGITAL TWIN
            </div>

          </div>

          {/* ================================================= */}
          {/* CLINICAL DATA STATUS */}
          {/* ================================================= */}

          {clinicalLoading && (
            <div className="
              mb-6
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-[#333333]
              bg-[#111111]
              p-4
              text-gray-300
            ">

              <RefreshCw
                size={18}
                className="animate-spin"
              />

              <span className="text-sm">
                Loading latest nurse clinical data...
              </span>

            </div>
          )}

          {!clinicalLoading &&
            !clinicalError && (
              <div className="
                mb-6
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                p-4
                text-emerald-400
              ">

                <CheckCircle
                  size={18}
                />

                <div>

                  <p className="
                    text-sm
                    font-semibold
                  ">
                    Latest nurse data loaded
                  </p>

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Digital Twin is synchronized with the latest clinical assessment.
                  </p>

                </div>

              </div>
            )}

          {clinicalError && (
            <div className="
              mb-6
              rounded-xl
              border
              border-orange-500/30
              bg-orange-500/10
              p-4
            ">

              <p className="
                font-semibold
                text-orange-400
              ">
                Clinical Data Notice
              </p>

              <p className="
                mt-1
                text-sm
                text-orange-300
              ">
                {clinicalError}
              </p>

              <p className="
                mt-2
                text-xs
                text-gray-500
              ">
                Ask the nurse to enter and save the patient's latest clinical assessment.
              </p>

            </div>
          )}

          {/* ================================================= */}
          {/* VITAL GRID */}
          {/* ================================================= */}

          <div className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          ">

            <VitalDisplay
              label="Heart Rate"
              unit="bpm"
              value={
                vitals.heart_rate
              }
            />

            <VitalDisplay
              label="Systolic BP"
              unit="mmHg"
              value={
                vitals.systolic_bp
              }
            />

            <VitalDisplay
              label="Diastolic BP"
              unit="mmHg"
              value={
                vitals.diastolic_bp
              }
            />

            <VitalDisplay
              label="MAP"
              unit="mmHg"
              value={
                vitals.map
              }
            />

            <VitalDisplay
              label="Respiratory Rate"
              unit="/min"
              value={
                vitals.respiratory_rate
              }
            />

            <VitalDisplay
              label="Temperature"
              unit="°C"
              value={
                vitals.temperature
              }
            />

            <VitalDisplay
              label="SpO₂"
              unit="%"
              value={
                vitals.spo2
              }
            />

            <VitalDisplay
              label="WBC"
              unit="10⁹/L"
              value={
                vitals.wbc
              }
            />

            <VitalDisplay
              label="Lactate"
              unit="mmol/L"
              value={
                vitals.lactate
              }
            />

            <VitalDisplay
              label="Creatinine"
              unit="mg/dL"
              value={
                vitals.creatinine
              }
            />

            <VitalDisplay
              label="Bilirubin"
              unit="mg/dL"
              value={
                vitals.bilirubin
              }
            />

            <VitalDisplay
              label="Platelets"
              unit="10⁹/L"
              value={
                vitals.platelets
              }
            />

            <VitalDisplay
              label="Glucose"
              unit="mg/dL"
              value={
                vitals.glucose
              }
            />

            <VitalDisplay
              label="CRP"
              unit="mg/L"
              value={
                vitals.crp
              }
            />

            <VitalDisplay
              label="Urine Output"
              unit="mL/hr"
              value={
                vitals.urine_output
              }
            />

            <VitalDisplay
              label="GCS"
              unit="/15"
              value={
                vitals.gcs
              }
            />

          </div>

          {/* ================================================= */}
          {/* CLINICAL FLAGS */}
          {/* ================================================= */}

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

              <FlagDisplay
                label="Vasopressor"
                value={
                  vitals.vasopressor ===
                  1
                }
              />

              <FlagDisplay
                label="Mechanical Ventilation"
                value={
                  vitals.mechanical_ventilation ===
                  1
                }
              />

              <FlagDisplay
                label="Antibiotic Given"
                value={
                  vitals.antibiotic_given ===
                  1
                }
              />

              <FlagDisplay
                label="Fluid Given"
                value={
                  vitals.fluid_given ===
                  1
                }
              />

            </div>

          </div>

          {/* ================================================= */}
          {/* PREDICT */}
          {/* ================================================= */}

          <div className="mt-8 flex justify-end">

            <button
              onClick={
                predictRisk
              }
              disabled={
                predicting ||
                clinicalLoading
              }
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-white
                px-6
                py-3
                font-semibold
                text-black
                hover:bg-gray-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {predicting ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />

                  Running AI...
                </>
              ) : (
                <>
                  <ShieldAlert
                    size={18}
                  />

                  Predict Sepsis & Organ Risk
                </>
              )}

            </button>

          </div>

          {/* ================================================= */}
          {/* PREDICTION ERROR */}
          {/* ================================================= */}

          {predictionError && (
            <div className="
              mt-5
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-4
              text-red-400
            ">

              <p className="font-semibold">
                AI Prediction Error
              </p>

              <p className="mt-1 text-sm">
                {predictionError}
              </p>

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* DIGITAL TWIN SIMULATION */}
        {/* ================================================= */}

        <DigitalTwinSimulation
          vitals={{
            heartRate:
              vitals.heart_rate,

            systolicBP:
              vitals.systolic_bp,

            diastolicBP:
              vitals.diastolic_bp,

            map:
              vitals.map,

            respiratoryRate:
              vitals.respiratory_rate,

            temperature:
              vitals.temperature,

            spo2:
              vitals.spo2,

            wbc:
              vitals.wbc,

            lactate:
              vitals.lactate,

            creatinine:
              vitals.creatinine,

            bilirubin:
              vitals.bilirubin,

            gcs:
              vitals.gcs,

            urineOutput:
              vitals.urine_output,
          }}

          sepsisRisk={
            prediction
              ?.sepsis
              ?.probability ??
            null
          }

          organRisks={
            prediction?.organ_risks
          }
        />

        {/* ================================================= */}
        {/* AI RESULTS */}
        {/* ================================================= */}

        {prediction && (
          <section className="mt-8 space-y-6">

            {/* ================================================= */}
            {/* SEPSIS */}
            {/* ================================================= */}

            <div className="
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
                  <ShieldAlert
                    size={22}
                  />
                </div>

                <div>

                  <h2 className="
                    text-xl
                    font-bold
                    text-white
                  ">
                    Sepsis Prediction
                  </h2>

                  <p className="
                    text-sm
                    text-gray-400
                  ">
                    LightGBM clinical risk prediction
                  </p>

                </div>

              </div>

              {prediction.sepsis ? (
                <div className="
                  grid
                  gap-5
                  md:grid-cols-3
                ">

                  <ResultCard
                    title="Prediction"
                    value={
                      prediction
                        .sepsis
                        .prediction
                    }
                  />

                  <ResultCard
                    title="Probability"
                    value={`${prediction.sepsis.probability}%`}
                  />

                  <div
                    className={`rounded-xl border p-5 ${riskClass(
                      prediction
                        .sepsis
                        .risk_level
                    )}`}
                  >

                    <p className="text-sm opacity-80">
                      Risk Level
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {
                        prediction
                          .sepsis
                          .risk_level
                      }
                    </p>

                  </div>

                </div>
              ) : (
                <p className="text-gray-400">
                  Sepsis prediction unavailable.
                </p>
              )}

            </div>

            {/* ================================================= */}
            {/* ORGAN RISK */}
            {/* ================================================= */}

            <div className="
              rounded-2xl
              border
              border-[#333333]
              bg-[#111111]
              p-6
            ">

              <div className="mb-6">

                <h2 className="
                  text-xl
                  font-bold
                  text-white
                ">
                  Organ-wise Risk Prediction
                </h2>

                <p className="
                  mt-1
                  text-sm
                  text-gray-400
                ">
                  AI-assisted assessment of potential organ dysfunction.
                </p>

              </div>

              <div className="
                grid
                gap-5
                md:grid-cols-2
                lg:grid-cols-4
              ">

                <OrganCard
                  name="Kidney"
                  icon={
                    <Droplets
                      size={22}
                    />
                  }
                  result={
                    prediction
                      .organ_risks
                      ?.kidney
                  }
                />

                <OrganCard
                  name="Liver"
                  icon={
                    <Activity
                      size={22}
                    />
                  }
                  result={
                    prediction
                      .organ_risks
                      ?.liver
                  }
                />

                <OrganCard
                  name="Lung"
                  icon={
                    <Wind
                      size={22}
                    />
                  }
                  result={
                    prediction
                      .organ_risks
                      ?.lung
                  }
                />

                <OrganCard
                  name="Cardiovascular"
                  icon={
                    <HeartPulse
                      size={22}
                    />
                  }
                  result={
                    prediction
                      .organ_risks
                      ?.cardiovascular
                  }
                />

              </div>

            </div>

            {/* ================================================= */}
            {/* XAI */}
            {/* ================================================= */}

            <div className="
              rounded-2xl
              border
              border-[#333333]
              bg-[#111111]
              p-6
            ">

              <div className="flex items-start gap-4">

                <div className="
                  rounded-xl
                  bg-[#222222]
                  p-3
                  text-white
                ">
                  <Brain
                    size={24}
                  />
                </div>

                <div>

                  <h2 className="
                    text-xl
                    font-bold
                    text-white
                  ">
                    Explainable AI
                  </h2>

                  <p className="
                    mt-2
                    text-sm
                    leading-6
                    text-gray-400
                  ">
                    The prediction is generated from the patient's latest clinical measurements entered by the nurse.
                  </p>

                  <div className="
                    mt-4
                    rounded-xl
                    border
                    border-[#333333]
                    bg-[#111111]
                    p-4
                  ">

                    <p className="
                      text-sm
                      text-gray-300
                    ">
                      SHAP Explanation Module
                    </p>

                    <p className="
                      mt-1
                      text-xs
                      text-gray-500
                    ">
                      SHAP feature contribution can be connected to this section.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

// =====================================================
// INFO
// =====================================================

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

// =====================================================
// VITAL DISPLAY
// =====================================================

function VitalDisplay({
  label,
  unit,
  value,
}: {
  label: string;
  unit: string;
  value: number | null;
}) {
  const displayValue =
    value === null ||
    value === undefined
      ? "—"
      : value;

  return (
    <div>

      <label className="
        mb-2
        block
        text-sm
        font-medium
        text-gray-300
      ">
        {label}
      </label>

      <div className="relative">

        <div className="
          w-full
          rounded-xl
          border
          border-[#333333]
          bg-[#111111]
          px-4
          py-3
          pr-20
          text-white
        ">
          {displayValue}
        </div>

        <span className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-xs
          text-gray-500
        ">
          {unit}
        </span>

      </div>

    </div>
  );
}

// =====================================================
// FLAG DISPLAY
// =====================================================

function FlagDisplay({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 ${
        value
          ? "border-orange-500/30 bg-orange-500/10"
          : "border-[#333333] bg-[#111111]"
      }`}
    >

      <span className="
        text-sm
        font-medium
        text-gray-300
      ">
        {label}
      </span>

      <span
        className={`text-xs font-bold ${
          value
            ? "text-orange-400"
            : "text-gray-500"
        }`}
      >
        {value
          ? "YES"
          : "NO"}
      </span>

    </div>
  );
}

// =====================================================
// RESULT CARD
// =====================================================

function ResultCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-[#333333]
      bg-[#111111]
      p-5
    ">

      <p className="
        text-sm
        text-gray-500
      ">
        {title}
      </p>

      <p className="
        mt-2
        text-xl
        font-bold
        text-white
      ">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// ORGAN CARD
// =====================================================

function OrganCard({
  name,
  icon,
  result,
}: {
  name: string;
  icon: React.ReactNode;
  result?: OrganRisk;
}) {
  if (!result) {
    return (
      <div className="
        rounded-xl
        border
        border-[#333333]
        bg-[#111111]
        p-5
      ">

        <div className="flex items-center gap-3">

          <div className="
            rounded-lg
            bg-[#222222]
            p-3
            text-white
          ">
            {icon}
          </div>

          <h3 className="
            font-bold
            text-white
          ">
            {name}
          </h3>

        </div>

        <p className="
          mt-4
          text-sm
          text-gray-500
        ">
          Organ model not available.
        </p>

      </div>
    );
  }

  if (
    result.prediction ===
      "NOT_AVAILABLE" ||
    result.risk_level ===
      "UNKNOWN"
  ) {
    return (
      <div className="
        rounded-xl
        border
        border-[#333333]
        bg-[#111111]
        p-5
      ">

        <div className="flex items-center gap-3">

          <div className="
            rounded-lg
            bg-[#222222]
            p-3
            text-white
          ">
            {icon}
          </div>

          <h3 className="
            font-bold
            text-white
          ">
            {name}
          </h3>

        </div>

        <p className="
          mt-5
          text-sm
          font-semibold
          text-gray-400
        ">
          Prediction Not Available
        </p>

        {result.missing_features &&
          result.missing_features.length >
            0 && (
            <div className="mt-3">

              <p className="
                text-xs
                text-gray-500
              ">
                Missing:
              </p>

              <p className="
                mt-1
                text-xs
                text-orange-400
              ">
                {result.missing_features.join(
                  ", "
                )}
              </p>

            </div>
          )}

        {result.error && (
          <p className="
            mt-3
            text-xs
            text-red-400
          ">
            {result.error}
          </p>
        )}

      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 ${riskClass(
        result.risk_level
      )}`}
    >

      <div className="flex items-center gap-3">

        <div className="
          rounded-lg
          bg-black/20
          p-3
        ">
          {icon}
        </div>

        <h3 className="font-bold">
          {name}
        </h3>

      </div>

      <p className="mt-5 text-sm opacity-80">
        Prediction
      </p>

      <p className="mt-1 font-bold">
        {result.prediction}
      </p>

      <div className="
        mt-4
        flex
        items-center
        justify-between
      ">

        <span className="text-sm">
          Probability
        </span>

        <span className="font-bold">
          {result.probability !== null &&
          result.probability !==
            undefined
            ? `${result.probability}%`
            : "N/A"}
        </span>

      </div>

      <div className="
        mt-2
        flex
        items-center
        gap-2
      ">

        {result.risk_level ===
        "LOW" ? (
          <CheckCircle size={16} />
        ) : (
          <AlertTriangle size={16} />
        )}

        <span className="
          text-sm
          font-semibold
        ">
          {result.risk_level}
        </span>

      </div>

    </div>
  );
}