"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import RoomGLBMap from "./RoomGLBMap";
import Door from "./Door";

// ── Sky dome ─────────────────────────────────────────────────────────────────
function SkyDome() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const vertexShader = `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    varying vec3 vWorldPos;
    void main() {
      float t = clamp((normalize(vWorldPos).y + 0.1) / 1.1, 0.0, 1.0);
      vec3 zenith = vec3(0.35, 0.65, 1.0);
      vec3 horizon = vec3(0.85, 0.92, 1.0);
      vec3 col = mix(horizon, zenith, pow(t, 0.6));
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[180, 32, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Clouds ────────────────────────────────────────────────────────────────────
function Clouds() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.003;
  });
  const clouds = useMemo(() => [
    { pos: [30, 28, -60] as [number,number,number], s: [8,3,5] as [number,number,number] },
    { pos: [-50, 32, -40] as [number,number,number], s: [12,4,6] as [number,number,number] },
    { pos: [60, 25, 20] as [number,number,number], s: [10,3,7] as [number,number,number] },
    { pos: [-20, 30, 70] as [number,number,number], s: [9,3,5] as [number,number,number] },
    { pos: [10, 35, -80] as [number,number,number], s: [14,4,8] as [number,number,number] },
  ], []);
  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.s}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshToonMaterial color="#ffffff" transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  );
}

// ── Terrain (rolling hills) ───────────────────────────────────────────────────
function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(200, 200, 80, 80);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // plane is XY before rotation
      // Keep center flat for gameplay, hills at edges
      const dist = Math.sqrt(x * x + z * z);
      const flatZone = Math.max(0, 1 - dist / 18);
      const hill =
        Math.sin(x * 0.08) * Math.cos(z * 0.07) * 3.5 +
        Math.sin(x * 0.15 + 1.2) * Math.sin(z * 0.12) * 2.0 +
        Math.cos(x * 0.05 - 0.8) * Math.cos(z * 0.06) * 4.0;
      pos.setZ(i, hill * (1 - flatZone * 0.95));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
      <meshToonMaterial color="#5a9e4a" />
    </mesh>
  );
}

// ── Flat physics floor (invisible, for RigidBody) ─────────────────────────────
function PhysicsFloor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -0.15, 0]}>
      <mesh>
        <boxGeometry args={[200, 0.2, 200]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </RigidBody>
  );
}

// ── Grass patches ─────────────────────────────────────────────────────────────
function GrassPatches() {
  const patches = useMemo(() => {
    const arr: { pos: [number,number,number]; r: number; s: number }[] = [];
    const rng = (n: number) => (Math.sin(n * 127.1 + 311.7) * 0.5 + 0.5);
    for (let i = 0; i < 120; i++) {
      const angle = rng(i * 2) * Math.PI * 2;
      const radius = 5 + rng(i * 3) * 55;
      arr.push({
        pos: [Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius],
        r: rng(i * 5) * Math.PI,
        s: 0.4 + rng(i * 7) * 0.8,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {patches.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[-Math.PI / 2, p.r, 0]} scale={[p.s, p.s, 1]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshToonMaterial color={i % 3 === 0 ? "#4caf50" : i % 3 === 1 ? "#66bb6a" : "#81c784"} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ── Stylized tree ─────────────────────────────────────────────────────────────
function Tree({ position, scale = 1, variant = 0 }: {
  position: [number,number,number];
  scale?: number;
  variant?: number;
}) {
  const trunkColor = "#5d4037";
  const foliageColors = ["#2e7d32", "#388e3c", "#43a047", "#1b5e20"];
  const fc = foliageColors[variant % foliageColors.length];
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.8, 7]} />
        <meshToonMaterial color={trunkColor} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <coneGeometry args={[1.1, 1.8, 8]} />
        <meshToonMaterial color={fc} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshToonMaterial color={foliageColors[(variant + 1) % foliageColors.length]} />
      </mesh>
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[0.5, 1.1, 8]} />
        <meshToonMaterial color={foliageColors[(variant + 2) % foliageColors.length]} />
      </mesh>
    </group>
  );
}

// ── Sakura tree ───────────────────────────────────────────────────────────────
function SakuraTree({ position, scale = 1 }: { position: [number,number,number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.04;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 2.4, 7]} />
        <meshToonMaterial color="#795548" />
      </mesh>
      {[
        [0, 3.0, 0, 1.4],
        [-0.6, 2.6, 0.4, 1.0],
        [0.6, 2.7, -0.3, 1.0],
        [0, 3.6, 0, 0.9],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 8, 7]} />
          <meshToonMaterial color={i % 2 === 0 ? "#f48fb1" : "#f8bbd0"} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}

// ── Rocks ─────────────────────────────────────────────────────────────────────
function Rock({ position, scale = [1,1,1], rotation = 0 }: {
  position: [number,number,number];
  scale?: [number,number,number];
  rotation?: number;
}) {
  return (
    <mesh position={position} scale={scale} rotation={[0.2, rotation, 0.1]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshToonMaterial color="#78909c" />
    </mesh>
  );
}

// ── Water pond ────────────────────────────────────────────────────────────────
function WaterPond({ position }: { position: [number,number,number] }) {
  const matRef = useRef<THREE.MeshToonMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 1.2) * 0.08;
    }
  });
  return (
    <group position={position}>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3.5, 32]} />
        <meshToonMaterial
          ref={matRef}
          color="#29b6f6"
          emissive="#0288d1"
          emissiveIntensity={0.15}
          transparent
          opacity={0.82}
        />
      </mesh>
      {/* Pond rim rocks */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Rock
            key={i}
            position={[Math.cos(a) * 3.8, 0, Math.sin(a) * 3.8]}
            scale={[0.4 + (i % 3) * 0.15, 0.3, 0.4]}
            rotation={a}
          />
        );
      })}
      <pointLight position={[0, 1, 0]} color="#29b6f6" intensity={0.8} distance={8} />
    </group>
  );
}

// ── Distant mountains ─────────────────────────────────────────────────────────
function Mountains() {
  const peaks = useMemo(() => [
    { pos: [-80, 0, -100] as [number,number,number], s: [18, 28, 14] as [number,number,number] },
    { pos: [-40, 0, -110] as [number,number,number], s: [14, 22, 12] as [number,number,number] },
    { pos: [20, 0, -105] as [number,number,number], s: [20, 32, 16] as [number,number,number] },
    { pos: [70, 0, -95] as [number,number,number], s: [16, 25, 13] as [number,number,number] },
    { pos: [100, 0, -80] as [number,number,number], s: [12, 20, 10] as [number,number,number] },
    { pos: [-100, 0, -60] as [number,number,number], s: [15, 24, 12] as [number,number,number] },
  ], []);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.s}>
          <coneGeometry args={[1, 1, 7]} />
          <meshToonMaterial color={i % 2 === 0 ? "#78909c" : "#90a4ae"} />
        </mesh>
      ))}
    </group>
  );
}

// ── Floating light orbs (Genshin wisps) ───────────────────────────────────────
function LightOrbs() {
  const orbsRef = useRef<THREE.Group>(null);
  const orbData = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: (Math.sin(i * 2.4) * 8),
    z: (Math.cos(i * 2.4) * 8),
    phase: i * 0.7,
    speed: 0.5 + (i % 4) * 0.2,
    color: ["#ffd54f", "#80deea", "#ce93d8", "#a5d6a7", "#ef9a9a"][i % 5],
  })), []);

  useFrame(({ clock }) => {
    if (!orbsRef.current) return;
    orbsRef.current.children.forEach((orb, i) => {
      const d = orbData[i];
      orb.position.y = 1.2 + Math.sin(clock.elapsedTime * d.speed + d.phase) * 0.6;
      orb.position.x = d.x + Math.sin(clock.elapsedTime * 0.3 + d.phase) * 1.5;
      orb.position.z = d.z + Math.cos(clock.elapsedTime * 0.25 + d.phase) * 1.5;
    });
  });

  return (
    <group ref={orbsRef}>
      {orbData.map((d, i) => (
        <group key={i} position={[d.x, 1.5, d.z]}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshToonMaterial color={d.color} emissive={d.color} emissiveIntensity={1.5} />
          </mesh>
          <pointLight color={d.color} intensity={0.6} distance={4} />
        </group>
      ))}
    </group>
  );
}

// ── Sakura petals falling ─────────────────────────────────────────────────────
const PETAL_COUNT = 40;
function SakuraPetals() {
  const petalsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const data = useRef(
    Array.from({ length: PETAL_COUNT }, (_, i) => ({
      x: (Math.sin(i * 137.5) * 0.5 + 0.5) * 30 - 15,
      y: 4 + (Math.cos(i * 97.3) * 0.5 + 0.5) * 8,
      z: (Math.sin(i * 73.1) * 0.5 + 0.5) * 30 - 15,
      vy: 0.01 + (i % 7) * 0.003,
      vx: Math.sin(i * 53.7) * 0.004,
      rz: Math.random() * Math.PI * 2,
      vrz: (Math.sin(i * 41.3) - 0.5) * 0.05,
    }))
  );

  useFrame(() => {
    if (!petalsRef.current) return;
    data.current.forEach((p, i) => {
      p.y -= p.vy;
      p.x += p.vx;
      p.rz += p.vrz;
      if (p.y < -1) {
        p.y = 10 + Math.random() * 5;
        p.x = (Math.random() - 0.5) * 30;
        p.z = (Math.random() - 0.5) * 30;
      }
      dummy.current.position.set(p.x, p.y, p.z);
      dummy.current.rotation.set(0.4, 0, p.rz);
      dummy.current.scale.setScalar(0.1 + (i % 4) * 0.02);
      dummy.current.updateMatrix();
      petalsRef.current!.setMatrixAt(i, dummy.current.matrix);
    });
    petalsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={petalsRef} args={[undefined, undefined, PETAL_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshToonMaterial color="#f8bbd0" side={THREE.DoubleSide} transparent opacity={0.88} />
    </instancedMesh>
  );
}

// ── Pavilion (outdoor rest area) ──────────────────────────────────────────────
function Pavilion({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      {/* Roof */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[3.5, 1.2, 8]} />
        <meshToonMaterial color="#c62828" />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <cylinderGeometry args={[3.6, 3.6, 0.18, 8]} />
        <meshToonMaterial color="#b71c1c" />
      </mesh>
      {/* Pillars */}
      {[[-2.5, 0, -2.5], [2.5, 0, -2.5], [-2.5, 0, 2.5], [2.5, 0, 2.5]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, 1.35, z]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 2.7, 8]} />
          <meshToonMaterial color="#d32f2f" />
        </mesh>
      ))}
      {/* Floor platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[6, 0.16, 6]} />
        <meshToonMaterial color="#8d6e63" />
      </mesh>
      {/* Lanterns */}
      {[[-2.5, 2.5, -2.5], [2.5, 2.5, -2.5], [-2.5, 2.5, 2.5], [2.5, 2.5, 2.5]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
            <meshToonMaterial color="#ff6f00" emissive="#ff6f00" emissiveIntensity={0.8} />
          </mesh>
          <pointLight color="#ffcc02" intensity={0.5} distance={5} />
        </group>
      ))}
    </group>
  );
}

// ── Torii gate ────────────────────────────────────────────────────────────────
function ToriiGate({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Left pillar */}
      <mesh position={[-1.6, 2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 4, 8]} />
        <meshToonMaterial color="#c62828" />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.6, 2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 4, 8]} />
        <meshToonMaterial color="#c62828" />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[4.2, 0.28, 0.28]} />
        <meshToonMaterial color="#b71c1c" />
      </mesh>
      {/* Second beam */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[3.6, 0.2, 0.22]} />
        <meshToonMaterial color="#c62828" />
      </mesh>
    </group>
  );
}

// ── Stone path ────────────────────────────────────────────────────────────────
function StonePath() {
  const stones = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    pos: [
      Math.sin(i * 0.3) * 0.6,
      0.01,
      -12 + i * 1.8,
    ] as [number,number,number],
    r: Math.sin(i * 7.3) * 0.3,
    s: 0.7 + Math.sin(i * 3.7) * 0.15,
  })), []);
  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[-Math.PI / 2, s.r, 0]} scale={s.s}>
          <circleGeometry args={[0.55, 7]} />
          <meshToonMaterial color="#90a4ae" />
        </mesh>
      ))}
    </group>
  );
}

// ── Flower patches ────────────────────────────────────────────────────────────
function Flowers() {
  const flowers = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const a = i * 137.508 * (Math.PI / 180);
    const r = 4 + (i % 8) * 1.5;
    return {
      pos: [Math.cos(a) * r, 0.15, Math.sin(a) * r] as [number,number,number],
      color: ["#f06292", "#fff176", "#ce93d8", "#80cbc4", "#ffb74d"][i % 5],
    };
  }), []);
  return (
    <group>
      {flowers.map((f, i) => (
        <group key={i} position={f.pos}>
          {/* Stem */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
            <meshToonMaterial color="#4caf50" />
          </mesh>
          {/* Bloom */}
          <mesh>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshToonMaterial color={f.color} emissive={f.color} emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Main Environment ──────────────────────────────────────────────────────────
export interface RoomEnvironmentProps {
  wallColor?: string;
  floorColor?: string;
  accentColor?: string;
  ambientColor?: string;
  rimColor?: string;
  fogColor?: string;
  useGLBMap?: boolean;
  mapScale?: number;
  mapOffsetY?: number;
  playerPosRef?: React.RefObject<THREE.Vector3>;
}

export default function RoomEnvironment({
  ambientColor = "#c8e6ff",
  rimColor = "#7dd3fc",
  fogColor = "#c8e6ff",
  useGLBMap = true,
  mapScale = 1,
  mapOffsetY = 0,
  playerPosRef,
}: RoomEnvironmentProps) {
  return (
    <group>
      {/* Sky */}
      <SkyDome />
      <Clouds />

      {/* ── Map: GLB or procedural ── */}
      {useGLBMap ? (
        <>
          <RoomGLBMap
            url="/models-map/room.glb"
            position={[0, mapOffsetY, 0]}
            scale={mapScale}
            applyToon={false}
          />
          {/* Fallback invisible floor so player never falls through */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, mapOffsetY - 0.1, 0]}>
            <mesh>
              <boxGeometry args={[200, 0.2, 200]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          </RigidBody>
        </>
      ) : (
        <>
          <Terrain />
          <PhysicsFloor />
          <GrassPatches />
          <Flowers />
          <StonePath />
        </>
      )}

      {/* Scenery — always shown */}
      <Mountains />
      <WaterPond position={[12, 0, 8]} />

      {/* Trees ring around play area */}
      {[
        { p: [-14, 0, -14] as [number,number,number], v: 0, s: 1.2 },
        { p: [14, 0, -14] as [number,number,number], v: 1, s: 1.0 },
        { p: [-14, 0, 14] as [number,number,number], v: 2, s: 1.3 },
        { p: [14, 0, 14] as [number,number,number], v: 3, s: 1.1 },
        { p: [-18, 0, 0] as [number,number,number], v: 0, s: 1.4 },
        { p: [18, 0, 0] as [number,number,number], v: 1, s: 1.2 },
        { p: [0, 0, -18] as [number,number,number], v: 2, s: 1.0 },
        { p: [-10, 0, -16] as [number,number,number], v: 3, s: 0.9 },
        { p: [10, 0, -16] as [number,number,number], v: 0, s: 1.1 },
        { p: [-16, 0, -8] as [number,number,number], v: 1, s: 1.0 },
        { p: [16, 0, -8] as [number,number,number], v: 2, s: 1.2 },
        { p: [-16, 0, 8] as [number,number,number], v: 3, s: 1.0 },
      ].map((t, i) => (
        <Tree key={i} position={t.p} variant={t.v} scale={t.s} />
      ))}

      {/* Sakura trees near pavilion */}
      <SakuraTree position={[-6, 0, -10]} scale={1.1} />
      <SakuraTree position={[6, 0, -10]} scale={1.0} />
      <SakuraTree position={[-8, 0, 6]} scale={0.9} />

      {/* Rocks scattered */}
      <Rock position={[-5, 0, 5]} scale={[1.2, 0.9, 1.0]} rotation={0.5} />
      <Rock position={[8, 0, -5]} scale={[0.8, 0.7, 0.9]} rotation={1.2} />
      <Rock position={[-9, 0, -3]} scale={[1.5, 1.1, 1.3]} rotation={2.1} />
      <Rock position={[5, 0, 9]} scale={[0.9, 0.8, 1.0]} rotation={0.8} />
      <Rock position={[15, 0, 5]} scale={[1.8, 1.4, 1.6]} rotation={1.5} />
      <Rock position={[-15, 0, 3]} scale={[1.4, 1.0, 1.2]} rotation={0.3} />

      {/* Pavilion */}
      <Pavilion position={[0, 0, -8]} />

      {/* Torii gate entrance */}
      <ToriiGate position={[0, 0, 12]} rotation={0} />

      {/* Doors — entrance to inner room */}
      <Door position={[0, 0, 6]}   rotation={0}           playerPosRef={playerPosRef} label="Vào phòng" />
      <Door position={[-7, 0, 0]}  rotation={Math.PI / 2} playerPosRef={playerPosRef} label="Phòng bên trái" />
      <Door position={[7, 0, 0]}   rotation={-Math.PI / 2} playerPosRef={playerPosRef} label="Phòng bên phải" />

      {/* Light orbs */}
      <LightOrbs />

      {/* Sakura petals */}
      <SakuraPetals />

      {/* ── Lighting ── */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        color="#fff8e1"
      />
      <ambientLight intensity={0.55} color={ambientColor} />
      <hemisphereLight args={[ambientColor as any, "#4caf50", 0.5]} />
      <directionalLight position={[-20, 10, 15]} intensity={0.4} color={rimColor} />

      {/* Fog */}
      <fog attach="fog" args={[fogColor, 40, 130]} />
    </group>
  );
}
