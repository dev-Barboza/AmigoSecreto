"use client";

import { OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Character, type CharMode } from "./Character";
import { Lights, Snow } from "./World";

type Props = { name?: string; photo?: string; color: string; mode?: CharMode; className?: string };

/** Palco pequeno com um boneco só, usado na tela de entrar no grupo. */
export default function Preview({ name, photo, color, mode = "wave", className }: Props) {
  return (
    <div className={className}>
      <Canvas shadows camera={{ position: [0, 1.6, 4.2], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <Lights />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.3, 48]} />
          <meshStandardMaterial color="#eef4ff" roughness={1} />
        </mesh>
        <Snow count={150} area={6} />
        <Sparkles count={25} scale={[3, 3, 3]} position={[0, 1.4, 0]} size={4} color="#fde68a" />
        <Character name={name} photo={photo} color={color} position={[0, 0, 0]} mode={mode} drop showLabel={!!name} onSelect={() => {}} />
        <OrbitControls enablePan={false} enableZoom={false} target={[0, 1, 0]} autoRotate autoRotateSpeed={1.5} minPolarAngle={0.8} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
