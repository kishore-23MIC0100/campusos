import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type CampusArea = "academic" | "library" | "sports";
const teal = "#277b70";
function Block({
  at,
  size,
  color,
  ...props
}: {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
} & Record<string, unknown>) {
  return (
    <mesh position={at} castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}
function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.45, z]}>
      <Block at={[0, 0.38, 0]} size={[0.1, 0.75, 0.1]} color="#9b8a72" />
      <mesh position={[0, 0.92, 0]} castShadow>
        <icosahedronGeometry args={[0.48, 1]} />
        <meshStandardMaterial color={teal} roughness={1} />
      </mesh>
    </group>
  );
}
function Building({
  x,
  z,
  width,
  depth,
  height,
  selected,
  onSelect,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <group
      position={[x, 0.45, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Block
        at={[0, height / 2, 0]}
        size={[width, height, depth]}
        color={selected ? "#c6e3dc" : "#e8eeeb"}
      />
      <Block
        at={[0, height + 0.09, 0]}
        size={[width + 0.18, 0.18, depth + 0.18]}
        color={selected ? teal : "#bccbc7"}
      />
      {[0.6, 1.35, 2.1]
        .filter((y) => y < height)
        .map((y) => (
          <group key={y}>
            {Array.from({ length: Math.floor(width / 0.65) }, (_, i) => (
              <Block
                key={i}
                at={[-width / 2 + 0.36 + i * 0.65, y, depth / 2 + 0.02]}
                size={[0.38, 0.4, 0.04]}
                color="#4a7275"
              />
            ))}
            {Array.from({ length: Math.floor(depth / 0.65) }, (_, i) => (
              <Block
                key={i}
                at={[width / 2 + 0.02, y, -depth / 2 + 0.35 + i * 0.65]}
                size={[0.04, 0.4, 0.38]}
                color="#4a7275"
              />
            ))}
          </group>
        ))}
      <Block
        at={[0, 0.45, depth / 2 + 0.03]}
        size={[0.6, 0.9, 0.08]}
        color={teal}
      />
      <Block
        at={[0, 0.05, depth / 2 + 0.48]}
        size={[1.1, 0.1, 0.9]}
        color="#d0d7d2"
      />
    </group>
  );
}
function Model({
  area,
  setArea,
  reduced,
}: {
  area: CampusArea;
  setArea: (value: CampusArea) => void;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current && !reduced)
      group.current.position.y = Math.sin(clock.elapsedTime * 0.65) * 0.08;
  });
  return (
    <group ref={group} rotation={[0, -0.16, 0]}>
      <Block at={[0, 0, 0]} size={[17, 0.8, 12]} color="#dce5de" />
      <Block at={[0, 0.42, 0]} size={[16.8, 0.06, 11.8]} color="#e9eeE6" />
      <Block at={[0, 0.48, 3.6]} size={[16.7, 0.06, 1.1]} color="#bac9c4" />
      <Block at={[0, 0.49, 0]} size={[1.3, 0.06, 10.5]} color="#c5d2cb" />
      <Block at={[-3, 0.48, 0]} size={[4.8, 0.06, 1]} color="#c5d2cb" />
      <Building
        x={-4.1}
        z={-2.5}
        width={5}
        depth={2.5}
        height={2.8}
        selected={area === "academic"}
        onSelect={() => setArea("academic")}
      />
      <Building
        x={-6}
        z={0.3}
        width={1.25}
        depth={2}
        height={2.8}
        selected={area === "academic"}
        onSelect={() => setArea("academic")}
      />
      <Building
        x={-2.2}
        z={0.3}
        width={1.25}
        depth={2}
        height={2.8}
        selected={area === "academic"}
        onSelect={() => setArea("academic")}
      />
      <Building
        x={3.6}
        z={-2.7}
        width={4.6}
        depth={2.8}
        height={2}
        selected={area === "library"}
        onSelect={() => setArea("library")}
      />
      <Block at={[3.6, 2.72, -2.7]} size={[2.2, 0.45, 1.3]} color="#78998d" />
      <group
        position={[4.3, 0.52, 1.3]}
        onClick={(e) => {
          e.stopPropagation();
          setArea("sports");
        }}
      >
        <Block
          at={[0, 0.03, 0]}
          size={[4.8, 0.08, 2.4]}
          color={area === "sports" ? "#3c8e79" : "#83a68b"}
        />
        {[-1, 1].map((z) => (
          <Block
            key={z}
            at={[0, 0.09, z]}
            size={[4.4, 0.02, 0.035]}
            color="#eaf1df"
          />
        ))}
        {[-2.2, 0, 2.2].map((x) => (
          <Block
            key={x}
            at={[x, 0.09, 0]}
            size={[0.035, 0.02, 2]}
            color="#eaf1df"
          />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[0.4, 0.43, 32]} />
          <meshBasicMaterial color="#eaf1df" />
        </mesh>
      </group>
      {[-7, -5, -3, -1, 1, 3, 5, 7].map((x) => (
        <Tree key={x} x={x} z={4.9} />
      ))}
      {[-3.7, -1.7, 0.3, 2.3].map((z) => (
        <Tree key={z} x={7.3} z={z} />
      ))}
      <Tree x={-4.1} z={0.9} />
      <Tree x={1.4} z={-0.5} />
      <Tree x={-7.4} z={-4.9} />
      <Block at={[0, 0.6, 5.5]} size={[2.5, 0.3, 0.6]} color="#fbfcf7" />
      <Block at={[-1.2, 1.1, 5.5]} size={[0.2, 1.3, 0.2]} color={teal} />
      <Block at={[1.2, 1.1, 5.5]} size={[0.2, 1.3, 0.2]} color={teal} />
      <Block at={[0, 1.8, 5.5]} size={[2.6, 0.25, 0.3]} color={teal} />
    </group>
  );
}
function ResponsiveCamera() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = Math.min(size.width / 24, size.height / 17);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate]);
  return null;
}
export default function ModernCampus({
  area,
  setArea,
  reduced,
}: {
  area: CampusArea;
  setArea: (value: CampusArea) => void;
  reduced: boolean;
}) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      orthographic
      camera={{ position: [19, 19, 24], zoom: 28, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <ResponsiveCamera />
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[8, 18, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-normalBias={0.05}
      />
      <Model area={area} setArea={setArea} reduced={reduced} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.7, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={!reduced}
        minPolarAngle={0.55}
        maxPolarAngle={1.1}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={1.1}
      />
    </Canvas>
  );
}
