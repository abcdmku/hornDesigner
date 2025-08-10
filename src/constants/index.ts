import { MaterialType } from '../types';

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
  mouthWidth: 200,
  mouthHeight: 150,
  length: 300,
  flareType: 'exponential' as const,
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
  autoMargin: 20
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