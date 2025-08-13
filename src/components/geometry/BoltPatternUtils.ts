import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GEOMETRY_CONSTANTS, DetailLevel, LOD_SEGMENTS } from "./constants";

export interface BoltPosition {
  x: number;
  y: number;
  z?: number;
}

export interface HoleParams {
  diameter: number;
  thickness: number;
  segments?: number;
}

export interface BoltPatternParams {
  boltCount: number;
  boltHoleDiameter: number;
  boltCircleDiameter: number;
}

export interface RectangularBoltPatternParams {
  width: number;
  height: number;
  boltCount: number;
  boltDiameter: number;
  margin?: number;
  maxSpacing?: number;
}

export function createBoltHoles(
  centerZ: number,
  params: BoltPatternParams,
  thickness: number
): THREE.Mesh[] {
  const holes: THREE.Mesh[] = [];
  
  const holeGeom = new THREE.CylinderGeometry(
    params.boltHoleDiameter / 2,
    params.boltHoleDiameter / 2,
    thickness * GEOMETRY_CONSTANTS.HOLE_PENETRATION_FACTOR,
    GEOMETRY_CONSTANTS.BOLT_HOLE_SEGMENTS_REDUCED
  );
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

export function createRectangularBoltPattern(
  params: RectangularBoltPatternParams
): BoltPosition[] {
  const {
    width,
    height,
    boltCount,
    margin = GEOMETRY_CONSTANTS.DEFAULT_BOLT_MARGIN,
    maxSpacing = GEOMETRY_CONSTANTS.DEFAULT_MAX_BOLT_SPACING,
  } = params;
  
  const positions: BoltPosition[] = [];
  const availableWidth = width - 2 * margin;
  const availableHeight = height - 2 * margin;
  
  const corners = getCornerPositions(availableWidth, availableHeight);
  positions.push(...corners);
  
  const remainingBolts = Math.max(0, boltCount - 4);
  
  if (remainingBolts > 0) {
    const edgeBolts = distributeEdgeBolts(
      availableWidth,
      availableHeight,
      remainingBolts,
      maxSpacing
    );
    positions.push(...edgeBolts);
  }
  
  return positions.slice(0, boltCount);
}

function getCornerPositions(width: number, height: number): BoltPosition[] {
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ];
}

function distributeEdgeBolts(
  width: number,
  height: number,
  boltCount: number,
  maxSpacing: number
): BoltPosition[] {
  const positions: BoltPosition[] = [];
  
  const horizontalBoltsPerEdge = Math.max(0, Math.floor(width / maxSpacing) - 1);
  const verticalBoltsPerEdge = Math.max(0, Math.floor(height / maxSpacing) - 1);
  const naturalTotal = 2 * (horizontalBoltsPerEdge + verticalBoltsPerEdge);
  
  let actualHorizontal = horizontalBoltsPerEdge;
  let actualVertical = verticalBoltsPerEdge;
  
  if (boltCount < naturalTotal) {
    const factor = boltCount / naturalTotal;
    actualHorizontal = Math.floor(horizontalBoltsPerEdge * factor);
    actualVertical = Math.floor(verticalBoltsPerEdge * factor);
  } else if (boltCount > naturalTotal) {
    const extra = boltCount - naturalTotal;
    const extraPerEdge = Math.floor(extra / 4);
    actualHorizontal += extraPerEdge;
    actualVertical += extraPerEdge;
  }
  
  positions.push(...createEdgeBolts(width, height, actualHorizontal, actualVertical));
  
  return positions;
}

function createEdgeBolts(
  width: number,
  height: number,
  horizontal: number,
  vertical: number
): BoltPosition[] {
  const positions: BoltPosition[] = [];
  
  if (horizontal > 0) {
    const hSpacing = width / (horizontal + 1);
    for (let i = 1; i <= horizontal; i++) {
      positions.push({ x: -width / 2 + i * hSpacing, y: height / 2 });
      positions.push({ x: width / 2 - i * hSpacing, y: -height / 2 });
    }
  }
  
  if (vertical > 0) {
    const vSpacing = height / (vertical + 1);
    for (let i = 1; i <= vertical; i++) {
      positions.push({ x: width / 2, y: height / 2 - i * vSpacing });
      positions.push({ x: -width / 2, y: -height / 2 + i * vSpacing });
    }
  }
  
  return positions;
}

export function calculateRecommendedBoltCount(
  width: number,
  height: number,
  margin: number = GEOMETRY_CONSTANTS.DEFAULT_BOLT_MARGIN,
  maxSpacing: number = GEOMETRY_CONSTANTS.DEFAULT_MAX_BOLT_SPACING
): number {
  const availableWidth = width - 2 * margin;
  const availableHeight = height - 2 * margin;
  
  let boltCount = 4;
  
  const horizontalBolts = Math.max(0, Math.floor(availableWidth / maxSpacing) - 1);
  boltCount += 2 * horizontalBolts;
  
  const verticalBolts = Math.max(0, Math.floor(availableHeight / maxSpacing) - 1);
  boltCount += 2 * verticalBolts;
  
  return boltCount;
}

export function createMergedBoltHoles(
  positions: BoltPosition[],
  holeParams: HoleParams
): THREE.BufferGeometry {
  const baseHoleGeom = new THREE.CylinderGeometry(
    holeParams.diameter / 2,
    holeParams.diameter / 2,
    holeParams.thickness * GEOMETRY_CONSTANTS.HOLE_OVERFLOW_FACTOR,
    holeParams.segments || GEOMETRY_CONSTANTS.BOLT_HOLE_SEGMENTS_REDUCED
  );
  
  baseHoleGeom.rotateX(Math.PI / 2);
  
  const holeGeometries: THREE.BufferGeometry[] = [];
  
  for (const pos of positions) {
    const geom = baseHoleGeom.clone();
    geom.translate(pos.x, pos.y, pos.z || 0);
    holeGeometries.push(geom);
  }
  
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(holeGeometries);
  
  holeGeometries.forEach(geom => geom.dispose());
  baseHoleGeom.dispose();
  
  return mergedGeometry;
}

export function createInstancedBoltHoles(
  positions: BoltPosition[],
  holeParams: HoleParams
): THREE.InstancedMesh {
  const baseHoleGeom = new THREE.CylinderGeometry(
    holeParams.diameter / 2,
    holeParams.diameter / 2,
    holeParams.thickness * GEOMETRY_CONSTANTS.HOLE_OVERFLOW_FACTOR,
    holeParams.segments || GEOMETRY_CONSTANTS.BOLT_HOLE_SEGMENTS_REDUCED
  );
  baseHoleGeom.rotateX(Math.PI / 2);
  
  const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
  
  const instancedMesh = new THREE.InstancedMesh(
    baseHoleGeom,
    material,
    positions.length
  );
  
  const matrix = new THREE.Matrix4();
  positions.forEach((pos, index) => {
    matrix.makeTranslation(pos.x, pos.y, pos.z || 0);
    instancedMesh.setMatrixAt(index, matrix);
  });
  
  instancedMesh.instanceMatrix.needsUpdate = true;
  
  return instancedMesh;
}

export function createLODBoltHoles(
  positions: BoltPosition[],
  holeParams: HoleParams,
  detailLevel: DetailLevel
): THREE.BufferGeometry {
  const adjustedParams: HoleParams = {
    ...holeParams,
    segments: LOD_SEGMENTS[detailLevel.toUpperCase() as keyof typeof LOD_SEGMENTS],
  };
  
  return createMergedBoltHoles(positions, adjustedParams);
}