export const HORN_GEOMETRY_CONSTANTS = {
  // Performance settings
  PERFORMANCE_WARNING_THRESHOLD_MS: 100,
  
  // LOD distances
  LOD_DISTANCES: [0, 300, 600],
  
  // Default values
  DEFAULT_MARGIN: 20,
  DEFAULT_BOLT_COUNT: 4,
  DEFAULT_PLATE_BOLT_DIAMETER: 6,
  DEFAULT_DRIVER_BOLT_DIAMETER: 4,
  DEFAULT_MAX_BOLT_SPACING: 150,
  DEFAULT_BOLT_CIRCLE_FACTOR: 0.6,
  
  // Geometry segments
  LATHE_SEGMENTS: 32,
  
  // Performance modes
  PERFORMANCE_SETTINGS: {
    high: { holeSegments: 16, hornSteps: 30, enableCSG: true },
    medium: { holeSegments: 8, hornSteps: 20, enableCSG: true },
    low: { holeSegments: 4, hornSteps: 15, enableCSG: true },
  },
  
  // Material properties
  MATERIALS: {
    horn: {
      color: "#888888",
      metalness: 0.1,
      roughness: 0.8,
    },
    plate: {
      color: "#555555",
      metalness: 0.2,
      roughness: 0.6,
    },
    driver: {
      color: "#777777",
      metalness: 0.3,
      roughness: 0.5,
    },
  },
} as const;

export type PerformanceMode = keyof typeof HORN_GEOMETRY_CONSTANTS.PERFORMANCE_SETTINGS;
export type DetailLevel = "high" | "medium" | "low";