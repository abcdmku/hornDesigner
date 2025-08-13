export {
  calculateRadii,
  interpolateCrossSection,
  generateCrossSectionVertices,
  generateSectionFaces,
  type CrossSectionProfile,
  type CrossSectionParams,
  type RadiiCalculation,
} from "./geometry/CrossSectionUtils";

export {
  createBoltHoles,
  createRectangularBoltPattern,
  calculateRecommendedBoltCount,
  createMergedBoltHoles,
  createInstancedBoltHoles,
  createLODBoltHoles,
  type BoltPosition,
  type HoleParams,
  type BoltPatternParams,
  type RectangularBoltPatternParams,
} from "./geometry/BoltPatternUtils";

export {
  applyCsgOperations,
  createFastCSGHoles,
  subtractGeometries,
  validateCSGInput,
  cleanupCSGGeometry,
  type CSGResult,
} from "./geometry/CSGOperations";

export {
  createRingGeometry,
  createRectangularRingGeometry,
  createRoundedRectangularRing,
  validateRingParameters,
  validateRectangularRingParameters,
  type RingGeometryParams,
  type RectangularRingParams,
} from "./geometry/RingGeometry";

export {
  getCachedGeometry,
  clearGeometryCache,
  getGeometryCacheStats,
  GeometryCache,
} from "./geometry/GeometryCache";

export {
  GEOMETRY_CONSTANTS,
  LOD_SEGMENTS,
  type DetailLevel,
} from "./geometry/constants";