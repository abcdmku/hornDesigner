// Temporary type definitions while hornLib.ts is being fixed

export interface HornProfileParams {
  throatDiameter: number;       // mm
  mouthWidth: number;           // mm
  mouthHeight?: number;         // mm (for rectangular horns)
  length: number;               // mm
  flareType: 'exponential' | 'conical';
  roundMouth: boolean;          // true = circular horn
  segments: number;             // radial segments
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
}

export interface DriverMountParams {
  type: 'bolt-on';
  throatDiameter: number;       // mm
  flangeThickness: number;      // mm
  boltCount: number;
  boltHoleDiameter: number;
  boltCircleDiameter: number;
}