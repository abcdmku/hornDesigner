import * as THREE from "three";
import { DriverMountParams } from "../../types";
import {
  createRingGeometry,
  createFastCSGHoles,
  HoleParams,
  BoltPosition,
} from "../GeometryUtils";
import { HORN_GEOMETRY_CONSTANTS, DetailLevel } from "./HornGeometryConstants";

export function createOptimizedDriver(
  driverParams: DriverMountParams,
  detailLevel: DetailLevel,
  enableHoles: boolean
): THREE.BufferGeometry {
  const baseGeometry = createBaseDriverGeometry(driverParams);
  const driverZ = 0;
  baseGeometry.translate(0, 0, driverZ);
  
  if (!enableHoles) {
    return baseGeometry;
  }
  
  return addBoltHolesToDriver(
    baseGeometry,
    driverParams,
    driverZ,
    detailLevel
  );
}

function createBaseDriverGeometry(
  driverParams: DriverMountParams
): THREE.BufferGeometry {
  const innerRadius = driverParams.throatDiameter / 2;
  const outerRadius = driverParams.flangeDiameter / 2;
  const thickness = driverParams.flangeThickness;
  
  return createRingGeometry({
    outerRadius,
    innerRadius,
    thickness,
    segments: HORN_GEOMETRY_CONSTANTS.LATHE_SEGMENTS,
  });
}

function addBoltHolesToDriver(
  baseGeometry: THREE.BufferGeometry,
  driverParams: DriverMountParams,
  driverZ: number,
  detailLevel: DetailLevel
): THREE.BufferGeometry {
  try {
    const baseMesh = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshStandardMaterial()
    );
    
    const holePositions = calculateDriverHolePositions(
      driverParams,
      driverZ
    );
    
    const holeParams: HoleParams = {
      diameter: driverParams.boltHoleDiameter || HORN_GEOMETRY_CONSTANTS.DEFAULT_DRIVER_BOLT_DIAMETER,
      thickness: driverParams.flangeThickness,
      segments: getSegmentsForDetailLevel(detailLevel),
    };
    
    const result = createFastCSGHoles(baseMesh, holePositions, holeParams);
    baseGeometry.dispose();
    
    if (result.success) {
      return result.geometry;
    } else {
      console.warn("CSG operation failed:", result.error);
      return baseGeometry;
    }
  } catch (error) {
    console.warn("Fast CSG failed for driver, using base geometry:", error);
    return baseGeometry;
  }
}

function calculateDriverHolePositions(
  driverParams: DriverMountParams,
  driverZ: number
): BoltPosition[] {
  const boltCircleRadius = calculateBoltCircleRadius(driverParams);
  const boltCount = driverParams.boltCount || HORN_GEOMETRY_CONSTANTS.DEFAULT_BOLT_COUNT;
  
  const positions: BoltPosition[] = [];
  
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * boltCircleRadius,
      y: Math.sin(angle) * boltCircleRadius,
      z: driverZ,
    });
  }
  
  return positions;
}

function calculateBoltCircleRadius(driverParams: DriverMountParams): number {
  if (driverParams.boltCircleDiameter) {
    return driverParams.boltCircleDiameter / 2;
  }
  
  return driverParams.throatDiameter * HORN_GEOMETRY_CONSTANTS.DEFAULT_BOLT_CIRCLE_FACTOR;
}

function getSegmentsForDetailLevel(detailLevel: DetailLevel): number {
  const segmentMap = {
    high: 16,
    medium: 8,
    low: 4,
  };
  return segmentMap[detailLevel];
}