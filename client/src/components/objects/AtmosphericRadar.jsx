import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AtmosphericRadar({ weatherData, sceneConfig }) {
  const radarGroupRef = useRef();
  const particleGroupRef = useRef();
  const scanRingRef = useRef();

  const {
    condition = 'Clear',
    rain = { active: false, intensity: 0.5 },
    snow = { active: false },
    isDay = true
  } = sceneConfig || {};

  // Procedural LiDAR aerosol / particle stream
  const [particlePositions, particleVelocities] = useMemo(() => {
    const count = rain.active ? 800 : 400;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 4 - 2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      vel[i] = rain.active ? (5.0 + Math.random() * 4.0) : (0.8 + Math.random() * 1.2);
    }
    return [pos, vel];
  }, [rain.active]);

  useFrame((state, delta) => {
    // Holographic radar sweep
    if (scanRingRef.current) {
      scanRingRef.current.rotation.y += delta * 0.8;
      scanRingRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 1.5;
    }

    // Atmospheric particulate flow
    if (particleGroupRef.current) {
      const posAttr = particleGroupRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const count = particleVelocities.length;

      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= particleVelocities[i] * delta;
        // Horizontal drift
        arr[i * 3 + 0] += 0.4 * delta;

        if (arr[i * 3 + 1] < -2.2) {
          arr[i * 3 + 1] = 2.2;
          const r = Math.random() * 2.2;
          const a = Math.random() * Math.PI * 2;
          arr[i * 3 + 0] = Math.cos(a) * r;
          arr[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={radarGroupRef} position={[0, -0.1, 0]}>
      {/* Sounding Chamber Outer Wireframe Cylinder */}
      <mesh>
        <cylinderGeometry args={[2.4, 2.4, 4.2, 32, 4, true]} />
        <meshBasicMaterial
          color="#1e293b"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Surface Base Compass Grid Plate (0m Elevation) */}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -2.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.4, 32]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>

      {/* Isobaric Pressure Levels (hPa Boundary Disks) */}
      {/* 850 hPa Level (-0.7y) */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 2.38, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      {/* 700 hPa Level (+0.7y) */}
      <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 2.38, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      {/* 500 hPa Upper Air Level (+1.8y) */}
      <mesh position={[0, 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 2.38, 32]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Active LiDAR Laser Altitude Scanner Ring */}
      <group ref={scanRingRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 2.35, 32]} />
          <meshBasicMaterial
            color={rain.active ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.32, 2.38, 32]} />
          <meshBasicMaterial color={rain.active ? '#38bdf8' : '#c084fc'} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Atmospheric Particulate Stream (Rain / Aerosol / Snow) */}
      <points ref={particleGroupRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={rain.active ? 0.07 : 0.045}
          color={rain.active ? '#38bdf8' : snow.active ? '#f8fafc' : '#fbbf24'}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Central Radiosonde Sounding Vector Core */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 4.2, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
