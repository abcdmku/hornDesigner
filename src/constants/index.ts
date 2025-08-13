import { MaterialType } from '../types';
import { ProfileType } from '../profiles/types';

// Material Costs Reference Data from PRP
export const MATERIALS: MaterialType[] = [
  { name: 'PLA', density: 1.25, costPerGram: 0.10 },
  { name: 'PETG', density: 1.25, costPerGram: 0.12 },  
  { name: 'ABS', density: 1.04, costPerGram: 0.10 },
  { name: 'Resin', density: 1.1, costPerGram: 1.50 }
];

// Horn Types Reference Data from PRP
export const HORN_TYPES = [
  'exponential', 'tractrix', 'conical', 'le-cleach', 'jmlc', 'oblate-spheroid'
] as const;

// Default values for horn parameters
export const DEFAULT_HORN_PARAMS = {
  throatDiameter: 25.4, // 1 inch in mm
  mouthWidth: 400,
  mouthHeight: 200,
  length: 300,
  flareType: ProfileType.EXPONENTIAL, // Use enum instead of string
  cutoffFrequency: 500, // Add default cutoff frequency
  roundMouth: false,
  segments: 32,
  wallThickness: 2 // mm - default wall thickness for hollow horns
};

// Default values for mounting plate
export const DEFAULT_PLATE_PARAMS = {
  type: 'rect' as const,
  diameter: 250,
  thickness: 6,
  boltCount: 8,
  boltHoleDiameter: 6,
  boltCircleDiameter: 200,
  useManualSize: false,
  autoMargin: 20,
  maxBoltSpacing: 150
};

// Default values for driver mount
export const DEFAULT_DRIVER_PARAMS = {
  type: 'bolt-on' as const,
  throatDiameter: 25.4,
  flangeDiameter: 50.8,
  flangeThickness: 5,
  boltCount: 4,
  boltHoleDiameter: 4,
  boltCircleDiameter: 40
};

// Performance settings for different quality modes
export const PERFORMANCE_SETTINGS = {
  HIGH: { 
    holeSegments: 16,  // Smooth circles
    hornSteps: 30, 
    enableCSG: true,
    enableLOD: true,
    enableShadows: true,
    antialias: true
  },
  MEDIUM: { 
    holeSegments: 8,   // Octagon shape
    hornSteps: 20, 
    enableCSG: true,
    enableLOD: true,
    enableShadows: true,
    antialias: true
  },
  LOW: { 
    holeSegments: 4,   // Square/diamond shape
    hornSteps: 15, 
    enableCSG: true,   // Keep holes visible but with minimal polygons
    enableLOD: true,
    enableShadows: false,
    antialias: false
  }
};

// Performance thresholds for automatic quality adjustment
export const PERFORMANCE_THRESHOLDS = {
  targetFPS: 50,
  minFPS: 30,
  maxFPS: 60,
  adjustmentBuffer: 10 // Number of frames to average before adjusting
};

// LOD distances for different components
export const LOD_DISTANCES = {
  plate: [0, 300, 600],
  driver: [0, 300, 600],
  bolts: [0, 200, 400]
};