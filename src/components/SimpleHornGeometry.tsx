import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HornProfileParams, MountPlateParams, DriverMountParams } from '../types';
import { calculateRadii, createBoltHoles, createRingGeometry, createRectangularRingGeometry, applyCsgOperations, createRectangularBoltPattern, interpolateCrossSection, generateCrossSectionVertices, generateSectionFaces } from './GeometryUtils';

interface SimpleHornGeometryProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  showMountingPlate: boolean;
  showDriverMount: boolean;
}

export default function SimpleHornGeometry({ hornParams, plateParams, driverParams, showMountingPlate, showDriverMount }: SimpleHornGeometryProps) {
  // Performance monitoring and cleanup
  const geometryRefs = useRef<THREE.BufferGeometry[]>([]);
  const startTimeRef = useRef<number>(0);
  
  // Memory cleanup on unmount or parameter changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      // Cleanup all geometries when component unmounts or params change
      geometryRefs.current.forEach(geometry => {
        if (geometry && typeof geometry.dispose === 'function') {
          geometry.dispose();
        }
      });
      geometryRefs.current = [];
    };
  }, [hornParams, plateParams, driverParams]);
  
  // Generate horn geometry with performance monitoring
  const hornGeometry = useMemo(() => {
    const startTime = performance.now();
    
    try {
      // Check if we need shape morphing (for now, use simple heuristics)
      // In the future, this could be controlled by explicit parameters
      const needsMorphing = false; // Placeholder for morphing detection logic
      
      let geometry: THREE.BufferGeometry;
      
      if (needsMorphing) {
        // Use morphing geometry for shape transitions
        geometry = createMorphingHornGeometry({
          ...hornParams,
          throatShape: 'circular', // Default throat shape
          exitShape: hornParams.roundMouth ? 'circular' : 'rectangular'
        });
      } else {
        // Use optimized geometry for same-shape horns
        if (hornParams.roundMouth) {
          geometry = createCircularHornGeometry(hornParams);
        } else {
          geometry = createRectangularHornGeometry(hornParams);
        }
      }
      
      // Register for cleanup and log performance
      geometryRefs.current.push(geometry);
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) { // Log slow operations
        console.warn(`Horn geometry creation took ${elapsed.toFixed(1)}ms`);
      }
      
      return geometry;
    } catch (error) {
      console.error('Error creating horn geometry:', error);
      const fallbackGeometry = createSimpleFallbackGeometry(hornParams);
      geometryRefs.current.push(fallbackGeometry);
      return fallbackGeometry;
    }
  }, [hornParams]);

  // Generate plate geometry with holes
  const plateGeometry = useMemo(() => {
    const startTime = performance.now();
    
    try {
      const geometry = createPlateWithHoles(plateParams, hornParams.length, hornParams);
      geometryRefs.current.push(geometry);
      
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) { // Log slow operations
        console.warn(`Plate geometry creation took ${elapsed.toFixed(1)}ms`);
      }
      
      return geometry;
    } catch (error) {
      console.error('Error creating plate geometry:', error);
      const fallbackGeometry = createSimplePlateGeometry(plateParams, hornParams.length);
      geometryRefs.current.push(fallbackGeometry);
      return fallbackGeometry;
    }
  }, [plateParams, hornParams]);

  // Generate driver flange geometry with holes
  const driverGeometry = useMemo(() => {
    const startTime = performance.now();
    
    try {
      const geometry = createDriverWithHoles(driverParams);
      geometryRefs.current.push(geometry);
      
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) { // Log slow operations
        console.warn(`Driver geometry creation took ${elapsed.toFixed(1)}ms`);
      }
      
      return geometry;
    } catch (error) {
      console.error('Error creating driver geometry:', error);
      const fallbackGeometry = createSimpleDriverGeometry(driverParams);
      geometryRefs.current.push(fallbackGeometry);
      return fallbackGeometry;
    }
  }, [driverParams]);

  return (
    <group>
      {/* Horn Body */}
      <mesh geometry={hornGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#888888" metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Mounting Plate */}
      {showMountingPlate && (
        <mesh geometry={plateGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#555555" metalness={0.2} roughness={0.6} />
        </mesh>
      )}
      
      {/* Driver Flange */}
      {showDriverMount && (
        <mesh geometry={driverGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Create circular horn geometry (hollow)
function createCircularHornGeometry(params: HornProfileParams): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, length, flareType, segments, wallThickness } = params;
  
  // Create points for the horn profile (outer wall)
  const outerPoints: THREE.Vector2[] = [];
  const innerPoints: THREE.Vector2[] = [];
  
  const steps = 30; // Reduced for performance
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    // Calculate interior radius (unchanging acoustic dimension)
    let interiorRadius: number;
    if (flareType === 'exponential') {
      interiorRadius = (throatDiameter / 2) * Math.pow(mouthWidth / throatDiameter, t);
    } else {
      interiorRadius = (throatDiameter / 2) + t * ((mouthWidth / 2) - (throatDiameter / 2));
    }
    
    // CORRECT: Wall expands outward only, maintaining interior dimensions
    const { innerRadius, outerRadius } = calculateRadii(interiorRadius, wallThickness);
    
    // Create outer wall points
    outerPoints.push(new THREE.Vector2(outerRadius, z));
    
    // Create inner wall points (for hollow horn)
    innerPoints.push(new THREE.Vector2(innerRadius, z));
  }
  
  // Add points in reverse for inner wall to create a closed shape
  for (let i = steps; i >= 0; i--) {
    outerPoints.push(innerPoints[i]);
  }
  
  // Create the lathe geometry from the points
  const geometry = new THREE.LatheGeometry(outerPoints, 32);
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

// Create rectangular horn geometry
function createRectangularHornGeometry(params: HornProfileParams): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, mouthHeight, length, flareType, wallThickness } = params;
  const finalMouthHeight = mouthHeight || mouthWidth;
  
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  
  const steps = 20; // Reduced for performance
  
  // Generate vertices for the horn
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
    
    // Calculate interior dimensions (unchanging acoustic dimensions)
    const interiorWidth = (throatDiameter * widthScale) / 2;
    const interiorHeight = (throatDiameter * heightScale) / 2;
    
    // CORRECT: Wall expands outward only, maintaining interior dimensions
    const { innerRadius: innerWidth, outerRadius: outerWidth } = calculateRadii(interiorWidth, wallThickness);
    const { innerRadius: innerHeight, outerRadius: outerHeight } = calculateRadii(interiorHeight, wallThickness);
    
    // Outer rectangle vertices
    vertices.push(-outerWidth, -outerHeight, z);
    vertices.push(outerWidth, -outerHeight, z);
    vertices.push(outerWidth, outerHeight, z);
    vertices.push(-outerWidth, outerHeight, z);
    
    // Inner rectangle vertices (for hollow)
    vertices.push(-innerWidth, -innerHeight, z);
    vertices.push(innerWidth, -innerHeight, z);
    vertices.push(innerWidth, innerHeight, z);
    vertices.push(-innerWidth, innerHeight, z);
    
    // Generate UVs
    for (let j = 0; j < 8; j++) {
      uvs.push(t, j / 8);
    }
    
    // Generate faces between steps
    if (i > 0) {
      const prev = (i - 1) * 8;
      const curr = i * 8;
      
      // Outer faces
      for (let j = 0; j < 4; j++) {
        const next = (j + 1) % 4;
        indices.push(prev + j, curr + j, prev + next);
        indices.push(curr + j, curr + next, prev + next);
      }
      
      // Inner faces
      for (let j = 0; j < 4; j++) {
        const next = (j + 1) % 4;
        indices.push(prev + 4 + j, prev + 4 + next, curr + 4 + j);
        indices.push(curr + 4 + j, prev + 4 + next, curr + 4 + next);
      }
      
      // Connect outer and inner walls
      for (let j = 0; j < 4; j++) {
        const next = (j + 1) % 4;
        indices.push(prev + j, prev + 4 + j, prev + next);
        indices.push(prev + 4 + j, prev + 4 + next, prev + next);
        indices.push(curr + j, curr + next, curr + 4 + j);
        indices.push(curr + 4 + j, curr + next, curr + 4 + next);
      }
    }
  }
  
  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create horn geometry with throat-to-exit shape morphing
function createMorphingHornGeometry(params: HornProfileParams & { 
  throatShape?: 'circular' | 'rectangular';
  exitShape?: 'circular' | 'rectangular';
}): THREE.BufferGeometry {
  const { 
    throatDiameter, 
    mouthWidth, 
    mouthHeight, 
    length, 
    flareType, 
    wallThickness,
    throatShape = 'circular',
    exitShape = params.roundMouth ? 'circular' : 'rectangular'
  } = params;

  // If both shapes are the same, use existing optimized functions
  if (throatShape === exitShape) {
    if (throatShape === 'circular') {
      return createCircularHornGeometry(params);
    } else {
      return createRectangularHornGeometry(params);
    }
  }

  // Create morphing geometry for different throat/exit shapes
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const steps = 25; // Reduced for performance
  let totalVertexCount = 0;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    // Calculate scale factor based on flare type
    let scale: number;
    if (flareType === 'exponential') {
      scale = Math.pow(mouthWidth / throatDiameter, t);
    } else {
      scale = 1 + t * ((mouthWidth / throatDiameter) - 1);
    }
    
    // Create cross-section profile that morphs between shapes
    const morphParams = {
      throatDiameter,
      mouthWidth,
      mouthHeight: mouthHeight || mouthWidth,
      roundMouth: exitShape === 'circular',
      wallThickness
    };
    
    // Interpolate between throat and exit shapes
    const crossSection = interpolateCrossSection(morphParams, t, scale);
    
    // Generate vertices for this cross-section
    const sectionVertices = generateCrossSectionVertices(crossSection, z);
    vertices.push(...sectionVertices);
    
    // Generate UVs
    for (let j = 0; j < crossSection.vertexCount; j++) {
      uvs.push(t, j / crossSection.vertexCount);
    }
    
    // Generate faces between this section and the previous one
    if (i > 0) {
      const prevStart = totalVertexCount - crossSection.vertexCount;
      const currStart = totalVertexCount;
      const faceIndices = generateSectionFaces(prevStart, currStart, crossSection.vertexCount);
      indices.push(...faceIndices);
    }
    
    totalVertexCount += crossSection.vertexCount;
  }

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// Create mounting plate with horn exit opening and bolt holes
function createPlateWithHoles(plateParams: MountPlateParams, hornLength: number, hornParams: HornProfileParams): THREE.BufferGeometry {
  let baseGeometry: THREE.BufferGeometry;
  
  // Plate type always matches horn mouth shape
  const plateType = hornParams.roundMouth ? 'circle' : 'rect';
  
  if (plateType === 'rect') {
    // Rectangular plate with rectangular opening - size based on horn mouth + 20mm
    const hornExitWidth = hornParams.mouthWidth;
    const hornExitHeight = hornParams.mouthHeight || hornParams.mouthWidth;
    
    const margin = plateParams.autoMargin || 20;
    const outerWidth = plateParams.useManualSize ? 
      (plateParams.width || (hornExitWidth + margin * 2)) : 
      (hornExitWidth + margin * 2);
    const outerHeight = plateParams.useManualSize ? 
      (plateParams.height || (hornExitHeight + margin * 2)) : 
      (hornExitHeight + margin * 2);
    const innerWidth = hornParams.roundMouth ? 
      hornParams.mouthWidth : 
      hornParams.mouthWidth;
    const innerHeight = hornParams.roundMouth ? 
      hornParams.mouthWidth : 
      (hornParams.mouthHeight || hornParams.mouthWidth);
    
    baseGeometry = createRectangularRingGeometry(
      outerWidth,
      outerHeight,
      innerWidth,
      innerHeight,
      plateParams.thickness
    );
  } else {
    // Circular plate with horn exit opening - size based on horn mouth + 20mm
    const hornExitRadius = hornParams.roundMouth ? 
      hornParams.mouthWidth / 2 :
      Math.max(hornParams.mouthWidth, hornParams.mouthHeight || hornParams.mouthWidth) / 2;
    
    const margin = plateParams.autoMargin || 20;
    const outerRadius = plateParams.useManualSize ? 
      (plateParams.diameter ? (plateParams.diameter / 2) : (hornExitRadius + margin)) : 
      (hornExitRadius + margin);
    const innerRadius = hornExitRadius;
    
    baseGeometry = createRingGeometry(outerRadius, innerRadius, plateParams.thickness);
  }
  
  // Position so front face is exactly at horn exit, thickness extends toward horn throat  
  const plateZ = hornLength;
  baseGeometry.translate(0, 0, plateZ - plateParams.thickness);
  
  // Add bolt holes using CSG operations
  try {
    const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial());
    baseMesh.updateMatrix();
    
    let boltHoles: THREE.Mesh[];
    
    if (plateParams.type === 'rect') {
      // Use rectangular bolt pattern for rectangular plates - place bolts in center of margin
      const margin = plateParams.autoMargin || 20;
      const plateWidth = plateParams.useManualSize ? 
        (plateParams.width || (hornParams.mouthWidth + margin * 2)) : 
        (hornParams.mouthWidth + margin * 2);
      const plateHeight = plateParams.useManualSize ? 
        (plateParams.height || ((hornParams.mouthHeight || hornParams.mouthWidth) + margin * 2)) : 
        ((hornParams.mouthHeight || hornParams.mouthWidth) + margin * 2);
      
      const rectBoltPositions = createRectangularBoltPattern(
        plateWidth,
        plateHeight,
        plateParams.boltCount || 4,
        plateParams.boltHoleDiameter || 6,
        margin / 2 // Place bolts in center of margin
      );
      
      // Create bolt holes at calculated positions
      boltHoles = [];
      const holeGeom = new THREE.CylinderGeometry(
        (plateParams.boltHoleDiameter || 6) / 2,
        (plateParams.boltHoleDiameter || 6) / 2,
        plateParams.thickness * 2.0, // Make holes twice as long to ensure they cut through
        16 // Balanced segments
      );
      // Rotate to make holes go through flat flanges along Z axis
      holeGeom.rotateX(Math.PI / 2);
      
      rectBoltPositions.forEach(pos => {
        const holeClone = holeGeom.clone();
        holeClone.translate(pos.x, pos.y, plateZ - plateParams.thickness / 2);
        boltHoles.push(new THREE.Mesh(holeClone, new THREE.MeshStandardMaterial()));
      });
    } else {
      // Use circular bolt pattern for circular plates - place bolts in center of margin
      const hornExitRadius = hornParams.roundMouth ? 
        hornParams.mouthWidth / 2 :
        Math.max(hornParams.mouthWidth, hornParams.mouthHeight || hornParams.mouthWidth) / 2;
      
      const margin = plateParams.autoMargin || 20;
      const plateRadius = plateParams.useManualSize ? 
        (plateParams.diameter ? (plateParams.diameter / 2) : (hornExitRadius + margin)) : 
        (hornExitRadius + margin);
      
      // Place bolt circle in center of margin
      const boltCircleRadius = hornExitRadius + (margin / 2);
      
      boltHoles = createBoltHoles(
        plateZ - plateParams.thickness / 2,
        {
          boltCount: plateParams.boltCount || 4,
          boltHoleDiameter: plateParams.boltHoleDiameter || 6,
          boltCircleDiameter: boltCircleRadius * 2
        },
        plateParams.thickness
      );
    }
    
    const finalGeometry = applyCsgOperations(baseMesh, boltHoles, baseGeometry);
    
    // Clean up intermediate geometries
    boltHoles.forEach(hole => {
      if (hole.geometry) hole.geometry.dispose();
      if (hole.material && !Array.isArray(hole.material)) hole.material.dispose();
    });
    
    return finalGeometry;
  } catch (error) {
    console.warn('CSG operation failed for mounting plate, using base geometry:', error);
    return baseGeometry;
  }
}


// Create driver flange with throat opening and bolt holes
function createDriverWithHoles(driverParams: DriverMountParams): THREE.BufferGeometry {
  const innerRadius = driverParams.throatDiameter / 2; // Throat opening
  const outerRadius = driverParams.flangeDiameter / 2; // Flange size
  const thickness = driverParams.flangeThickness;
  
  // Create ring geometry for flange with throat opening
  const baseGeometry = createRingGeometry(outerRadius, innerRadius, thickness, 32);
  
  // Position flush with horn throat at z=0, extending towards horn exit
  const driverZ = 0;
  baseGeometry.translate(0, 0, driverZ);
  
  // Add bolt holes using CSG operations
  try {
    const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial());
    baseMesh.updateMatrix();
    
    const boltHoles = createBoltHoles(
      driverZ,
      {
        boltCount: driverParams.boltCount || 4,
        boltHoleDiameter: driverParams.boltHoleDiameter || 4,
        boltCircleDiameter: driverParams.boltCircleDiameter || (driverParams.throatDiameter * 1.2)
      },
      thickness
    );
    
    const finalGeometry = applyCsgOperations(baseMesh, boltHoles, baseGeometry);
    
    // Clean up intermediate geometries
    boltHoles.forEach(hole => {
      if (hole.geometry) hole.geometry.dispose();
      if (hole.material && !Array.isArray(hole.material)) hole.material.dispose();
    });
    
    return finalGeometry;
  } catch (error) {
    console.warn('CSG operation failed for driver flange, using base geometry:', error);
    return baseGeometry;
  }
}

// Simple fallback geometries
function createSimpleFallbackGeometry(params: HornProfileParams): THREE.BufferGeometry {
  const geometry = new THREE.ConeGeometry(
    params.mouthWidth / 2,
    params.length,
    16,
    1,
    true
  );
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createSimplePlateGeometry(plateParams: MountPlateParams, hornLength: number): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    (plateParams.diameter || 250) / 2,
    (plateParams.diameter || 250) / 2,
    plateParams.thickness,
    16
  );
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, hornLength + plateParams.thickness / 2);
  return geometry;
}

function createSimpleDriverGeometry(driverParams: DriverMountParams): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    driverParams.flangeDiameter / 2,
    driverParams.flangeDiameter / 2,
    driverParams.flangeThickness,
    16
  );
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, 0);
  return geometry;
}