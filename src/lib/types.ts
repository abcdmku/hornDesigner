// Temporary type definitions while hornLib.ts is being fixed

import { ProfileType } from '../profiles/types';

export interface HornProfileParams {
  throatDiameter: number;       // mm
  mouthWidth: number;           // mm
  mouthHeight?: number;         // mm (for rectangular horns)
  length: number;               // mm
  flareType: ProfileType;       // Use ProfileType enum only
  cutoffFrequency?: number;     // Hz (for certain profiles)
  roundMouth: boolean;          // true = circular horn
  segments: number;             // radial segments
  wallThickness: number;        // mm - wall thickness
  
  // Acoustic analysis mode
  acousticCalculationMode?: 'size-to-dispersion' | 'dispersion-to-size'; // Calculation direction
  
  // Target dispersion parameters (used in dispersion-to-size mode)
  targetHorizontalDispersion?: number; // degrees at -6dB
  targetVerticalDispersion?: number;   // degrees at -6dB
  targetFrequency?: number;            // Hz - frequency for dispersion target
  
  // Calculated dispersion (shown in size-to-dispersion mode)
  calculatedHorizontalDispersion?: number; // degrees at -6dB
  calculatedVerticalDispersion?: number;   // degrees at -6dB
  calculatedCutoffFrequency?: number;      // Hz
  
  // Calculated size (shown in dispersion-to-size mode)
  calculatedMouthWidth?: number;    // mm
  calculatedMouthHeight?: number;   // mm
  calculatedLength?: number;        // mm
}

export interface MountPlateParams {
  type: 'rect' | 'circle';
  width?: number;       // for rect
  height?: number;      // for rect
  diameter?: number;    // for circle
  thickness: number;
  boltCount: number;
  boltHoleDiameter: number;
  boltCircleDiameter: number; // spacing
  cornerRadius?: number;      // for rect
  useManualSize: boolean; // toggle for manual size input
  autoMargin?: number;  // margin for auto sizing
  maxBoltSpacing?: number; // maximum spacing between bolts (mm)
}

export interface DriverMountParams {
  type: 'bolt-on';
  throatDiameter: number;       // mm
  flangeDiameter: number;       // mm
  flangeThickness: number;      // mm
  boltCount: number;
  boltHoleDiameter: number;
  boltCircleDiameter: number;
}