"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Cenário "Tribunal": plenário de mármore, bancada em meia-lua, colunas, balança da justiça e papéis voando. */

const WOOD = "#5b3a24";
const WOOD_LIGHT = "#7a5236";
const MARBLE = "#ece6da";
const GOLD = "#d4a537";
const LEATHER = "#7f1d1d";

export function CourtSky() {
  return (
    <>
      <color attach="background" args={["#1b1410"]} />
      <fog attach="fog" args={["#1b1410", 14, 38]} />
      <ambientLight intensity={0.25} color="#ffe4c4" />
      <spotLight position={[0, 12, 2]} angle={0.55} penumbra={0.6} intensity={35} distance={30} color="#fff1d6" />
      <Sparkles count={40} scale={[14, 6, 14]} position={[0, 3, 0]} size={2} speed={0.15} color="#e8c77a" />
    </>
  );
}

let tileTex: THREE.Texture | null = null;
function marbleTiles() {
  if (tileTex) return tileTex;
  const S = 512, n = 8, t = S / n;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#ece6da" : "#d9d0c1";
      ctx.fillRect(i * t, j * t, t, t);
      // veios do mármore
      ctx.strokeStyle = "rgba(120,110,95,.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * t + ((i * 31 + j * 17) % t), j * t);
      ctx.bezierCurveTo(i * t + t * 0.2, j * t + t * 0.4, i * t + t * 0.8, j * t + t * 0.6, i * t + ((i * 13 + j * 29) % t), j * t + t);
      ctx.stroke();
    }
  ctx.strokeStyle = "rgba(90,80,70,.35)";
  ctx.lineWidth = 2;
  for (let k = 0; k <= n; k++) {
    ctx.beginPath(); ctx.moveTo(k * t, 0); ctx.lineTo(k * t, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, k * t); ctx.lineTo(S, k * t); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tileTex = tex;
  return tex;
}

export function CourtFloor({ radius = 9 }: { radius?: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial map={marbleTiles()} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* tapete vermelho no centro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[radius * 0.18, radius * 0.3, 64]} />
        <meshStandardMaterial color={LEATHER} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[radius * 0.3, radius * 0.31, 64]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[radius, radius * 0.94, 0.5, 64]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Bancada de madeira em meia-lua com cadeiras de espaldar alto, no fundo da cena. */
export function Bench({ radius = 7 }: { radius?: number }) {
  const segs = 11;
  const arc = Math.PI * 0.8;
  const items = useMemo(
    () =>
      Array.from({ length: segs }).map((_, i) => {
        const a = Math.PI - arc / 2 + (i / (segs - 1)) * arc;
        return { a, x: Math.sin(a) * radius, z: Math.cos(a) * radius };
      }),
    [radius, arc],
  );
  const segLen = ((arc / (segs - 1)) * radius) * 1.02;
  return (
    <group>
      {items.map(({ a, x, z }, i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}>
          {/* mesa */}
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[segLen, 1.1, 0.5]} />
            <meshStandardMaterial color={WOOD} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.13, 0.05]} castShadow>
            <boxGeometry args={[segLen * 1.01, 0.07, 0.7]} />
            <meshStandardMaterial color={WOOD_LIGHT} roughness={0.4} />
          </mesh>
          {/* friso dourado */}
          <mesh position={[0, 0.85, 0.26]}>
            <boxGeometry args={[segLen, 0.04, 0.02]} />
            <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* cadeira */}
          {i % 2 === 0 && (
            <group position={[0, 0, -0.75]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[0.6, 0.15, 0.55]} />
                <meshStandardMaterial color={LEATHER} roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.35, -0.25]} castShadow>
                <boxGeometry args={[0.65, 1.5, 0.15]} />
                <meshStandardMaterial color={LEATHER} roughness={0.5} />
              </mesh>
              <mesh position={[0, 2.12, -0.25]}>
                <boxGeometry args={[0.7, 0.08, 0.18]} />
                <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/** Colunas de mármore só na metade de trás, para não tapar os bonecos. */
export function Columns({ radius = 9, height = 6 }: { radius?: number; height?: number }) {
  const n = 7;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const a = Math.PI - Math.PI * 0.45 + (i / (n - 1)) * Math.PI * 0.9;
        return (
          <group key={i} position={[Math.sin(a) * radius, 0, Math.cos(a) * radius]}>
            <mesh position={[0, 0.15, 0]} castShadow>
              <boxGeometry args={[0.9, 0.3, 0.9]} />
              <meshStandardMaterial color={MARBLE} roughness={0.4} />
            </mesh>
            <mesh position={[0, height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.34, height, 20]} />
              <meshStandardMaterial color={MARBLE} roughness={0.35} />
            </mesh>
            <mesh position={[0, height + 0.12, 0]}>
              <boxGeometry args={[0.85, 0.25, 0.85]} />
              <meshStandardMaterial color={MARBLE} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

let flagTex: THREE.Texture | null = null;
function flagTexture() {
  if (flagTex) return flagTex;
  const W = 400, H = 280;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#009c3b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffdf00";
  ctx.beginPath();
  ctx.moveTo(W * 0.085, H / 2);
  ctx.lineTo(W / 2, H * 0.12);
  ctx.lineTo(W * 0.915, H / 2);
  ctx.lineTo(W / 2, H * 0.88);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#002776";
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, H * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = H * 0.035;
  ctx.beginPath();
  ctx.arc(W / 2 - H * 0.05, H / 2 + H * 0.55, H * 0.6, -Math.PI * 0.62, -Math.PI * 0.32);
  ctx.stroke();
  flagTex = new THREE.CanvasTexture(c);
  flagTex.colorSpace = THREE.SRGBColorSpace;
  return flagTex;
}

export function Flag({ position }: { position: [number, number, number] }) {
  const cloth = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(1.5, 1.05, 20, 1), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  useFrame(({ clock }) => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3] + 0.75;
      p.setZ(i, Math.sin(x * 4 - clock.elapsedTime * 3) * 0.06 * x);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 4, 10]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 4.05, 0]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh ref={cloth} geometry={geo} position={[0.78, 3.4, 0]}>
        <meshStandardMaterial map={flagTexture()} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Peça central no lugar da árvore: pedestal de mármore com a balança da justiça. */
export function Scales({ scale = 1 }: { scale?: number }) {
  const beam = useRef<THREE.Group>(null);
  const panL = useRef<THREE.Group>(null);
  const panR = useRef<THREE.Group>(null);
  const ARM = 0.75;
  useFrame(({ clock }) => {
    const tilt = Math.sin(clock.elapsedTime * 0.9) * 0.18;
    if (beam.current) beam.current.rotation.z = tilt;
    // os pratos ficam sempre na vertical, pendurados nas pontas
    if (panL.current) {
      panL.current.position.set(-Math.cos(tilt) * ARM, -Math.sin(tilt) * ARM, 0);
    }
    if (panR.current) {
      panR.current.position.set(Math.cos(tilt) * ARM, Math.sin(tilt) * ARM, 0);
    }
  });
  const gold = <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.22} />;
  return (
    <group scale={scale}>
      {/* pedestal */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.85, 0.2, 32]} />
        <meshStandardMaterial color={MARBLE} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.9, 32]} />
        <meshStandardMaterial color={MARBLE} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.14, 0]}>
        <cylinderGeometry args={[0.55, 0.45, 0.1, 32]} />
        {gold}
      </mesh>
      {/* haste */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.6, 12]} />
        {gold}
      </mesh>
      <mesh position={[0, 2.82, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        {gold}
      </mesh>
      <group position={[0, 2.7, 0]}>
        <group ref={beam}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, ARM * 2, 10]} />
            {gold}
          </mesh>
        </group>
        {[panL, panR].map((ref, i) => (
          <group key={i} ref={ref}>
            {/* cordinhas */}
            {[-1, 1].map((d) => (
              <mesh key={d} position={[d * 0.12, -0.32, 0]} rotation={[0, 0, d * 0.35]}>
                <cylinderGeometry args={[0.008, 0.008, 0.68, 4]} />
                {gold}
              </mesh>
            ))}
            <mesh position={[0, -0.66, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.22, 0.06, 28]} />
              {gold}
            </mesh>
          </group>
        ))}
      </group>
      {/* martelo apoiado na base */}
      <group position={[0.55, 1.24, 0.35]} rotation={[0, 0.6, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 16]} />
          <meshStandardMaterial color={WOOD} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
          <meshStandardMaterial color={WOOD_LIGHT} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Folhas de processo caindo devagar, girando (no lugar da neve). */
export function Papers({ count = 70, area = 20 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        x: (Math.random() - 0.5) * area,
        y: Math.random() * 12,
        z: (Math.random() - 0.5) * area,
        speed: 0.25 + Math.random() * 0.45,
        spin: (Math.random() - 0.5) * 3,
        phase: Math.random() * Math.PI * 2,
      })),
    [count, area],
  );
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      d.y -= d.speed * dt;
      if (d.y < 0) d.y = 12;
      dummy.position.set(d.x + Math.sin(t * 0.8 + d.phase) * 0.6, d.y, d.z + Math.cos(t * 0.6 + d.phase) * 0.4);
      dummy.rotation.set(Math.sin(t + d.phase) * 1.2, t * d.spin, Math.cos(t * 0.7 + d.phase) * 0.8);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.16, 0.22]} />
      <meshStandardMaterial color="#f5f1e8" side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}
