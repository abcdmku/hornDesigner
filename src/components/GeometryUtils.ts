import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

// Wall thickness calculation - CORRECT APPROACH: expand outward only
export function calculateRadii(interiorRadius: number, wallThickness: number) {
  const innerRadius = interiorRadius; // Interior unchanged
  const outerRadius = interiorRadius + wallThickness; // Wall expands outward
  return { innerRadius, outerRadius };
}

// Optimized CSG bolt hole creation
export function createBoltHoles(
  centerZ: number,
  params: { boltCount: number; boltHoleDiameter: number; boltCircleDiameter: number },
  thickness: number
): THREE.Mesh[] {
  const holes: THREE.Mesh[] = [];
  
  // Reuse geometry for performance - make holes longer to ensure full penetration
  const holeGeom = new THREE.CylinderGeometry(
    params.boltHoleDiameter / 2,
    params.boltHoleDiameter / 2,
    thickness * 2.0, // Make holes twice as long to ensure they cut through
    8 // Reduced segments for performance
  );
  // Rotate to make holes go through flat flanges along Z axis
  holeGeom.rotateX(Math.PI / 2);
  
  for (let i = 0; i < params.boltCount; i++) {
    const angle = (i / params.boltCount) * Math.PI * 2;
    const x = Math.cos(angle) * (params.boltCircleDiameter / 2);
    const y = Math.sin(angle) * (params.boltCircleDiameter / 2);
    
    const holeClone = holeGeom.clone();
    holeClone.translate(x, y, centerZ);
    holes.push(new THREE.Mesh(holeClone, new THREE.MeshStandardMaterial()));
  }
  
  return holes;
}

// Rectangle bolt positioning algorithm - corner-first, maximum spacing
export function createRectangularBoltPattern(
  width: number,
  height: number,
  boltCount: number,
  boltDiameter: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const margin = boltDiameter; // Minimum distance from edge
  
  // Calculate available perimeter
  const availableWidth = width - 2 * margin;
  const availableHeight = height - 2 * margin;
  
  if (boltCount <= 4) {
    // For small bolt counts, use corners
    const corners = [
      { x: availableWidth / 2, y: availableHeight / 2 },     // Top-right
      { x: -availableWidth / 2, y: availableHeight / 2 },    // Top-left
      { x: -availableWidth / 2, y: -availableHeight / 2 },   // Bottom-left
      { x: availableWidth / 2, y: -availableHeight / 2 }     // Bottom-right
    ];
    
    return corners.slice(0, boltCount);
  }
  
  // For larger counts, distribute around perimeter starting with corners
  const perimeter = 2 * availableWidth + 2 * availableHeight;
  const spacing = perimeter / boltCount;
  
  for (let i = 0; i < boltCount; i++) {
    const distance = i * spacing;
    let x: number, y: number;
    
    if (distance <= availableWidth) {
      // Top edge
      x = -availableWidth / 2 + distance;
      y = availableHeight / 2;
    } else if (distance <= availableWidth + availableHeight) {
      // Right edge
      x = availableWidth / 2;
      y = availableHeight / 2 - (distance - availableWidth);
    } else if (distance <= 2 * availableWidth + availableHeight) {
      // Bottom edge
      x = availableWidth / 2 - (distance - availableWidth - availableHeight);
      y = -availableHeight / 2;
    } else {
      // Left edge
      x = -availableWidth / 2;
      y = -availableHeight / 2 + (distance - 2 * availableWidth - availableHeight);
    }
    
    positions.push({ x, y });
  }
  
  return positions;
}

// Create ring geometry with ExtrudeGeometry (for flanges with openings)
export function createRingGeometry(
  outerRadius: number,
  innerRadius: number,
  thickness: number,
  segments: number = 32
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  
  // Add hole
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(holePath);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: segments
  });
  
  // No rotation - flanges should be flat (parallel to XY plane)
  return geometry;
}

// Create rectangular ring geometry (for rectangular mounting plates)
export function createRectangularRingGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  thickness: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Outer rectangle
  shape.moveTo(-outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, outerHeight / 2);
  shape.lineTo(-outerWidth / 2, outerHeight / 2);
  shape.lineTo(-outerWidth / 2, -outerHeight / 2);
  
  // Inner rectangle hole
  const holePath = new THREE.Path();
  holePath.moveTo(-innerWidth / 2, -innerHeight / 2);
  holePath.lineTo(-innerWidth / 2, innerHeight / 2);
  holePath.lineTo(innerWidth / 2, innerHeight / 2);
  holePath.lineTo(innerWidth / 2, -innerHeight / 2);
  holePath.lineTo(-innerWidth / 2, -innerHeight / 2);
  shape.holes.push(holePath);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 4
  });
  
  // No rotation - flanges should be flat (parallel to XY plane)
  return geometry;
}

// Apply CSG operations with error handling and fallback
export function applyCsgOperations(
  baseMesh: THREE.Mesh,
  subtractMeshes: THREE.Mesh[],
  fallbackGeometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  try {
    // Update matrices before CSG operations
    baseMesh.updateMatrix();
    subtractMeshes.forEach(mesh => mesh.updateMatrix());
    
    let result: any = baseMesh;
    for (const subtractMesh of subtractMeshes) {
      result = CSG.subtract(result, subtractMesh);
    }
    
    return result.geometry;
  } catch (error) {
    console.warn('CSG operation failed, using fallback geometry:', error);
    return fallbackGeometry;
  }
}

// Enhanced horn profile with shape morphing support
export interface CrossSectionProfile {
  vertices: Array<{ x: number; y: number }>;
  vertexCount: number;
  isRectangular: boolean;
}

// Interpolate between throat and exit cross-sections
export function interpolateCrossSection(
  params: {
    throatDiameter: number;
    mouthWidth: number;
    mouthHeight?: number;
    roundMouth: boolean;
    wallThickness: number;
  },
  t: number, // interpolation factor (0 = throat, 1 = exit)
  scale: number // current scale factor along horn length
): CrossSectionProfile {
  const throatRadius = params.throatDiameter / 2;
  const mouthWidth = params.mouthWidth * scale;
  const mouthHeight = (params.mouthHeight || params.mouthWidth) * scale;
  
  if (params.roundMouth) {
    // Circular cross-section
    const { innerRadius, outerRadius } = calculateRadii(
      throatRadius + t * (mouthWidth / 2 - throatRadius),
      params.wallThickness
    );
    
    // Generate circular vertices
    const segments = 16;
    const vertices: Array<{ x: number; y: number }> = [];
    
    // Outer circle
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * outerRadius,
        y: Math.sin(angle) * outerRadius
      });
    }
    
    // Inner circle (reverse order for hole)
    for (let i = segments - 1; i >= 0; i--) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * innerRadius,
        y: Math.sin(angle) * innerRadius
      });
    }
    
    return {
      vertices,
      vertexCount: vertices.length,
      isRectangular: false
    };
  } else {
    // Rectangular cross-section
    const throatWidth = params.throatDiameter;
    const throatHeight = params.throatDiameter;
    
    const currentWidth = throatWidth + t * (mouthWidth - throatWidth);
    const currentHeight = throatHeight + t * (mouthHeight - throatHeight);
    
    const { innerRadius: innerWidth, outerRadius: outerWidth } = calculateRadii(
      currentWidth / 2,
      params.wallThickness
    );
    const { innerRadius: innerHeight, outerRadius: outerHeight } = calculateRadii(
      currentHeight / 2,
      params.wallThickness
    );
    
    const vertices = [
      // Outer rectangle
      { x: -outerWidth, y: -outerHeight },
      { x: outerWidth, y: -outerHeight },
      { x: outerWidth, y: outerHeight },
      { x: -outerWidth, y: outerHeight },
      // Inner rectangle (hole)
      { x: -innerWidth, y: -innerHeight },
      { x: -innerWidth, y: innerHeight },
      { x: innerWidth, y: innerHeight },
      { x: innerWidth, y: -innerHeight }
    ];
    
    return {
      vertices,
      vertexCount: vertices.length,
      isRectangular: true
    };
  }
}

// Generate cross-section vertices for 3D geometry
export function generateCrossSectionVertices(
  crossSection: CrossSectionProfile,
  z: number
): number[] {
  const vertices: number[] = [];
  
  for (const vertex of crossSection.vertices) {
    vertices.push(vertex.x, vertex.y, z);
  }
  
  return vertices;
}

// Generate face indices between two cross-sections
export function generateSectionFaces(
  prevStart: number,
  currStart: number,
  vertexCount: number
): number[] {
  const indices: number[] = [];
  
  for (let i = 0; i < vertexCount; i++) {
    const next = (i + 1) % vertexCount;
    
    // Create quad between sections
    indices.push(
      prevStart + i,
      currStart + i,
      prevStart + next
    );
    
    indices.push(
      currStart + i,
      currStart + next,
      prevStart + next
    );
  }
  
  return indices;
}