"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/theme";
import type { PublicParticipant } from "@/lib/types";
import { Character } from "./Character";
import { CourtFloor, CourtSky, Papers } from "./Court";
import { Lights, Sky, Snow } from "./World";

type Props = {
  person: PublicParticipant;
  taps: number; // quantas vezes já tocou no presente (abre no 3º)
  opened: boolean;
  onTap: () => void;
  className?: string;
  theme?: Theme;
};

const BOX = 1.6;

/** Natal: presente vermelho com laço. Tribunal: caixa de processo lacrada, de papelão com fita vermelha. */
const BOX_COLORS = {
  natal: { side: "#e11d48", bottom: "#be123c", lid: "#f43f5e", ribbon: "#fde047" },
  tribunal: { side: "#a47148", bottom: "#8a5a35", lid: "#b8835a", ribbon: "#b91c1c" },
};

function GiftBox({ taps, opened, onTap, theme }: { taps: number; opened: boolean; onTap: () => void; theme: Theme }) {
  const col = BOX_COLORS[theme];
  const box = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const shakeAt = useRef(-99);
  const openAt = useRef<number | null>(null);
  const lastTaps = useRef(taps);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (taps !== lastTaps.current) {
      lastTaps.current = taps;
      shakeAt.current = t;
    }
    if (opened && openAt.current === null) openAt.current = t;
    const g = box.current, l = lid.current;
    if (!g || !l) return;

    // respiração + tremida quando toca (cada vez mais forte)
    const s = t - shakeAt.current;
    const intensity = 0.06 + taps * 0.05;
    const shake = s < 0.6 ? Math.sin(s * 45) * intensity * (1 - s / 0.6) : 0;
    g.rotation.z = shake + (opened ? 0 : Math.sin(t * 1.5) * 0.03 * (1 + taps));
    g.position.y = opened ? 0 : Math.abs(Math.sin(t * 2)) * 0.05 * (1 + taps) + (s < 0.3 ? s * 0.6 : 0);
    const pulse = 1 + (opened ? 0 : Math.sin(t * 3) * 0.015 * (1 + taps));
    g.scale.setScalar(pulse);

    // tampa voando
    if (openAt.current !== null) {
      const k = Math.min((t - openAt.current) / 1.4, 1);
      l.position.set(k * 2.2, BOX + 0.12 + Math.sin(k * Math.PI * 0.8) * 3.2 + k * 1.5, -k * 1.5);
      l.rotation.set(-k * 3, k * 6, k * 2);
      l.scale.setScalar(1 - Math.max(0, (k - 0.5) / 0.5));
      l.visible = k < 1;
    }
  });

  const ribbon = col.ribbon;
  return (
    <group
      ref={box}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onPointerOver={() => (document.body.style.cursor = opened ? "" : "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* caixa (aberta em cima para o boneco sair) */}
      {[
        [0, BOX / 2, BOX / 2, 0],
        [0, BOX / 2, -BOX / 2, 0],
        [BOX / 2, BOX / 2, 0, Math.PI / 2],
        [-BOX / 2, BOX / 2, 0, Math.PI / 2],
      ].map(([x, y, z, r], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, r, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[BOX, BOX, 0.06]} />
            <meshStandardMaterial color={col.side} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <boxGeometry args={[0.3, BOX, 0.02]} />
            <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[BOX, 0.06, BOX]} />
        <meshStandardMaterial color={col.bottom} />
      </mesh>
      {/* tampa */}
      <group ref={lid} position={[0, BOX + 0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[BOX + 0.14, 0.26, BOX + 0.14]} />
          <meshStandardMaterial color={col.lid} roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.32, 0.28, BOX + 0.16]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.25} />
        </mesh>
        <mesh>
          <boxGeometry args={[BOX + 0.16, 0.28, 0.32]} />
          <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.25} />
        </mesh>
        {/* laço */}
        {[-1, 1].map((d) => (
          <mesh key={d} position={[d * 0.28, 0.32, 0]} rotation={[0, 0, d * 0.6]}>
            <torusGeometry args={[0.22, 0.07, 12, 28]} />
            <meshStandardMaterial color={ribbon} metalness={0.3} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={ribbon} />
        </mesh>
      </group>
    </group>
  );
}

function RisingCharacter({ person, opened, theme }: { person: PublicParticipant; opened: boolean; theme: Theme }) {
  const g = useRef<THREE.Group>(null);
  const at = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (!opened) {
      g.current.visible = false;
      return;
    }
    if (at.current === null) at.current = clock.elapsedTime;
    const k = Math.min((clock.elapsedTime - at.current - 0.3) / 1.2, 1);
    g.current.visible = k > 0;
    const e = 1 - Math.pow(1 - Math.max(k, 0), 3);
    g.current.position.y = -0.6 + e * (BOX + 0.15);
    g.current.scale.setScalar(0.3 + e * 0.85);
  });
  return (
    <group ref={g}>
      <Character photo={person.photo} color={person.color} position={[0, 0, 0]} mode="dance" showLabel={false} outfit={theme === "tribunal" ? "ministro" : "noel"} />
    </group>
  );
}

function LightBeam({ opened }: { opened: boolean }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    if (m.current) m.current.opacity = THREE.MathUtils.lerp(m.current.opacity, opened ? 0.16 : 0, dt * 2);
  });
  return (
    <mesh position={[0, BOX + 3, 0]}>
      <cylinderGeometry args={[1.4, 0.75, 6, 32, 1, true]} />
      <meshBasicMaterial ref={m} color="#fde68a" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export default function Reveal({ person, taps, opened, onTap, className, theme = "natal" }: Props) {
  const court = theme === "tribunal";
  return (
    <div className={className}>
      <Canvas shadows camera={{ position: [0, 3.4, 9.5], fov: 45 }} dpr={[1, 2]} onCreated={({ camera }) => camera.lookAt(0, 2.1, 0)} onPointerMissed={() => onTap()}>
        {court ? (
          <>
            <CourtSky />
            <Lights />
            <CourtFloor radius={6} />
            <Papers count={50} area={12} />
          </>
        ) : (
          <>
            <Sky />
            <Lights />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[6, 64]} />
              <meshStandardMaterial color="#eef4ff" roughness={1} />
            </mesh>
            <Snow count={300} area={12} />
          </>
        )}
        <GiftBox taps={taps} opened={opened} onTap={onTap} theme={theme} />
        <RisingCharacter person={person} opened={opened} theme={theme} />
        <LightBeam opened={opened} />
        {opened && <Sparkles count={120} scale={[5, 6, 5]} position={[0, 3, 0]} size={6} speed={1.2} color="#fde047" />}
      </Canvas>
    </div>
  );
}
