import { HornProfileParams, MountPlateParams, DriverMountParams } from '../lib/types';

// Central type definitions
export interface AppState {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;  
  driverParams: DriverMountParams;
  selectedMaterial: MaterialType;
}

export interface MaterialType {
  name: string;
  density: number; // g/mm³
  costPerGram: number; // $/gram
}

// Re-export hornLib types for convenience
export type { HornProfileParams, MountPlateParams, DriverMountParams };