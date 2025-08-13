import * as THREE from "three";
import { HornProfileParams } from "../../types";
import { calculateRadii } from "../GeometryUtils";
import { HORN_GEOMETRY_CONSTANTS } from "./HornGeometryConstants";
import { getProfile, ProfileType } from "../../profiles";

export function createOptimizedCircularHorn(
  params: HornProfileParams,
  steps: number
): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, length, flareType, wallThickness, cutoffFrequency } = params;
  
  const outerPoints: THREE.Vector2[] = [];
  const innerPoints: THREE.Vector2[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    const interiorRadius = calculateInteriorRadius(
      throatDiameter / 2,
      mouthWidth / 2,
      t,
      flareType,
      length,
      cutoffFrequency
    );
    
    const { innerRadius, outerRadius } = calculateRadii(interiorRadius, wallThickness);
    
    outerPoints.push(new THREE.Vector2(outerRadius, z));
    innerPoints.push(new THREE.Vector2(innerRadius, z));
  }
  
  for (let i = steps; i >= 0; i--) {
    outerPoints.push(innerPoints[i]);
  }
  
  const geometry = new THREE.LatheGeometry(
    outerPoints,
    HORN_GEOMETRY_CONSTANTS.LATHE_SEGMENTS
  );
  geometry.rotateX(Math.PI / 2);
  
  return geometry;
}

export function createOptimizedRectangularHorn(
  params: HornProfileParams,
  steps: number
): THREE.BufferGeometry {
  const { throatDiameter, mouthWidth, mouthHeight, length, flareType, wallThickness } = params;
  const finalMouthHeight = mouthHeight || mouthWidth;
  
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    
    const { widthScale, heightScale } = calculateScaleFactors(
      throatDiameter,
      mouthWidth,
      finalMouthHeight,
      t,
      flareType
    );
    
    const crossSection = createRectangularCrossSection(
      throatDiameter,
      widthScale,
      heightScale,
      wallThickness,
      z
    );
    
    vertices.push(...crossSection.vertices);
    uvs.push(...createUVs(t, 8));
    
    if (i > 0) {
      indices.push(...generateRectangularFaces(i));
    }
  }
  
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function calculateInteriorRadius(
  throatRadius: number,
  mouthRadius: number,
  t: number,
  flareType: string | ProfileType,
  length: number,
  cutoffFrequency?: number
): number {
  // Handle legacy string types
  if (flareType === "exponential") {
    flareType = ProfileType.EXPONENTIAL;
  } else if (flareType === "conical") {
    flareType = ProfileType.CONICAL;
  }
  
  // Use the new profile system
  const profile = getProfile(flareType as ProfileType, {
    throatRadius,
    mouthRadius,
    length,
    segments: 100,
    cutoffFrequency
  });
  
  // Find the radius at position t * length
  const targetX = t * length;
  
  // Find the closest point in the profile
  let closestPoint = profile[0];
  for (const point of profile) {
    if (point.x >= targetX) {
      closestPoint = point;
      break;
    }
  }
  
  return closestPoint.radius;
}

function calculateScaleFactors(
  throatDiameter: number,
  mouthWidth: number,
  mouthHeight: number,
  t: number,
  flareType: string | ProfileType
) {
  // Convert legacy strings to ProfileType
  if (typeof flareType === 'string') {
    if (flareType === 'exponential') {
      flareType = ProfileType.EXPONENTIAL;
    } else if (flareType === 'conical') {
      flareType = ProfileType.CONICAL;
    }
  }
  
  // Use the profile library to get the radius at position t
  const throatRadius = throatDiameter / 2;
  const mouthWidthRadius = mouthWidth / 2;
  const mouthHeightRadius = mouthHeight / 2;
  
  // For rectangular horns, we need to calculate width and height scales
  // based on the profile curve
  switch (flareType) {
    case ProfileType.CONICAL:
      return {
        widthScale: 1 + t * ((mouthWidth / throatDiameter) - 1),
        heightScale: 1 + t * ((mouthHeight / throatDiameter) - 1),
      };
    
    case ProfileType.EXPONENTIAL:
    case ProfileType.MODIFIED_EXPONENTIAL:
      return {
        widthScale: Math.pow(mouthWidth / throatDiameter, t),
        heightScale: Math.pow(mouthHeight / throatDiameter, t),
      };
    
    case ProfileType.TRACTRIX:
    case ProfileType.LE_CLEACH:
    case ProfileType.JMLC:
      // These profiles use more complex curves
      // We'll calculate based on the profile's radius at position t
      const profile = getProfile(flareType, {
        throatRadius,
        mouthRadius: mouthWidthRadius,
        length: 1, // Normalized length
        segments: 100
      });
      const pointIndex = Math.floor(t * (profile.length - 1));
      const radiusAtT = profile[pointIndex].radius;
      const scale = radiusAtT / throatRadius;
      
      return {
        widthScale: scale * (mouthWidth / throatDiameter) / (mouthWidthRadius / throatRadius),
        heightScale: scale * (mouthHeight / throatDiameter) / (mouthHeightRadius / throatRadius),
      };
    
    default:
      // For other profiles, use a smooth interpolation
      const smoothT = t * t * (3 - 2 * t); // Smoothstep function
      return {
        widthScale: 1 + smoothT * ((mouthWidth / throatDiameter) - 1),
        heightScale: 1 + smoothT * ((mouthHeight / throatDiameter) - 1),
      };
  }
}

function createRectangularCrossSection(
  throatDiameter: number,
  widthScale: number,
  heightScale: number,
  wallThickness: number,
  z: number
) {
  const interiorWidth = (throatDiameter * widthScale) / 2;
  const interiorHeight = (throatDiameter * heightScale) / 2;
  
  const { innerRadius: innerWidth, outerRadius: outerWidth } = calculateRadii(
    interiorWidth,
    wallThickness
  );
  const { innerRadius: innerHeight, outerRadius: outerHeight } = calculateRadii(
    interiorHeight,
    wallThickness
  );
  
  return {
    vertices: [
      -outerWidth, -outerHeight, z,
      outerWidth, -outerHeight, z,
      outerWidth, outerHeight, z,
      -outerWidth, outerHeight, z,
      -innerWidth, -innerHeight, z,
      innerWidth, -innerHeight, z,
      innerWidth, innerHeight, z,
      -innerWidth, innerHeight, z,
    ],
  };
}

function createUVs(t: number, count: number): number[] {
  const uvs: number[] = [];
  for (let j = 0; j < count; j++) {
    uvs.push(t, j / count);
  }
  return uvs;
}

function generateRectangularFaces(segmentIndex: number): number[] {
  const indices: number[] = [];
  const prev = (segmentIndex - 1) * 8;
  const curr = segmentIndex * 8;
  
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
  
  return indices;
}