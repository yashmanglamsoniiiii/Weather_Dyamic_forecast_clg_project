import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Convert lat/lon in degrees to 3D Cartesian coordinates on sphere of radius R
function latLonToVector3(lat, lon, radius = 2.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

// Procedural high-density landmass dot distribution representing real Earth continents
function generateContinentDots(radius = 2.0) {
  const landmassRegions = [
    // North America
    { minLat: 15, maxLat: 72, minLon: -168, maxLon: -55, count: 650 },
    // South America
    { minLat: -54, maxLat: 12, minLon: -82, maxLon: -34, count: 480 },
    // Europe & Scandinavia
    { minLat: 36, maxLat: 71, minLon: -10, maxLon: 42, count: 520 },
    // Africa
    { minLat: -34, maxLat: 37, minLon: -17, maxLon: 51, count: 620 },
    // Asia & Middle East
    { minLat: 8, maxLat: 74, minLon: 42, maxLon: 145, count: 1100 },
    // Japan & East Asian Coast
    { minLat: 30, maxLat: 46, minLon: 129, maxLon: 146, count: 180 },
    // Australia & New Zealand
    { minLat: -44, maxLat: -11, minLon: 113, maxLon: 178, count: 320 },
    // Antarctica
    { minLat: -88, maxLat: -66, minLon: -180, maxLon: 180, count: 350 }
  ];

  const positions = [];
  landmassRegions.forEach((reg) => {
    for (let i = 0; i < reg.count; i++) {
      const lat = reg.minLat + Math.random() * (reg.maxLat - reg.minLat);
      const lon = reg.minLon + Math.random() * (reg.maxLon - reg.minLon);

      // Fine-tune geographical boundary filters
      if (reg.minLon === -168 && lat < 30 && lon < -115) continue; // Pacific cut
      if (reg.minLon === -82 && lat > -5 && lon < -75) continue;

      const [x, y, z] = latLonToVector3(lat, lon, radius * 1.004);
      positions.push(x, y, z);
    }
  });

  return new Float32Array(positions);
}

export default function Globe({ lat = 35.6762, lon = 139.6503, cityName = 'Target Location' }) {
  const globeGroupRef = useRef();
  const beaconRef = useRef();
  const scanSweepRef = useRef();
  const satelliteRef = useRef();
  const radius = 2.0;

  // Generate continent point matrix
  const continentPositions = useMemo(() => generateContinentDots(radius), [radius]);

  // City target pin coordinate
  const targetPos = useMemo(() => latLonToVector3(lat, lon, radius * 1.01), [lat, lon, radius]);

  // Global planetary wind streamlines (jet stream particles)
  const jetStreamPositions = useMemo(() => {
    const points = [];
    const count = 300;
    // Northern jet stream ring (~45 deg lat)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const currentLat = 42 + Math.sin(angle * 5) * 6;
      const currentLon = (angle * 180) / Math.PI - 180;
      const [x, y, z] = latLonToVector3(currentLat, currentLon, radius * 1.04);
      points.push(x, y, z);
    }
    // Tropical equatorial trade wind ring (~10 deg lat)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const currentLat = 8 + Math.cos(angle * 4) * 5;
      const currentLon = (angle * 180) / Math.PI - 180;
      const [x, y, z] = latLonToVector3(currentLat, currentLon, radius * 1.03);
      points.push(x, y, z);
    }
    return new Float32Array(points);
  }, [radius]);

  useFrame((state, delta) => {
    // Continuous axial planetary rotation
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }

    // Radar scan beam rotation
    if (scanSweepRef.current) {
      scanSweepRef.current.rotation.y += delta * 0.45;
    }

    // Weather satellite orbit
    if (satelliteRef.current) {
      const t = state.clock.elapsedTime * 0.5;
      satelliteRef.current.position.x = Math.cos(t) * (radius * 1.45);
      satelliteRef.current.position.z = Math.sin(t) * (radius * 1.45);
      satelliteRef.current.position.y = Math.sin(t * 1.8) * 0.6;
    }

    // City beacon radar pulse
    if (beaconRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 4.5) * 0.35;
      beaconRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, -0.15, 0]}>
      {/* Planetary Body Group (Rotates smoothly) */}
      <group ref={globeGroupRef}>
        {/* Deep Ocean Core Sphere */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            color="#080e1e"
            roughness={0.65}
            metalness={0.3}
            emissive="#0369a1"
            emissiveIntensity={0.06}
          />
        </mesh>

        {/* Real Earth Continents (Phosphor Cyan Point Matrix) */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={continentPositions.length / 3}
              array={continentPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.045}
            color="#38bdf8"
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Coordinate Meridian & Latitude Grid Cage */}
        <mesh>
          <sphereGeometry args={[radius * 1.002, 36, 18]} />
          <meshBasicMaterial
            color="#1e293b"
            wireframe
            transparent
            opacity={0.22}
          />
        </mesh>

        {/* Global Wind Streamlines / Jet Streams */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={jetStreamPositions.length / 3}
              array={jetStreamPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            color="#818cf8"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Target City Pinpoint Laser & Radar Ping */}
        <group position={targetPos}>
          {/* Surface Beacon Core */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>

          {/* Vertical Tactical Marker Laser */}
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
            <meshBasicMaterial color="#fb7185" transparent opacity={0.85} />
          </mesh>

          {/* Pulsing Concentric Radar Rings */}
          <group ref={beaconRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.14, 24]} />
              <meshBasicMaterial
                color="#f43f5e"
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.16, 0.22, 24]} />
              <meshBasicMaterial
                color="#fb7185"
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* Orbiting Satellite Radar Surveillance Beam (Independent Rotation) */}
      <group ref={scanSweepRef}>
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[radius * 1.05, radius * 1.055, 64]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Scanning Sector Arc */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.99, radius * 1.25, 32, 1, 0, Math.PI / 4]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Weather Satellite in Polar Orbit */}
      <group ref={satelliteRef}>
        {/* Satellite Chassis */}
        <mesh>
          <boxGeometry args={[0.08, 0.05, 0.05]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Solar Panels */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.26, 0.01, 0.06]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
        </mesh>
        {/* Downward Sensor Beam */}
        <pointLight color="#38bdf8" intensity={0.4} distance={1.2} />
      </group>

      {/* Atmospheric Fresnel Limb Glow (Outer Halo) */}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
