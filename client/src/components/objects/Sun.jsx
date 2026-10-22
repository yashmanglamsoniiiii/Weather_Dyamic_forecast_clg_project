import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Sun({ intensity = 1.0, isDay = true }) {
  const sunCoreRef = useRef();
  const coronaRef = useRef();
  const coronaOuterRef = useRef();

  useFrame((state, delta) => {
    if (sunCoreRef.current) {
      sunCoreRef.current.rotation.y += delta * 0.15;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z -= delta * 0.1;
      const scale = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      coronaRef.current.scale.set(scale, scale, scale);
    }
    if (coronaOuterRef.current) {
      coronaOuterRef.current.rotation.z += delta * 0.05;
      const outerScale = 1.2 + Math.cos(state.clock.elapsedTime * 1.5) * 0.08;
      coronaOuterRef.current.scale.set(outerScale, outerScale, outerScale);
    }
  });

  if (!isDay) {
    // Render moon instead of sun
    return (
      <group position={[3.5, 2.5, -2]}>
        <mesh ref={sunCoreRef}>
          <sphereGeometry args={[1.0, 32, 32]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.8}
            metalness={0.1}
            emissive="#94a3b8"
            emissiveIntensity={0.2}
          />
        </mesh>
        <pointLight intensity={1.5} distance={15} color="#cbd5e1" />
      </group>
    );
  }

  return (
    <group position={[3.5, 2.5, -2]}>
      {/* Sun Core */}
      <mesh ref={sunCoreRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#f59e0b"
          emissiveIntensity={1.8 * intensity}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Coronal Glow */}
      <mesh ref={coronaRef}>
        <ringGeometry args={[1.3, 1.9, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.35 * intensity}
          side={2}
        />
      </mesh>

      {/* Outer Corona Rays */}
      <mesh ref={coronaOuterRef}>
        <ringGeometry args={[1.8, 2.6, 16]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.18 * intensity}
          side={2}
        />
      </mesh>

      {/* Radiant point light casting onto the scene */}
      <pointLight intensity={3.5 * intensity} distance={25} color="#fef08a" />
    </group>
  );
}
