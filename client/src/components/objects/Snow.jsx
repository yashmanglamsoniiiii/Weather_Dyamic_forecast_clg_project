import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Snow({ count = 800 }) {
  const pointsRef = useRef();

  const [positions, speeds, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 10 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      spd[i] = 1.0 + Math.random() * 1.5;
      off[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, off];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speeds[i] * delta;
      // Soft drift
      arr[i * 3 + 0] += Math.sin(t * 1.5 + offsets[i]) * 0.01;

      if (arr[i * 3 + 1] < -4) {
        arr[i * 3 + 1] = 7;
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
        size={0.12}
        color="#f8fafc"
        transparent
        opacity={0.85}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
