import { useGLTF } from "@react-three/drei";

export default function HumanBody() {
  const { scene } = useGLTF(
    "/models/human_body.glb"
  );

  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[0, -1, 0]}
    />
  );
}

useGLTF.preload("/models/human_body.glb");