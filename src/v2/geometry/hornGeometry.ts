/**
 * Horn geometry generation
 * Converts profiles and cross-sections to 3D BufferGeometry
 */

import * as THREE from 'three';
import { ProfilePoint } from '../profiles/types';
import { 
  CrossSectionSpec, 
  superellipsePoints, 
  calculateRectangularDimensions,
  calculateSuperellipseDimensions,
  scheduleN,
  stereographicMap,
  applyHVDiff
} from '../math/hornMath';

/**
 * Ring of 3D points representing a cross-section
 */
export type Ring = Float32Array;

/**
 * Generate rings from profile and cross-section specification
 */
export function profileToRings(
  profile: ProfilePoint[],
  crossSection: CrossSectionSpec,
  thetaDivs: number = 32
): Ring[] {
  const rings: Ring[] = [];
  const length = profile[profile.length - 1].z;
  
  for (const point of profile) {
    const ring = generateRing(
      point,
      length,
      crossSection,
      thetaDivs
    );
    rings.push(ring);
  }
  
  return rings;
}

/**
 * Generate a single ring of points for a cross-section
 */
function generateRing(
  point: ProfilePoint,
  totalLength: number,
  crossSection: CrossSectionSpec,
  thetaDivs: number
): Ring {
  const { z, r } = point;
  const ring = new Float32Array((thetaDivs + 1) * 3); // +1 for seam
  
  switch (crossSection.mode) {
    case 'circle':
      generateCircularRing(ring, r, z, thetaDivs);
      break;
      
    case 'ellipse':
      generateEllipticalRing(ring, r, z, crossSection, thetaDivs);
      break;
      
    case 'superellipse':
      generateSuperellipseRing(ring, r, z, totalLength, crossSection, thetaDivs);
      break;
      
    case 'rectangular':
      generateRectangularRing(ring, r, z, crossSection, thetaDivs);
      break;
      
    case 'stereographic':
      generateStereographicRing(ring, r, z, crossSection, thetaDivs);
      break;
      
    default:
      generateCircularRing(ring, r, z, thetaDivs);
  }
  
  // Ensure seam wrapping (copy first point to last)
  ring[thetaDivs * 3] = ring[0];
  ring[thetaDivs * 3 + 1] = ring[1];
  ring[thetaDivs * 3 + 2] = ring[2];
  
  return ring;
}

/**
 * Generate circular ring
 */
function generateCircularRing(
  ring: Float32Array,
  radius: number,
  z: number,
  thetaDivs: number
): void {
  for (let i = 0; i < thetaDivs; i++) {
    const theta = (i / thetaDivs) * 2 * Math.PI;
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    
    ring[i * 3] = x;
    ring[i * 3 + 1] = y;
    ring[i * 3 + 2] = z;
  }
}

/**
 * Generate elliptical ring
 */
function generateEllipticalRing(
  ring: Float32Array,
  baseRadius: number,
  z: number,
  crossSection: CrossSectionSpec,
  thetaDivs: number
): void {
  const aspect = crossSection.aspect || 1;
  const a = baseRadius * Math.sqrt(aspect); // Horizontal semi-axis
  const b = baseRadius / Math.sqrt(aspect); // Vertical semi-axis
  
  for (let i = 0; i < thetaDivs; i++) {
    const theta = (i / thetaDivs) * 2 * Math.PI;
    const x = a * Math.cos(theta);
    const y = b * Math.sin(theta);
    
    ring[i * 3] = x;
    ring[i * 3 + 1] = y;
    ring[i * 3 + 2] = z;
  }
}

/**
 * Generate superellipse ring
 */
function generateSuperellipseRing(
  ring: Float32Array,
  baseRadius: number,
  z: number,
  totalLength: number,
  crossSection: CrossSectionSpec,
  thetaDivs: number
): void {
  const aspect = crossSection.aspect || 1;
  const n = scheduleN(z, totalLength, crossSection.n_schedule);
  
  // Calculate area-matched dimensions
  const { a, b } = calculateSuperellipseDimensions(baseRadius, aspect, n);
  
  // Generate superellipse points
  const points = superellipsePoints(a, b, n, thetaDivs);
  
  for (let i = 0; i < thetaDivs && i < points.length; i++) {
    ring[i * 3] = points[i].x;
    ring[i * 3 + 1] = points[i].y;
    ring[i * 3 + 2] = z;
  }
}

/**
 * Generate rectangular ring (with optional rounded corners)
 */
function generateRectangularRing(
  ring: Float32Array,
  baseRadius: number,
  z: number,
  crossSection: CrossSectionSpec,
  thetaDivs: number
): void {
  const aspect = crossSection.aspect || 1;
  const cornerRadius = crossSection.rectangular?.cornerRadius || 0;
  const matchMode = crossSection.rectangular?.matchMode || 'area';
  
  const { width, height } = calculateRectangularDimensions(
    baseRadius,
    aspect,
    matchMode
  );
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Distribute points around rectangle perimeter
  const perimeter = 2 * (width + height);
  const pointsPerSide = Math.floor(thetaDivs / 4);
  
  let pointIndex = 0;
  
  // Top edge (right to left)
  for (let i = 0; i <= pointsPerSide; i++) {
    const t = i / pointsPerSide;
    const x = halfWidth - t * width;
    const y = halfHeight;
    
    if (pointIndex < thetaDivs) {
      ring[pointIndex * 3] = x;
      ring[pointIndex * 3 + 1] = y;
      ring[pointIndex * 3 + 2] = z;
      pointIndex++;
    }
  }
  
  // Left edge (top to bottom)
  for (let i = 1; i <= pointsPerSide; i++) {
    const t = i / pointsPerSide;
    const x = -halfWidth;
    const y = halfHeight - t * height;
    
    if (pointIndex < thetaDivs) {
      ring[pointIndex * 3] = x;
      ring[pointIndex * 3 + 1] = y;
      ring[pointIndex * 3 + 2] = z;
      pointIndex++;
    }
  }
  
  // Bottom edge (left to right)
  for (let i = 1; i <= pointsPerSide; i++) {
    const t = i / pointsPerSide;
    const x = -halfWidth + t * width;
    const y = -halfHeight;
    
    if (pointIndex < thetaDivs) {
      ring[pointIndex * 3] = x;
      ring[pointIndex * 3 + 1] = y;
      ring[pointIndex * 3 + 2] = z;
      pointIndex++;
    }
  }
  
  // Right edge (bottom to top)
  for (let i = 1; i < pointsPerSide; i++) {
    const t = i / pointsPerSide;
    const x = halfWidth;
    const y = -halfHeight + t * height;
    
    if (pointIndex < thetaDivs) {
      ring[pointIndex * 3] = x;
      ring[pointIndex * 3 + 1] = y;
      ring[pointIndex * 3 + 2] = z;
      pointIndex++;
    }
  }
}

/**
 * Generate stereographic ring
 */
function generateStereographicRing(
  ring: Float32Array,
  baseRadius: number,
  z: number,
  crossSection: CrossSectionSpec,
  thetaDivs: number
): void {
  const fp = crossSection.stereographic?.fp || 1;
  const normalize = crossSection.stereographic?.normalize ?? true;
  
  for (let i = 0; i < thetaDivs; i++) {
    const theta = (i / thetaDivs) * 2 * Math.PI;
    const phi = Math.PI / 4; // Example elevation angle
    
    const { x, y } = stereographicMap(theta, phi, fp, normalize);
    
    ring[i * 3] = x * baseRadius;
    ring[i * 3 + 1] = y * baseRadius;
    ring[i * 3 + 2] = z;
  }
}

/**
 * Convert rings to indexed BufferGeometry
 */
export function ringsToGeometry(
  rings: Ring[],
  thetaDivs: number
): THREE.BufferGeometry {
  const numRings = rings.length;
  const numVertices = numRings * (thetaDivs + 1);
  
  // Create vertex arrays
  const positions = new Float32Array(numVertices * 3);
  const normals = new Float32Array(numVertices * 3);
  const uvs = new Float32Array(numVertices * 2);
  
  // Fill vertex data
  for (let i = 0; i < numRings; i++) {
    const ring = rings[i];
    const v = i / (numRings - 1); // V coordinate for texture
    
    for (let j = 0; j <= thetaDivs; j++) {
      const vertexIndex = i * (thetaDivs + 1) + j;
      const u = j / thetaDivs; // U coordinate for texture
      
      // Position
      positions[vertexIndex * 3] = ring[j * 3];
      positions[vertexIndex * 3 + 1] = ring[j * 3 + 1];
      positions[vertexIndex * 3 + 2] = ring[j * 3 + 2];
      
      // UV
      uvs[vertexIndex * 2] = u;
      uvs[vertexIndex * 2 + 1] = v;
    }
  }
  
  // Calculate normals
  calculateNormals(positions, normals, numRings, thetaDivs);
  
  // Create indices for triangles
  const numFaces = (numRings - 1) * thetaDivs * 2;
  const indices = new Uint32Array(numFaces * 3);
  let indexOffset = 0;
  
  for (let i = 0; i < numRings - 1; i++) {
    for (let j = 0; j < thetaDivs; j++) {
      const a = i * (thetaDivs + 1) + j;
      const b = a + 1;
      const c = a + thetaDivs + 1;
      const d = c + 1;
      
      // First triangle
      indices[indexOffset++] = a;
      indices[indexOffset++] = c;
      indices[indexOffset++] = b;
      
      // Second triangle
      indices[indexOffset++] = b;
      indices[indexOffset++] = c;
      indices[indexOffset++] = d;
    }
  }
  
  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  
  // Compute bounding sphere for frustum culling
  geometry.computeBoundingSphere();
  
  return geometry;
}

/**
 * Calculate vertex normals
 */
function calculateNormals(
  positions: Float32Array,
  normals: Float32Array,
  numRings: number,
  thetaDivs: number
): void {
  // Calculate face normals and accumulate to vertices
  for (let i = 0; i < numRings - 1; i++) {
    for (let j = 0; j < thetaDivs; j++) {
      const a = i * (thetaDivs + 1) + j;
      const b = a + 1;
      const c = a + thetaDivs + 1;
      
      // Get vertex positions
      const ax = positions[a * 3];
      const ay = positions[a * 3 + 1];
      const az = positions[a * 3 + 2];
      
      const bx = positions[b * 3];
      const by = positions[b * 3 + 1];
      const bz = positions[b * 3 + 2];
      
      const cx = positions[c * 3];
      const cy = positions[c * 3 + 1];
      const cz = positions[c * 3 + 2];
      
      // Calculate face normal using cross product
      const v1x = bx - ax;
      const v1y = by - ay;
      const v1z = bz - az;
      
      const v2x = cx - ax;
      const v2y = cy - ay;
      const v2z = cz - az;
      
      const nx = v1y * v2z - v1z * v2y;
      const ny = v1z * v2x - v1x * v2z;
      const nz = v1x * v2y - v1y * v2x;
      
      // Normalize
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (length > 0) {
        const invLength = 1 / length;
        
        // Add to vertex normals
        normals[a * 3] += nx * invLength;
        normals[a * 3 + 1] += ny * invLength;
        normals[a * 3 + 2] += nz * invLength;
        
        normals[b * 3] += nx * invLength;
        normals[b * 3 + 1] += ny * invLength;
        normals[b * 3 + 2] += nz * invLength;
        
        normals[c * 3] += nx * invLength;
        normals[c * 3 + 1] += ny * invLength;
        normals[c * 3 + 2] += nz * invLength;
      }
    }
  }
  
  // Normalize vertex normals
  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0) {
      const invLength = 1 / length;
      normals[i] *= invLength;
      normals[i + 1] *= invLength;
      normals[i + 2] *= invLength;
    }
  }
}

/**
 * Create horn geometry with WebWorker support for large meshes
 */
export async function createHornGeometry(
  profile: ProfilePoint[],
  crossSection: CrossSectionSpec,
  thetaDivs: number = 32,
  useWorker: boolean = false
): Promise<THREE.BufferGeometry> {
  const vertexCount = profile.length * (thetaDivs + 1);
  
  // Use WebWorker for large meshes
  if (useWorker && vertexCount > 50000) {
    // TODO: Implement WebWorker version
    console.log('WebWorker geometry generation not yet implemented');
  }
  
  // Generate geometry on main thread
  const rings = profileToRings(profile, crossSection, thetaDivs);
  return ringsToGeometry(rings, thetaDivs);
}