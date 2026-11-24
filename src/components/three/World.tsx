"use client";

import { Sparkles, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#c7d2fe" />
      <hemisphereLight args={["#a5b4fc", "#1e1b4b", 0.6]} />
      <directionalLight
        position={[5, 10, 6]}
        intensity={2.2}
        color="#fff7ed"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <pointLight position={[0, 3.5, 0]} intensity={6} distance={9} color="#fbbf24" />
    </>
  );
}

export function Ground({ radius = 9 }: { radius?: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#eef4ff" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[radius, radius * 0.92, 0.5, 64]} />
        <meshStandardMaterial color="#c7d7f5" roughness={1} />
      </mesh>
      {/* montinhos de neve */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        const r = radius * (0.82 + ((i * 37) % 10) / 80);
        return (
          <mesh key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} scale={[1, 0.45, 1]} receiveShadow castShadow>
            <sphereGeometry args={[0.35 + ((i * 13) % 5) / 12, 16, 12]} />
            <meshStandardMaterial color="#f8fbff" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

export function ChristmasTree({ scale = 1 }: { scale?: number }) {
  const star = useRef<THREE.Mesh>(null);
  const balls = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => {
        const h = 0.6 + (i / 22) * 2.1;
        const r = (2.9 - h) * 0.42;
        const a = i * 2.4;
        return {
          pos: [Math.sin(a) * r, h, Math.cos(a) * r] as [number, number, number],
          color: ["#ef4444", "#facc15", "#3b82f6", "#ec4899", "#ffffff"][i % 5],
        };
      }),
    [],
  );
  useFrame(({ clock }) => {
    if (star.current) {
      star.current.rotation.y = clock.elapsedTime * 1.2;
      star.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
    }
  });
  return (
    <group scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 12]} />
        <meshStandardMaterial color="#7c4a2d" />
      </mesh>
      {[
        [1.25, 1.2, 0.9],
        [1.0, 1.0, 1.55],
        [0.72, 0.85, 2.15],
      ].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <coneGeometry args={[r, h, 28]} />
          <meshStandardMaterial color={["#166534", "#15803d", "#16a34a"][i]} roughness={0.7} />
        </mesh>
      ))}
      {balls.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.6} metalness={0.4} roughness={0.2} />
        </mesh>
      ))}
      <mesh ref={star} position={[0, 2.75, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={2} />
      </mesh>
      {/* presentes */}
      {[
        [0.75, 0.55, "#e11d48", "#fde047"],
        [-0.7, 0.6, "#2563eb", "#f8fafc"],
        [0.1, -0.85, "#9333ea", "#facc15"],
        [-0.45, -0.55, "#16a34a", "#ef4444"],
      ].map(([x, z, c, rib], i) => (
        <MiniGift key={i} position={[x as number, 0, z as number]} color={c as string} ribbon={rib as string} size={0.32 + i * 0.04} />
      ))}
    </group>
  );
}

export function MiniGift({ position, color, ribbon, size }: { position: [number, number, number]; color: string; ribbon: string; size: number }) {
  return (
    <group position={[position[0], size / 2, position[2]]} rotation={[0, size * 4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 1.02, size * 1.02, size * 0.18]} />
        <meshStandardMaterial color={ribbon} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 0.18, size * 1.02, size * 1.02]} />
        <meshStandardMaterial color={ribbon} roughness={0.3} />
      </mesh>
    </group>
  );
}

let flakeTex: THREE.Texture | null = null;
function flakeTexture() {
  if (flakeTex) return flakeTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  flakeTex = new THREE.CanvasTexture(c);
  return flakeTex;
}

export function Snow({ count = 700, area = 22 }: { count?: number; area?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * area;
      speeds[i] = 0.4 + Math.random() * 0.9;
    }
    return { positions, speeds };
  }, [count, area]);
  useFrame(({ clock }, dt) => {
    const p = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!p) return;
    const arr = p.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speeds[i] * dt;
      arr[i * 3] += Math.sin(clock.elapsedTime + i) * dt * 0.15;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 14;
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={flakeTexture()} color="#ffffff" size={0.12} sizeAttenuation transparent opacity={0.95} depthWrite={false} alphaTest={0.01} />
    </points>
  );
}

export function Sky() {
  return (
    <>
      <color attach="background" args={["#0f1b2d"]} />
      <fog attach="fog" args={["#0f1b2d", 16, 40]} />
      <Stars radius={60} depth={30} count={2500} factor={3} fade speed={0.6} />
      <Sparkles count={60} scale={[14, 6, 14]} position={[0, 3, 0]} size={3} speed={0.3} color="#f0b54a" />
    </>
  );
}
