import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { createFastCSGHoles, HoleParams } from './GeometryUtils';
import { HornProfileParams, MountPlateParams, DriverMountParams } from '../types';

interface HornGeometryAdvancedProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  enableCSG?: boolean; // Allow toggling CSG operations
}

export default function HornGeometryAdvanced({ 
  hornParams, 
  plateParams, 
  driverParams,
  enableCSG = false 
}: HornGeometryAdvancedProps) {
  const [isProcessing] = useState(false);
  
  // Generate horn with optional CSG operations
  const hornAssembly = useMemo(() => {
    if (enableCSG && !isProcessing) {
      // Use CSG for holes but with optimizations
      return {
        horn: buildHollowHornOptimized(hornParams),
        plate: buildPlateWithCSGHoles(plateParams, hornParams.length),
        driver: buildDriverWithCSGHoles(driverParams)
      };
    } else {
      // Use simpler geometry without holes
      return {
        horn: buildHollowHornSimple(hornParams),
        plate: buildPlateSimple(plateParams, hornParams.length),
        driver: buildDriverSimple(driverParams)
      };
    }
  }, [hornParams, plateParams, driverParams, enableCSG, isProcessing]);

  return (
    <group>
      <mesh geometry={hornAssembly.horn} castShadow receiveShadow>
        <meshStandardMaterial color="#888888" metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={hornAssembly.plate} castShadow receiveShadow>
        <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh geometry={hornAssembly.driver} castShadow receiveShadow>
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Optimized hollow horn using LatheGeometry with closed profile
function buildHollowHornOptimized(params: HornProfileParams): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, length, flareType, segments: _segments, wallThickness } = params;
  
  const points: THREE.Vector2[] = [];
  const steps = 25; // Balanced for performance
  
  // Create outer profile
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    let radius: number;
    
    if (flareType === 'exponential') {
      radius = (throatDiameter / 2) * Math.pow(mouthWidth / throatDiameter, t);
    } else {
      radius = (throatDiameter / 2) + t * ((mouthWidth / 2) - (throatDiameter / 2));
    }
    
    points.push(new THREE.Vector2(radius, z));
  }
  
  // Create inner profile (reverse order for closed shape)
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const z = t * length;
    let radius: number;
    
    if (flareType === 'exponential') {
      radius = (throatDiameter / 2) * Math.pow(mouthWidth / throatDiameter, t);
    } else {
      radius = (throatDiameter / 2) + t * ((mouthWidth / 2) - (throatDiameter / 2));
    }
    
    const innerRadius = Math.max(1, radius - wallThickness);
    points.push(new THREE.Vector2(innerRadius, z));
  }
  
  const geometry = new THREE.LatheGeometry(points, 32);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

// Simple hollow horn without CSG
function buildHollowHornSimple(params: HornProfileParams): THREE.BufferGeometry {
  return buildHollowHornOptimized(params); // Same implementation
}

// Plate with CSG holes (optimized using three-bvh-csg)
function buildPlateWithCSGHoles(plateParams: MountPlateParams, hornLength: number): THREE.BufferGeometry {
  const radius = (plateParams.diameter || 250) / 2;
  const thickness = plateParams.thickness;
  
  // Create base plate
  const plateGeom = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  plateGeom.rotateX(Math.PI / 2);
  plateGeom.translate(0, 0, hornLength + thickness / 2);
  
  const plateMesh = new THREE.Mesh(plateGeom, new THREE.MeshStandardMaterial());
  
  // Create hole positions
  const holePositions: Array<{ x: number; y: number; z: number }> = [];
  
  for (let i = 0; i < plateParams.boltCount; i++) {
    const angle = (i / plateParams.boltCount) * Math.PI * 2;
    const x = Math.cos(angle) * (plateParams.boltCircleDiameter / 2);
    const y = Math.sin(angle) * (plateParams.boltCircleDiameter / 2);
    
    holePositions.push({
      x,
      y,
      z: hornLength + thickness / 2
    });
  }
  
  // Use fast CSG operations
  const holeParams: HoleParams = {
    diameter: plateParams.boltHoleDiameter,
    thickness: thickness,
    segments: 16
  };
  
  try {
    const optimizedGeometry = createFastCSGHoles(plateMesh, holePositions, holeParams);
    plateGeom.dispose(); // Clean up original geometry
    return optimizedGeometry;
  } catch (error) {
    console.warn('Fast CSG operation failed for plate, using simple geometry', error);
    return plateGeom;
  }
}

// Simple plate without holes
function buildPlateSimple(plateParams: MountPlateParams, hornLength: number): THREE.BufferGeometry {
  const radius = (plateParams.diameter || 250) / 2;
  const thickness = plateParams.thickness;
  
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, hornLength + thickness / 2);
  
  return geometry;
}

// Driver flange with CSG holes (optimized using three-bvh-csg)
function buildDriverWithCSGHoles(driverParams: DriverMountParams): THREE.BufferGeometry {
  const radius = driverParams.throatDiameter / 2;
  const thickness = driverParams.flangeThickness;
  
  // Create base flange
  const flangeGeom = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  flangeGeom.rotateX(Math.PI / 2);
  flangeGeom.translate(0, 0, -thickness / 2);
  
  const flangeMesh = new THREE.Mesh(flangeGeom, new THREE.MeshStandardMaterial());
  
  // Create hole positions
  const holePositions: Array<{ x: number; y: number; z: number }> = [];
  
  for (let i = 0; i < driverParams.boltCount; i++) {
    const angle = (i / driverParams.boltCount) * Math.PI * 2;
    const x = Math.cos(angle) * (driverParams.boltCircleDiameter / 2);
    const y = Math.sin(angle) * (driverParams.boltCircleDiameter / 2);
    
    holePositions.push({
      x,
      y,
      z: -thickness / 2
    });
  }
  
  // Use fast CSG operations
  const holeParams: HoleParams = {
    diameter: driverParams.boltHoleDiameter,
    thickness: thickness,
    segments: 16
  };
  
  try {
    const optimizedGeometry = createFastCSGHoles(flangeMesh, holePositions, holeParams);
    flangeGeom.dispose(); // Clean up original geometry
    return optimizedGeometry;
  } catch (error) {
    console.warn('Fast CSG operation failed for driver flange, using simple geometry', error);
    return flangeGeom;
  }
}

// Simple driver flange without holes
function buildDriverSimple(driverParams: DriverMountParams): THREE.BufferGeometry {
  const radius = driverParams.throatDiameter / 2;
  const thickness = driverParams.flangeThickness;
  
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, -thickness / 2);
  
  return geometry;
}