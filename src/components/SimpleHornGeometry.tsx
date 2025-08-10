import { useMemo } from 'react';
import * as THREE from 'three';
import { HornProfileParams, MountPlateParams, DriverMountParams } from '../types';

interface SimpleHornGeometryProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
}

export default function SimpleHornGeometry({ hornParams, plateParams, driverParams }: SimpleHornGeometryProps) {
  // Create a simple horn geometry without CSG complications for now
  const hornGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = t * hornParams.length;
      let radius;
      if (hornParams.flareType === 'exponential') {
        radius = (hornParams.throatDiameter / 2) * Math.pow(hornParams.mouthWidth / hornParams.throatDiameter, t);
      } else {
        radius = (hornParams.throatDiameter / 2) + t * ((hornParams.mouthWidth / 2) - (hornParams.throatDiameter / 2));
      }
      shape.lineTo(radius, z);
    }
    
    return new THREE.LatheGeometry(shape.extractPoints(steps).shape, hornParams.segments);
  }, [hornParams]);

  return (
    <group>
      {/* Horn Body */}
      <mesh geometry={hornGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#888888" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Simple Mounting Plate */}
      <mesh position={[0, 0, hornParams.length]} castShadow receiveShadow>
        <cylinderGeometry args={[(plateParams.diameter || 250) / 2, (plateParams.diameter || 250) / 2, plateParams.thickness, 32]} />
        <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Simple Driver Flange */}
      <mesh position={[0, 0, -driverParams.flangeThickness]} castShadow receiveShadow>
        <cylinderGeometry args={[driverParams.throatDiameter / 2, driverParams.throatDiameter / 2, driverParams.flangeThickness, 32]} />
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}