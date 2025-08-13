import * as THREE from "three";
import { GEOMETRY_CONSTANTS } from "./constants";

export interface RingGeometryParams {
  outerRadius: number;
  innerRadius: number;
  thickness: number;
  segments?: number;
}

export interface RectangularRingParams {
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
  thickness: number;
}

export function createRingGeometry(params: RingGeometryParams): THREE.BufferGeometry {
  const {
    outerRadius,
    innerRadius,
    thickness,
    segments = GEOMETRY_CONSTANTS.DEFAULT_SEGMENTS,
  } = params;
  
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(holePath);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: segments,
  });
  
  return geometry;
}

export function createRectangularRingGeometry(
  params: RectangularRingParams
): THREE.BufferGeometry {
  const { outerWidth, outerHeight, innerWidth, innerHeight, thickness } = params;
  
  const shape = createRectangularShape(outerWidth, outerHeight);
  const hole = createRectangularPath(innerWidth, innerHeight);
  shape.holes.push(hole);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: GEOMETRY_CONSTANTS.RECTANGULAR_CURVE_SEGMENTS,
  });
  
  return geometry;
}

function createRectangularShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  shape.moveTo(-halfWidth, -halfHeight);
  shape.lineTo(halfWidth, -halfHeight);
  shape.lineTo(halfWidth, halfHeight);
  shape.lineTo(-halfWidth, halfHeight);
  shape.lineTo(-halfWidth, -halfHeight);
  
  return shape;
}

function createRectangularPath(width: number, height: number): THREE.Path {
  const path = new THREE.Path();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  path.moveTo(-halfWidth, -halfHeight);
  path.lineTo(-halfWidth, halfHeight);
  path.lineTo(halfWidth, halfHeight);
  path.lineTo(halfWidth, -halfHeight);
  path.lineTo(-halfWidth, -halfHeight);
  
  return path;
}

export function createRoundedRectangularRing(
  params: RectangularRingParams & { cornerRadius?: number }
): THREE.BufferGeometry {
  const {
    outerWidth,
    outerHeight,
    innerWidth,
    innerHeight,
    thickness,
    cornerRadius = 0,
  } = params;
  
  const shape = createRoundedRectangleShape(outerWidth, outerHeight, cornerRadius);
  
  if (innerWidth > 0 && innerHeight > 0) {
    const innerCornerRadius = Math.max(
      0,
      cornerRadius - Math.min(
        (outerWidth - innerWidth) / 2,
        (outerHeight - innerHeight) / 2
      )
    );
    const hole = createRoundedRectanglePath(innerWidth, innerHeight, innerCornerRadius);
    shape.holes.push(hole);
  }
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: cornerRadius > 0 ? 8 : GEOMETRY_CONSTANTS.RECTANGULAR_CURVE_SEGMENTS,
  });
  
  return geometry;
}

function createRoundedRectangleShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  
  if (r <= 0) {
    return createRectangularShape(width, height);
  }
  
  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);
  
  return shape;
}

function createRoundedRectanglePath(
  width: number,
  height: number,
  radius: number
): THREE.Path {
  const path = new THREE.Path();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  
  if (r <= 0) {
    return createRectangularPath(width, height);
  }
  
  path.moveTo(-halfWidth + r, -halfHeight);
  path.lineTo(-halfWidth, -halfHeight + r);
  path.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);
  path.lineTo(halfWidth - r, -halfHeight);
  path.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  path.lineTo(halfWidth, halfHeight - r);
  path.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  path.lineTo(-halfWidth + r, halfHeight);
  path.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  path.lineTo(-halfWidth, -halfHeight + r);
  
  return path;
}

export function validateRingParameters(params: RingGeometryParams): boolean {
  const { outerRadius, innerRadius, thickness } = params;
  
  if (outerRadius <= 0) {
    console.error("Outer radius must be positive");
    return false;
  }
  
  if (innerRadius <= 0) {
    console.error("Inner radius must be positive");
    return false;
  }
  
  if (innerRadius >= outerRadius) {
    console.error("Inner radius must be less than outer radius");
    return false;
  }
  
  if (thickness <= 0) {
    console.error("Thickness must be positive");
    return false;
  }
  
  return true;
}

export function validateRectangularRingParameters(params: RectangularRingParams): boolean {
  const { outerWidth, outerHeight, innerWidth, innerHeight, thickness } = params;
  
  if (outerWidth <= 0 || outerHeight <= 0) {
    console.error("Outer dimensions must be positive");
    return false;
  }
  
  if (innerWidth <= 0 || innerHeight <= 0) {
    console.error("Inner dimensions must be positive");
    return false;
  }
  
  if (innerWidth >= outerWidth || innerHeight >= outerHeight) {
    console.error("Inner dimensions must be less than outer dimensions");
    return false;
  }
  
  if (thickness <= 0) {
    console.error("Thickness must be positive");
    return false;
  }
  
  return true;
}