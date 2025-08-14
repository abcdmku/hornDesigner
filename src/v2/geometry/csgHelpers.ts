/**
 * CSG (Constructive Solid Geometry) helpers for horn mounting and flanges
 * Optional utilities for adding mounting features to horn geometry
 */

import * as THREE from 'three';

/**
 * Mounting flange specification
 */
export interface FlangeSpec {
  enabled: boolean;
  thickness: number; // mm
  outerDiameter: number; // mm
  boltPattern?: BoltPattern;
}

/**
 * Bolt pattern specification
 */
export interface BoltPattern {
  count: number;
  diameter: number; // Bolt circle diameter (mm)
  holeSize: number; // Bolt hole diameter (mm)
}

/**
 * Driver mounting specification
 */
export interface DriverMountSpec {
  enabled: boolean;
  throatDiameter: number; // mm
  mountingDepth: number; // mm
  boltPattern?: BoltPattern;
}

/**
 * Create a mounting flange geometry
 */
export function createFlangeGeometry(
  mouthRadius: number,
  flangeSpec: FlangeSpec
): THREE.BufferGeometry | null {
  if (!flangeSpec.enabled) {
    return null;
  }
  
  const innerRadius = mouthRadius;
  const outerRadius = flangeSpec.outerDiameter / 2;
  const thickness = flangeSpec.thickness;
  
  // Create ring geometry for flange
  const geometry = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    32,
    1
  );
  
  // Extrude to create thickness
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: thickness,
    bevelEnabled: false
  };
  
  const shape = new THREE.Shape();
  
  // Outer circle
  shape.moveTo(outerRadius, 0);
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    shape.lineTo(
      outerRadius * Math.cos(angle),
      outerRadius * Math.sin(angle)
    );
  }
  
  // Inner hole
  const hole = new THREE.Path();
  hole.moveTo(innerRadius, 0);
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    hole.lineTo(
      innerRadius * Math.cos(angle),
      innerRadius * Math.sin(angle)
    );
  }
  shape.holes.push(hole);
  
  const flangeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Add bolt holes if specified
  if (flangeSpec.boltPattern) {
    addBoltHoles(flangeGeometry, flangeSpec.boltPattern, thickness);
  }
  
  return flangeGeometry;
}

/**
 * Add bolt holes to a geometry
 */
function addBoltHoles(
  geometry: THREE.BufferGeometry,
  boltPattern: BoltPattern,
  depth: number
): void {
  const { count, diameter, holeSize } = boltPattern;
  const boltRadius = diameter / 2;
  const holeRadius = holeSize / 2;
  
  // Create cylinder geometry for holes
  const holeGeometry = new THREE.CylinderGeometry(
    holeRadius,
    holeRadius,
    depth * 1.1,
    16
  );
  
  // Position holes around bolt circle
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = boltRadius * Math.cos(angle);
    const y = boltRadius * Math.sin(angle);
    
    // Clone and position hole geometry
    const hole = holeGeometry.clone();
    hole.rotateX(Math.PI / 2);
    hole.translate(x, y, depth / 2);
    
    // Note: Actual CSG subtraction would require a CSG library
    // This is a simplified representation
  }
}

/**
 * Create driver mounting adapter
 */
export function createDriverMount(
  throatRadius: number,
  mountSpec: DriverMountSpec
): THREE.BufferGeometry | null {
  if (!mountSpec.enabled) {
    return null;
  }
  
  const { throatDiameter, mountingDepth } = mountSpec;
  const adapterRadius = throatDiameter / 2;
  
  // Create tapered adapter from driver to horn throat
  const points: THREE.Vector2[] = [];
  
  // Driver side (larger)
  points.push(new THREE.Vector2(adapterRadius, 0));
  points.push(new THREE.Vector2(adapterRadius, mountingDepth * 0.2));
  
  // Taper
  points.push(new THREE.Vector2(throatRadius, mountingDepth * 0.8));
  points.push(new THREE.Vector2(throatRadius, mountingDepth));
  
  // Create lathe geometry
  const geometry = new THREE.LatheGeometry(points, 32);
  
  return geometry;
}

/**
 * Create a phase plug geometry
 */
export function createPhasePlug(
  throatRadius: number,
  plugLength: number,
  slots: number = 6
): THREE.BufferGeometry {
  const geometry = new THREE.ConeGeometry(
    throatRadius * 0.8,
    throatRadius * 0.3,
    plugLength,
    32
  );
  
  // Add radial slots (simplified representation)
  // In practice, this would require CSG operations
  
  return geometry;
}

/**
 * Merge multiple geometries into one
 */
export function mergeGeometries(
  geometries: (THREE.BufferGeometry | null)[]
): THREE.BufferGeometry {
  const validGeometries = geometries.filter(g => g !== null) as THREE.BufferGeometry[];
  
  if (validGeometries.length === 0) {
    return new THREE.BufferGeometry();
  }
  
  if (validGeometries.length === 1) {
    return validGeometries[0];
  }
  
  // Merge all geometries
  const mergedGeometry = validGeometries[0].clone();
  
  for (let i = 1; i < validGeometries.length; i++) {
    // Note: In Three.js r125+, use BufferGeometryUtils.mergeBufferGeometries
    // For now, simplified merge
    const positions = validGeometries[i].getAttribute('position');
    const normals = validGeometries[i].getAttribute('normal');
    const uvs = validGeometries[i].getAttribute('uv');
    
    // This is a simplified merge - proper implementation would combine attributes
  }
  
  return mergedGeometry;
}

/**
 * Calculate volume of a horn geometry
 */
export function calculateVolume(geometry: THREE.BufferGeometry): number {
  const positions = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  
  if (!positions || !indices) {
    return 0;
  }
  
  let volume = 0;
  
  // Calculate volume using divergence theorem
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.array[i];
    const b = indices.array[i + 1];
    const c = indices.array[i + 2];
    
    const v1 = new THREE.Vector3(
      positions.array[a * 3],
      positions.array[a * 3 + 1],
      positions.array[a * 3 + 2]
    );
    
    const v2 = new THREE.Vector3(
      positions.array[b * 3],
      positions.array[b * 3 + 1],
      positions.array[b * 3 + 2]
    );
    
    const v3 = new THREE.Vector3(
      positions.array[c * 3],
      positions.array[c * 3 + 1],
      positions.array[c * 3 + 2]
    );
    
    // Signed volume of tetrahedron
    const tetraVolume = v1.dot(v2.cross(v3)) / 6;
    volume += tetraVolume;
  }
  
  return Math.abs(volume);
}

/**
 * Calculate surface area of a horn geometry
 */
export function calculateSurfaceArea(geometry: THREE.BufferGeometry): number {
  const positions = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  
  if (!positions || !indices) {
    return 0;
  }
  
  let area = 0;
  
  // Calculate area of each triangle
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.array[i];
    const b = indices.array[i + 1];
    const c = indices.array[i + 2];
    
    const v1 = new THREE.Vector3(
      positions.array[a * 3],
      positions.array[a * 3 + 1],
      positions.array[a * 3 + 2]
    );
    
    const v2 = new THREE.Vector3(
      positions.array[b * 3],
      positions.array[b * 3 + 1],
      positions.array[b * 3 + 2]
    );
    
    const v3 = new THREE.Vector3(
      positions.array[c * 3],
      positions.array[c * 3 + 1],
      positions.array[c * 3 + 2]
    );
    
    // Triangle area using cross product
    const edge1 = v2.sub(v1);
    const edge2 = v3.sub(v1);
    const triangleArea = edge1.cross(edge2).length() / 2;
    
    area += triangleArea;
  }
  
  return area;
}

/**
 * Generate wall thickness for 3D printing
 */
export function addWallThickness(
  geometry: THREE.BufferGeometry,
  thickness: number
): THREE.BufferGeometry {
  // Clone geometry for inner surface
  const innerGeometry = geometry.clone();
  
  // Scale down uniformly (simplified approach)
  const scale = 1 - thickness / 100; // Approximate scaling
  innerGeometry.scale(scale, scale, 1);
  
  // Flip normals for inner surface
  const normals = innerGeometry.getAttribute('normal');
  if (normals) {
    for (let i = 0; i < normals.count; i++) {
      normals.array[i * 3] *= -1;
      normals.array[i * 3 + 1] *= -1;
      normals.array[i * 3 + 2] *= -1;
    }
  }
  
  // Merge outer and inner geometries
  return mergeGeometries([geometry, innerGeometry]);
}