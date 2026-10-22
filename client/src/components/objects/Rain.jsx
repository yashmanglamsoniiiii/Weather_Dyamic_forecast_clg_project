import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Rain({ count = 1200, intensity = 1.0 }) {
  const pointsRef = useRef();

  // Generate randomized rain drop positions
  const [positions, velocities] = useMemo(() => {
    const actualCount = Math.floor(count * intensity);
    const pos = new Float32Array(actualCount * 3);
    const vel = new Float32Array(actualCount);

    for (let i = 0; i < actualCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16; // x
      pos[i * 3 + 1] = Math.random() * 12 - 2;     // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12; // z
      vel[i] = 7.0 + Math.random() * 6.0;         // fall velocity
    }
    return [pos, vel];
  }, [count, intensity]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const actualCount = velocities.length;

    for (let i = 0; i < actualCount; i++) {
      arr[i * 3 + 1] -= velocities[i] * delta;
      // Slight slant for wind
      arr[i * 3 + 0] -= 1.2 * delta;

      // Reset to top when passing bottom
      if (arr[i * 3 + 1] < -4) {
        arr[i * 3 + 1] = 8;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 16;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#38bdf8"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
