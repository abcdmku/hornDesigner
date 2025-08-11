import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Detailed } from '@react-three/drei';
import { HornProfileParams, MountPlateParams, DriverMountParams } from '../types';
import { 
  calculateRadii, 
  createRingGeometry, 
  createRectangularRingGeometry,
  createRectangularBoltPattern,
  calculateRecommendedBoltCount,
  createFastCSGHoles,
  HoleParams,
  getCachedGeometry,
  clearGeometryCache
} from './GeometryUtils';

interface OptimizedHornGeometryProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  showMountingPlate: boolean;
  showDriverMount: boolean;
  performanceMode?: 'high' | 'medium' | 'low';
  enableLOD?: boolean;
}

export default function OptimizedHornGeometry({ 
  hornParams, 
  plateParams, 
  driverParams, 
  showMountingPlate, 
  showDriverMount,
  performanceMode = 'high',
  enableLOD = true
}: OptimizedHornGeometryProps) {
  const geometryRefs = useRef<THREE.BufferGeometry[]>([]);
  const startTimeRef = useRef<number>(0);
  
  // Cleanup on unmount or parameter changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      geometryRefs.current.forEach(geometry => {
        if (geometry && typeof geometry.dispose === 'function') {
          geometry.dispose();
        }
      });
      geometryRefs.current = [];
      clearGeometryCache();
    };
  }, [hornParams, plateParams, driverParams]);
  
  // Performance settings based on mode
  const perfSettings = useMemo(() => {
    const settings = {
      high: { holeSegments: 16, hornSteps: 30, enableCSG: true },
      medium: { holeSegments: 8, hornSteps: 20, enableCSG: true },
      low: { holeSegments: 4, hornSteps: 15, enableCSG: true }  // Keep CSG enabled but use fewer segments
    };
    return settings[performanceMode];
  }, [performanceMode]);
  
  // Generate horn geometry
  const hornGeometry = useMemo(() => {
    const cacheKey = `horn_${JSON.stringify(hornParams)}_${performanceMode}`;
    
    return getCachedGeometry(cacheKey, () => {
      const startTime = performance.now();
      
      const geometry = hornParams.roundMouth ? 
        createOptimizedCircularHorn(hornParams, perfSettings.hornSteps) :
        createOptimizedRectangularHorn(hornParams, perfSettings.hornSteps);
      
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) {
        console.warn(`Horn geometry creation took ${elapsed.toFixed(1)}ms`);
      }
      
      geometryRefs.current.push(geometry);
      return geometry;
    });
  }, [hornParams, performanceMode, perfSettings]);
  
  // Generate plate geometries for different LOD levels
  const plateGeometries = useMemo(() => {
    if (!showMountingPlate) return null;
    
    const startTime = performance.now();
    
    const high = createOptimizedPlate(plateParams, hornParams, 'high', perfSettings.enableCSG);
    const medium = createOptimizedPlate(plateParams, hornParams, 'medium', perfSettings.enableCSG);
    const low = createOptimizedPlate(plateParams, hornParams, 'low', perfSettings.enableCSG); // Keep holes but with fewer segments
    
    geometryRefs.current.push(high, medium, low);
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 100) {
      console.warn(`Plate LOD geometry creation took ${elapsed.toFixed(1)}ms`);
    }
    
    return { high, medium, low };
  }, [plateParams, hornParams, showMountingPlate, perfSettings.enableCSG]);
  
  // Generate driver geometries for different LOD levels
  const driverGeometries = useMemo(() => {
    if (!showDriverMount) return null;
    
    const startTime = performance.now();
    
    const high = createOptimizedDriver(driverParams, 'high', perfSettings.enableCSG);
    const medium = createOptimizedDriver(driverParams, 'medium', perfSettings.enableCSG);
    const low = createOptimizedDriver(driverParams, 'low', perfSettings.enableCSG); // Keep holes but with fewer segments
    
    geometryRefs.current.push(high, medium, low);
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 100) {
      console.warn(`Driver LOD geometry creation took ${elapsed.toFixed(1)}ms`);
    }
    
    return { high, medium, low };
  }, [driverParams, showDriverMount, perfSettings.enableCSG]);
  
  // Render with or without LOD
  if (enableLOD && plateGeometries && driverGeometries) {
    return (
      <group>
        {/* Horn Body (no LOD needed as it's the main focus) */}
        <mesh geometry={hornGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#888888" metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Mounting Plate with LOD */}
        {showMountingPlate && plateGeometries && (
          <Detailed distances={[0, 300, 600]}>
            <mesh geometry={plateGeometries.high} castShadow receiveShadow>
              <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh geometry={plateGeometries.medium} castShadow receiveShadow>
              <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh geometry={plateGeometries.low} castShadow receiveShadow>
              <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
            </mesh>
          </Detailed>
        )}
        
        {/* Driver Mount with LOD */}
        {showDriverMount && driverGeometries && (
          <Detailed distances={[0, 300, 600]}>
            <mesh geometry={driverGeometries.high} castShadow receiveShadow>
              <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh geometry={driverGeometries.medium} castShadow receiveShadow>
              <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh geometry={driverGeometries.low} castShadow receiveShadow>
              <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
            </mesh>
          </Detailed>
        )}
      </group>
    );
  }
  
  // Fallback to simple rendering without LOD
  return (
    <group>
      <mesh geometry={hornGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#888888" metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      
      {showMountingPlate && plateGeometries && (
        <mesh geometry={plateGeometries.high} castShadow receiveShadow>
          <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
        </mesh>
      )}
      
      {showDriverMount && driverGeometries && (
        <mesh geometry={driverGeometries.high} castShadow receiveShadow>
          <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Optimized circular horn creation
function createOptimizedCircularHorn(params: HornProfileParams, steps: number): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, length, flareType, wallThickness } = params;
  
  const outerPoints: THREE.Vector2[] = [];
  const innerPoints: THREE.Vector2[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    let interiorRadius: number;
    if (flareType === 'exponential') {
      interiorRadius = (throatDiameter / 2) * Math.pow(mouthWidth / throatDiameter, t);
    } else {
      interiorRadius = (throatDiameter / 2) + t * ((mouthWidth / 2) - (throatDiameter / 2));
    }
    
    const { innerRadius, outerRadius } = calculateRadii(interiorRadius, wallThickness);
    
    outerPoints.push(new THREE.Vector2(outerRadius, z));
    innerPoints.push(new THREE.Vector2(innerRadius, z));
  }
  
  for (let i = steps; i >= 0; i--) {
    outerPoints.push(innerPoints[i]);
  }
  
  const geometry = new THREE.LatheGeometry(outerPoints, 32);
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

// Optimized rectangular horn creation
function createOptimizedRectangularHorn(params: HornProfileParams, steps: number): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, mouthHeight, length, flareType, wallThickness } = params;
  const finalMouthHeight = mouthHeight || mouthWidth;
  
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    let widthScale: number, heightScale: number;
    if (flareType === 'exponential') {
      widthScale = Math.pow(mouthWidth / throatDiameter, t);
      heightScale = Math.pow(finalMouthHeight / throatDiameter, t);
    } else {
      widthScale = 1 + t * ((mouthWidth / throatDiameter) - 1);
      heightScale = 1 + t * ((finalMouthHeight / throatDiameter) - 1);
    }
    
    const interiorWidth = (throatDiameter * widthScale) / 2;
    const interiorHeight = (throatDiameter * heightScale) / 2;
    
    const { innerRadius: innerWidth, outerRadius: outerWidth } = calculateRadii(interiorWidth, wallThickness);
    const { innerRadius: innerHeight, outerRadius: outerHeight } = calculateRadii(interiorHeight, wallThickness);
    
    // Outer rectangle vertices
    vertices.push(-outerWidth, -outerHeight, z);
    vertices.push(outerWidth, -outerHeight, z);
    vertices.push(outerWidth, outerHeight, z);
    vertices.push(-outerWidth, outerHeight, z);
    
    // Inner rectangle vertices
    vertices.push(-innerWidth, -innerHeight, z);
    vertices.push(innerWidth, -innerHeight, z);
    vertices.push(innerWidth, innerHeight, z);
    vertices.push(-innerWidth, innerHeight, z);
    
    for (let j = 0; j < 8; j++) {
      uvs.push(t, j / 8);
    }
    
    if (i > 0) {
      const prev = (i - 1) * 8;
      const curr = i * 8;
      
      // Generate faces
      for (let j = 0; j < 4; j++) {
        const next = (j + 1) % 4;
        
        // Outer faces
        indices.push(prev + j, curr + j, prev + next);
        indices.push(curr + j, curr + next, prev + next);
        
        // Inner faces
        indices.push(prev + 4 + j, prev + 4 + next, curr + 4 + j);
        indices.push(curr + 4 + j, prev + 4 + next, curr + 4 + next);
        
        // Connect walls
        indices.push(prev + j, prev + 4 + j, prev + next);
        indices.push(prev + 4 + j, prev + 4 + next, prev + next);
        indices.push(curr + j, curr + next, curr + 4 + j);
        indices.push(curr + 4 + j, curr + next, curr + 4 + next);
      }
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

// Optimized plate creation with LOD
function createOptimizedPlate(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  detailLevel: 'high' | 'medium' | 'low',
  enableHoles: boolean
): THREE.BufferGeometry {
  let baseGeometry: THREE.BufferGeometry;
  
  const plateType = hornParams.roundMouth ? 'circle' : 'rect';
  
  if (plateType === 'rect') {
    const hornExitWidth = hornParams.mouthWidth;
    const hornExitHeight = hornParams.mouthHeight || hornParams.mouthWidth;
    const margin = plateParams.autoMargin || 20;
    
    const outerWidth = plateParams.useManualSize ? 
      (plateParams.width || (hornExitWidth + margin * 2)) : 
      (hornExitWidth + margin * 2);
    const outerHeight = plateParams.useManualSize ? 
      (plateParams.height || (hornExitHeight + margin * 2)) : 
      (hornExitHeight + margin * 2);
    
    baseGeometry = createRectangularRingGeometry(
      outerWidth,
      outerHeight,
      hornParams.mouthWidth,
      hornParams.mouthHeight || hornParams.mouthWidth,
      plateParams.thickness
    );
  } else {
    const hornExitRadius = hornParams.mouthWidth / 2;
    const margin = plateParams.autoMargin || 20;
    const outerRadius = plateParams.useManualSize ? 
      (plateParams.diameter ? (plateParams.diameter / 2) : (hornExitRadius + margin)) : 
      (hornExitRadius + margin);
    
    baseGeometry = createRingGeometry(outerRadius, hornExitRadius, plateParams.thickness);
  }
  
  const plateZ = hornParams.length;
  baseGeometry.translate(0, 0, plateZ - plateParams.thickness);
  
  // Add holes with varying complexity based on detail level
  if (enableHoles) {
    try {
      const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial());
      
      let holePositions: Array<{ x: number; y: number; z: number }>;
      
      if (plateParams.type === 'rect') {
        const margin = plateParams.autoMargin || 20;
        const plateWidth = plateParams.useManualSize ? 
          (plateParams.width || (hornParams.mouthWidth + margin * 2)) : 
          (hornParams.mouthWidth + margin * 2);
        const plateHeight = plateParams.useManualSize ? 
          (plateParams.height || ((hornParams.mouthHeight || hornParams.mouthWidth) + margin * 2)) : 
          ((hornParams.mouthHeight || hornParams.mouthWidth) + margin * 2);
        
        const optimalBoltCount = calculateRecommendedBoltCount(
          plateWidth,
          plateHeight,
          margin / 2,
          plateParams.maxBoltSpacing || 150
        );
        
        const rectBoltPositions = createRectangularBoltPattern(
          plateWidth,
          plateHeight,
          optimalBoltCount,
          plateParams.boltHoleDiameter || 6,
          margin / 2,
          plateParams.maxBoltSpacing || 150
        );
        
        holePositions = rectBoltPositions.map(pos => ({
          x: pos.x,
          y: pos.y,
          z: plateZ - plateParams.thickness / 2
        }));
      } else {
        const hornExitRadius = hornParams.mouthWidth / 2;
        const margin = plateParams.autoMargin || 20;
        const boltCircleRadius = hornExitRadius + (margin / 2);
        
        holePositions = [];
        for (let i = 0; i < (plateParams.boltCount || 4); i++) {
          const angle = (i / (plateParams.boltCount || 4)) * Math.PI * 2;
          holePositions.push({
            x: Math.cos(angle) * boltCircleRadius,
            y: Math.sin(angle) * boltCircleRadius,
            z: plateZ - plateParams.thickness / 2
          });
        }
      }
      
      const holeParams: HoleParams = {
        diameter: plateParams.boltHoleDiameter || 6,
        thickness: plateParams.thickness,
        segments: detailLevel === 'high' ? 16 : (detailLevel === 'medium' ? 8 : 4)
      };
      
      const finalGeometry = createFastCSGHoles(baseMesh, holePositions, holeParams);
      baseGeometry.dispose();
      
      return finalGeometry;
    } catch (error) {
      console.warn('Fast CSG failed for plate, using base geometry:', error);
      return baseGeometry;
    }
  }
  
  return baseGeometry;
}

// Optimized driver creation with LOD
function createOptimizedDriver(
  driverParams: DriverMountParams,
  detailLevel: 'high' | 'medium' | 'low',
  enableHoles: boolean
): THREE.BufferGeometry {
  const innerRadius = driverParams.throatDiameter / 2;
  const outerRadius = driverParams.flangeDiameter / 2;
  const thickness = driverParams.flangeThickness;
  
  const baseGeometry = createRingGeometry(outerRadius, innerRadius, thickness, 32);
  const driverZ = 0;
  baseGeometry.translate(0, 0, driverZ);
  
  if (enableHoles) {
    try {
      const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial());
      
      const holePositions: Array<{ x: number; y: number; z: number }> = [];
      const boltCircleRadius = driverParams.boltCircleDiameter / 2 || (driverParams.throatDiameter * 0.6);
      
      for (let i = 0; i < (driverParams.boltCount || 4); i++) {
        const angle = (i / (driverParams.boltCount || 4)) * Math.PI * 2;
        holePositions.push({
          x: Math.cos(angle) * boltCircleRadius,
          y: Math.sin(angle) * boltCircleRadius,
          z: driverZ
        });
      }
      
      const holeParams: HoleParams = {
        diameter: driverParams.boltHoleDiameter || 4,
        thickness: thickness,
        segments: detailLevel === 'high' ? 16 : (detailLevel === 'medium' ? 8 : 4)
      };
      
      const finalGeometry = createFastCSGHoles(baseMesh, holePositions, holeParams);
      baseGeometry.dispose();
      
      return finalGeometry;
    } catch (error) {
      console.warn('Fast CSG failed for driver, using base geometry:', error);
      return baseGeometry;
    }
  }
  
  return baseGeometry;
}