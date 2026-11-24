"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type Outfit = "noel" | "ministro";

export type CharMode = "idle" | "run" | "dance" | "wave";

export type CharacterProps = {
  name?: string;
  photo?: string;
  color: string;
  /** posição fixa (quando não está no círculo) */
  position?: [number, number, number];
  /** posição em círculo: ângulo base + raio; spin é compartilhado pela cena */
  angle?: number;
  radius?: number;
  spin?: React.RefObject<number>;
  mode?: CharMode;
  /** cai do céu ao aparecer */
  drop?: boolean;
  scale?: number;
  showLabel?: boolean;
  highlight?: boolean;
  onSelect?: () => void;
  outfit?: Outfit;
};

const SKIN = "#ffdcc2";
const TOGA = "#151515";

function easeOutBounce(x: number) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

/** Textura do rosto: foto recortada em círculo, ou um rostinho desenhado. */
function useFaceTexture(photo: string | undefined, color: string) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    const finish = () => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      setTex((old) => {
        old?.dispose();
        return t;
      });
    };
    ctx.fillStyle = SKIN;
    ctx.fillRect(0, 0, S, S);
    if (photo) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, S * 0.04, S * 0.04, S * 0.92, S * 0.92);
        ctx.restore();
        ctx.lineWidth = S * 0.035;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2);
        ctx.stroke();
        finish();
      };
      img.src = photo;
    } else {
      // rostinho fofo
      ctx.fillStyle = "#2b1d16";
      for (const x of [0.36, 0.64]) {
        ctx.beginPath();
        ctx.ellipse(S * x, S * 0.45, S * 0.045, S * 0.065, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(S * x + S * 0.015, S * 0.43, S * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2b1d16";
      }
      ctx.fillStyle = "rgba(255,120,120,.45)";
      for (const x of [0.27, 0.73]) {
        ctx.beginPath();
        ctx.ellipse(S * x, S * 0.58, S * 0.06, S * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "#2b1d16";
      ctx.lineWidth = S * 0.025;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(S / 2, S * 0.56, S * 0.09, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      finish();
    }
  }, [photo, color]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

export function Character({
  name, photo, color, position, angle = 0, radius = 0, spin, mode = "idle", drop = false,
  scale = 1, showLabel = true, highlight = false, onSelect, outfit = "noel",
}: CharacterProps) {
  const judge = outfit === "ministro";
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const born = useRef<number | null>(drop ? null : -999);
  const jumpAt = useRef(-999);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const [hover, setHover] = useState(false);
  const clock = useThree((st) => st.clock);
  const curScale = useRef(scale);
  const face = useFaceTexture(photo, color);
  const shirt = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    if (born.current === null) born.current = t;
    const g = root.current, b = body.current;
    if (!g || !b) return;

    // posição no círculo ou fixa
    if (position) {
      g.position.set(position[0], position[1], position[2]);
    } else {
      const a = angle + (spin?.current ?? 0);
      g.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
      if (mode === "run") g.rotation.y = a + Math.PI / 2;
      else {
        // vira suavemente para a câmera, para a foto sempre aparecer
        const yaw = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
        let d = yaw - g.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        g.rotation.y += d * 0.08;
      }
    }

    let y = 0, rotY = 0, squash = 1, armA = 0, armB = 0, armX = 0;

    // queda do céu
    const since = t - born.current;
    if (since < 1.1) {
      const k = Math.min(since / 1.1, 1);
      y += (1 - easeOutBounce(k)) * 7;
      squash = 1 + Math.sin(k * Math.PI * 3) * 0.08 * (1 - k);
    }

    switch (mode) {
      case "idle":
        y += Math.sin(t * 2 + phase) * 0.03;
        armA = 0.25 + Math.sin(t * 2 + phase) * 0.08;
        armB = armA;
        break;
      case "wave":
        y += Math.sin(t * 2 + phase) * 0.03;
        armA = 0.25;
        armB = 2.6 + Math.sin(t * 9) * 0.35;
        break;
      case "run":
        y += Math.abs(Math.sin(t * 14 + phase)) * 0.18;
        armX = Math.sin(t * 14 + phase) * 0.9;
        armA = armB = 0.35;
        break;
      case "dance": {
        const s = Math.abs(Math.sin(t * 5 + phase));
        y += s * 0.45;
        squash *= 1 - (1 - s) * 0.12;
        rotY = Math.sin(t * 2.5 + phase) * 0.5;
        armA = armB = 2.4 + Math.sin(t * 10 + phase) * 0.4;
        break;
      }
    }

    // pulinho ao clicar
    const j = t - jumpAt.current;
    if (j < 0.9) {
      const k = j / 0.9;
      y += Math.sin(Math.PI * k) * 1.3;
      rotY += Math.PI * 2 * k;
      armA = armB = 2.8;
    }

    b.position.y = y;
    b.rotation.y = rotY;
    const target = (hover || highlight ? 1.12 : 1) * scale;
    const s = (curScale.current = THREE.MathUtils.lerp(curScale.current, target, 0.15));
    b.scale.set(s / Math.sqrt(squash), s * squash, s / Math.sqrt(squash));
    if (armL.current) armL.current.rotation.set(armX, 0, -armA);
    if (armR.current) armR.current.rotation.set(-armX, 0, armB);
  });

  return (
    <group ref={root}>
      <group
        ref={body}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          jumpAt.current = clock.elapsedTime;
          onSelect?.();
        }}
      >
        {/* pés */}
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.1, 0.06]} castShadow>
            <sphereGeometry args={[0.13, 20, 16]} />
            <meshStandardMaterial color="#3b2416" roughness={0.6} />
          </mesh>
        ))}
        {/* corpo */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.33, 0.32, 8, 24]} />
          <meshStandardMaterial color={judge ? TOGA : shirt} roughness={judge ? 0.55 : 0.45} />
        </mesh>
        {judge ? (
          <>
            {/* barra da toga, abrindo embaixo */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.34, 0.45, 0.38, 32]} />
              <meshStandardMaterial color={TOGA} roughness={0.55} />
            </mesh>
            {/* camisa branca + gravata na cor da pessoa */}
            <mesh position={[0, 0.83, 0.3]} rotation={[-0.25, 0, 0]}>
              <boxGeometry args={[0.2, 0.3, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.8, 0.316]} rotation={[-0.25, 0, 0]}>
              <boxGeometry args={[0.07, 0.26, 0.02]} />
              <meshStandardMaterial color={shirt} roughness={0.4} />
            </mesh>
            {/* gola branca da capa */}
            <mesh position={[0, 0.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.065, 12, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {/* faixa dourada */}
            <mesh position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.36, 0.37, 0.04, 32]} />
              <meshStandardMaterial color="#d4a537" metalness={0.7} roughness={0.3} />
            </mesh>
          </>
        ) : (
          <>
            {/* barra branca de pelúcia */}
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.3, 0.06, 12, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
            {/* cinto */}
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.335, 0.335, 0.08, 32]} />
              <meshStandardMaterial color="#1f1f1f" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.55, 0.335]}>
              <boxGeometry args={[0.14, 0.11, 0.03]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* botões */}
            {[0.72, 0.85].map((y) => (
              <mesh key={y} position={[0, y, 0.315]}>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshStandardMaterial color="#fff" />
              </mesh>
            ))}
          </>
        )}
        {/* braços */}
        {([
          [armL, -0.36],
          [armR, 0.36],
        ] as const).map(([ref, x]) => (
          <group key={x} ref={ref} position={[x, 0.85, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[judge ? 0.1 : 0.09, 0.22, 6, 12]} />
              <meshStandardMaterial color={judge ? TOGA : shirt} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <sphereGeometry args={[judge ? 0.085 : 0.1, 16, 12]} />
              <meshStandardMaterial color={judge ? SKIN : "#ffffff"} roughness={judge ? 0.7 : 1} />
            </mesh>
            {/* martelo na mão direita */}
            {judge && x > 0 && (
              <group position={[0, -0.47, 0.08]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.34, 8]} />
                  <meshStandardMaterial color="#7a5236" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0, 0.18]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.065, 0.065, 0.22, 16]} />
                  <meshStandardMaterial color="#5b3a24" roughness={0.45} />
                </mesh>
              </group>
            )}
          </group>
        ))}
        {/* cabeça */}
        <group position={[0, 1.33, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 32, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
          {face && (
            <mesh>
              <sphereGeometry args={[0.425, 48, 32, Math.PI / 2 - Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.18, Math.PI * 0.64]} />
              <meshStandardMaterial map={face} roughness={0.6} />
            </mesh>
          )}
          {judge ? (
            /* cabelo grisalho, puxado para trás para não cobrir a foto */
            <mesh rotation={[-0.55, 0, 0]}>
              <sphereGeometry args={[0.44, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
              <meshStandardMaterial color="#6b6460" roughness={0.9} />
            </mesh>
          ) : (
          /* gorro */
          <group position={[0, 0.27, -0.02]} rotation={[-0.15, 0, -0.18]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <coneGeometry args={[0.36, 0.62, 32]} />
              <meshStandardMaterial color="#dc2626" roughness={0.6} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <torusGeometry args={[0.37, 0.08, 14, 36]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
            <mesh position={[0, 0.64, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
          </group>
          )}
        </group>
        {showLabel && name && (
          <Html position={[0, 2.35, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div
              className="whitespace-nowrap rounded-md px-2.5 py-0.5 text-sm font-bold text-white"
              style={{ background: color, boxShadow: "0 2px 0 rgba(0,0,0,.35)" }}
            >
              {judge ? `Min. ${name}` : name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
