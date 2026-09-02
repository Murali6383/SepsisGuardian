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
  vasopressor: number | null;
  mechanical_ventilation: number | null;
  antibiotic_given: number | null;
  fluid_given: number | null;
  recorded_by?: string;
  recorded_at?: string;
}

interface NurseLabs {
  wbc: number | null;
  platelets: number | null;
  creatinine: number | null;
  bilirubin: number | null;
  lactate: number | null;
  crp: number | null;
  procalcitonin: number | null;
  glucose: number | null;
  recorded_by?: string;
  recorded_at?: string;
}

interface ClinicalDataResponse {
  status: string;
  patient_id: string;
  message?: string;
  vitals: NurseVitals | null;
  labs: NurseLabs | null;
}

interface Vitals {
  age: number;
  gender: string;

  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;

  systolic_bp: number | null;
  diastolic_bp: number | null;
  map: number | null;

  spo2: number | null;
  urine_output: number | null;
  gcs: number | null;

  wbc: number | null;
  platelets: number | null;
  creatinine: number | null;
  bilirubin: number | null;
  lactate: number | null;
  crp: number | null;
  procalcitonin: number | null;
  glucose: number | null;

  vasopressor: number;
  mechanical_ventilation: number;
  antibiotic_given: number;
  fluid_given: number;
}

// =====================================================
// ORGAN RISK
// IMPORTANT: backend returns prediction as NUMBER
// e.g. 1 or 0
// =====================================================

interface OrganRisk {
  prediction: string | number | null;
  probability: number | null;
  risk_level: string;
  missing_features?: string[];
  error?: string;
}

// =====================================================
// PATIENT-SPECIFIC FEATURE IMPACT
// =====================================================

interface PatientFeatureImpact {
  feature: string;

  value: number | string | null;

  probability_change?: number;

  importance?: number;

  normalized_importance?: number;

  direction?: string;

  impact:
    | "HIGH IMPACT"
    | "MEDIUM IMPACT"
    | "LOW IMPACT"
    | "MINIMAL IMPACT"
    | string;

  status?: string;

  clinical_status?: string;

  label?: string;

  unit?: string;

  explanation?: string;
}

// =====================================================
// PREDICTION RESULT
// =====================================================

interface PredictionResult {
  status?: string;
  patient_id?: string;
  database_id?: number;
  patient_name?: string;

  sepsis?: {
    prediction: string | number | null;
    probability: number;
    risk_level: string;
    threshold?: number;
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

  source_ids?: {
    vitals_id?: number | string;
    labs_id?: number | string;
  };

  patient_specific_feature_impact?: PatientFeatureImpact[];

  permutation_importance?: PatientFeatureImpact[];
}

// =====================================================
// FEATURE LABEL
// =====================================================

const featureLabel = (feature: string): string => {
  const labels: Record<string, string> = {
    temperature: "Temperature",
    lactate: "Lactate",
    spo2: "SpO₂",
    heart_rate: "Heart Rate",
    crp: "CRP",
    creatinine: "Creatinine",
    glucose: "Glucose",
    bilirubin: "Bilirubin",
    wbc: "WBC",
    respiratory_rate: "Respiratory Rate",
    systolic_bp: "Systolic BP",
    diastolic_bp: "Diastolic BP",
    map: "MAP",
    gcs: "GCS",
    urine_output: "Urine Output",
    platelets: "Platelets",
    procalcitonin: "Procalcitonin",
  };

  return (
    labels[feature] ||
    feature
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
};

// =====================================================
// FEATURE UNIT
// =====================================================

const featureUnit = (feature: string): string => {
  const units: Record<string, string> = {
    temperature: "°C",
    heart_rate: "bpm",
    respiratory_rate: "/min",
    systolic_bp: "mmHg",
    diastolic_bp: "mmHg",
    map: "mmHg",
    spo2: "%",
    urine_output: "mL/hr",
    gcs: "/15",
    wbc: "×10³/µL",
    platelets: "×10³/µL",
    creatinine: "mg/dL",
    bilirubin: "mg/dL",
    lactate: "mmol/L",
    crp: "mg/L",
    procalcitonin: "ng/mL",
    glucose: "mg/dL",
  };

  return units[feature] || "";
};

// =====================================================
// CLINICAL FEATURES ONLY
// =====================================================

const CLINICAL_FEATURES = new Set([
  "temperature",
  "heart_rate",
  "respiratory_rate",
  "systolic_bp",
  "diastolic_bp",
  "map",
  "spo2",
  "urine_output",
  "gcs",
  "wbc",
  "platelets",
  "creatinine",
  "bilirubin",
  "lactate",
  "crp",
  "procalcitonin",
  "glucose",
]);

// =====================================================
// RISK CLASS
// =====================================================

const riskClass = (risk?: string): string => {
  const normalized =
    String(risk ?? "UNKNOWN").toUpperCase();

  if (normalized === "CRITICAL") {
    return "border-red-500/40 bg-red-500/10 text-red-400";
  }

  if (
    normalized === "HIGH" ||
    normalized === "HIGH_RISK"
  ) {
    return "border-orange-500/40 bg-orange-500/10 text-orange-400";
  }

  if (normalized === "MODERATE") {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  if (
    normalized === "LOW" ||
    normalized === "LOW_RISK"
  ) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  }

  return "border-[#333333] bg-[#111111] text-gray-400";
};

// =====================================================
// FEATURE STATUS CLASS
// =====================================================

const featureStatusClass = (
  status?: string
): string => {
  const normalized =
    String(status ?? "").toUpperCase();

  if (
    normalized === "HIGH" ||
    normalized === "ABNORMAL_HIGH"
  ) {
    return "border-red-500/30 bg-red-500/5 text-red-400";
  }

  if (
    normalized === "LOW" ||
    normalized === "ABNORMAL_LOW"
  ) {
    return "border-orange-500/30 bg-orange-500/5 text-orange-400";
  }

  if (normalized === "NORMAL") {
    return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
  }

  return "border-[#333333] bg-[#111111] text-gray-400";
};

// =====================================================
// SAFE PREDICTION TEXT
// FIX FOR:
// result.prediction?.toUpperCase()
// =====================================================

const getPredictionText = (
  prediction: string | number | null | undefined
): string => {
  if (
    prediction === null ||
    prediction === undefined
  ) {
    return "UNKNOWN";
  }

  if (typeof prediction === "number") {
    if (prediction === 1) {
      return "POSITIVE";
    }

    if (prediction === 0) {
      return "NEGATIVE";
    }

    return String(prediction);
  }

  const normalized = String(prediction)
    .trim()
    .toUpperCase();

  if (
    normalized === "1" ||
    normalized === "POSITIVE" ||
    normalized === "TRUE"
  ) {
    return "POSITIVE";
  }

  if (
    normalized === "0" ||
    normalized === "NEGATIVE" ||
    normalized === "FALSE"
  ) {
    return "NEGATIVE";
  }

  return normalized;
};

// =====================================================
// SAFE NUMBER
// =====================================================

const safeNumber = (
  value: unknown
): number | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

// =====================================================
// PROBABILITY TO PERCENT
// Supports:
// 0.99  -> 99
// 99    -> 99
// =====================================================

const probabilityPercent = (
  probability: number | null | undefined
): number | null => {
  const value = safeNumber(probability);

  if (value === null) {
    return null;
  }

  return value <= 1
    ? value * 100
    : value;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function DoctorPatientDetails() {
  const { patientId } =
    useParams<{ patientId: string }>();

  const navigate = useNavigate();

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

  const [vitals, setVitals] =
    useState<Vitals>({
      age: 0,
      gender: "",

      temperature: null,
      heart_rate: null,
      respiratory_rate: null,

      systolic_bp: null,
      diastolic_bp: null,
      map: null,

      spo2: null,
      urine_output: null,
      gcs: null,

      wbc: null,
      platelets: null,
      creatinine: null,
      bilirubin: null,
      lactate: null,
      crp: null,
      procalcitonin: null,
      glucose: null,

      vasopressor: 0,
      mechanical_ventilation: 0,
      antibiotic_given: 0,
      fluid_given: 0,
    });

  // ===================================================
  // CALCULATE AGE
  // ===================================================

  const calculateAge = (
    dateOfBirth: string
  ): number => {
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
  };

  // ===================================================
  // LOAD PATIENT
  // ===================================================

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError("Patient ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/api/patients/${patientId}`
        );

        const patientData = response.data;

        setPatient(patientData);

        setVitals((previous) => ({
          ...previous,

          age: calculateAge(
            patientData.date_of_birth
          ),

          gender:
            patientData.gender || "",
        }));
      } catch (err: any) {
        console.error(
          "Failed to load patient:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Failed to load patient information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  // ===================================================
  // LOAD NURSE CLINICAL DATA
  // ===================================================

  useEffect(() => {
    const loadClinicalData = async () => {
      if (!patientId) {
        return;
      }

      try {
        setClinicalLoading(true);
        setClinicalError("");

        const response =
          await api.get<ClinicalDataResponse>(
            `/api/nurse/clinical-data/${patientId}`
          );

        const data = response.data;

        if (
          data.status !== "success" ||
          !data.vitals
        ) {
          setClinicalError(
            data.message ||
              "No nurse clinical data available."
          );

          return;
        }

        const nurseVitals = data.vitals;
        const nurseLabs = data.labs;

        setVitals((previous) => ({
          ...previous,

          temperature:
            nurseVitals.temperature,

          heart_rate:
            nurseVitals.heart_rate,

          respiratory_rate:
            nurseVitals.respiratory_rate,

          systolic_bp:
            nurseVitals.systolic_bp,

          diastolic_bp:
            nurseVitals.diastolic_bp,

          map:
            nurseVitals.map,

          spo2:
            nurseVitals.spo2,

          urine_output:
            nurseVitals.urine_output,

          gcs:
            nurseVitals.gcs,

          wbc:
            nurseLabs?.wbc ?? null,

          platelets:
            nurseLabs?.platelets ?? null,

          creatinine:
            nurseLabs?.creatinine ?? null,

          bilirubin:
            nurseLabs?.bilirubin ?? null,

          lactate:
            nurseLabs?.lactate ?? null,

          crp:
            nurseLabs?.crp ?? null,

          procalcitonin:
            nurseLabs?.procalcitonin ?? null,

          glucose:
            nurseLabs?.glucose ?? null,

          vasopressor:
            nurseVitals.vasopressor ?? 0,

          mechanical_ventilation:
            nurseVitals.mechanical_ventilation ?? 0,

          antibiotic_given:
            nurseVitals.antibiotic_given ?? 0,

          fluid_given:
            nurseVitals.fluid_given ?? 0,
        }));
      } catch (err: any) {
        console.error(
          "Failed to load clinical data:",
          err
        );

        setClinicalError(
          err?.response?.data?.detail ||
            "Unable to load nurse clinical data."
        );
      } finally {
        setClinicalLoading(false);
      }
    };

    loadClinicalData();
  }, [patientId]);

  // ===================================================
  // PREDICT RISK
  // ===================================================

  const predictRisk = async () => {
    if (!patientId) {
      return;
    }

    try {
      setPredicting(true);
      setPredictionError("");

      console.log(
        "Running AI prediction for patient:",
        patientId
      );

      const response =
        await api.post<PredictionResult>(
          `/api/ai/predict/${patientId}`
        );

      console.log(
        "AI prediction response:",
        response.data
      );

      setPrediction(response.data);
    } catch (err: any) {
      console.error(
        "AI prediction failed:",
        err
      );

      if (err?.response?.status === 404) {
        setPredictionError(
          "Patient or clinical data not found."
        );
      } else if (
        err?.response?.status === 422
      ) {
        setPredictionError(
          "Some required clinical features are missing or invalid."
        );
      } else if (
        err?.response?.status === 500
      ) {
        setPredictionError(
          err?.response?.data?.detail ||
            "AI prediction failed on the server."
        );
      } else {
        setPredictionError(
          err?.response?.data?.detail ||
            "Unable to generate AI prediction."
        );
      }
    } finally {
      setPredicting(false);
    }
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 animate-pulse text-cyan-400" />

          <p className="text-gray-400">
            Loading patient information...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR SCREEN
  // ===================================================

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-red-500/30 bg-red-500/5 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />

          <h2 className="text-xl font-semibold mb-2">
            Unable to Load Patient
          </h2>

          <p className="text-gray-400 mb-6">
            {error ||
              "Patient information is unavailable."}
          </p>

          <button
            onClick={() =>
              navigate("/doctor")
            }
            className="px-5 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition"
          >
            Back to Doctor Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // PATIENT-SPECIFIC FEATURE IMPACT
  // ===================================================

  const allFeatureImpacts =
    prediction?.patient_specific_feature_impact ??
    prediction?.permutation_importance ??
    [];

  /*
   * Only clinical features.
   *
   * No:
   * age
   * gender
   * antibiotics
   * fluids
   * vasopressor
   * mechanical ventilation
   */

  const featureImpacts =
    allFeatureImpacts
      .filter((item) =>
        CLINICAL_FEATURES.has(
          item.feature
        )
      )
      .filter(
        (item) =>
          item.value !== null &&
          item.value !== undefined
      )
      .filter((item) => {
        const status =
          (
            item.status ??
            item.clinical_status ??
            ""
          ).toUpperCase();

        /*
         * Do not display NORMAL/reference features.
         * Only actual abnormal clinical measurements.
         */
        return status !== "NORMAL";
      })
      .sort(
        (a, b) =>
          Math.abs(
            b.probability_change ?? 0
          ) -
          Math.abs(
            a.probability_change ?? 0
          )
      )
      .slice(0, 8);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-black text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-[#222222] bg-black sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                navigate("/doctor")
              }
              className="p-2 rounded-lg border border-[#333333] hover:bg-[#111111] transition"
              title="Back to Doctor Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>

              <div className="text-sm font-semibold tracking-wider text-cyan-400">
                SEPSISGUARDIAN AI
              </div>

              <h1 className="text-xl font-semibold">
                Doctor Patient Details
              </h1>

            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldAlert className="w-4 h-4" />
            Clinical Decision Support
          </div>

        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {/* =================================================
            PATIENT INFORMATION
        ================================================= */}

        <section className="border border-[#222222] rounded-2xl bg-[#080808] overflow-hidden">

          <div className="px-6 py-5 border-b border-[#222222]">

            <h2 className="text-lg font-semibold">
              Patient Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Demographic and admission information
            </p>

          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

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
                patient.department || "—"
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
              value={patient.status}
            />

            <Info
              label="Admission Time"
              value={
                patient.admitted_at
                  ? new Date(
                      patient.admitted_at
                    ).toLocaleString()
                  : "—"
              }
            />

          </div>
        </section>

        {/* =================================================
            CLINICAL VITALS
        ================================================= */}

        <section className="border border-[#222222] rounded-2xl bg-[#080808] overflow-hidden">

          <div className="px-6 py-5 border-b border-[#222222] flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold">
                Digital Twin — Clinical Vitals
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Latest clinical measurements recorded by
                nursing staff
              </p>

            </div>

            {clinicalLoading ? (

              <div className="flex items-center gap-2 text-sm text-gray-500">

                <RefreshCw className="w-4 h-4 animate-spin" />

                Loading

              </div>

            ) : clinicalError ? (

              <div className="text-xs text-orange-400">
                Clinical data unavailable
              </div>

            ) : (

              <div className="flex items-center gap-2 text-xs text-emerald-400">

                <CheckCircle className="w-4 h-4" />

                Latest data loaded

              </div>

            )}

          </div>

          <div className="p-6">

            {clinicalError ? (

              <div className="border border-orange-500/30 bg-orange-500/5 rounded-xl p-5 text-orange-300 text-sm">
                {clinicalError}
              </div>

            ) : (

              <>

                {/* VITALS */}

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">

                  <VitalDisplay
                    icon={
                      <HeartPulse className="w-4 h-4" />
                    }
                    label="Heart Rate"
                    value={
                      vitals.heart_rate
                    }
                    unit="bpm"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Systolic BP"
                    value={
                      vitals.systolic_bp
                    }
                    unit="mmHg"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Diastolic BP"
                    value={
                      vitals.diastolic_bp
                    }
                    unit="mmHg"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="MAP"
                    value={vitals.map}
                    unit="mmHg"
                  />

                  <VitalDisplay
                    icon={
                      <Wind className="w-4 h-4" />
                    }
                    label="Respiratory Rate"
                    value={
                      vitals.respiratory_rate
                    }
                    unit="/min"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Temperature"
                    value={
                      vitals.temperature
                    }
                    unit="°C"
                  />

                  <VitalDisplay
                    icon={
                      <Droplets className="w-4 h-4" />
                    }
                    label="SpO₂"
                    value={vitals.spo2}
                    unit="%"
                  />

                  <VitalDisplay
                    icon={
                      <Droplets className="w-4 h-4" />
                    }
                    label="Urine Output"
                    value={
                      vitals.urine_output
                    }
                    unit="mL/hr"
                  />

                  <VitalDisplay
                    icon={
                      <Brain className="w-4 h-4" />
                    }
                    label="GCS"
                    value={vitals.gcs}
                    unit="/15"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="WBC"
                    value={vitals.wbc}
                    unit="×10³/µL"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Platelets"
                    value={
                      vitals.platelets
                    }
                    unit="×10³/µL"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Creatinine"
                    value={
                      vitals.creatinine
                    }
                    unit="mg/dL"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Bilirubin"
                    value={
                      vitals.bilirubin
                    }
                    unit="mg/dL"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Lactate"
                    value={
                      vitals.lactate
                    }
                    unit="mmol/L"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="CRP"
                    value={vitals.crp}
                    unit="mg/L"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Procalcitonin"
                    value={
                      vitals.procalcitonin
                    }
                    unit="ng/mL"
                  />

                  <VitalDisplay
                    icon={
                      <Activity className="w-4 h-4" />
                    }
                    label="Glucose"
                    value={
                      vitals.glucose
                    }
                    unit="mg/dL"
                  />

                </div>

                {/* FLAGS */}

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">

                  <FlagDisplay
                    label="Vasopressor"
                    value={
                      vitals.vasopressor
                    }
                  />

                  <FlagDisplay
                    label="Mechanical Ventilation"
                    value={
                      vitals.mechanical_ventilation
                    }
                  />

                  <FlagDisplay
                    label="Antibiotic Given"
                    value={
                      vitals.antibiotic_given
                    }
                  />

                  <FlagDisplay
                    label="Fluid Given"
                    value={
                      vitals.fluid_given
                    }
                  />

                </div>

                {/* PREDICT BUTTON */}

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">

                  <button
                    onClick={predictRisk}
                    disabled={predicting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >

                    {predicting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />

                        Running AI Prediction...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />

                        Predict Sepsis & Organ Risk
                      </>
                    )}

                  </button>

                  {predictionError && (
                    <div className="text-sm text-red-400">
                      {predictionError}
                    </div>
                  )}

                </div>

              </>
            )}

          </div>
        </section>

        {/* =================================================
            DIGITAL TWIN SIMULATION
            FUNCTIONALITY PRESERVED
        ================================================= */}

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
            prediction?.sepsis?.probability ??
            null
          }

          organRisks={
            prediction?.organ_risks
          }
        />

        {/* =================================================
            AI RESULTS
        ================================================= */}

        <section className="border border-[#222222] rounded-2xl bg-[#080808] overflow-hidden">

          <div className="px-6 py-5 border-b border-[#222222]">

            <h2 className="text-lg font-semibold">
              AI Clinical Risk Results
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Machine-learning based risk assessment
            </p>

          </div>

          <div className="p-6 space-y-8">

            {/* =================================================
                SEPSIS PREDICTION
            ================================================= */}

            <div>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Sepsis Prediction
              </h3>

              {prediction?.sepsis ? (

                <ResultCard
                  title="Sepsis Risk"
                  prediction={
                    prediction.sepsis.prediction
                  }
                  probability={
                    prediction.sepsis.probability
                  }
                  riskLevel={
                    prediction.sepsis.risk_level
                  }
                />

              ) : (

                <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-6 text-center text-gray-500">
                  Run AI prediction to view sepsis risk.
                </div>

              )}

            </div>

            {/* =================================================
                ORGAN-WISE RISK
            ================================================= */}

            <div>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Organ-wise Risk
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                <OrganCard
                  title="Kidney"
                  icon={
                    <Droplets className="w-5 h-5" />
                  }
                  result={
                    prediction?.organ_risks?.kidney
                  }
                />

                <OrganCard
                  title="Liver"
                  icon={
                    <Activity className="w-5 h-5" />
                  }
                  result={
                    prediction?.organ_risks?.liver
                  }
                />

                <OrganCard
                  title="Lung"
                  icon={
                    <Wind className="w-5 h-5" />
                  }
                  result={
                    prediction?.organ_risks?.lung
                  }
                />

                <OrganCard
                  title="Cardiovascular"
                  icon={
                    <HeartPulse className="w-5 h-5" />
                  }
                  result={
                    prediction?.organ_risks
                      ?.cardiovascular
                  }
                />

              </div>
            </div>

            {/* =================================================
                PATIENT-SPECIFIC EXPLAINABLE AI
            ================================================= */}

            <div>

              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">

                <div>

                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Explainable AI — Clinical Feature Impact
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                    Patient-specific abnormal clinical
                    measurements that contributed to the
                    model&apos;s predicted sepsis risk.
                  </p>

                </div>

                {featureImpacts.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Top {featureImpacts.length} clinical impacts
                  </div>
                )}

              </div>

              {featureImpacts.length > 0 ? (

                <div className="space-y-4">

                  {featureImpacts.map(
                    (item, index) => {

                      const probabilityChange =
                        safeNumber(
                          item.probability_change
                        ) ?? 0;

                      const isPositive =
                        probabilityChange > 0.05;

                      const isNegative =
                        probabilityChange < -0.05;

                      const isMinimal =
                        !isPositive &&
                        !isNegative;

                      const formattedChange =
                        `${
                          probabilityChange >= 0
                            ? "+"
                            : ""
                        }${probabilityChange.toFixed(
                          1
                        )}%`;

                      const directionText =
                        item.direction ||
                        (
                          isPositive
                            ? "INCREASES MODEL-PREDICTED SEPSIS RISK"
                            : isNegative
                            ? "DECREASES MODEL-PREDICTED SEPSIS RISK"
                            : "MINIMAL MODEL IMPACT"
                        );

                      const directionClass =
                        isPositive
                          ? "text-red-400"
                          : isNegative
                          ? "text-emerald-400"
                          : "text-gray-400";

                      const changeBoxClass =
                        isPositive
                          ? "border-red-500/30 bg-red-500/5"
                          : isNegative
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-[#333333] bg-[#0d0d0d]";

                      const unit =
                        item.unit ||
                        featureUnit(
                          item.feature
                        );

                      const status = (
                        item.status ??
                        item.clinical_status ??
                        ""
                      ).toUpperCase();

                      return (
                        <div
                          key={`${item.feature}-${index}`}
                          className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-5"
                        >

                          <div className="flex flex-col xl:flex-row xl:items-center gap-5">

                            {/* FEATURE INFORMATION */}

                            <div className="flex-1 min-w-0">

                              <div className="flex flex-wrap items-center gap-3">

                                <h4 className="font-semibold text-white">
                                  {item.label ||
                                    featureLabel(
                                      item.feature
                                    )}
                                </h4>

                                <span
                                  className={`text-[11px] px-2 py-1 rounded-md border ${
                                    item.impact ===
                                    "HIGH IMPACT"
                                      ? "border-red-500/30 bg-red-500/5 text-red-400"
                                      : item.impact ===
                                        "MEDIUM IMPACT"
                                      ? "border-orange-500/30 bg-orange-500/5 text-orange-400"
                                      : "border-[#333333] text-gray-500"
                                  }`}
                                >
                                  {item.impact}
                                </span>

                                {status && (
                                  <span
                                    className={`text-[11px] px-2 py-1 rounded-md border ${featureStatusClass(
                                      status
                                    )}`}
                                  >
                                    {status}
                                  </span>
                                )}

                              </div>

                              {/* CURRENT PATIENT VALUE */}

                              <div className="mt-4 rounded-lg border border-[#222222] bg-black/40 p-4">

                                <div className="text-[11px] uppercase tracking-wider text-gray-500">
                                  Current Patient Value
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">

                                  <span className="text-2xl font-bold text-white">

                                    {item.value !==
                                      null &&
                                    item.value !==
                                      undefined
                                      ? String(
                                          item.value
                                        )
                                      : "—"}

                                  </span>

                                  {unit && (
                                    <span className="text-sm text-gray-500">
                                      {unit}
                                    </span>
                                  )}

                                </div>

                              </div>

                              {/* CLINICAL EXPLANATION */}

                              <div className="mt-4">

                                <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                                  Model Interpretation
                                </div>

                                <p
                                  className={`text-sm font-medium leading-relaxed ${directionClass}`}
                                >
                                  {item.explanation ||
                                    `${
                                      item.label ||
                                      featureLabel(
                                        item.feature
                                      )
                                    } ${
                                      isPositive
                                        ? "increases"
                                        : isNegative
                                        ? "decreases"
                                        : "has minimal impact on"
                                    } model-predicted sepsis risk.`}
                                </p>

                              </div>

                            </div>

                            {/* PROBABILITY CHANGE */}

                            <div
                              className={`xl:w-64 shrink-0 rounded-xl border p-5 ${changeBoxClass}`}
                            >

                              <div className="text-[11px] uppercase tracking-wider text-gray-500">
                                Predicted Probability Change
                              </div>

                              <div
                                className={`text-3xl font-bold mt-2 ${directionClass}`}
                              >
                                {formattedChange}
                              </div>

                              <div
                                className={`text-xs font-semibold mt-2 ${directionClass}`}
                              >
                                {directionText}
                              </div>

                              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                                Percentage-point change in
                                the model&apos;s predicted
                                sepsis probability based on
                                this clinical feature.
                              </p>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              ) : (

                <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-6">

                  <div className="flex items-start gap-4">

                    <div className="p-2 rounded-lg bg-[#151515]">

                      <ShieldAlert className="w-5 h-5 text-gray-500" />

                    </div>

                    <div>

                      <h4 className="font-medium text-gray-300">
                        Clinical feature impact unavailable
                      </h4>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Run the AI prediction first. The
                        explanation requires the trained
                        sepsis model and the patient&apos;s
                        current vital signs and laboratory
                        values.
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* =================================================
                  EXPLANATION
              ================================================= */}

              {featureImpacts.length > 0 && (

                <div className="mt-5 border border-cyan-500/20 bg-cyan-500/5 rounded-xl p-5">

                  <div className="flex items-start gap-3">

                    <Activity className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />

                    <div>

                      <h4 className="text-sm font-semibold text-cyan-300">
                        How to interpret this explanation
                      </h4>

                      <div className="mt-3 space-y-2 text-sm text-gray-400 leading-relaxed">

                        <p>
                          <span className="text-red-400 font-medium">
                            Positive %
                          </span>{" "}
                          means the current clinical
                          measurement increases the model&apos;s
                          predicted sepsis probability.
                        </p>

                        <p>
                          <span className="text-emerald-400 font-medium">
                            Negative %
                          </span>{" "}
                          means the current clinical
                          measurement decreases the model&apos;s
                          predicted sepsis probability.
                        </p>

                        <p>
                          For example,{" "}
                          <span className="text-gray-300 font-medium">
                            Lactate 5.5 mmol/L → +21.0%
                          </span>{" "}
                          means the model&apos;s predicted
                          probability changes by 21 percentage
                          points based on that feature comparison.
                        </p>

                        <p>
                          The{" "}
                          <span className="text-gray-300">
                            percentage
                          </span>{" "}
                          represents a change in predicted
                          probability. It does{" "}
                          <span className="text-gray-300">
                            NOT
                          </span>{" "}
                          mean that the clinical measurement
                          itself changed by that percentage.
                        </p>

                        <p>
                          These explanations describe{" "}
                          <span className="text-gray-300">
                            model behaviour
                          </span>{" "}
                          and should not be interpreted as
                          causation, diagnosis, or a treatment
                          recommendation.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* DISCLAIMER */}

              <div className="mt-4 text-xs text-gray-600 leading-relaxed">

                This patient-specific explanation shows how
                selected vital signs and laboratory measurements
                affect the model&apos;s predicted sepsis probability.
                Percentages represent model probability changes,
                not clinical measurement changes or causal effects.

              </div>

            </div>

          </div>
        </section>

      </main>

    </div>
  );
}

// =====================================================
// INFO COMPONENT
// =====================================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-4">

      <div className="text-[11px] uppercase tracking-wider text-gray-500">
        {label}
      </div>

      <div className="mt-2 text-sm font-medium text-white">
        {value || "—"}
      </div>

    </div>
  );
}

// =====================================================
// VITAL DISPLAY
// =====================================================

function VitalDisplay({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-4">

      <div className="flex items-center gap-2 text-gray-500">

        {icon}

        <span className="text-[11px] uppercase tracking-wider">
          {label}
        </span>

      </div>

      <div className="mt-3 flex items-baseline gap-1">

        <span className="text-lg font-semibold text-white">

          {value !== null &&
          value !== undefined
            ? value
            : "—"}

        </span>

        {value !== null &&
          value !== undefined && (

            <span className="text-[11px] text-gray-500">
              {unit}
            </span>

          )}

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
  value: number;
}) {
  const enabled =
    Number(value) === 1;

  return (
    <div
      className={`border rounded-xl p-4 ${
        enabled
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-[#222222] bg-[#0b0b0b]"
      }`}
    >

      <div className="text-[11px] uppercase tracking-wider text-gray-500">
        {label}
      </div>

      <div
        className={`mt-2 text-sm font-semibold ${
          enabled
            ? "text-orange-400"
            : "text-gray-400"
        }`}
      >
        {enabled ? "YES" : "NO"}
      </div>

    </div>
  );
}

// =====================================================
// RESULT CARD
// =====================================================

function ResultCard({
  title,
  prediction,
  probability,
  riskLevel,
}: {
  title: string;
  prediction: string | number | null;
  probability: number;
  riskLevel: string;
}) {
  const probabilityValue =
    probabilityPercent(probability);

  const predictionText =
    getPredictionText(prediction);

  return (
    <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        <div>

          <div className="text-xs uppercase tracking-wider text-gray-500">
            {title}
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {predictionText}
          </div>

          <div
            className={`inline-flex mt-3 px-3 py-1.5 rounded-lg border text-xs font-semibold ${riskClass(
              riskLevel
            )}`}
          >
            {String(
              riskLevel || "UNKNOWN"
            ).toUpperCase()}
          </div>

        </div>

        <div className="md:text-right">

          <div className="text-xs uppercase tracking-wider text-gray-500">
            Probability
          </div>

          <div className="mt-1 text-4xl font-bold text-cyan-400">

            {probabilityValue !== null
              ? `${probabilityValue.toFixed(1)}%`
              : "—"}

          </div>

        </div>

      </div>

      <div className="mt-6">

        <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">

          <div
            className="h-full bg-cyan-400 rounded-full transition-all"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  probabilityValue ?? 0
                )
              )}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

// =====================================================
// ORGAN CARD
// =====================================================

function OrganCard({
  title,
  icon,
  result,
}: {
  title: string;
  icon: React.ReactNode;
  result?: OrganRisk;
}) {
  // ---------------------------------------------------
  // NO RESULT
  // ---------------------------------------------------

  if (!result) {
    return (
      <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-5">

        <div className="flex items-center gap-3 text-gray-400">

          {icon}

          <span className="font-semibold">
            {title}
          </span>

        </div>

        <p className="mt-4 text-sm text-gray-600">
          No prediction available.
        </p>

      </div>
    );
  }

  // ---------------------------------------------------
  // SAFE PREDICTION CONVERSION
  //
  // FIX:
  // result.prediction?.toUpperCase()
  //
  // Backend:
  // prediction: 1
  // ---------------------------------------------------

  const normalizedPrediction =
    getPredictionText(
      result.prediction
    );

  // ---------------------------------------------------
  // UNKNOWN / NOT AVAILABLE
  // ---------------------------------------------------

  if (
    normalizedPrediction ===
      "NOT_AVAILABLE" ||
    normalizedPrediction ===
      "UNKNOWN"
  ) {
    return (
      <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-5">

        <div className="flex items-center gap-3 text-gray-400">

          {icon}

          <span className="font-semibold">
            {title}
          </span>

        </div>

        <p className="mt-4 text-sm text-gray-500">
          Organ prediction unavailable.
        </p>

        {result.missing_features &&
          result.missing_features.length >
            0 && (

            <div className="mt-3 text-xs text-gray-600">

              Missing:{" "}

              {result.missing_features.join(
                ", "
              )}

            </div>

          )}

      </div>
    );
  }

  // ---------------------------------------------------
  // PROBABILITY
  // ---------------------------------------------------

  const probability =
    probabilityPercent(
      result.probability
    );

  // ---------------------------------------------------
  // DISPLAY
  // ---------------------------------------------------

  return (
    <div className="border border-[#222222] bg-[#0b0b0b] rounded-xl p-5">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-3 text-gray-300">

          {icon}

          <span className="font-semibold">
            {title}
          </span>

        </div>

        <span
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${riskClass(
            result.risk_level
          )}`}
        >
          {String(
            result.risk_level ||
              "UNKNOWN"
          ).toUpperCase()}
        </span>

      </div>

      <div className="mt-5">

        <div className="text-xs uppercase tracking-wider text-gray-500">
          Prediction
        </div>

        <div className="mt-1 text-lg font-semibold text-white">
          {normalizedPrediction}
        </div>

      </div>

      {probability !== null && (

        <div className="mt-5">

          <div className="flex items-center justify-between text-xs">

            <span className="text-gray-500">
              Probability
            </span>

            <span className="text-gray-300 font-medium">
              {probability.toFixed(1)}%
            </span>

          </div>

          <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">

            <div
              className="h-full bg-cyan-400 rounded-full transition-all"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    probability
                  )
                )}%`,
              }}
            />

          </div>

        </div>

      )}

      {result.error && (
        <div className="mt-4 text-xs text-red-400">
          {result.error}
        </div>
      )}

    </div>
  );
}