"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PublicParticipant } from "@/lib/types";
import { Character, type CharMode } from "./Character";
import { ChristmasTree, Ground, Lights, Sky, Snow } from "./World";

export type LobbyMode = "idle" | "shuffle" | "party";

type Props = {
  people: PublicParticipant[];
  mode?: LobbyMode;
  highlightId?: string;
  onSelect?: (p: PublicParticipant) => void;
  className?: string;
};

/** Controla a rotação do círculo de bonecos: parado, girando cada vez mais rápido, ou festa. */
function Spinner({ spin, mode }: { spin: React.RefObject<number>; mode: LobbyMode }) {
  const speed = useRef(0);
  useFrame((_, dt) => {
    const target = mode === "shuffle" ? 9 : mode === "party" ? 0 : 0.08;
    const accel = mode === "shuffle" ? 2.2 : 3.5;
    speed.current += (target - speed.current) * Math.min(1, dt * accel);
    spin.current = (spin.current ?? 0) + speed.current * dt;
  });
  return null;
}

export default function Lobby({ people, mode = "idle", highlightId, onSelect, className }: Props) {
  const spin = useRef(0);
  const n = Math.max(people.length, 1);
  const radius = Math.max(2.4, n * 0.42);
  const dist = radius * 1.9 + 5;
  const charMode: CharMode = mode === "shuffle" ? "run" : mode === "party" ? "dance" : "idle";

  return (
    <div className={className}>
      <Canvas shadows camera={{ position: [0, dist * 0.45, dist], fov: 42 }} dpr={[1, 2]}>
        <Sky />
        <Lights />
        <Ground radius={radius + 3.5} />
        <ChristmasTree scale={1 + Math.min(n, 20) * 0.03} />
        <Snow />
        <Spinner spin={spin} mode={mode} />
        {people.map((p, i) => (
          <Character
            key={p.id}
            name={p.name}
            photo={p.photo}
            color={p.color}
            angle={(i / n) * Math.PI * 2}
            radius={radius}
            spin={spin}
            mode={p.id === highlightId && mode === "idle" ? "wave" : charMode}
            drop
            highlight={p.id === highlightId}
            onSelect={() => onSelect?.(p)}
          />
        ))}
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={dist * 1.6}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1, 0]}
          autoRotate={mode === "party"}
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
}
