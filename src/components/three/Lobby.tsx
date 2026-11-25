"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Theme } from "@/lib/theme";
import type { PublicParticipant } from "@/lib/types";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Character, type CharMode, type DragOptions } from "./Character";
import { Bench, Columns, CourtFloor, CourtSky, Flag, Papers, Scales } from "./Court";
import { ChristmasTree, Ground, Lights, Sky, Snow } from "./World";

export type LobbyMode = "idle" | "shuffle" | "party";

type Props = {
  people: PublicParticipant[];
  mode?: LobbyMode;
  highlightId?: string;
  onSelect?: (p: PublicParticipant) => void;
  className?: string;
  theme?: Theme;
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

export default function Lobby({ people, mode = "idle", highlightId, onSelect, className, theme = "natal" }: Props) {
  const court = theme === "tribunal";
  const spin = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const n = Math.max(people.length, 1);
  const radius = Math.max(2.4, n * 0.42);
  const dist = radius * 1.9 + 5;
  const drag: DragOptions = {
    minR: 1.4,
    maxR: court ? radius + 1.6 : radius + 2.8, // no tribunal, não deixa entrar na bancada
    onStart: () => controls.current && (controls.current.enabled = false),
    onEnd: () => controls.current && (controls.current.enabled = true),
  };
  const charMode: CharMode = mode === "shuffle" ? "run" : mode === "party" ? "dance" : "idle";

  return (
    <div ref={wrap} className={className} style={{ position: "relative" }}>
      <Canvas shadows camera={{ position: [0, dist * 0.45, dist], fov: 42 }} dpr={[1, 2]}>
        {court ? (
          <>
            <CourtSky />
            <Lights />
            <CourtFloor radius={radius + 3.5} />
            <Bench radius={radius + 2.4} />
            <Columns radius={radius + 4.6} />
            <Flag position={[-(radius + 1.2), 0, -(radius + 1.2)]} />
            <Scales scale={1 + Math.min(n, 20) * 0.03} />
            <Papers />
          </>
        ) : (
          <>
            <Sky />
            <Lights />
            <Ground radius={radius + 3.5} />
            <ChristmasTree scale={1 + Math.min(n, 20) * 0.03} />
            <Snow />
          </>
        )}
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
            outfit={court ? "ministro" : "noel"}
            labelTarget={wrap}
            drag={drag}
          />
        ))}
        <OrbitControls
          ref={controls}
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
