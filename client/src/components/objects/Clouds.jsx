import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

function CloudCluster({ position, scale = 1, speed = 0.5, isDark = false }) {
  const groupRef = useRef();
  const initialX = position[0];

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.x += delta * 0.2 * speed;
      // Loop back horizontally
      if (groupRef.current.position.x > 8) {
        groupRef.current.position.x = -8;
      }
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + initialX) * 0.15;
    }
  });

  const cloudColor = isDark ? '#475569' : '#f8fafc';
  const emissiveColor = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Central puff */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color={cloudColor} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
      {/* Side puff left */}
      <mesh position={[-0.7, -0.2, 0.2]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color={cloudColor} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
      {/* Side puff right */}
      <mesh position={[0.7, -0.15, 0.1]}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshStandardMaterial color={cloudColor} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
      {/* Top puff */}
      <mesh position={[0.2, 0.5, -0.1]}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshStandardMaterial color={cloudColor} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
      {/* Back puff */}
      <mesh position={[-0.3, 0.3, -0.3]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color={cloudColor} emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function Clouds({ density = 0.5, speed = 1.0, isDark = false }) {
  const clouds = useMemo(() => {
    const list = [
      { pos: [-3.5, 1.8, 0], scale: 1.1, speed: 0.8 * speed },
      { pos: [0.5, 2.2, -1], scale: 1.3, speed: 1.1 * speed },
      { pos: [3.8, 1.5, 0.5], scale: 0.9, speed: 0.7 * speed }
    ];
    if (density > 0.6) {
      list.push(
        { pos: [-1.8, 1.0, 1], scale: 1.0, speed: 1.0 * speed },
        { pos: [2.2, 2.8, -0.5], scale: 0.85, speed: 0.9 * speed }
      );
    }
    return list;
  }, [density, speed]);

  return (
    <group>
      {clouds.map((c, i) => (
        <CloudCluster
          key={i}
          position={c.pos}
          scale={c.scale}
          speed={c.speed}
          isDark={isDark}
        />
      ))}
    </group>
  );
}
