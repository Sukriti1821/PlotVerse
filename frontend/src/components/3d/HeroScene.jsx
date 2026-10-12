import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SCENE_COLORS } from "./sceneConstants";

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
        <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.9} />
      </mesh>
      {/* Bottom Foliage Tier */}
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.55, 0.8, 5]} />
        <meshStandardMaterial color={SCENE_COLORS.treeFoliageDark} roughness={0.8} flatShading />
      </mesh>
      {/* Middle Foliage Tier */}
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.42, 0.7, 5]} />
        <meshStandardMaterial color={SCENE_COLORS.treeFoliageLight} roughness={0.8} flatShading />
      </mesh>
      {/* Top Foliage Tier */}
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.28, 0.6, 5]} />
        <meshStandardMaterial color={SCENE_COLORS.treeFoliageDark} roughness={0.75} flatShading />
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
            <meshStandardMaterial color={SCENE_COLORS.stones} roughness={0.9} flatShading />
          </mesh>
        );
      })}

      {/* Crossed Firewood Logs */}
      <mesh position={[0, 0.08, 0]} rotation={[0.2, 0.6, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 4]} />
        <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-0.2, -0.6, -0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 4]} />
        <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.9} />
      </mesh>

      {/* Stylized Glowing Flame Mesh */}
      <mesh ref={flameRef} position={[0, 0.2, 0]}>
        <coneGeometry args={[0.16, 0.35, 5]} />
        <meshStandardMaterial
          color={SCENE_COLORS.fireGlow}
          emissive={SCENE_COLORS.fireCore}
          emissiveIntensity={1.8}
          roughness={0.2}
          flatShading
        />
      </mesh>

      {/* Dynamic Flickering Hearth Light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color={SCENE_COLORS.lanternLight}
        intensity={2.2}
        distance={4.5}
        decay={2}
      />

      {/* Floating Campfire Embers */}
      <points ref={embersRef} position={[0, 0.2, 0]} geometry={emberGeometry}>
        <pointsMaterial
          size={0.06}
          color={SCENE_COLORS.fireGlow}
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
          <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.7} />
        </mesh>
      ))}
      {/* Cross Support Beams */}
      <mesh position={[0, 0.01, -0.4]}>
        <boxGeometry args={[0.82, 0.03, 0.07]} />
        <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.01, 0.4]}>
        <boxGeometry args={[0.82, 0.03, 0.07]} />
        <meshStandardMaterial color={SCENE_COLORS.woodTrunk} roughness={0.8} />
      </mesh>
      {/* Cozy Stool/Chair */}
      <mesh position={[0.18, 0.16, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 5]} />
        <meshStandardMaterial color={SCENE_COLORS.campsitePlot} roughness={0.8} />
      </mesh>
      {/* Fairy Lantern on Stool */}
      <mesh position={[0.18, 0.3, -0.2]}>
        <boxGeometry args={[0.07, 0.1, 0.07]} />
        <meshStandardMaterial
          color={SCENE_COLORS.lanternLight}
          emissive={SCENE_COLORS.lanternLight}
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight position={[0.18, 0.32, -0.2]} color={SCENE_COLORS.lanternLight} intensity={0.9} distance={2} />
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
        <meshStandardMaterial color={SCENE_COLORS.glacierRidge} roughness={0.9} flatShading transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.26, -0.05, 0]}>
        <sphereGeometry args={[0.22, 5, 4]} />
        <meshStandardMaterial color={SCENE_COLORS.glacierRidge} roughness={0.9} flatShading transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.24, -0.04, 0.05]}>
        <sphereGeometry args={[0.24, 5, 4]} />
        <meshStandardMaterial color={SCENE_COLORS.glacierRidge} roughness={0.9} flatShading transparent opacity={0.7} />
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
        <meshStandardMaterial color={SCENE_COLORS.campsitePlot} roughness={0.9} flatShading />
      </mesh>

      {/* 2. Mountain Ridge Top Surface */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.58, 2.52, 0.18, 7]} />
        <meshStandardMaterial color={SCENE_COLORS.groundPlateau} roughness={0.7} flatShading />
      </mesh>

      {/* 3. Mountain Ridge Crest on the island corner */}
      <group position={[-1.1, 0.1, -0.9]}>
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[1.1, 1.8, 5]} />
          <meshStandardMaterial color={SCENE_COLORS.distantMountains} roughness={0.85} flatShading />
        </mesh>
        {/* Snow Peak */}
        <mesh position={[0, 1.45, 0]}>
          <coneGeometry args={[0.42, 0.7, 5]} />
          <meshStandardMaterial color={SCENE_COLORS.snowCaps} roughness={0.5} flatShading />
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
        <meshStandardMaterial color={SCENE_COLORS.stones} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.3, 0.14, 1.4]} rotation={[0.1, 0.6, 0.2]}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={SCENE_COLORS.stones} roughness={0.85} flatShading />
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
          <div className="rounded-3xl border border-white/10 bg-dusk p-8 text-center backdrop-blur shadow-sm max-w-sm">
            <span className="text-3xl">🏔️</span>
            <p className="mt-2 font-bold text-snow">Panoramic Himalayan Retreats</p>
            <p className="text-xs text-light-slate mt-1">Scenic plots, pine glades & starlit stays ready to explore.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main Inner 3D Component
function HeroSceneInner() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
    const checkDevice = () => {
      const small = typeof window !== "undefined" && window.innerWidth < 768;
      const lowCores =
        typeof navigator !== "undefined" &&
        navigator.hardwareConcurrency &&
        navigator.hardwareConcurrency <= 4;
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData =
        typeof navigator !== "undefined" &&
        navigator.connection &&
        Boolean(navigator.connection.saveData);

      setIsSmallScreen(Boolean(small || prefersReducedMotion));
      setIsLowEnd(Boolean(lowCores || saveData));
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Mobile / Low-End Fallback: Static navy hero with warm saffron sun motif
  if (!hasWebGL || isSmallScreen || isLowEnd) {
    return (
      <div className="relative w-full h-[340px] sm:h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-navy-deep">
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy to-dusk" />
        {/* Saffron sun motif */}
        <div className="absolute top-10 right-14 w-28 h-28 rounded-full bg-saffron/20 blur-2xl" />
        <div className="absolute top-14 right-18 w-16 h-16 rounded-full bg-saffron/40 blur-md" />
        <div className="relative z-10 p-6 text-center text-snow max-w-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 border border-saffron/30 px-3 py-1 text-[11px] font-bold text-saffron uppercase tracking-wider backdrop-blur-md mb-2">
            🏔️ Himalayan Dusk
          </span>
          <h4 className="text-base font-bold text-snow">Scenic Mountain Plots</h4>
          <p className="text-xs text-light-slate mt-1">
            Discover secluded glades, alpine meadows, and ridge-line camps by the hour.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] select-none"
      style={{ touchAction: "none" }}
    >
        <Canvas
          camera={{ position: [3.8, 3.2, 5.0], fov: 42 }}
          gl={{
            antialias: !isLowEnd,
            alpha: true,
            powerPreference: isLowEnd ? "low-power" : "high-performance",
          }}
          dpr={[1, 1.5]}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Ambient Lighting */}
          <ambientLight intensity={0.9} color={SCENE_COLORS.ambientLight} />

          {/* Warm Saffron Himalayan Sunlight */}
          <directionalLight position={[6, 10, 4]} intensity={2.2} color={SCENE_COLORS.sunLight} castShadow />

          {/* Cool Dusk Fill Light */}
          <directionalLight position={[-6, 4, -4]} intensity={0.8} color={SCENE_COLORS.fillLight} />

          {/* Interactive Floating Island */}
          <Suspense fallback={null}>
            <Float
              speed={1.8}
              rotationIntensity={0.25}
              floatIntensity={0.5}
              floatingRange={[-0.1, 0.1]}
            >
              <MiniatureNatureIsland />
            </Float>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI / 4.2}
              maxPolarAngle={Math.PI / 2.05}
            />
          </Suspense>
        </Canvas>

        {/* Subtle Hint Badge */}
        <div className="pointer-events-none absolute bottom-3 right-4 sm:right-6 rounded-full bg-dusk/90 px-3 py-1 text-[11px] font-semibold text-snow backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
          <span className="text-saffron">✦</span> Drag to explore plot
        </div>
      </div>
  );
}

export default function HeroScene(props) {
  return (
    <SceneErrorBoundary>
      <HeroSceneInner {...props} />
    </SceneErrorBoundary>
  );
}
