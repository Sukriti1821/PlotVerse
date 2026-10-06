import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Safe WebGL detection
function checkWebGLSupport() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// Stylized Pine Tree Component
function PineTree({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Wooden Trunk */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.7, 5]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Bottom Foliage Tier */}
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.55, 0.8, 5]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} flatShading />
      </mesh>
      {/* Middle Foliage Tier */}
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.42, 0.7, 5]} />
        <meshStandardMaterial color="#047857" roughness={0.8} flatShading />
      </mesh>
      {/* Top Foliage Tier */}
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.28, 0.6, 5]} />
        <meshStandardMaterial color="#059669" roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

// Cozy Campfire with Flickering Light & Floating Embers
function Campfire({ position = [0, 0, 0] }) {
  const lightRef = useRef();
  const flameRef = useRef();
  const embersRef = useRef();

  // Procedural rising campfire embers
  const emberCount = 20;
  const [emberPositions, emberSpeeds] = useMemo(() => {
    const pos = new Float32Array(emberCount * 3);
    const spd = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      spd[i] = 0.3 + Math.random() * 0.5;
    }
    return [pos, spd];
  }, []);

  const emberGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
    return geo;
  }, [emberPositions]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // Warm campfire light flicker
    if (lightRef.current) {
      lightRef.current.intensity = 2.2 + Math.sin(t * 12) * 0.4 + Math.cos(t * 18) * 0.3;
    }
    // Flame bobbing animation
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 14) * 0.15;
      flameRef.current.scale.x = 1 + Math.cos(t * 10) * 0.1;
    }
    // Embers rising animation safely checking geometry and attributes
    if (embersRef.current?.geometry?.attributes?.position) {
      const posAttr = embersRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      if (arr) {
        for (let i = 0; i < emberCount; i++) {
          arr[i * 3 + 1] += emberSpeeds[i] * delta * 0.8;
          arr[i * 3] += Math.sin(t * 4 + i) * delta * 0.1;
          if (arr[i * 3 + 1] > 1.4) {
            arr[i * 3 + 1] = 0.05;
            arr[i * 3] = (Math.random() - 0.5) * 0.3;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group position={position}>
      {/* Stone Ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 0.32;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.06, Math.sin(angle) * r]}
            rotation={[0, angle, 0]}
          >
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} flatShading />
          </mesh>
        );
      })}

      {/* Crossed Firewood Logs */}
      <mesh position={[0, 0.08, 0]} rotation={[0.2, 0.6, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 4]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-0.2, -0.6, -0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 4]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Stylized Glowing Flame Mesh */}
      <mesh ref={flameRef} position={[0, 0.2, 0]}>
        <coneGeometry args={[0.16, 0.35, 5]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#ea580c"
          emissiveIntensity={1.8}
          roughness={0.2}
          flatShading
        />
      </mesh>

      {/* Dynamic Flickering Hearth Light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color="#fbbf24"
        intensity={2.2}
        distance={4.5}
        decay={2}
      />

      {/* Floating Campfire Embers */}
      <points ref={embersRef} position={[0, 0.2, 0]} geometry={emberGeometry}>
        <pointsMaterial
          size={0.06}
          color="#fde047"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Wooden Deck Observation Platform overlooking the cliff
function WoodenDeck({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* 5 Wooden Planks */}
      {[-0.32, -0.16, 0, 0.16, 0.32].map((xOffset, i) => (
        <mesh key={i} position={[xOffset, 0.04, 0]}>
          <boxGeometry args={[0.14, 0.04, 1.1]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
      ))}
      {/* Cross Support Beams */}
      <mesh position={[0, 0.01, -0.4]}>
        <boxGeometry args={[0.82, 0.03, 0.07]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.01, 0.4]}>
        <boxGeometry args={[0.82, 0.03, 0.07]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Cozy Stool/Chair */}
      <mesh position={[0.18, 0.16, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 5]} />
        <meshStandardMaterial color="#d97706" roughness={0.8} />
      </mesh>
      {/* Fairy Lantern on Stool */}
      <mesh position={[0.18, 0.3, -0.2]}>
        <boxGeometry args={[0.07, 0.1, 0.07]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#eab308"
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight position={[0.18, 0.32, -0.2]} color="#fef08a" intensity={0.9} distance={2} />
    </group>
  );
}

// Low-poly Fluffy Cloud floating in the sky
function FloatingCloud({ position = [0, 0, 0], scale = 1, speed = 0.2 }) {
  const cloudRef = useRef();

  useFrame(({ clock }) => {
    if (!cloudRef.current) return;
    const t = clock.getElapsedTime() * speed;
    cloudRef.current.position.x = position[0] + Math.sin(t) * 0.4;
    cloudRef.current.position.y = position[1] + Math.cos(t * 1.2) * 0.15;
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.32, 5, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} flatShading transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.26, -0.05, 0]}>
        <sphereGeometry args={[0.22, 5, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} flatShading transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.24, -0.04, 0.05]}>
        <sphereGeometry args={[0.24, 5, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} flatShading transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// The Entire Miniature Floating Island Diorama
function MiniatureNatureIsland() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Subterranean Cliff Base (Stone Rock Pedestal) */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[2.5, 1.7, 1.3, 7]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} flatShading />
      </mesh>

      {/* 2. Vibrant Emerald Meadow / Plot Grass Top */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.58, 2.52, 0.18, 7]} />
        <meshStandardMaterial color="#059669" roughness={0.7} flatShading />
      </mesh>

      {/* 3. Mountain Ridge Crest on the island corner */}
      <group position={[-1.1, 0.1, -0.9]}>
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[1.1, 1.8, 5]} />
          <meshStandardMaterial color="#0f3e30" roughness={0.85} flatShading />
        </mesh>
        {/* Snow Peak */}
        <mesh position={[0, 1.45, 0]}>
          <coneGeometry args={[0.42, 0.7, 5]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} flatShading />
        </mesh>
      </group>

      {/* 4. Pine Trees dotted across the plot */}
      <PineTree position={[-0.4, 0.1, -1.3]} scale={0.9} />
      <PineTree position={[-1.3, 0.1, 0.3]} scale={1.1} />
      <PineTree position={[-0.9, 0.1, 0.9]} scale={0.75} />
      <PineTree position={[0.7, 0.1, -1.2]} scale={1.0} />

      {/* 5. Cozy Wooden Deck on the Scenic Rim */}
      <WoodenDeck position={[1.1, 0.12, 0.3]} />

      {/* 6. Glowing Campfire in the Center Clearing */}
      <Campfire position={[0.1, 0.12, 0.0]} />

      {/* 7. Decorative Natural Boulders */}
      <mesh position={[0.9, 0.16, -0.7]} rotation={[0.4, 0.2, 0.5]}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.3, 0.14, 1.4]} rotation={[0.1, 0.6, 0.2]}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
      </mesh>

      {/* 8. Floating Puffy Clouds around the Island */}
      <FloatingCloud position={[-2.4, 1.1, 1.2]} scale={0.9} speed={0.4} />
      <FloatingCloud position={[2.6, 0.6, -1.0]} scale={0.75} speed={0.3} />
      <FloatingCloud position={[0.4, 1.6, -2.2]} scale={0.85} speed={0.35} />
    </group>
  );
}

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.warn("3D Hero Scene error caught, using fallback:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] flex items-center justify-center p-6">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/60 p-8 text-center backdrop-blur shadow-sm max-w-sm">
            <span className="text-3xl">🏔️</span>
            <p className="mt-2 font-bold text-slate-800">Panoramic Himalayan Retreats</p>
            <p className="text-xs text-slate-500 mt-1">Scenic plots, pine glades & starlit stays ready to explore.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main Export Component
export default function HeroScene() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  if (!hasWebGL) {
    return null;
  }

  return (
    <SceneErrorBoundary>
      <div
        className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] select-none"
        style={{ touchAction: "none" }}
      >
        <Canvas
          camera={{ position: [3.8, 3.2, 5.0], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Soft Sky & Daylight Ambient Lighting */}
          <ambientLight intensity={1.1} color="#ffffff" />

          {/* Crisp Himalayan Sunlight casting depth shadows */}
          <directionalLight position={[6, 10, 4]} intensity={1.8} color="#fffbeb" castShadow />

          {/* Soft Meadow Fill Light */}
          <directionalLight position={[-6, 4, -4]} intensity={0.65} color="#a7f3d0" />

          {/* Interactive Floating Island with Gentle Levitation & User Rotation */}
          <Suspense fallback={null}>
            <Float
              speed={1.8} // Animation speed
              rotationIntensity={0.25} // XYZ rotation intensity
              floatIntensity={0.5} // Up/down float intensity
              floatingRange={[-0.1, 0.1]}
            >
              <MiniatureNatureIsland />
            </Float>

            {/* Smooth Orbit Controls with auto-rotate and angle clamping */}
            <OrbitControls
              enableZoom={false} // Prevent stealing page scroll
              enablePan={false} // Keep centered
              autoRotate={true} // Gentle idle rotation
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI / 4.2} // Prevent viewing from directly above
              maxPolarAngle={Math.PI / 2.05} // Prevent viewing from under the ground
            />
          </Suspense>
        </Canvas>

        {/* Subtle Hint Badge */}
        <div className="pointer-events-none absolute bottom-3 right-4 sm:right-6 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur-md border border-slate-200/90 shadow-sm flex items-center gap-1.5">
          <span className="text-emerald-600">✦</span> Drag to explore plot
        </div>
      </div>
    </SceneErrorBoundary>
  );
}
