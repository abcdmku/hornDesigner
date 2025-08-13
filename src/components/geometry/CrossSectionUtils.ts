import { GEOMETRY_CONSTANTS } from "./constants";

export interface CrossSectionProfile {
  vertices: Array<{ x: number; y: number }>;
  vertexCount: number;
  isRectangular: boolean;
}

export interface CrossSectionParams {
  throatDiameter: number;
  mouthWidth: number;
  mouthHeight?: number;
  roundMouth: boolean;
  wallThickness: number;
}

export interface RadiiCalculation {
  innerRadius: number;
  outerRadius: number;
}

export function calculateRadii(
  interiorRadius: number,
  wallThickness: number
): RadiiCalculation {
  const innerRadius = interiorRadius;
  const outerRadius = interiorRadius + wallThickness;
  return { innerRadius, outerRadius };
}

export function interpolateCrossSection(
  params: CrossSectionParams,
  t: number,
  scale: number
): CrossSectionProfile {
  if (params.roundMouth) {
    return createCircularCrossSection(params, t, scale);
  } else {
    return createRectangularCrossSection(params, t, scale);
  }
}

function createCircularCrossSection(
  params: CrossSectionParams,
  t: number,
  scale: number
): CrossSectionProfile {
  const throatRadius = params.throatDiameter / 2;
  const mouthWidth = params.mouthWidth * scale;
  
  const currentRadius = throatRadius + t * (mouthWidth / 2 - throatRadius);
  const { innerRadius, outerRadius } = calculateRadii(currentRadius, params.wallThickness);
  
  const segments = GEOMETRY_CONSTANTS.CROSS_SECTION_SEGMENTS;
  const vertices: Array<{ x: number; y: number }> = [];
  
  vertices.push(...generateCircleVertices(outerRadius, segments, false));
  vertices.push(...generateCircleVertices(innerRadius, segments, true));
  
  return {
    vertices,
    vertexCount: vertices.length,
    isRectangular: false,
  };
}

function createRectangularCrossSection(
  params: CrossSectionParams,
  t: number,
  scale: number
): CrossSectionProfile {
  const throatDiameter = params.throatDiameter;
  const mouthWidth = params.mouthWidth * scale;
  const mouthHeight = (params.mouthHeight || params.mouthWidth) * scale;
  
  const currentWidth = throatDiameter + t * (mouthWidth - throatDiameter);
  const currentHeight = throatDiameter + t * (mouthHeight - throatDiameter);
  
  const { innerRadius: innerHalfWidth, outerRadius: outerHalfWidth } = calculateRadii(
    currentWidth / 2,
    params.wallThickness
  );
  const { innerRadius: innerHalfHeight, outerRadius: outerHalfHeight } = calculateRadii(
    currentHeight / 2,
    params.wallThickness
  );
  
  const vertices = [
    ...createRectangleVertices(outerHalfWidth, outerHalfHeight),
    ...createRectangleVertices(innerHalfWidth, innerHalfHeight),
  ];
  
  return {
    vertices,
    vertexCount: vertices.length,
    isRectangular: true,
  };
}

function generateCircleVertices(
  radius: number,
  segments: number,
  reverse: boolean
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];
  
  if (reverse) {
    for (let i = segments - 1; i >= 0; i--) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
  } else {
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
  }
  
  return vertices;
}

function createRectangleVertices(
  halfWidth: number,
  halfHeight: number
): Array<{ x: number; y: number }> {
  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
}

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

export function generateSectionFaces(
  prevStart: number,
  currStart: number,
  vertexCount: number
): number[] {
  const indices: number[] = [];
  
  for (let i = 0; i < vertexCount; i++) {
    const next = (i + 1) % vertexCount;
    
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

export function calculateInterpolatedScale(
  startScale: number,
  endScale: number,
  t: number,
  easing: "linear" | "quadratic" | "exponential" = "linear"
): number {
  let easedT = t;
  
  switch (easing) {
    case "quadratic":
      easedT = t * t;
      break;
    case "exponential":
      easedT = Math.pow(t, 3);
      break;
  }
  
  return startScale + easedT * (endScale - startScale);
}