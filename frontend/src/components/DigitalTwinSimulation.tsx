import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Droplets,
  FlaskConical,
  HeartPulse,
  Info,
  RotateCcw,
  ShieldAlert,
  Thermometer,
  Wind,
} from "lucide-react";

import {
  useState,
  type ReactNode,
} from "react";

import DigitalTwin3D from "./DigitalTwin3D";

// =====================================================
// TYPES
// =====================================================

interface SHAPFactor {
  feature?: string;
  impact?: number | string | null;
}

interface SimulationVitals {
  heartRate?: number | string | null;
  systolicBP?: number | string | null;
  diastolicBP?: number | string | null;
  map?: number | string | null;
  respiratoryRate?: number | string | null;
  temperature?: number | string | null;
  spo2?: number | string | null;

  wbc?: number | string | null;
  lactate?: number | string | null;
  creatinine?: number | string | null;
  bilirubin?: number | string | null;
  gcs?: number | string | null;
  urineOutput?: number | string | null;
}

interface OrganRisk {
  prediction?: string | null;
  probability?: number | string | null;
  risk_level?: string | null;
  shap_factors?: SHAPFactor[] | null;
}

interface DigitalTwinSimulationProps {
  vitals?: SimulationVitals | null;

  antibioticSuitability?:
    | number
    | string
    | null;

  organRisks?: {
    kidney?: OrganRisk | null;
    liver?: OrganRisk | null;
    lung?: OrganRisk | null;
    cardiovascular?: OrganRisk | null;
  } | null;
}

interface SimulatedVitals {
  heartRate: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  map: number | null;
  lactate: number | null;
  urineOutput: number | null;
}

// =====================================================
// MAIN
// =====================================================

export default function DigitalTwinSimulation({
  vitals,
  antibioticSuitability,
  organRisks,
}: DigitalTwinSimulationProps) {
  // ===================================================
  // STATE
  // ===================================================

  const [customAntibiotic, setCustomAntibiotic] =
    useState("");

  const [simulationHours, setSimulationHours] =
    useState(24);

  const [simulatedVitals, setSimulatedVitals] =
    useState<SimulatedVitals | null>(null);

  const [simulating, setSimulating] =
    useState(false);

  const [simulationComplete, setSimulationComplete] =
    useState(false);

  // ===================================================
  // BASELINE
  // ===================================================

  const baseline: SimulatedVitals = {
    heartRate: toNumber(vitals?.heartRate),

    spo2: toNumber(vitals?.spo2),

    respiratoryRate: toNumber(
      vitals?.respiratoryRate
    ),

    temperature: toNumber(
      vitals?.temperature
    ),

    map: toNumber(vitals?.map),

    lactate: toNumber(
      vitals?.lactate
    ),

    urineOutput: toNumber(
      vitals?.urineOutput
    ),
  };

  // ===================================================
  // SIMULATION
  // ===================================================

  function runSimulation() {
    setSimulating(true);
    setSimulationComplete(false);

    window.setTimeout(() => {
      const simulated: SimulatedVitals = {
        heartRate: simulateHeartRate(
          baseline.heartRate,
          simulationHours
        ),

        spo2: simulateSpO2(
          baseline.spo2,
          simulationHours
        ),

        respiratoryRate:
          simulateRespiratoryRate(
            baseline.respiratoryRate,
            simulationHours
          ),

        temperature:
          simulateTemperature(
            baseline.temperature,
            simulationHours
          ),

        map: simulateMap(
          baseline.map,
          simulationHours
        ),

        lactate: simulateLactate(
          baseline.lactate,
          simulationHours
        ),

        urineOutput:
          simulateUrineOutput(
            baseline.urineOutput,
            simulationHours
          ),
      };

      setSimulatedVitals(simulated);
      setSimulating(false);
      setSimulationComplete(true);
    }, 800);
  }

  // ===================================================
  // RESET
  // ===================================================

  function resetSimulation() {
    setCustomAntibiotic("");
    setSimulatedVitals(null);
    setSimulationComplete(false);
    setSimulating(false);
    setSimulationHours(24);
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black">

      {/* ================================================= */}
      {/* 1. VIRTUAL HUMAN DIGITAL TWIN */}
      {/* ================================================= */}

      <div className="border-b border-white/10 p-6">

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Virtual Human Digital Twin
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Click the organs to inspect physiological
            values, AI risk and SHAP explanation.
          </p>

        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ================================================= */}
          {/* HUMAN */}
          {/* ================================================= */}

          <div className="flex min-h-[620px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">

            <DigitalTwin3D
              vitals={vitals}
              organRisks={organRisks}
              simulatedVitals={simulatedVitals}
              simulated={simulationComplete}
              antibioticSuitability={
                antibioticSuitability
              }
            />

          </div>

          {/* ================================================= */}
          {/* VITAL CARDS */}
          {/* ================================================= */}

          <div className="lg:col-span-2">

            <div className="grid gap-4 sm:grid-cols-2">

              <ComparisonCard
                icon={<HeartPulse size={20} />}
                label="Heart Rate"
                current={baseline.heartRate}
                simulated={
                  simulatedVitals?.heartRate ?? null
                }
                unit="bpm"
              />

              <ComparisonCard
                icon={<Wind size={20} />}
                label="SpO₂"
                current={baseline.spo2}
                simulated={
                  simulatedVitals?.spo2 ?? null
                }
                unit="%"
              />

              <ComparisonCard
                icon={<Wind size={20} />}
                label="Respiratory Rate"
                current={
                  baseline.respiratoryRate
                }
                simulated={
                  simulatedVitals?.respiratoryRate ??
                  null
                }
                unit="/min"
              />

              <ComparisonCard
                icon={<Thermometer size={20} />}
                label="Temperature"
                current={
                  baseline.temperature
                }
                simulated={
                  simulatedVitals?.temperature ??
                  null
                }
                unit="°C"
              />

              <ComparisonCard
                icon={<Activity size={20} />}
                label="MAP"
                current={baseline.map}
                simulated={
                  simulatedVitals?.map ?? null
                }
                unit="mmHg"
              />

              <ComparisonCard
                icon={<FlaskConical size={20} />}
                label="Lactate"
                current={baseline.lactate}
                simulated={
                  simulatedVitals?.lactate ??
                  null
                }
                unit="mmol/L"
              />

              <ComparisonCard
                icon={<Droplets size={20} />}
                label="Urine Output"
                current={
                  baseline.urineOutput
                }
                simulated={
                  simulatedVitals?.urineOutput ??
                  null
                }
                unit="mL/hr"
              />

              <ComparisonCard
                icon={<Activity size={20} />}
                label="Simulation"
                current={null}
                simulated={
                  simulationComplete
                    ? simulationHours
                    : null
                }
                unit={
                  simulationComplete
                    ? "hours"
                    : ""
                }
              />

            </div>

          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* 2. DIGITAL TWIN TREATMENT SIMULATION */}
      {/* ================================================= */}

      <div className="border-b border-white/10 p-6">

        <div className="mb-6">

          <div className="flex items-start gap-3">

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <Activity
                size={24}
                className="text-white"
              />
            </div>

            <div>

              <h2 className="text-xl font-bold text-white">
                Digital Twin Treatment Simulation
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Enter an antibiotic scenario and select
                a hypothetical simulation period.
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* SAFETY */}
        {/* ================================================= */}

        <div className="mb-6 flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4">

          <Info
            size={20}
            className="mt-0.5 shrink-0 text-white"
          />

          <div>

            <p className="text-sm font-semibold text-white">
              Simulation only
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-400">
              This interface records a clinician-entered
              antibiotic scenario and visualizes hypothetical
              physiological changes. It does not prescribe
              treatment or calculate medication dosage.
            </p>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ================================================= */}
          {/* TREATMENT */}
          {/* ================================================= */}

          <div className="rounded-2xl border border-white/10 bg-black p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                <ShieldAlert
                  size={20}
                  className="text-white"
                />
              </div>

              <div>

                <h3 className="font-bold text-white">
                  Treatment Scenario
                </h3>

                <p className="text-xs text-gray-500">
                  Enter the antibiotic name.
                </p>

              </div>

            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Antibiotic Name
            </label>

            <input
              type="text"
              value={customAntibiotic}
              onChange={(event) =>
                setCustomAntibiotic(
                  event.target.value
                )
              }
              placeholder="Enter antibiotic name"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white focus:ring-1 focus:ring-white"
            />

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">

              <p className="text-[10px] uppercase tracking-wide text-gray-600">
                Current Scenario
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {customAntibiotic.trim()
                  ? customAntibiotic.trim()
                  : "No antibiotic entered"}
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* TIMELINE */}
          {/* ================================================= */}

          <div className="rounded-2xl border border-white/10 bg-black p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                <Activity
                  size={20}
                  className="text-white"
                />
              </div>

              <div>

                <h3 className="font-bold text-white">
                  Simulation Timeline
                </h3>

                <p className="text-xs text-gray-500">
                  Select the observation window.
                </p>

              </div>

            </div>

            <div className="grid grid-cols-3 gap-3">

              {[6, 12, 24].map(
                (hours) => {
                  const selected =
                    simulationHours ===
                    hours;

                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() =>
                        setSimulationHours(
                          hours
                        )
                      }
                      className={`rounded-xl border p-4 font-semibold transition ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {hours}h
                    </button>
                  );
                }
              )}

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={runSimulation}
                disabled={simulating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {simulating ? (
                  <>
                    <Activity
                      size={18}
                      className="animate-spin"
                    />

                    Simulating...
                  </>
                ) : (
                  <>
                    <ChevronRight
                      size={18}
                    />

                    Run Simulation
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={resetSimulation}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-5 py-3 font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
              >

                <RotateCcw size={18} />

                Reset

              </button>

            </div>

          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* 3. ANTIBIOTIC SUITABILITY */}
      {/* ================================================= */}

      <div className="border-b border-white/10 p-6">

        <div className="mb-5">

          <h3 className="text-lg font-bold text-white">
            Antibiotic Suitability
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Patient-specific suitability percentage from
            the backend model.
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-500">
                Antibiotic
              </p>

              <p className="mt-1 text-xl font-bold text-white">
                {customAntibiotic.trim()
                  ? customAntibiotic.trim()
                  : "No antibiotic entered"}
              </p>

            </div>

            <div className="text-left md:text-right">

              <p className="text-xs uppercase tracking-wide text-gray-500">
                Suitability
              </p>

              <p className="mt-1 text-4xl font-bold text-white">
                {formatSuitability(
                  antibioticSuitability
                )}
              </p>

            </div>

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{
                width: `${getSuitabilityPercent(
                  antibioticSuitability
                )}%`,
              }}
            />

          </div>

          <div className="mt-3 flex justify-between text-[10px] text-gray-600">

            <span>0%</span>

            <span>Model Output</span>

            <span>100%</span>

          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <div className="bg-black p-5">

        <div className="flex gap-3">

          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-white"
          />

          <p className="text-xs leading-5 text-gray-500">
            Antibiotic suitability should be generated
            from validated patient data and an appropriately
            trained model. This interface is a software
            visualization and does not independently
            prescribe treatment.
          </p>

        </div>

      </div>

    </section>
  );
}

// =====================================================
// ANIMATED HUMAN
// =====================================================

function AnimatedHuman({
  vitals,
  organRisks,
  simulated,
}: {
  vitals: SimulatedVitals;

  organRisks?: {
    kidney?: OrganRisk | null;
    liver?: OrganRisk | null;
    lung?: OrganRisk | null;
    cardiovascular?: OrganRisk | null;
  } | null;

  simulated: boolean;
}) {
  const [selectedOrgan, setSelectedOrgan] =
    useState<
      | "brain"
      | "heart"
      | "lungs"
      | "liver"
      | "kidneys"
      | null
    >(null);

  // ===================================================
  // RISK
  // ===================================================

  const heartRisk =
    organRisks?.cardiovascular
      ?.risk_level ?? undefined;

  const lungRisk =
    organRisks?.lung?.risk_level ??
    undefined;

  const kidneyRisk =
    organRisks?.kidney?.risk_level ??
    undefined;

  const liverRisk =
    organRisks?.liver?.risk_level ??
    undefined;

  const heartColor =
    getOrganColor(heartRisk);

  const lungColor =
    getOrganColor(lungRisk);

  const kidneyColor =
    getOrganColor(kidneyRisk);

  const liverColor =
    getOrganColor(liverRisk);

  // ===================================================
  // SAFE VITALS
  // ===================================================

  const heartRate =
    toNumber(vitals.heartRate);

  const spo2 =
    toNumber(vitals.spo2);

  const respiratoryRate =
    toNumber(
      vitals.respiratoryRate
    );

  const temperature =
    toNumber(vitals.temperature);

  const map =
    toNumber(vitals.map);

  // ===================================================
  // ABNORMAL
  // ===================================================

  const heartAbnormal =
    heartRate !== null &&
    (heartRate > 100 ||
      heartRate < 60);

  const spo2Abnormal =
    spo2 !== null &&
    spo2 < 94;

  const rrAbnormal =
    respiratoryRate !== null &&
    (respiratoryRate > 20 ||
      respiratoryRate < 12);

  const tempAbnormal =
    temperature !== null &&
    (temperature > 37.5 ||
      temperature < 36);

  const mapAbnormal =
    map !== null &&
    map < 65;

  const compromisedFlow =
    heartAbnormal ||
    spo2Abnormal ||
    mapAbnormal;

  const bloodFlowDuration =
    compromisedFlow
      ? "2.4s"
      : "1.2s";

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="relative flex h-[620px] w-full items-center justify-center overflow-hidden">

      {/* STATE */}

      <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2">

        <div className="rounded-xl border border-white/10 bg-black/95 px-4 py-2 text-center shadow-xl">

          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Patient Digital Twin
          </p>

          <p className="mt-1 text-xs font-bold text-white">
            {simulated
              ? "SIMULATED STATE"
              : "CURRENT STATE"}
          </p>

        </div>

      </div>

      {/* LEFT VITALS */}

      <div className="absolute left-1 top-[105px] z-30 space-y-2">

        <VitalBadge
          label="Heart Rate"
          value={
            heartRate !== null
              ? String(heartRate)
              : "—"
          }
          unit="bpm"
          abnormal={heartAbnormal}
        />

        <VitalBadge
          label="MAP"
          value={
            map !== null
              ? String(map)
              : "—"
          }
          unit="mmHg"
          abnormal={mapAbnormal}
        />

      </div>

      {/* RIGHT VITALS */}

      <div className="absolute right-1 top-[105px] z-30 space-y-2">

        <VitalBadge
          label="SpO₂"
          value={
            spo2 !== null
              ? String(spo2)
              : "—"
          }
          unit="%"
          abnormal={spo2Abnormal}
        />

        <VitalBadge
          label="Respiratory"
          value={
            respiratoryRate !== null
              ? String(
                  respiratoryRate
                )
              : "—"
          }
          unit="/min"
          abnormal={rrAbnormal}
        />

      </div>

      {/* TEMPERATURE */}

      <div className="absolute bottom-[45px] left-1/2 z-30 -translate-x-1/2">

        <VitalBadge
          label="Temperature"
          value={
            temperature !== null
              ? temperature.toFixed(1)
              : "—"
          }
          unit="°C"
          abnormal={tempAbnormal}
          center
        />

      </div>

      {/* ================================================= */}
      {/* SVG */}
      {/* ================================================= */}

      <svg
        viewBox="0 0 500 760"
        className="h-[520px] w-[320px]"
        xmlns="http://www.w3.org/2000/svg"
      >

        <defs>

          <linearGradient
            id="dtBodyGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >

            <stop
              offset="0%"
              stopColor="#ffffff"
            />

            <stop
              offset="45%"
              stopColor="#d4d4d4"
            />

            <stop
              offset="100%"
              stopColor="#525252"
            />

          </linearGradient>

          <linearGradient
            id="dtInnerBody"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="0%"
              stopColor="#404040"
            />

            <stop
              offset="100%"
              stopColor="#000000"
            />

          </linearGradient>

          <radialGradient
            id="dtHeartGradient"
          >

            <stop
              offset="0%"
              stopColor="#ffffff"
            />

            <stop
              offset="70%"
              stopColor="#d4d4d4"
            />

            <stop
              offset="100%"
              stopColor="#404040"
            />

          </radialGradient>

          <filter
            id="dtOrganGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >

            <feGaussianBlur
              stdDeviation="6"
              result="blur"
            />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

          <filter
            id="dtBloodGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >

            <feGaussianBlur
              stdDeviation="2"
              result="blur"
            />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

        </defs>

        {/* ================================================= */}
        {/* HEAD */}
        {/* ================================================= */}

        <ellipse
          cx="250"
          cy="93"
          rx="65"
          ry="74"
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="4"
        />

        {/* EARS */}

        <ellipse
          cx="185"
          cy="102"
          rx="9"
          ry="18"
          fill="#737373"
        />

        <ellipse
          cx="315"
          cy="102"
          rx="9"
          ry="18"
          fill="#737373"
        />

        {/* FACE */}

        <path
          d="
            M220 90
            Q250 76 280 90

            M226 117
            Q250 130 274 117

            M244 101
            Q250 108 256 101
          "
          fill="none"
          stroke="#d4d4d4"
          strokeWidth="2"
          opacity="0.45"
        />

        {/* ================================================= */}
        {/* BRAIN */}
        {/* ================================================= */}

        <g
          onClick={() =>
            setSelectedOrgan("brain")
          }
          style={{
            cursor: "pointer",
          }}
          className={
            spo2Abnormal
              ? "animate-pulse"
              : ""
          }
        >

          <path
            d="
              M215 98
              C202 78 215 58 235 65
              C247 51 275 58 279 80
              C295 91 283 114 265 112
              C256 127 233 124 228 110
              C214 117 204 106 215 98
            "
            fill="#ffffff"
            fillOpacity="0.10"
            stroke="#ffffff"
            strokeWidth="3"
          />

          <path
            d="
              M228 72
              C238 83 230 90 242 95
              C251 100 242 110 253 113
              C263 115 267 104 272 96

              M241 66
              C249 76 257 77 261 67
            "
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="2"
            opacity="0.65"
          />

        </g>

        {/* ================================================= */}
        {/* NECK */}
        {/* ================================================= */}

        <path
          d="
            M226 155
            L226 202
            Q250 218 274 202
            L274 155
            Z
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="4"
        />

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <path
          d="
            M185 194
            Q150 201 130 242
            L108 332
            Q103 353 117 364
            L157 347
            L174 467
            Q188 490 250 495
            Q312 490 326 467
            L343 347
            L383 364
            Q397 353 392 332
            L370 242
            Q350 201 315 194
            Q286 213 250 218
            Q214 213 185 194
            Z
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="5"
        />

        {/* INNER BODY */}

        <path
          d="
            M204 228
            Q250 242 296 228
            L311 337
            Q294 350 250 354
            Q206 350 189 337
            Z
          "
          fill="url(#dtInnerBody)"
          opacity="0.65"
        />

        {/* ================================================= */}
        {/* LEFT ARM */}
        {/* ================================================= */}

        <path
          d="
            M145 225
            L106 336
            L70 466
            Q65 485 82 492
            Q98 498 106 478
            L147 379
            L184 268
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="5"
        />

        {/* RIGHT ARM */}

        <path
          d="
            M355 225
            L394 336
            L430 466
            Q435 485 418 492
            Q402 498 394 478
            L353 379
            L316 268
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="5"
        />

        {/* ================================================= */}
        {/* LEFT LEG */}
        {/* ================================================= */}

        <path
          d="
            M174 465
            L170 690
            Q170 710 190 713
            Q208 713 211 691
            L250 495
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="5"
        />

        {/* RIGHT LEG */}

        <path
          d="
            M326 465
            L330 690
            Q330 710 310 713
            Q292 713 289 691
            L250 495
          "
          fill="url(#dtBodyGradient)"
          stroke="#ffffff"
          strokeWidth="5"
        />

        {/* ================================================= */}
        {/* LUNGS */}
        {/* ================================================= */}

        <g
          onClick={() =>
            setSelectedOrgan("lungs")
          }
          style={{
            cursor: "pointer",
          }}
          className={
            isAbnormal(lungRisk)
              ? "animate-pulse"
              : ""
          }
        >

          <path
            d="
              M242 244
              C216 220 180 231 176 275
              L180 328
              C188 348 219 344 242 317
              Z
            "
            fill={lungColor}
            fillOpacity="0.25"
            stroke={lungColor}
            strokeWidth="5"
            filter={
              isAbnormal(lungRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

          <path
            d="
              M258 244
              C284 220 320 231 324 275
              L320 328
              C312 348 281 344 258 317
              Z
            "
            fill={lungColor}
            fillOpacity="0.25"
            stroke={lungColor}
            strokeWidth="5"
            filter={
              isAbnormal(lungRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

          <path
            d="
              M250 205
              L250 267
              M250 252
              L222 284
              M250 252
              L278 284
            "
            fill="none"
            stroke="#d4d4d4"
            strokeWidth="4"
          />

        </g>

        {/* ================================================= */}
        {/* HEART */}
        {/* ================================================= */}

        <g
          onClick={() =>
            setSelectedOrgan("heart")
          }
          style={{
            cursor: "pointer",
          }}
          className={
            heartAbnormal
              ? "animate-pulse"
              : ""
          }
        >

          <path
            d="
              M250 304
              C229 273 190 288 195 319
              C201 350 250 383 250 383
              C250 383 299 350 305 319
              C310 288 271 273 250 304
              Z
            "
            fill="url(#dtHeartGradient)"
            stroke={heartColor}
            strokeWidth="6"
            fillOpacity="0.82"
            filter={
              isAbnormal(heartRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

          <path
            d="
              M211 319
              L226 319
              L234 306
              L243 332
              L252 298
              L262 319
              L284 319
            "
            fill="none"
            stroke="#000000"
            strokeWidth="3"
          />

        </g>

        {/* ================================================= */}
        {/* AORTA */}
        {/* ================================================= */}

        <path
          d="
            M250 376
            C236 397 232 430 239 459

            M250 376
            C264 397 268 430 261 459
          "
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          opacity="0.8"
        />

        {/* ================================================= */}
        {/* ARTERIES */}
        {/* ================================================= */}

        <g
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.72"
        >

          <path
            d="
              M250 220
              L250 168
            "
          />

          <path
            d="
              M240 395
              C200 382 163 345 130 290
            "
          />

          <path
            d="
              M260 395
              C300 382 337 345 370 290
            "
          />

          <path
            d="
              M242 452
              L215 565
              L190 690
            "
          />

          <path
            d="
              M258 452
              L285 565
              L310 690
            "
          />

        </g>

        {/* ================================================= */}
        {/* LIVER */}
        {/* ================================================= */}

        <g
          onClick={() =>
            setSelectedOrgan("liver")
          }
          style={{
            cursor: "pointer",
          }}
          className={
            isAbnormal(liverRisk)
              ? "animate-pulse"
              : ""
          }
        >

          <path
            d="
              M170 372
              Q215 346 269 363
              Q315 374 300 411
              Q266 437 208 425
              Q170 414 170 372
              Z
            "
            fill={liverColor}
            fillOpacity="0.32"
            stroke={liverColor}
            strokeWidth="5"
            filter={
              isAbnormal(liverRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

        </g>

        {/* ================================================= */}
        {/* KIDNEYS */}
        {/* ================================================= */}

        <g
          onClick={() =>
            setSelectedOrgan("kidneys")
          }
          style={{
            cursor: "pointer",
          }}
          className={
            isAbnormal(kidneyRisk)
              ? "animate-pulse"
              : ""
          }
        >

          <path
            d="
              M198 413
              C171 402 157 425 166 450
              C175 475 200 473 210 450
              C215 435 211 418 198 413
              Z
            "
            fill={kidneyColor}
            fillOpacity="0.42"
            stroke={kidneyColor}
            strokeWidth="5"
            filter={
              isAbnormal(kidneyRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

          <path
            d="
              M302 413
              C329 402 343 425 334 450
              C325 475 300 473 290 450
              C285 435 289 418 302 413
              Z
            "
            fill={kidneyColor}
            fillOpacity="0.42"
            stroke={kidneyColor}
            strokeWidth="5"
            filter={
              isAbnormal(kidneyRisk)
                ? "url(#dtOrganGlow)"
                : undefined
            }
          />

        </g>

        {/* ================================================= */}
        {/* VEINS */}
        {/* ================================================= */}

        <g
          fill="none"
          stroke="#d4d4d4"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        >

          <path
            d="
              M198 452
              C215 478 235 503 250 527
            "
          />

          <path
            d="
              M302 452
              C285 478 265 503 250 527
            "
          />

          <path
            d="
              M250 527
              L250 411
            "
          />

          <path
            d="
              M250 527
              L250 650
            "
          />

        </g>

        {/* ================================================= */}
        {/* BLOOD FLOW */}
        {/* ================================================= */}

        <g filter="url(#dtBloodGlow)">

          <circle
            r="5"
            fill="#ffffff"
          >

            <animateMotion
              dur={bloodFlowDuration}
              repeatCount="indefinite"
              path="
                M250 365
                C250 305 250 230 250 168
              "
            />

          </circle>

          <circle
            r="5"
            fill="#ffffff"
          >

            <animateMotion
              dur={bloodFlowDuration}
              begin="0.2s"
              repeatCount="indefinite"
              path="
                M250 365
                C212 350 170 320 130 290
              "
            />

          </circle>

          <circle
            r="5"
            fill="#ffffff"
          >

            <animateMotion
              dur={bloodFlowDuration}
              begin="0.4s"
              repeatCount="indefinite"
              path="
                M250 365
                C288 350 330 320 370 290
              "
            />

          </circle>

          <circle
            r="5"
            fill="#ffffff"
          >

            <animateMotion
              dur={bloodFlowDuration}
              begin="0.6s"
              repeatCount="indefinite"
              path="
                M250 390
                C225 405 205 430 190 445
              "
            />

          </circle>

          <circle
            r="5"
            fill="#ffffff"
          >

            <animateMotion
              dur={bloodFlowDuration}
              begin="0.8s"
              repeatCount="indefinite"
              path="
                M250 390
                C275 405 295 430 310 445
              "
            />

          </circle>

        </g>

        {/* ================================================= */}
        {/* VENOUS RETURN */}
        {/* ================================================= */}

        <g opacity="0.8">

          <circle
            r="4"
            fill="#d4d4d4"
          >

            <animateMotion
              dur="1.8s"
              repeatCount="indefinite"
              path="
                M190 445
                C210 480 232 505 250 527
                C250 490 250 450 250 410
              "
            />

          </circle>

          <circle
            r="4"
            fill="#d4d4d4"
          >

            <animateMotion
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
              path="
                M310 445
                C290 480 268 505 250 527
                C250 490 250 450 250 410
              "
            />

          </circle>

        </g>

        {/* ================================================= */}
        {/* PERFUSION */}
        {/* ================================================= */}

        <circle
          cx="190"
          cy="445"
          r="18"
          fill="none"
          stroke={kidneyColor}
          strokeWidth="3"
          opacity="0.55"
          className={
            isAbnormal(kidneyRisk)
              ? "animate-ping"
              : ""
          }
        />

        <circle
          cx="310"
          cy="445"
          r="18"
          fill="none"
          stroke={kidneyColor}
          strokeWidth="3"
          opacity="0.55"
          className={
            isAbnormal(kidneyRisk)
              ? "animate-ping"
              : ""
          }
        />

      </svg>

      {/* ================================================= */}
      {/* ORGAN DETAILS */}
      {/* ================================================= */}

      {selectedOrgan && (
        <OrganDetailsPanel
          organ={selectedOrgan}
          vitals={vitals}
          organRisks={organRisks}
          onClose={() =>
            setSelectedOrgan(null)
          }
        />
      )}

      {/* ================================================= */}
      {/* BLOOD FLOW STATUS */}
      {/* ================================================= */}

      <div className="absolute bottom-2 right-1 z-30 rounded-xl border border-white/10 bg-black/95 px-3 py-2 shadow-xl">

        <div className="flex items-center gap-2">

          <span
            className={`h-2 w-2 rounded-full ${
              compromisedFlow
                ? "animate-pulse bg-white"
                : "bg-gray-500"
            }`}
          />

          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            Blood Flow
          </span>

        </div>

        <p
          className={`mt-1 text-xs font-bold ${
            compromisedFlow
              ? "text-white"
              : "text-gray-400"
          }`}
        >
          {compromisedFlow
            ? "COMPROMISED"
            : "NORMAL"}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// ORGAN DETAILS
// =====================================================

function OrganDetailsPanel({
  organ,
  vitals,
  organRisks,
  onClose,
}: {
  organ:
    | "brain"
    | "heart"
    | "lungs"
    | "liver"
    | "kidneys";

  vitals: SimulatedVitals;

  organRisks?: {
    kidney?: OrganRisk | null;
    liver?: OrganRisk | null;
    lung?: OrganRisk | null;
    cardiovascular?: OrganRisk | null;
  } | null;

  onClose: () => void;
}) {
  const riskData =
    organ === "heart"
      ? organRisks?.cardiovascular
      : organ === "lungs"
      ? organRisks?.lung
      : organ === "liver"
      ? organRisks?.liver
      : organ === "kidneys"
      ? organRisks?.kidney
      : undefined;

  const organName =
    organ === "kidneys"
      ? "Kidneys"
      : organ.charAt(0).toUpperCase() +
        organ.slice(1);

  const riskLevel =
    riskData?.risk_level ??
    (organ === "brain"
      ? "REFERENCE ONLY"
      : "UNKNOWN");

  const probability =
    formatSuitability(
      riskData?.probability
    );

  const heartRate =
    toNumber(vitals.heartRate);

  const spo2 =
    toNumber(vitals.spo2);

  const respiratoryRate =
    toNumber(
      vitals.respiratoryRate
    );

  const temperature =
    toNumber(vitals.temperature);

  const map =
    toNumber(vitals.map);

  const lactate =
    toNumber(vitals.lactate);

  const urineOutput =
    toNumber(
      vitals.urineOutput
    );

  let vitalItems: {
    label: string;
    value: string;
  }[] = [];

  switch (organ) {

    case "heart":

      vitalItems = [
        {
          label: "Heart Rate",
          value:
            heartRate !== null
              ? `${heartRate} bpm`
              : "N/A",
        },

        {
          label: "MAP",
          value:
            map !== null
              ? `${map} mmHg`
              : "N/A",
        },

        {
          label: "Lactate",
          value:
            lactate !== null
              ? `${lactate} mmol/L`
              : "N/A",
        },
      ];

      break;

    case "lungs":

      vitalItems = [
        {
          label: "SpO₂",
          value:
            spo2 !== null
              ? `${spo2}%`
              : "N/A",
        },

        {
          label: "Respiratory Rate",
          value:
            respiratoryRate !== null
              ? `${respiratoryRate}/min`
              : "N/A",
        },

        {
          label: "Temperature",
          value:
            temperature !== null
              ? `${temperature} °C`
              : "N/A",
        },
      ];

      break;

    case "liver":

      vitalItems = [
        {
          label: "Temperature",
          value:
            temperature !== null
              ? `${temperature} °C`
              : "N/A",
        },

        {
          label: "Lactate",
          value:
            lactate !== null
              ? `${lactate} mmol/L`
              : "N/A",
        },
      ];

      break;

    case "kidneys":

      vitalItems = [
        {
          label: "MAP",
          value:
            map !== null
              ? `${map} mmHg`
              : "N/A",
        },

        {
          label: "Urine Output",
          value:
            urineOutput !== null
              ? `${urineOutput} mL/hr`
              : "N/A",
        },
      ];

      break;

    case "brain":

      vitalItems = [
        {
          label: "SpO₂",
          value:
            spo2 !== null
              ? `${spo2}%`
              : "N/A",
        },

        {
          label: "MAP",
          value:
            map !== null
              ? `${map} mmHg`
              : "N/A",
        },
      ];

      break;
  }

  const shapFactors =
    Array.isArray(
      riskData?.shap_factors
    )
      ? riskData.shap_factors
      : [];

  return (
    <div className="absolute inset-x-2 bottom-14 z-40 max-h-[350px] overflow-y-auto rounded-2xl border border-white/20 bg-black/98 p-4 shadow-2xl backdrop-blur">

      {/* HEADER */}

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Selected Organ
          </p>

          <h4 className="mt-1 text-lg font-bold text-white">
            {organName}
          </h4>

        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:bg-white hover:text-black"
        >
          Close
        </button>

      </div>

      {/* RISK */}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

          <p className="text-[9px] uppercase tracking-wide text-gray-500">
            Risk Level
          </p>

          <p
            className={`mt-1 text-lg font-bold ${getRiskTextColor(
              riskLevel
            )}`}
          >
            {riskLevel}
          </p>

        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

          <p className="text-[9px] uppercase tracking-wide text-gray-500">
            Probability
          </p>

          <p className="mt-1 text-lg font-bold text-white">
            {probability}
          </p>

        </div>

      </div>

      {/* VITALS */}

      <div className="mt-4">

        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Organ-related Vitals
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">

          {vitalItems.map(
            (item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
              >

                <p className="text-[9px] text-gray-500">
                  {item.label}
                </p>

                <p className="mt-1 text-xs font-semibold text-white">
                  {item.value}
                </p>

              </div>
            )
          )}

        </div>

      </div>

      {/* SHAP */}

      <div className="mt-4">

        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          SHAP Factors
        </p>

        <div className="mt-2 space-y-2">

          {shapFactors.length > 0 ? (
            shapFactors
              .slice(0, 5)
              .map(
                (factor, index) => {

                  const impact =
                    toNumber(
                      factor?.impact
                    );

                  return (
                    <div
                      key={`${factor?.feature ?? "feature"}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >

                      <span className="text-xs text-gray-300">
                        {factor?.feature ??
                          "Unknown Feature"}
                      </span>

                      <span
                        className={`text-xs font-bold ${
                          impact !== null &&
                          impact >= 0
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >

                        {impact !== null
                          ? `${
                              impact >= 0
                                ? "+"
                                : ""
                            }${impact.toFixed(
                              3
                            )}`
                          : "N/A"}

                      </span>

                    </div>
                  );
                }
              )
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-gray-500">
              SHAP factors are not available
              for this prediction yet.
            </div>
          )}

        </div>

      </div>

      {/* PREDICTION */}

      {riskData?.prediction && (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">

          <p className="text-[9px] uppercase tracking-wide text-gray-500">
            AI Prediction
          </p>

          <p className="mt-1 text-xs text-gray-300">
            {riskData.prediction}
          </p>

        </div>
      )}

    </div>
  );
}

// =====================================================
// VITAL BADGE
// =====================================================

function VitalBadge({
  label,
  value,
  unit,
  abnormal,
  center = false,
}: {
  label: string;
  value: string;
  unit: string;
  abnormal: boolean;
  center?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-black/95 px-3 py-2 shadow-xl ${
        abnormal
          ? "border-white/40"
          : "border-white/10"
      } ${
        center
          ? "text-center"
          : ""
      }`}
    >

      <p
        className={`text-[8px] font-semibold uppercase ${
          abnormal
            ? "text-white"
            : "text-gray-400"
        }`}
      >
        {label}
      </p>

      <div
        className={`mt-1 flex items-end gap-1 ${
          center
            ? "justify-center"
            : ""
        }`}
      >

        <span
          className={`text-sm font-bold ${
            abnormal
              ? "text-white"
              : "text-gray-200"
          }`}
        >
          {value}
        </span>

        <span className="text-[8px] text-gray-600">
          {unit}
        </span>

      </div>

    </div>
  );
}

// =====================================================
// COMPARISON CARD
// =====================================================

function ComparisonCard({
  icon,
  label,
  current,
  simulated,
  unit,
}: {
  icon: ReactNode;
  label: string;
  current: number | null;
  simulated: number | null;
  unit: string;
}) {
  const difference =
    current !== null &&
    simulated !== null
      ? simulated - current
      : null;

  return (
    <div className="rounded-xl border border-white/10 bg-black p-4 transition hover:border-white/20">

      <div className="flex items-center gap-3">

        <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-300">
          {icon}
        </div>

        <p className="text-sm font-semibold text-white">
          {label}
        </p>

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div>

          <p className="text-[10px] uppercase text-gray-600">
            Current
          </p>

          <p className="mt-1 text-lg font-bold text-white">
            {formatValue(current)}
          </p>

          {current !== null && (
            <p className="text-[10px] text-gray-600">
              {unit}
            </p>
          )}

        </div>

        <div>

          <p className="text-[10px] uppercase text-gray-500">
            Simulated
          </p>

          <p className="mt-1 text-lg font-bold text-gray-200">
            {formatValue(simulated)}
          </p>

          {simulated !== null && (
            <p className="text-[10px] text-gray-600">
              {unit}
            </p>
          )}

        </div>

      </div>

      {difference !== null && (
        <div className="mt-3 border-t border-white/10 pt-3">

          <p className="text-xs text-gray-500">
            Hypothetical change:{" "}

            <span className="font-semibold text-gray-300">
              {difference > 0
                ? "+"
                : ""}
              {difference.toFixed(1)}
            </span>

          </p>

        </div>
      )}

    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function formatValue(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

function getSuitabilityPercent(
  value:
    | number
    | string
    | null
    | undefined
): number {
  const numeric =
    toNumber(value);

  if (numeric === null) {
    return 0;
  }

  const percentage =
    numeric <= 1
      ? numeric * 100
      : numeric;

  return Math.min(
    100,
    Math.max(0, percentage)
  );
}

function formatSuitability(
  value:
    | number
    | string
    | null
    | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  return `${Math.round(
    getSuitabilityPercent(value)
  )}%`;
}

// =====================================================
// ORGAN COLOR
// =====================================================

function getOrganColor(
  risk?: string | null
): string {
  switch (risk?.toUpperCase()) {

    case "CRITICAL":
      return "#ffffff";

    case "HIGH":
    case "HIGH_RISK":
      return "#d4d4d4";

    case "MODERATE":
      return "#a3a3a3";

    case "LOW":
    case "LOW_RISK":
      return "#737373";

    default:
      return "#ffffff";
  }
}

// =====================================================
// ABNORMAL
// =====================================================

function isAbnormal(
  risk?: string | null
): boolean {
  const normalized =
    risk?.toUpperCase();

  return (
    normalized === "HIGH" ||
    normalized === "HIGH_RISK" ||
    normalized === "CRITICAL"
  );
}

// =====================================================
// RISK TEXT COLOR
// =====================================================

function getRiskTextColor(
  risk?: string | null
): string {
  switch (risk?.toUpperCase()) {

    case "CRITICAL":
      return "text-white";

    case "HIGH":
    case "HIGH_RISK":
      return "text-gray-200";

    case "MODERATE":
      return "text-gray-400";

    case "LOW":
    case "LOW_RISK":
      return "text-gray-500";

    default:
      return "text-gray-400";
  }
}

// =====================================================
// SIMULATION
// =====================================================

function simulateHeartRate(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value > 100) {
    return roundNumber(
      value -
        Math.min(hours, 24) *
          0.45
    );
  }

  if (value < 60) {
    return roundNumber(
      value +
        Math.min(hours, 24) *
          0.25
    );
  }

  return roundNumber(value);
}

function simulateSpO2(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value < 95) {
    return clamp(
      roundNumber(
        value +
          Math.min(hours, 24) *
            0.05
      ),
      0,
      100
    );
  }

  return roundNumber(value);
}

function simulateRespiratoryRate(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value > 20) {
    return roundNumber(
      value -
        Math.min(hours, 24) *
          0.35
    );
  }

  if (value < 12) {
    return roundNumber(
      value +
        Math.min(hours, 24) *
          0.2
    );
  }

  return roundNumber(value);
}

function simulateTemperature(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value > 37.5) {
    return roundNumber(
      value -
        Math.min(hours, 24) *
          0.015
    );
  }

  if (value < 36) {
    return roundNumber(
      value +
        Math.min(hours, 24) *
          0.01
    );
  }

  return roundNumber(value);
}

function simulateMap(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value < 65) {
    return roundNumber(
      value +
        Math.min(hours, 24) *
          0.3
    );
  }

  if (value > 100) {
    return roundNumber(
      value -
        Math.min(hours, 24) *
          0.25
    );
  }

  return roundNumber(value);
}

function simulateLactate(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value <= 2) {
    return roundNumber(value);
  }

  return Math.max(
    0,
    roundNumber(
      value -
        Math.min(hours, 24) *
          0.015
    )
  );
}

function simulateUrineOutput(
  value: number | null,
  hours: number
): number | null {
  if (value === null) {
    return null;
  }

  if (value < 60) {
    return roundNumber(
      value +
        Math.min(hours, 24) *
          0.5
    );
  }

  return roundNumber(value);
}

function roundNumber(
  value: number
): number {
  return Math.round(
    value * 10
  ) / 10;
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    Math.max(value, min),
    max
  );
}