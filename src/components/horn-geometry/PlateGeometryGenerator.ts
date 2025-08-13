import * as THREE from "three";
import { HornProfileParams, MountPlateParams } from "../../types";
import {
  createRingGeometry,
  createRectangularRingGeometry,
  createRectangularBoltPattern,
  calculateRecommendedBoltCount,
  createFastCSGHoles,
  HoleParams,
  BoltPosition,
} from "../GeometryUtils";
import { HORN_GEOMETRY_CONSTANTS, DetailLevel } from "./HornGeometryConstants";

export function createOptimizedPlate(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  detailLevel: DetailLevel,
  enableHoles: boolean
): THREE.BufferGeometry {
  const baseGeometry = createBasePlateGeometry(plateParams, hornParams);
  const plateZ = hornParams.length;
  baseGeometry.translate(0, 0, plateZ - plateParams.thickness);
  
  if (!enableHoles) {
    return baseGeometry;
  }
  
  return addBoltHolesToPlate(
    baseGeometry,
    plateParams,
    hornParams,
    plateZ,
    detailLevel
  );
}

function createBasePlateGeometry(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams
): THREE.BufferGeometry {
  const plateType = hornParams.roundMouth ? "circle" : "rect";
  
  if (plateType === "rect") {
    return createRectangularPlateGeometry(plateParams, hornParams);
  } else {
    return createCircularPlateGeometry(plateParams, hornParams);
  }
}

function createRectangularPlateGeometry(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams
): THREE.BufferGeometry {
  const dimensions = calculateRectangularPlateDimensions(plateParams, hornParams);
  
  return createRectangularRingGeometry({
    outerWidth: dimensions.outerWidth,
    outerHeight: dimensions.outerHeight,
    innerWidth: hornParams.mouthWidth,
    innerHeight: hornParams.mouthHeight || hornParams.mouthWidth,
    thickness: plateParams.thickness,
  });
}

function createCircularPlateGeometry(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams
): THREE.BufferGeometry {
  const radii = calculateCircularPlateRadii(plateParams, hornParams);
  
  return createRingGeometry({
    outerRadius: radii.outerRadius,
    innerRadius: radii.innerRadius,
    thickness: plateParams.thickness,
  });
}

function calculateRectangularPlateDimensions(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams
) {
  const hornExitWidth = hornParams.mouthWidth;
  const hornExitHeight = hornParams.mouthHeight || hornParams.mouthWidth;
  const margin = plateParams.autoMargin || HORN_GEOMETRY_CONSTANTS.DEFAULT_MARGIN;
  
  const outerWidth = plateParams.useManualSize
    ? (plateParams.width || (hornExitWidth + margin * 2))
    : (hornExitWidth + margin * 2);
    
  const outerHeight = plateParams.useManualSize
    ? (plateParams.height || (hornExitHeight + margin * 2))
    : (hornExitHeight + margin * 2);
  
  return { outerWidth, outerHeight };
}

function calculateCircularPlateRadii(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams
) {
  const hornExitRadius = hornParams.mouthWidth / 2;
  const margin = plateParams.autoMargin || HORN_GEOMETRY_CONSTANTS.DEFAULT_MARGIN;
  
  const outerRadius = plateParams.useManualSize
    ? (plateParams.diameter ? (plateParams.diameter / 2) : (hornExitRadius + margin))
    : (hornExitRadius + margin);
  
  return {
    outerRadius,
    innerRadius: hornExitRadius,
  };
}

function addBoltHolesToPlate(
  baseGeometry: THREE.BufferGeometry,
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  plateZ: number,
  detailLevel: DetailLevel
): THREE.BufferGeometry {
  try {
    const baseMesh = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshStandardMaterial()
    );
    
    const holePositions = calculatePlateHolePositions(
      plateParams,
      hornParams,
      plateZ
    );
    
    const holeParams: HoleParams = {
      diameter: plateParams.boltHoleDiameter || HORN_GEOMETRY_CONSTANTS.DEFAULT_PLATE_BOLT_DIAMETER,
      thickness: plateParams.thickness,
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
    console.warn("Fast CSG failed for plate, using base geometry:", error);
    return baseGeometry;
  }
}

function calculatePlateHolePositions(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  plateZ: number
): BoltPosition[] {
  if (plateParams.type === "rect") {
    return calculateRectangularHolePositions(plateParams, hornParams, plateZ);
  } else {
    return calculateCircularHolePositions(plateParams, hornParams, plateZ);
  }
}

function calculateRectangularHolePositions(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  plateZ: number
): BoltPosition[] {
  const margin = plateParams.autoMargin || HORN_GEOMETRY_CONSTANTS.DEFAULT_MARGIN;
  const dimensions = calculateRectangularPlateDimensions(plateParams, hornParams);
  
  const optimalBoltCount = calculateRecommendedBoltCount(
    dimensions.outerWidth,
    dimensions.outerHeight,
    margin / 2,
    plateParams.maxBoltSpacing || HORN_GEOMETRY_CONSTANTS.DEFAULT_MAX_BOLT_SPACING
  );
  
  const rectBoltPositions = createRectangularBoltPattern({
    width: dimensions.outerWidth,
    height: dimensions.outerHeight,
    boltCount: optimalBoltCount,
    boltDiameter: plateParams.boltHoleDiameter || HORN_GEOMETRY_CONSTANTS.DEFAULT_PLATE_BOLT_DIAMETER,
    margin: margin / 2,
    maxSpacing: plateParams.maxBoltSpacing || HORN_GEOMETRY_CONSTANTS.DEFAULT_MAX_BOLT_SPACING,
  });
  
  return rectBoltPositions.map(pos => ({
    x: pos.x,
    y: pos.y,
    z: plateZ - plateParams.thickness / 2,
  }));
}

function calculateCircularHolePositions(
  plateParams: MountPlateParams,
  hornParams: HornProfileParams,
  plateZ: number
): BoltPosition[] {
  const hornExitRadius = hornParams.mouthWidth / 2;
  const margin = plateParams.autoMargin || HORN_GEOMETRY_CONSTANTS.DEFAULT_MARGIN;
  const boltCircleRadius = hornExitRadius + (margin / 2);
  const boltCount = plateParams.boltCount || HORN_GEOMETRY_CONSTANTS.DEFAULT_BOLT_COUNT;
  
  const positions: BoltPosition[] = [];
  
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * boltCircleRadius,
      y: Math.sin(angle) * boltCircleRadius,
      z: plateZ - plateParams.thickness / 2,
    });
  }
  
  return positions;
}

function getSegmentsForDetailLevel(detailLevel: DetailLevel): number {
  const segmentMap = {
    high: 16,
    medium: 8,
    low: 4,
  };
  return segmentMap[detailLevel];
}