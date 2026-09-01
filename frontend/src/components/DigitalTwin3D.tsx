import React, {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Canvas,
  useFrame,
  type ThreeEvent,
} from "@react-three/fiber";

import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  useGLTF,
} from "@react-three/drei";

import * as THREE from "three";

/* =========================================================
   TYPES
========================================================= */

type OrganName =
  | "heart"
  | "lungs"
  | "liver"
  | "kidneys"
  | "vessels";

type SimulationVitals = {
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
};

type SHAPFactor = {
  feature?: string | null;
  impact?: number | string | null;
};

type OrganRisk = {
  prediction?: string | null;
  probability?: number | string | null;
  risk_level?: string | null;
  shap_factors?: SHAPFactor[] | null;
};

type OrganRisks = {
  heart?: OrganRisk | number | string | null;
  lungs?: OrganRisk | number | string | null;
  lung?: OrganRisk | number | string | null;
  liver?: OrganRisk | number | string | null;
  kidneys?: OrganRisk | number | string | null;
  kidney?: OrganRisk | number | string | null;
  vessels?: OrganRisk | number | string | null;
  cardiovascular?: OrganRisk | number | string | null;
};

type SimulatedVitals = {
  heartRate: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  map: number | null;
  lactate: number | null;
  urineOutput: number | null;
};

type DigitalTwin3DProps = {
  vitals?: SimulationVitals | null;
  organRisks?: OrganRisks | null;
  simulatedVitals?: SimulatedVitals | null;
  simulated?: boolean;
  antibioticSuitability?: number | string | null;

  heartRate?: number | null;
  spo2?: number | null;
  respiratoryRate?: number | null;
  temperature?: number | null;
  map?: number | null;
  lactate?: number | null;
  urineOutput?: number | null;

  sepsisRisk?: number | null;

  onOrganClick?: (
    organ: OrganName
  ) => void;
};

/* =========================================================
   MODEL PATHS
========================================================= */

const MODEL_BASE = "/models/human";

const MODEL_PATHS = {
  body: `${MODEL_BASE}/body.glb`,
  heart: `${MODEL_BASE}/heart.glb`,
  lungs: `${MODEL_BASE}/lungs.glb`,
  liver: `${MODEL_BASE}/liver.glb`,
  kidneys: `${MODEL_BASE}/kidneys.glb`,
  vessels: `${MODEL_BASE}/vessels.glb`,
};

/* =========================================================
   HELPERS
========================================================= */

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

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

/* =========================================================
   BUILD VITALS
========================================================= */

function buildVitals(
  props: DigitalTwin3DProps
): SimulatedVitals {
  const {
    vitals,
    simulatedVitals,
    heartRate,
    spo2,
    respiratoryRate,
    temperature,
    map,
    lactate,
    urineOutput,
  } = props;

  if (simulatedVitals) {
    return simulatedVitals;
  }

  return {
    heartRate:
      toNumber(vitals?.heartRate) ??
      toNumber(heartRate),

    spo2:
      toNumber(vitals?.spo2) ??
      toNumber(spo2),

    respiratoryRate:
      toNumber(vitals?.respiratoryRate) ??
      toNumber(respiratoryRate),

    temperature:
      toNumber(vitals?.temperature) ??
      toNumber(temperature),

    map:
      toNumber(vitals?.map) ??
      toNumber(map),

    lactate:
      toNumber(vitals?.lactate) ??
      toNumber(lactate),

    urineOutput:
      toNumber(vitals?.urineOutput) ??
      toNumber(urineOutput),
  };
}

/* =========================================================
   NORMALIZE ORGAN RISK
========================================================= */

function getOrganRisk(
  organ: OrganName,
  risks?: OrganRisks | null
): OrganRisk | null {
  if (!risks) {
    return null;
  }

  let value:
    | OrganRisk
    | number
    | string
    | null
    | undefined;

  if (organ === "heart") {
    value =
      risks.heart ??
      risks.cardiovascular;
  } else if (organ === "lungs") {
    value =
      risks.lungs ??
      risks.lung;
  } else if (organ === "liver") {
    value = risks.liver;
  } else if (organ === "kidneys") {
    value =
      risks.kidneys ??
      risks.kidney;
  } else {
    value =
      risks.vessels ??
      risks.cardiovascular;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return {
      probability: value,
    };
  }

  return value;
}

/* =========================================================
   RISK %
========================================================= */

function getRiskPercent(
  risk: OrganRisk | null
): number | null {
  if (!risk) {
    return null;
  }

  const value = toNumber(
    risk.probability
  );

  if (value === null) {
    return null;
  }

  const percent =
    value >= 0 && value <= 1
      ? value * 100
      : value;

  return Math.max(
    0,
    Math.min(
      100,
      percent
    )
  );
}

/* =========================================================
   RISK LEVEL
========================================================= */

function getRiskLevel(
  risk: OrganRisk | null
): string {
  if (!risk) {
    return "NO PREDICTION";
  }

  if (risk.risk_level) {
    return risk.risk_level.toUpperCase();
  }

  const percent =
    getRiskPercent(risk);

  if (percent === null) {
    return "NO PREDICTION";
  }

  if (percent >= 70) {
    return "HIGH RISK";
  }

  if (percent >= 40) {
    return "MODERATE";
  }

  return "LOW RISK";
}

/* =========================================================
   RISK COLOR
========================================================= */

function getRiskColor(
  risk: OrganRisk | null
): string {
  const level =
    getRiskLevel(risk);

  if (
    level.includes("HIGH") ||
    level.includes("CRITICAL")
  ) {
    return "#ef4444";
  }

  if (
    level.includes("MODERATE") ||
    level.includes("MEDIUM")
  ) {
    return "#f59e0b";
  }

  if (
    level.includes("LOW")
  ) {
    return "#22c55e";
  }

  return "#38bdf8";
}

/* =========================================================
   BODY MODEL
========================================================= */

function BodyModel() {
  const { scene } =
    useGLTF(
      MODEL_PATHS.body
    );

  const body =
    useMemo(() => {
      const clone =
        scene.clone(true);

      clone.traverse(
        (child) => {
          if (
            !(child instanceof THREE.Mesh)
          ) {
            return;
          }

          const materials =
            Array.isArray(
              child.material
            )
              ? child.material
              : [child.material];

          materials.forEach(
            (material) => {
              material.transparent =
                true;

              material.opacity =
                0.14;

              material.depthWrite =
                false;

              material.side =
                THREE.DoubleSide;

              material.needsUpdate =
                true;
            }
          );
        }
      );

      return clone;
    }, [scene]);

  return (
    <primitive
      object={body}

      /*
       * Keep body and organs
       * aligned.
       */
      position={[
        0,
        -1.25,
        0,
      ]}
    />
  );
}

/* =========================================================
   ORGAN MODEL
========================================================= */

function OrganModel({
  path,
  organ,
  position,
  selected,
  risk,
  onSelect,
}: {
  path: string;
  organ: OrganName;
  position: [
    number,
    number,
    number
  ];
  selected: boolean;
  risk: OrganRisk | null;
  onSelect: (
    organ: OrganName
  ) => void;
}) {
  const { scene } =
    useGLTF(path);

  const model =
    useMemo(() => {
      const clone =
        scene.clone(true);

      clone.traverse(
        (child) => {
          child.userData = {
            ...child.userData,
            organ,
          };

          if (
            !(child instanceof THREE.Mesh)
          ) {
            return;
          }

          child.castShadow =
            true;

          child.receiveShadow =
            true;

          const materials =
            Array.isArray(
              child.material
            )
              ? child.material
              : [child.material];

          materials.forEach(
            (material) => {
              material.transparent =
                false;

              material.opacity =
                1;

              material.depthWrite =
                true;

              material.side =
                THREE.DoubleSide;

              if (selected) {
                const standard =
                  material as THREE.MeshStandardMaterial;

                standard.emissive.set(
                  getRiskColor(
                    risk
                  )
                );

                standard.emissiveIntensity =
                  0.35;
              } else {
                const standard =
                  material as THREE.MeshStandardMaterial;

                standard.emissive.set(
                  "#000000"
                );

                standard.emissiveIntensity =
                  0;
              }

              material.needsUpdate =
                true;
            }
          );
        }
      );

      return clone;
    }, [
      scene,
      organ,
      selected,
      risk,
    ]);

  return (
    <group
      position={position}
      onPointerDown={(
        event: ThreeEvent<PointerEvent>
      ) => {
        event.stopPropagation();

        onSelect(
          organ
        );
      }}
    >
      <primitive
        object={model}
      />
    </group>
  );
}

/* =========================================================
   HUMAN SCENE
========================================================= */

function HumanScene({
  selectedOrgan,
  organRisks,
  onSelectOrgan,
  onOrganClick,
}: {
  selectedOrgan:
    | OrganName
    | null;

  organRisks?: OrganRisks | null;

  onSelectOrgan: (
    organ: OrganName
  ) => void;

  onOrganClick?: (
    organ: OrganName
  ) => void;
}) {
  const groupRef =
    useRef<THREE.Group>(
      null
    );

  const heartRisk =
    getOrganRisk(
      "heart",
      organRisks
    );

  const lungsRisk =
    getOrganRisk(
      "lungs",
      organRisks
    );

  const liverRisk =
    getOrganRisk(
      "liver",
      organRisks
    );

  const kidneysRisk =
    getOrganRisk(
      "kidneys",
      organRisks
    );

  const vesselsRisk =
    getOrganRisk(
      "vessels",
      organRisks
    );

  useFrame(
    (state) => {
      if (
        !groupRef.current
      ) {
        return;
      }

      groupRef.current.rotation.y =
        Math.sin(
          state.clock.elapsedTime *
            0.15
        ) * 0.01;
    }
  );

  const selectOrgan = (
    organ: OrganName
  ) => {
    onSelectOrgan(
      organ
    );

    onOrganClick?.(
      organ
    );
  };

  return (
    <group
      ref={groupRef}

      /*
       * IMPORTANT:
       *
       * Human moved UP.
       *
       * Previous:
       * position={[0, 2.25, 0]}
       *
       * New:
       * position={[0, 3.05, 0]}
       *
       * Scale remains 2.05.
       */
      position={[
        0,
        3.05,
        0,
      ]}

      scale={2.05}
    >
      {/* BODY */}

      <BodyModel />

      {/* HEART */}

      <OrganModel
        path={
          MODEL_PATHS.heart
        }
        organ="heart"
        position={[
          0,
          -1.25,
          0,
        ]}
        selected={
          selectedOrgan ===
          "heart"
        }
        risk={heartRisk}
        onSelect={
          selectOrgan
        }
      />

      {/* LUNGS */}

      <OrganModel
        path={
          MODEL_PATHS.lungs
        }
        organ="lungs"
        position={[
          0,
          -1.25,
          0,
        ]}
        selected={
          selectedOrgan ===
          "lungs"
        }
        risk={lungsRisk}
        onSelect={
          selectOrgan
        }
      />

      {/* LIVER */}

      <OrganModel
        path={
          MODEL_PATHS.liver
        }
        organ="liver"
        position={[
          0,
          -1.25,
          0,
        ]}
        selected={
          selectedOrgan ===
          "liver"
        }
        risk={liverRisk}
        onSelect={
          selectOrgan
        }
      />

      {/* KIDNEYS */}

      <OrganModel
        path={
          MODEL_PATHS.kidneys
        }
        organ="kidneys"
        position={[
          0,
          -1.40,
          0,
        ]}
        selected={
          selectedOrgan ===
          "kidneys"
        }
        risk={kidneysRisk}
        onSelect={
          selectOrgan
        }
      />

      {/* VESSELS */}

      <OrganModel
        path={
          MODEL_PATHS.vessels
        }
        organ="vessels"
        position={[
          0,
          -1.25,
          0,
        ]}
        selected={
          selectedOrgan ===
          "vessels"
        }
        risk={vesselsRisk}
        onSelect={
          selectOrgan
        }
      />
    </group>
  );
}

/* =========================================================
   BLOOD FLOW
========================================================= */

function createCurve(
  points: number[][]
) {
  return new THREE.CatmullRomCurve3(
    points.map(
      ([x, y, z]) =>
        new THREE.Vector3(
          x,
          y,
          z
        )
    )
  );
}

function BloodFlow({
  compromised,
}: {
  compromised: boolean;
}) {
  const particles =
    useRef<
      THREE.Mesh[]
    >([]);

  const paths =
    useMemo(
      () => [
        createCurve([
          [0, 0.5, 0.2],
          [0, 1.2, 0.18],
          [0, 2.0, 0.12],
          [0, 2.8, 0.08],
        ]),

        createCurve([
          [0, 0.7, 0.2],
          [-0.5, 1.1, 0.15],
          [-0.9, 1.7, 0.1],
          [-1.1, 2.2, 0.05],
        ]),

        createCurve([
          [0, 0.7, 0.2],
          [0.5, 1.1, 0.15],
          [0.9, 1.7, 0.1],
          [1.1, 2.2, 0.05],
        ]),

        createCurve([
          [0, 0.45, 0.2],
          [-0.3, 0.15, 0.12],
          [-0.5, -0.4, 0.08],
          [-0.55, -0.9, 0.03],
        ]),

        createCurve([
          [0, 0.45, 0.2],
          [0.3, 0.15, 0.12],
          [0.5, -0.4, 0.08],
          [0.55, -0.9, 0.03],
        ]),
      ],
      []
    );

  useFrame(
    (_state, delta) => {
      const speed =
        compromised
          ? 0.15
          : 0.28;

      particles.current.forEach(
        (
          mesh,
          index
        ) => {
          if (!mesh) {
            return;
          }

          const curve =
            paths[
              index %
                paths.length
            ];

          const old =
            mesh.userData
              .progress ??
            index * 0.08;

          const next =
            (old +
              delta *
                speed) %
            1;

          mesh.userData.progress =
            next;

          mesh.position.copy(
            curve.getPointAt(
              next
            )
          );
        }
      );
    }
  );

  return (
    <group>
      {Array.from({
        length: 20,
      }).map(
        (_, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              if (mesh) {
                particles.current[
                  index
                ] = mesh;
              }
            }}
          >
            <sphereGeometry
              args={[
                compromised
                  ? 0.024
                  : 0.018,
                8,
                8,
              ]}
            />

            <meshStandardMaterial
              color="#ef4444"
              emissive="#7f1d1d"
              emissiveIntensity={1.2}
            />
          </mesh>
        )
      )}
    </group>
  );
}

/* =========================================================
   ORGAN VITALS
========================================================= */

function getOrganVitals(
  organ: OrganName,
  vitals: SimulatedVitals
) {
  const hr =
    vitals.heartRate;

  const spo2 =
    vitals.spo2;

  const rr =
    vitals.respiratoryRate;

  const temp =
    vitals.temperature;

  const map =
    vitals.map;

  const lactate =
    vitals.lactate;

  const urine =
    vitals.urineOutput;

  if (organ === "heart") {
    return [
      {
        label: "Heart Rate",
        value:
          hr !== null
            ? `${hr} bpm`
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
  }

  if (organ === "lungs") {
    return [
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
          rr !== null
            ? `${rr}/min`
            : "N/A",
      },
      {
        label: "Temperature",
        value:
          temp !== null
            ? `${temp} °C`
            : "N/A",
      },
    ];
  }

  if (organ === "liver") {
    return [
      {
        label: "Temperature",
        value:
          temp !== null
            ? `${temp} °C`
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
  }

  if (organ === "kidneys") {
    return [
      {
        label: "Urine Output",
        value:
          urine !== null
            ? `${urine} mL/hr`
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
  }

  return [
    {
      label: "MAP",
      value:
        map !== null
          ? `${map} mmHg`
          : "N/A",
    },
    {
      label: "Heart Rate",
      value:
        hr !== null
          ? `${hr} bpm`
          : "N/A",
    },
    {
      label: "SpO₂",
      value:
        spo2 !== null
          ? `${spo2}%`
          : "N/A",
    },
  ];
}

/* =========================================================
   ORGAN PANEL
========================================================= */

function OrganPanel({
  organ,
  vitals,
  organRisks,
  onClose,
}: {
  organ: OrganName;
  vitals: SimulatedVitals;
  organRisks?: OrganRisks | null;
  onClose: () => void;
}) {
  const risk =
    getOrganRisk(
      organ,
      organRisks
    );

  const percent =
    getRiskPercent(
      risk
    );

  const level =
    getRiskLevel(
      risk
    );

  const color =
    getRiskColor(
      risk
    );

  const values =
    getOrganVitals(
      organ,
      vitals
    );

  const shap =
    risk?.shap_factors ??
    [];

  const title =
    organ === "heart"
      ? "Heart"
      : organ === "lungs"
      ? "Lungs"
      : organ === "liver"
      ? "Liver"
      : organ === "kidneys"
      ? "Kidneys"
      : "Blood Vessels";

  return (
    <div className="absolute left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-[430px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
            Selected Organ
          </p>

          <h3 className="mt-1 text-2xl font-bold text-white">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl text-white/40 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>

      </div>

      {/* RISK */}

      <div className="px-5 pt-4">

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

          <p className="text-[9px] uppercase tracking-wide text-white/40">
            AI Risk Score
          </p>

          <div className="mt-2 flex items-center justify-between">

            <span
              className="text-4xl font-bold"
              style={{
                color,
              }}
            >
              {percent ===
              null
                ? "—"
                : `${Math.round(
                    percent
                  )}%`}
            </span>

            <span
              className="rounded-full border px-3 py-1.5 text-[10px] font-bold"
              style={{
                color,
                borderColor:
                  `${color}55`,
                backgroundColor:
                  `${color}15`,
              }}
            >
              {level}
            </span>

          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:
                  percent ===
                  null
                    ? "0%"
                    : `${percent}%`,
                backgroundColor:
                  color,
              }}
            />

          </div>

        </div>
      </div>

      {/* ORGAN VITALS */}

      <div className="px-5 pt-4">

        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Current Physiological Values
        </p>

        <div className="mt-2 space-y-2">

          {values.map(
            (item) => (
              <div
                key={
                  item.label
                }
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >

                <span className="text-xs text-white/50">
                  {
                    item.label
                  }
                </span>

                <span className="text-sm font-bold text-white">
                  {
                    item.value
                  }
                </span>

              </div>
            )
          )}

        </div>
      </div>

      {/* SHAP */}

      <div className="px-5 pb-5 pt-4">

        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
          SHAP Explanation
        </p>

        <div className="mt-2 space-y-2">

          {shap.length ===
          0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-white/40">
              SHAP factors are not available yet.
            </div>
          ) : (
            shap
              .slice(0, 5)
              .map(
                (
                  factor,
                  index
                ) => {

                  const impact =
                    toNumber(
                      factor.impact
                    );

                  return (
                    <div
                      key={`${factor.feature}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >

                      <span className="text-xs text-white/70">
                        {
                          factor.feature ??
                          "Feature"
                        }
                      </span>

                      <span
                        className={
                          impact !==
                            null &&
                          impact >=
                            0
                            ? "text-xs font-bold text-red-400"
                            : "text-xs font-bold text-emerald-400"
                        }
                      >
                        {impact ===
                        null
                          ? "N/A"
                          : `${
                              impact >=
                              0
                                ? "+"
                                : ""
                            }${impact.toFixed(
                              3
                            )}`}
                      </span>

                    </div>
                  );
                }
              )
          )}

        </div>
      </div>

      {/* AI PREDICTION */}

      {risk?.prediction && (
        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">

          <p className="text-[9px] uppercase tracking-wide text-white/40">
            AI Prediction
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {
              risk.prediction
            }
          </p>

        </div>
      )}

      {/* NO PREDICTION */}

      {!risk && (
        <div className="border-t border-white/10 px-5 py-4">

          <p className="text-[10px] text-white/40">
            No organ prediction is available yet.
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            Click Predict Sepsis & Organ Risk to generate the AI prediction.
          </p>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   FLOW STATUS
========================================================= */

function isFlowCompromised(
  vitals: SimulatedVitals
) {
  const spo2 =
    vitals.spo2;

  const map =
    vitals.map;

  const lactate =
    vitals.lactate;

  return (
    (spo2 !== null &&
      spo2 < 92) ||
    (map !== null &&
      map < 65) ||
    (lactate !== null &&
      lactate > 2)
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingHuman() {
  return (
    <Html center>

      <div className="rounded-xl border border-white/10 bg-black px-5 py-4 text-center">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />

        <p className="mt-3 text-xs font-semibold text-white">
          Loading 3D Human...
        </p>

      </div>

    </Html>
  );
}

/* =========================================================
   ERROR BOUNDARY
========================================================= */

class ModelErrorBoundary extends React.Component<
  {
    children: ReactNode;
  },
  {
    error: Error | null;
  }
> {
  state: {
    error: Error | null;
  } = {
    error: null,
  };

  static getDerivedStateFromError(
    error: Error
  ) {
    return {
      error,
    };
  }

  render() {
    if (
      this.state.error
    ) {
      return (
        <Html center>

          <div className="w-[340px] rounded-xl border border-red-500/30 bg-black p-5 text-white">

            <p className="font-bold text-red-400">
              3D Model Error
            </p>

            <p className="mt-2 text-xs leading-5 text-white/70">
              {
                this.state.error
                  .message
              }
            </p>

            <p className="mt-3 text-[10px] leading-5 text-white/40">
              Check these files:
              <br />
              body.glb
              <br />
              heart.glb
              <br />
              lungs.glb
              <br />
              liver.glb
              <br />
              kidneys.glb
              <br />
              vessels.glb
            </p>

          </div>

        </Html>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DigitalTwin3D({
  vitals,
  organRisks,
  simulatedVitals,
  simulated = false,
  antibioticSuitability,

  heartRate,
  spo2,
  respiratoryRate,
  temperature,
  map,
  lactate,
  urineOutput,

  sepsisRisk,

  onOrganClick,
}: DigitalTwin3DProps) {
  const [
    selectedOrgan,
    setSelectedOrgan,
  ] =
    useState<
      OrganName | null
    >(null);

  const displayVitals =
    buildVitals({
      vitals,
      organRisks,
      simulatedVitals,
      simulated,
      antibioticSuitability,

      heartRate,
      spo2,
      respiratoryRate,
      temperature,
      map,
      lactate,
      urineOutput,

      sepsisRisk,

      onOrganClick,
    });

  const flowCompromised =
    isFlowCompromised(
      displayVitals
    );

  return (
    <div
      className="
        relative
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-black
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          absolute
          left-0
          right-0
          top-0
          z-30
          flex
          items-center
          justify-between
          border-b
          border-white/10
          bg-black/90
          px-5
          py-3
          backdrop-blur-xl
        "
      >

        <div>

          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
            Digital Twin
          </p>

          <p className="mt-1 text-sm font-bold text-white">
            Virtual Human
          </p>

          <p className="mt-0.5 text-[9px] text-white/35">
            Click an organ to inspect AI risk
          </p>

        </div>

        <div
          className={`
            rounded-full
            border
            px-3
            py-1
            text-[9px]
            font-semibold
            ${
              simulated
                ? "border-white/20 bg-white/5 text-white"
                : "border-white/20 bg-white/5 text-white"
            }
          `}
        >
          {simulated
            ? "SIMULATED STATE"
            : "CURRENT STATE"}
        </div>

      </div>

      {/* =================================================
          3D VIEW
      ================================================= */}

      <div
        className="
          relative
          h-[720px]
          w-full
          bg-black
        "
      >

        <Canvas
          dpr={[
            1,
            2,
          ]}
          shadows
          gl={{
            antialias:
              true,
            alpha: false,
          }}

          /*
           * Pure black Three.js canvas.
           */
          onCreated={({
            scene,
          }) => {
            scene.background =
              new THREE.Color(
                "#000000"
              );
          }}
        >

          {/* CAMERA */}

          <PerspectiveCamera
            makeDefault
            position={[
              0,
              2.0,
              7.2,
            ]}
            fov={38}
          />

          {/* LIGHTS */}

          <ambientLight
            intensity={1.7}
          />

          <directionalLight
            position={[
              4,
              7,
              5,
            ]}
            intensity={2.3}
            castShadow
          />

          <directionalLight
            position={[
              -4,
              3,
              2,
            ]}
            intensity={1.2}
          />

          <pointLight
            position={[
              0,
              2,
              3,
            ]}
            intensity={1.2}
          />

          {/* HUMAN */}

          <ModelErrorBoundary>

            <Suspense
              fallback={
                <LoadingHuman />
              }
            >

              <HumanScene
                selectedOrgan={
                  selectedOrgan
                }
                organRisks={
                  organRisks
                }
                onSelectOrgan={
                  setSelectedOrgan
                }
                onOrganClick={
                  onOrganClick
                }
              />

              <BloodFlow
                compromised={
                  flowCompromised
                }
              />

            </Suspense>

          </ModelErrorBoundary>

          {/* CAMERA CONTROLS */}

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}

            minDistance={2.8}
            maxDistance={9}

            minPolarAngle={
              Math.PI * 0.20
            }

            maxPolarAngle={
              Math.PI * 0.80
            }

            /*
             * Target moved slightly upward
             * so the virtual human stays
             * visually higher/centered.
             */
            target={[
              0,
              0.8,
              0,
            ]}
          />

        </Canvas>

        {/* =================================================
            ORGAN DETAIL PANEL
        ================================================= */}

        {selectedOrgan && (
          <OrganPanel
            organ={
              selectedOrgan
            }
            vitals={
              displayVitals
            }
            organRisks={
              organRisks
            }
            onClose={() =>
              setSelectedOrgan(
                null
              )
            }
          />
        )}

        {/* =================================================
            BLOOD FLOW STATUS
        ================================================= */}

        <div
          className="
            absolute
            bottom-4
            right-4
            z-20
            rounded-xl
            border
            border-white/10
            bg-black/90
            px-4
            py-3
            backdrop-blur-xl
          "
        >

          <div className="flex items-center gap-2">

            <span
              className={`
                h-2.5
                w-2.5
                rounded-full
                ${
                  flowCompromised
                    ? "animate-pulse bg-red-400"
                    : "bg-emerald-400"
                }
              `}
            />

            <span className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
              Blood Flow
            </span>

          </div>

          <p
            className={`
              mt-1
              text-xs
              font-bold
              ${
                flowCompromised
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            `}
          >
            {flowCompromised
              ? "COMPROMISED"
              : "NORMAL"}
          </p>

        </div>

      </div>

      {/* =================================================
          ANTIBIOTIC SUITABILITY
      ================================================= */}

      {antibioticSuitability !==
        undefined &&
        antibioticSuitability !==
          null && (

        <div className="border-t border-white/10 bg-black px-5 py-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                Antibiotic Suitability
              </p>

              <p className="mt-1 text-[10px] text-white/25">
                AI model result
              </p>

            </div>

            <p className="text-2xl font-bold text-white">

              {Math.round(
                Number(
                  antibioticSuitability
                ) <= 1
                  ? Number(
                      antibioticSuitability
                    ) * 100
                  : Number(
                      antibioticSuitability
                    )
              )}

              %

            </p>

          </div>

        </div>
      )}

      {/* =================================================
          SEPSIS RISK
      ================================================= */}

      {sepsisRisk !==
        null &&
        sepsisRisk !==
          undefined && (

        <div className="border-t border-white/10 bg-black px-5 py-3">

          <div className="flex items-center justify-between">

            <span className="text-[10px] uppercase tracking-wide text-white/40">
              Sepsis Risk
            </span>

            <span className="text-sm font-bold text-white">

              {Number(
                sepsisRisk
              ).toFixed(1)}

              %

            </span>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   PRELOAD MODELS
========================================================= */

useGLTF.preload(
  MODEL_PATHS.body
);

useGLTF.preload(
  MODEL_PATHS.heart
);

useGLTF.preload(
  MODEL_PATHS.lungs
);

useGLTF.preload(
  MODEL_PATHS.liver
);

useGLTF.preload(
  MODEL_PATHS.kidneys
);

useGLTF.preload(
  MODEL_PATHS.vessels
);