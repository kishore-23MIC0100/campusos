import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Building, GraduationCap, Trophy, BookOpen, Users, Compass } from 'lucide-react';

interface CampusCanvasProps {
  scrollProgress?: number; // 0 to 1
  activeHotspot?: string | null;
  onSelectHotspot?: (hotspotId: string) => void;
  reduceMotion?: boolean;
}

export interface HotspotInfo {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  cameraTarget: [number, number, number];
  description: string;
  stats: string;
  icon: any;
}

export const CAMPUS_HOTSPOTS: HotspotInfo[] = [
  {
    id: 'academic',
    name: 'Academic & Science Block',
    category: 'Smart Classrooms • STEM Wings',
    position: [-10, 5, 3],
    cameraTarget: [-8, 7, 9],
    description: '48 Interactive Smart Classrooms, Advanced AI & Robotics Wings, and State-of-the-Art Biology & Chemistry Labs.',
    stats: '1,420 Students Active • 98.2% Avg Attendance',
    icon: GraduationCap,
  },
  {
    id: 'admin',
    name: 'Founders Memorial Hall & Clocktower',
    category: 'Executive Leadership • Governance',
    position: [0, 8.5, -6],
    cameraTarget: [0, 9, 5],
    description: 'Principal Secretariat, Central Boardroom, Registrar Office, and the Iconic 85-foot Oakridge Heritage Clocktower.',
    stats: 'ISO 9001 Certified • Central Administration',
    icon: Building,
  },
  {
    id: 'library',
    name: 'Alexander Knowledge Hub',
    category: 'Grand Rotunda • Digital Archives',
    position: [10, 5.5, 4],
    cameraTarget: [8, 7, 10],
    description: 'Neoclassical 3-tier domed rotunda with 50,000+ volumes, digital research pods, and silent study chambers.',
    stats: '184 Daily Checkouts • 98 Research Terminals',
    icon: BookOpen,
  },
  {
    id: 'sports',
    name: 'Olympia Stadium & Arena',
    category: 'Athletics Pavilion • Olympic Pool',
    position: [-16, 3.5, -8],
    cameraTarget: [-12, 6, -2],
    description: 'Synthetic 8-Lane 400m Track, FIFA-grade turf, Olympic swimming pavilion, and indoor basketball court.',
    stats: '14 State Championships • 12 Active Sports Clubs',
    icon: Trophy,
  },
  {
    id: 'auditorium',
    name: 'Grand Cultural Auditorium',
    category: 'Performing Arts • Assemblies',
    position: [15, 4.5, -6],
    cameraTarget: [12, 7, 1],
    description: '1,000-seat state-of-the-art Dolby Atmos theater for annual convocations, symphonies, and debate summits.',
    stats: 'Upcoming: Annual Science & Arts Gala 2026',
    icon: Users,
  },
];

// Animated Flag Component
function WavingFlag({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geom.attributes.position;
    const time = state.clock.getElapsedTime() * 3.5;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      // Wave intensity increases along the flag length (u > 0)
      const wave = Math.sin(time + u * 2.5) * 0.15 * Math.max(0, (u + 0.8) / 1.6);
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={position}>
      {/* Flagpole */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 8, 16]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Golden Finial Ball */}
      <mesh position={[0, 8.05, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Waving Fabric */}
      <mesh ref={meshRef} position={[0.8, 6.8, 0]} castShadow>
        <planeGeometry args={[1.6, 1.0, 16, 8]} />
        <meshStandardMaterial color="#1E3A8A" side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Animated Tiered Plaza Fountain
function MonumentalFountain({ position }: { position: [number, number, number] }) {
  const waterJetRef = useRef<THREE.Mesh>(null);
  const middleJetRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (waterJetRef.current) {
      waterJetRef.current.scale.y = 1 + Math.sin(t * 4) * 0.15;
    }
    if (middleJetRef.current) {
      middleJetRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Outer Basin (Lower Tier) */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.4, 0.5, 32]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Lower Basin Water */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.0, 32]} />
        <meshStandardMaterial color="#0284C7" roughness={0.05} metalness={0.3} transparent opacity={0.88} />
      </mesh>

      {/* Middle Tier Pedestal */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 0.8, 16]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[1.7, 1.8, 0.35, 24]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
      </mesh>
      {/* Middle Water Pool */}
      <mesh position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.55, 24]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.05} metalness={0.2} transparent opacity={0.85} />
      </mesh>

      {/* Top Spire Tier */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 0.9, 16]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      {/* Animated Center Vertical Water Jet */}
      <mesh ref={waterJetRef} position={[0, 2.2, 0]}>
        <coneGeometry args={[0.25, 1.4, 16]} />
        <meshStandardMaterial color="#BAE6FD" roughness={0.05} metalness={0.1} transparent opacity={0.75} />
      </mesh>
      {/* Golden Fountain Statuette / Crest */}
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Warm Ambient Water Underwater Illumination */}
      <pointLight position={[0, 0.8, 0]} color="#38BDF8" intensity={1.8} distance={6} />
    </group>
  );
}

// Detailed Realistic Tree Model
function RealisticTree({ position, scale = 1, type = 'oak' }: { position: [number, number, number]; scale?: number; type?: 'oak' | 'cypress' | 'blossom' }) {
  const foliageColor = type === 'blossom' ? '#F472B6' : type === 'cypress' ? '#1E3A2F' : '#2D6A4F';
  const trunkColor = '#5C3D2E';

  if (type === 'cypress') {
    return (
      <group position={position} scale={[scale, scale, scale]}>
        {/* Trunk */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.14, 0.8, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>
        {/* Slender Conical Foliage Layers */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[0.45, 2.2, 10]} />
          <meshStandardMaterial color={foliageColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <coneGeometry args={[0.35, 1.8, 10]} />
          <meshStandardMaterial color="#224233" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // Deluxe Canopy Tree (Oak / Cherry Blossom)
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Fluted Trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 1.8, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.85} />
      </mesh>
      {/* Multi-tier Organic Canopy Spheres */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={foliageColor} roughness={0.65} />
      </mesh>
      <mesh position={[-0.4, 2.6, 0.3]} castShadow>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color={type === 'blossom' ? '#FBCFE8' : '#3E8863'} roughness={0.65} />
      </mesh>
      <mesh position={[0.4, 2.7, -0.2]} castShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color={type === 'blossom' ? '#F472B6' : '#2D6A4F'} roughness={0.65} />
      </mesh>
      {/* Stone Planter Ring */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[0.65, 0.75, 0.16, 16]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Ornate Campus Streetlamp with glowing sphere
function CampusStreetlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Black Cast Iron Post */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 2.4, 12]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Base Flange */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.2, 12]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Lamp Cap & Arm */}
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>
      {/* Glowing Warm Honey Light Sphere */}
      <mesh position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#F59E0B" emissiveIntensity={1.8} />
      </mesh>
      {/* Real Point Light */}
      <pointLight position={[0, 2.35, 0]} color="#FDE68A" intensity={0.9} distance={7} />
    </group>
  );
}

// Flock of birds circling above the campus clocktower
function SoaringFlock() {
  const flockRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!flockRef.current) return;
    const t = state.clock.getElapsedTime() * 0.4;
    flockRef.current.rotation.y = t;
    flockRef.current.position.y = 16 + Math.sin(t * 1.5) * 1.2;
  });

  return (
    <group ref={flockRef} position={[0, 16, -6]}>
      {[
        [2, 0, 1], [-1.5, 0.4, 2.2], [3.2, -0.3, -1.8],
        [-2.8, 0.2, -2.5], [1.2, 0.6, 3.5], [-3.8, -0.2, 0.5]
      ].map(([x, y, z], i) => (
        <group key={`bird-${i}`} position={[x, y, z]} scale={[0.25, 0.25, 0.25]}>
          <mesh rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.2, 1.2, 3]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Master Realistic Campus Architectural 3D Scene
function CampusArchitecture({ activeHotspot, onSelectHotspot }: { activeHotspot?: string | null; onSelectHotspot?: (id: string) => void }) {
  // Realistic & Prestige Materials Matrix
  const materials = useMemo(() => ({
    limestonePrestige: new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.35, metalness: 0.08 }),
    limestoneWarm: new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.45, metalness: 0.05 }),
    imperialBrick: new THREE.MeshStandardMaterial({ color: '#991B1B', roughness: 0.75, metalness: 0.1 }),
    slateMansardRoof: new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.4 }),
    copperVerdigrisDome: new THREE.MeshStandardMaterial({ color: '#0D9488', roughness: 0.3, metalness: 0.65 }),
    copperBronzeTrim: new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.25, metalness: 0.85, emissive: '#F59E0B', emissiveIntensity: 0.15 }),
    goldenHeritage: new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.2, metalness: 0.95, emissive: '#F59E0B', emissiveIntensity: 0.3 }),
    glassGlowingAtrium: new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.1, metalness: 0.85, emissive: '#F59E0B', emissiveIntensity: 0.28, transparent: true, opacity: 0.88 }),
    glassDeepBlue: new THREE.MeshStandardMaterial({ color: '#1E3A8A', roughness: 0.15, metalness: 0.9, transparent: true, opacity: 0.85 }),
    emeraldLawn: new THREE.MeshStandardMaterial({ color: '#1B4D3E', roughness: 0.9, metalness: 0.02 }),
    plazaSandstone: new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.6, metalness: 0.08 }),
    plazaPavedDark: new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.65, metalness: 0.1 }),
    runningTrackRed: new THREE.MeshStandardMaterial({ color: '#881337', roughness: 0.85, metalness: 0.05 }),
    sportsTurfStriped: new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.9, metalness: 0.02 }),
    solarPanelReflective: new THREE.MeshStandardMaterial({ color: '#0B1B3A', roughness: 0.1, metalness: 0.95 }),
  }), []);

  return (
    <group>
      {/* 1. Main Manicured Campus Grounds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={materials.emeraldLawn}>
        <planeGeometry args={[90, 90]} />
      </mesh>

      {/* Grand Central Boulevard & Concentric Plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]} receiveShadow material={materials.plazaSandstone}>
        <planeGeometry args={[7, 36]} />
      </mesh>
      {/* Plaza Outer Marble Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1]} receiveShadow material={materials.plazaSandstone}>
        <circleGeometry args={[9.5, 48]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 1]} receiveShadow material={materials.plazaPavedDark}>
        <ringGeometry args={[9.1, 9.5, 48]} />
      </mesh>

      {/* Radiating Walkway Avenues to Wings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.015, 3]} receiveShadow material={materials.plazaSandstone}>
        <planeGeometry args={[14, 3.5]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.015, 3]} receiveShadow material={materials.plazaSandstone}>
        <planeGeometry args={[14, 3.5]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-13, 0.015, -4]} receiveShadow material={materials.plazaSandstone}>
        <planeGeometry args={[10, 3]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13, 0.015, -4]} receiveShadow material={materials.plazaSandstone}>
        <planeGeometry args={[10, 3]} />
      </mesh>

      {/* Monumental Plaza Fountain at Heart of Campus */}
      <MonumentalFountain position={[0, 0, 1]} />

      {/* Waving Oakridge Institutional Flag at Front Plaza */}
      <WavingFlag position={[2.5, 0, 7]} />

      {/* 2. HEROIC CENTRAL ACADEMY & CLOCKTOWER (FOUNDERS HALL) */}
      <group position={[0, 0, -6]}>
        {/* Monumental 3-Step Granite Base Podium */}
        <mesh position={[0, 0.15, 0]} receiveShadow material={materials.limestoneWarm}>
          <boxGeometry args={[18, 0.3, 11]} />
        </mesh>
        <mesh position={[0, 0.35, 1]} receiveShadow material={materials.limestoneWarm}>
          <boxGeometry args={[16, 0.2, 9]} />
        </mesh>
        <mesh position={[0, 0.5, 2.5]} receiveShadow material={materials.limestoneWarm}>
          <boxGeometry args={[12, 0.2, 6]} />
        </mesh>

        {/* Grand Classical Colonnade Portico (6 Ionic Pillars) */}
        {[-4.5, -2.7, -0.9, 0.9, 2.7, 4.5].map((x, i) => (
          <group key={`col-${i}`} position={[x, 3.5, 4.2]}>
            {/* Fluted Column Shaft */}
            <mesh castShadow material={materials.limestonePrestige}>
              <cylinderGeometry args={[0.26, 0.32, 6, 16]} />
            </mesh>
            {/* Ornate Capital & Base */}
            <mesh position={[0, 3.05, 0]} material={materials.copperBronzeTrim}>
              <boxGeometry args={[0.7, 0.2, 0.7]} />
            </mesh>
            <mesh position={[0, -3.05, 0]} material={materials.limestonePrestige}>
              <boxGeometry args={[0.7, 0.2, 0.7]} />
            </mesh>
          </group>
        ))}

        {/* Triangular Monumental Pediment */}
        <mesh position={[0, 7.2, 4.2]} castShadow material={materials.limestonePrestige}>
          <coneGeometry args={[6.5, 2.2, 3]} />
        </mesh>
        {/* Golden Institutional Seal Monogram on Pediment */}
        <mesh position={[0, 7.0, 4.8]} material={materials.goldenHeritage}>
          <cylinderGeometry args={[0.65, 0.65, 0.1, 24]} />
        </mesh>

        {/* Main 4-Story Academy Building Body */}
        <mesh position={[0, 3.8, 0]} castShadow receiveShadow material={materials.limestonePrestige}>
          <boxGeometry args={[16, 6.8, 8]} />
        </mesh>

        {/* Mansard Slate Roof with Copper Dormers */}
        <mesh position={[0, 7.8, 0]} castShadow material={materials.slateMansardRoof}>
          <boxGeometry args={[16.6, 1.4, 8.6]} />
        </mesh>

        {/* Grand Glass Illuminated Atrium Center */}
        <mesh position={[0, 3.2, 4.05]} material={materials.glassGlowingAtrium}>
          <boxGeometry args={[6, 5.5, 0.4]} />
        </mesh>

        {/* Multi-story Classroom Window Arrays with Interior Glow */}
        {[-6, -4, 4, 6].map((x, idx) => (
          <React.Fragment key={`admin-win-${idx}`}>
            <mesh position={[x, 2.2, 4.04]} material={materials.glassGlowingAtrium}>
              <boxGeometry args={[1.3, 1.6, 0.1]} />
            </mesh>
            <mesh position={[x, 4.8, 4.04]} material={materials.glassGlowingAtrium}>
              <boxGeometry args={[1.3, 1.6, 0.1]} />
            </mesh>
          </React.Fragment>
        ))}

        {/* THE SOARING 85-FOOT CLOCKTOWER */}
        <group position={[0, 7.5, 0]}>
          {/* Square Tower Base Tier */}
          <mesh position={[0, 2, 0]} castShadow material={materials.limestonePrestige}>
            <boxGeometry args={[4.2, 4, 4.2]} />
          </mesh>
          {/* Clock Chamber Tier with Arch Details */}
          <mesh position={[0, 5, 0]} castShadow material={materials.limestoneWarm}>
            <boxGeometry args={[3.6, 3, 3.6]} />
          </mesh>
          
          {/* 4 Illuminated Clock Faces */}
          {[
            [0, 5.2, 1.85, 0],
            [1.85, 5.2, 0, Math.PI / 2],
            [0, 5.2, -1.85, Math.PI],
            [-1.85, 5.2, 0, -Math.PI / 2],
          ].map(([x, y, z, rotY], i) => (
            <group key={`clock-face-${i}`} position={[x as number, y as number, z as number]} rotation={[0, rotY as number, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.limestonePrestige}>
                <cylinderGeometry args={[0.95, 0.95, 0.08, 32]} />
              </mesh>
              {/* Clock Golden Rim */}
              <mesh material={materials.goldenHeritage}>
                <ringGeometry args={[0.9, 0.98, 32]} />
              </mesh>
              {/* Glowing Clock Dial */}
              <mesh position={[0, 0, 0.02]} material={materials.glassGlowingAtrium}>
                <circleGeometry args={[0.88, 32]} />
              </mesh>
            </group>
          ))}

          {/* Open Belfry with Classical Arches & Cast Bell */}
          <mesh position={[0, 7.4, 0]} castShadow material={materials.copperBronzeTrim}>
            <boxGeometry args={[3.2, 2, 3.2]} />
          </mesh>
          {/* Bronze Bell */}
          <mesh position={[0, 7.2, 0]}>
            <cylinderGeometry args={[0.4, 0.8, 0.9, 16]} />
            <meshStandardMaterial color="#B45309" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Soaring Steep Verdigris Copper Spire & Spire Finial */}
          <mesh position={[0, 10.5, 0]} castShadow material={materials.copperVerdigrisDome}>
            <coneGeometry args={[1.8, 4.6, 8]} />
          </mesh>
          <mesh position={[0, 13.2, 0]} material={materials.goldenHeritage}>
            <sphereGeometry args={[0.25, 16, 16]} />
          </mesh>

          {/* Rooftop Astronomical Observatory Dome Wing */}
          <group position={[6.5, 0.5, -0.5]}>
            <mesh position={[0, 1.2, 0]} castShadow material={materials.limestoneWarm}>
              <cylinderGeometry args={[1.8, 1.8, 1.8, 24]} />
            </mesh>
            {/* Hemispherical Copper Dome */}
            <mesh position={[0, 2.1, 0]} castShadow material={materials.copperBronzeTrim}>
              <sphereGeometry args={[1.82, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>
          </group>
        </group>

        {/* Founders Hall Warm Evening Uplighting */}
        <pointLight position={[0, 4, 5.5]} color="#FDE68A" intensity={2.2} distance={14} />
      </group>

      {/* 3. ALEXANDER KNOWLEDGE HUB (NEOCLASSICAL DOMED ROTUNDA LIBRARY) */}
      <group position={[11, 0, 4]}>
        {/* Tiered Circular Podium */}
        <mesh position={[0, 0.2, 0]} receiveShadow material={materials.limestoneWarm}>
          <cylinderGeometry args={[5.8, 6.2, 0.4, 32]} />
        </mesh>
        
        {/* Ring of 12 Colonnade Columns */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = Math.cos(angle) * 4.6;
          const z = Math.sin(angle) * 4.6;
          return (
            <mesh key={`lib-col-${i}`} position={[x, 2.6, z]} castShadow material={materials.limestonePrestige}>
              <cylinderGeometry args={[0.2, 0.24, 4.8, 16]} />
            </mesh>
          );
        })}

        {/* Cylindrical Main Library Core with Glowing Arched Glass */}
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow material={materials.limestonePrestige}>
          <cylinderGeometry args={[4.2, 4.2, 4.6, 32]} />
        </mesh>
        <mesh position={[0, 2.5, 0]} material={materials.glassGlowingAtrium}>
          <cylinderGeometry args={[4.25, 4.25, 3.2, 32, 1, true, 0, Math.PI * 1.6]} />
        </mesh>

        {/* Entablature Cornice */}
        <mesh position={[0, 5.0, 0]} castShadow material={materials.copperBronzeTrim}>
          <cylinderGeometry args={[5.2, 5.2, 0.45, 32]} />
        </mesh>

        {/* Grand Emerald Verdigris Copper Dome */}
        <mesh position={[0, 5.8, 0]} castShadow material={materials.copperVerdigrisDome}>
          <sphereGeometry args={[4.2, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* Central Skylight Lantern */}
        <mesh position={[0, 7.9, 0]} material={materials.glassGlowingAtrium}>
          <cylinderGeometry args={[1.0, 1.0, 0.7, 16]} />
        </mesh>
        <mesh position={[0, 8.4, 0]} material={materials.goldenHeritage}>
          <coneGeometry args={[1.1, 0.8, 16]} />
        </mesh>

        <pointLight position={[0, 3, 0]} color="#F59E0B" intensity={2.0} distance={10} />
      </group>

      {/* 4. ACADEMIC & SCIENCE QUADRANGLE (STEM WINGS & SKYBRIDGE) */}
      <group position={[-11, 0, 3]}>
        {/* 4-Story Contemporary Academic Wing */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow material={materials.limestonePrestige}>
          <boxGeometry args={[11, 6.4, 6.5]} />
        </mesh>
        <mesh position={[3.5, 2.6, 4]} castShadow receiveShadow material={materials.imperialBrick}>
          <boxGeometry args={[5.5, 5.2, 4.5]} />
        </mesh>

        {/* Modular Glowing Science Window Grids */}
        {[-3.5, -1.8, 0, 1.8].map((x, i) => (
          <React.Fragment key={`stem-win-${i}`}>
            <mesh position={[x, 2.0, 3.3]} material={materials.glassGlowingAtrium}>
              <boxGeometry args={[1.2, 1.4, 0.1]} />
            </mesh>
            <mesh position={[x, 4.2, 3.3]} material={materials.glassGlowingAtrium}>
              <boxGeometry args={[1.2, 1.4, 0.1]} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Modern Glass Skybridge Connecting Academic Block to Central Academy */}
        <group position={[5.8, 3.8, -3.2]}>
          <mesh rotation={[0, Math.PI / 4, 0]} castShadow material={materials.glassGlowingAtrium}>
            <boxGeometry args={[4.2, 2.4, 1.4]} />
          </mesh>
          <mesh position={[0, -1.25, 0]} rotation={[0, Math.PI / 4, 0]} material={materials.copperBronzeTrim}>
            <boxGeometry args={[4.4, 0.2, 1.6]} />
          </mesh>
        </group>

        {/* Rooftop Angled Solar Photovoltaic Grid */}
        <mesh position={[0, 6.55, 0]} rotation={[0.25, 0, 0]} material={materials.solarPanelReflective}>
          <boxGeometry args={[9.5, 0.15, 5]} />
        </mesh>
      </group>

      {/* 5. OLYMPIA SPORTS COMPLEX & ATHLETIC STADIUM */}
      <group position={[-18, 0, -8]}>
        {/* Synthetic 8-Lane 400m Oval Running Track */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={materials.runningTrackRed}>
          <planeGeometry args={[14, 9.5]} />
        </mesh>
        {/* White Lane Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[5.2, 5.3, 32]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Striped Football / Soccer Turf */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={materials.sportsTurfStriped}>
          <planeGeometry args={[10, 6.5]} />
        </mesh>
        
        {/* Modern Covered Grandstand Stadium Canopy */}
        <mesh position={[-6, 2, 0]} castShadow material={materials.limestonePrestige}>
          <boxGeometry args={[2, 4, 8]} />
        </mesh>
        <mesh position={[-4.5, 4.2, 0]} rotation={[0, 0, -0.28]} material={materials.copperBronzeTrim}>
          <planeGeometry args={[4, 8.5]} />
        </mesh>

        {/* 4 Soaring Stadium Floodlight Towers */}
        {[
          [-6, 0, -4.5], [-6, 0, 4.5], [6, 0, -4.5], [6, 0, 4.5]
        ].map(([x, y, z], idx) => (
          <group key={`floodlight-${idx}`} position={[x, y, z]}>
            <mesh position={[0, 3.5, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.12, 7, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 7.1, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.2]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. GRAND CULTURAL AUDITORIUM & ARTS PAVILION */}
      <group position={[17, 0, -7]}>
        {/* Aerodynamic Tiered Shell Theater */}
        <mesh position={[0, 3, 0]} castShadow receiveShadow material={materials.limestonePrestige}>
          <boxGeometry args={[9, 6, 10]} />
        </mesh>
        <mesh position={[0, 6.2, 0]} rotation={[0.08, 0, 0]} material={materials.slateMansardRoof}>
          <boxGeometry args={[9.5, 0.6, 10.5]} />
        </mesh>
        {/* Soaring Glass Lobby Facade */}
        <mesh position={[0, 2.5, 5.05]} material={materials.glassGlowingAtrium}>
          <boxGeometry args={[7, 4.5, 0.1]} />
        </mesh>
        <pointLight position={[0, 3, 6]} color="#FDE68A" intensity={1.5} distance={9} />
      </group>

      {/* 7. PRESTIGE BOTANICAL GARDENS, AVENUE TREES & STREETLAMPS */}
      {/* Central Boulevard Cypress Sentinels */}
      {[
        [-4.2, 0, 5], [-4.2, 0, 9], [-4.2, 0, 13], [-4.2, 0, 17],
        [4.2, 0, 5], [4.2, 0, 9], [4.2, 0, 13], [4.2, 0, 17],
      ].map(([x, y, z], idx) => (
        <React.Fragment key={`cypress-ave-${idx}`}>
          <RealisticTree position={[x, y, z]} scale={1.15} type="cypress" />
          <CampusStreetlight position={[x > 0 ? x + 1.2 : x - 1.2, 0, z]} />
        </React.Fragment>
      ))}

      {/* Lush Campus Boundary Shade Oaks & Flowering Cherry Blossoms */}
      {[
        [-9, 0, 11], [-13, 0, 9], [-15, 0, 4],
        [9, 0, 11], [14, 0, 9], [16, 0, 3],
        [-6, 0, -2], [6, 0, -2],
        [-5, 0, -12], [5, 0, -12],
        [-13, 0, -13], [13, 0, -13],
      ].map(([x, y, z], idx) => (
        <RealisticTree
          key={`oak-${idx}`}
          position={[x, y, z]}
          scale={idx % 2 === 0 ? 1.25 : 1.05}
          type={idx % 3 === 0 ? 'blossom' : 'oak'}
        />
      ))}

      {/* Soaring Aerial Birds above Clocktower */}
      <SoaringFlock />

      {/* 8. INTERACTIVE 3D HOLOGRAPHIC HOTSPOT MARKERS */}
      {CAMPUS_HOTSPOTS.map((hotspot) => {
        const isSelected = activeHotspot === hotspot.id;
        const Icon = hotspot.icon;
        return (
          <group key={hotspot.id} position={hotspot.position}>
            <Float speed={2.0} rotationIntensity={0.15} floatIntensity={0.5}>
              <Html distanceFactor={18} center zIndexRange={[100, 0]}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHotspot?.(hotspot.id);
                  }}
                  className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full border transition-all duration-300 shadow-xl cursor-pointer select-none whitespace-nowrap backdrop-blur-md ${
                    isSelected
                      ? 'bg-teal-600 border-teal-300 text-white ring-4 ring-teal-400/40 scale-110'
                      : 'bg-navy-950/90 hover:bg-navy-900 border-white/25 hover:border-amber-400 text-white hover:scale-105'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center animate-pulse ${isSelected ? 'bg-amber-400' : 'bg-teal-400'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-navy-950" />
                  </div>
                  <Icon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-xs font-bold tracking-wide font-sans">{hotspot.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-400 text-navy-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider">
                    Inspect
                  </div>
                </button>
              </Html>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

// Camera Controller with Majestic Heroic Framing
function CameraController({ scrollProgress = 0, activeHotspot, reduceMotion }: { scrollProgress?: number; activeHotspot?: string | null; reduceMotion?: boolean }) {
  const vec = useRef(new THREE.Vector3());
  const lookAtVec = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (reduceMotion) {
      state.camera.position.lerp(new THREE.Vector3(2, 20, 28), 0.05);
      state.camera.lookAt(0, 4, -2);
      return;
    }

    if (activeHotspot) {
      const targetHotspot = CAMPUS_HOTSPOTS.find((h) => h.id === activeHotspot);
      if (targetHotspot) {
        vec.current.set(...targetHotspot.cameraTarget);
        lookAtVec.current.set(...targetHotspot.position);
        state.camera.position.lerp(vec.current, 0.06);
        state.camera.lookAt(lookAtVec.current);
        return;
      }
    }

    // Scroll-Driven Cinematic Hero Camera Angles
    const p = Math.max(0, Math.min(1, scrollProgress));

    let targetCamX = 0;
    let targetCamY = 22;
    let targetCamZ = 30;

    let targetLookX = 0;
    let targetLookY = 4;
    let targetLookZ = -3;

    if (p < 0.2) {
      // 0% -> Heroic Wide Vista (Camera framed to showcase Clocktower & Fountain while leaving left clear for text)
      const t = p / 0.2;
      targetCamX = THREE.MathUtils.lerp(2.5, 0, t);
      targetCamY = THREE.MathUtils.lerp(20, 14, t);
      targetCamZ = THREE.MathUtils.lerp(28, 20, t);
      targetLookX = THREE.MathUtils.lerp(-1, 0, t);
      targetLookY = THREE.MathUtils.lerp(5, 5.5, t);
      targetLookZ = THREE.MathUtils.lerp(-4, -5, t);
    } else if (p < 0.4) {
      // 20% to 40% -> Academic & STEM Quadrangle Focus
      const t = (p - 0.2) / 0.2;
      targetCamX = THREE.MathUtils.lerp(0, -8, t);
      targetCamY = THREE.MathUtils.lerp(14, 9, t);
      targetCamZ = THREE.MathUtils.lerp(20, 14, t);
      targetLookX = THREE.MathUtils.lerp(0, -9, t);
      targetLookY = THREE.MathUtils.lerp(5.5, 4, t);
      targetLookZ = THREE.MathUtils.lerp(-5, 2, t);
    } else if (p < 0.6) {
      // 40% to 60% -> Founders Memorial Hall & Clocktower
      const t = (p - 0.4) / 0.2;
      targetCamX = THREE.MathUtils.lerp(-8, 0, t);
      targetCamY = THREE.MathUtils.lerp(9, 10, t);
      targetCamZ = THREE.MathUtils.lerp(14, 10, t);
      targetLookX = THREE.MathUtils.lerp(-9, 0, t);
      targetLookY = THREE.MathUtils.lerp(4, 7, t);
      targetLookZ = THREE.MathUtils.lerp(2, -5, t);
    } else if (p < 0.8) {
      // 60% to 80% -> Sports Stadium & Running Track
      const t = (p - 0.6) / 0.2;
      targetCamX = THREE.MathUtils.lerp(0, -13, t);
      targetCamY = THREE.MathUtils.lerp(10, 8, t);
      targetCamZ = THREE.MathUtils.lerp(10, 6, t);
      targetLookX = THREE.MathUtils.lerp(0, -16, t);
      targetLookY = THREE.MathUtils.lerp(7, 2.5, t);
      targetLookZ = THREE.MathUtils.lerp(-5, -7, t);
    } else {
      // 80% to 100% -> Full Grand Panorama
      const t = (p - 0.8) / 0.2;
      targetCamX = THREE.MathUtils.lerp(-13, 0, t);
      targetCamY = THREE.MathUtils.lerp(8, 24, t);
      targetCamZ = THREE.MathUtils.lerp(6, 34, t);
      targetLookX = THREE.MathUtils.lerp(-16, 0, t);
      targetLookY = THREE.MathUtils.lerp(2.5, 3, t);
      targetLookZ = THREE.MathUtils.lerp(-7, -2, t);
    }

    vec.current.set(targetCamX, targetCamY, targetCamZ);
    lookAtVec.current.set(targetLookX, targetLookY, targetLookZ);

    state.camera.position.lerp(vec.current, 0.05);
    state.camera.lookAt(lookAtVec.current);
  });

  return null;
}

export const CampusCanvas: React.FC<CampusCanvasProps> = ({
  scrollProgress = 0,
  activeHotspot = null,
  onSelectHotspot,
  reduceMotion = false,
}) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-navy-950 text-slate-300 p-8 rounded-2xl border border-navy-800">
        <div className="text-center max-w-md">
          <Building className="w-12 h-12 text-teal-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">CampusOS Digital Campus</h3>
          <p className="text-sm text-slate-400">
            Interactive 3D model rendered in lightweight fallback mode. Explore modules directly from the navigation bar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        shadows
        camera={{ position: [2.5, 20, 28], fov: 40 }}
        className="w-full h-full"
      >
        {/* Atmosphere & Depth Fog */}
        <fog attach="fog" args={['#F8FAFC', 25, 95]} />

        {/* HEROIC GOLDEN HOUR & CINEMATIC LIGHTING SETUP */}
        {/* Soft Sky Blue Ambient Fill */}
        <ambientLight intensity={0.7} color="#E0F2FE" />
        
        {/* Main Golden Sunlight casting rich soft architectural shadows */}
        <directionalLight
          position={[24, 32, 20]}
          intensity={1.8}
          color="#FFFBEB"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={75}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.0001}
        />

        {/* Cool Azure Rim Lighting from opposite quadrant */}
        <directionalLight position={[-20, 16, -15]} intensity={0.65} color="#38BDF8" />

        {/* Warm Golden Atmosphere Motes / Sparkles floating above the campus */}
        <Sparkles
          count={70}
          scale={[50, 25, 50]}
          size={3.5}
          speed={0.3}
          opacity={0.55}
          color="#F59E0B"
        />

        {/* Master 3D Architecture */}
        <CampusArchitecture activeHotspot={activeHotspot} onSelectHotspot={onSelectHotspot} />

        {/* Camera Scroll Coordinator */}
        <CameraController scrollProgress={scrollProgress} activeHotspot={activeHotspot} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
};
