/**
 * Custom Controls Hook
 * Replaces Leva's useControls with useState-based state management
 */

import { useState, useCallback } from "react";
import { ProfileType } from "../profiles/types";
import { CrossSectionMode } from "../math/hornMath";

// Import the ControlValues interface and default values from the original Controls.tsx
export interface ControlValues {
  // Profile parameters
  profileType: ProfileType;
  throatRadius: number;
  mouthRadius: number;
  length: number;
  segments: number;

  // Profile-specific parameters
  T?: number; // Hypex T-factor
  coverage?: number; // JMLC coverage
  eccentricity?: number; // Oblate spheroid
  curvature?: number; // Parabolic
  spiralRate?: number; // Hyperbolic spiral
  tStart?: number; // PETF
  tEnd?: number; // PETF
  
  // Cutoff and rollover parameters
  cutoffFrequency?: number; // Hz - for tractrix, Le Cléac'h
  cutoffWavenumber?: number; // For advanced tractrix
  rolloverPoint?: number; // Le Cléac'h rollover position (0-1)
  rolloverStrength?: number; // Le Cléac'h rollover strength (0-1)

  // Cross-section parameters
  crossSectionMode: CrossSectionMode;
  aspect: number;
  nStart?: number; // Superellipse
  nEnd?: number; // Superellipse
  easing?: "linear" | "cubic";
  cornerRadius?: number; // Rectangular
  matchMode?: "area" | "dimensions";
  fp?: number; // Stereographic focal parameter

  // H/V flare difference
  hvHorizontal?: number;
  hvVertical?: number;

  // Display options
  thetaDivs: number;
  wireframe: boolean;
  pressureColoring: boolean;
  showAxes: boolean;

  // Material
  color: string;
  metalness: number;
  roughness: number;

  // Acoustic parameters
  computeAcoustics: boolean;
  minFreq: number;
  maxFreq: number;
  freqPoints: number;
}

/**
 * Default control values
 */
const defaultValues: ControlValues = {
  profileType: "exponential" as ProfileType,
  throatRadius: 25,
  mouthRadius: 150,
  length: 300,
  segments: 50,

  // Profile-specific defaults
  T: 0.707,
  coverage: 90,
  eccentricity: 0.7,
  curvature: 2,
  spiralRate: 0.5,
  tStart: 0.5,
  tEnd: 1.0,
  
  // Cutoff and rollover defaults
  cutoffFrequency: 500,
  rolloverPoint: 0.7,
  rolloverStrength: 0.8,

  crossSectionMode: "circle",
  aspect: 1,
  nStart: 2,
  nEnd: 2,
  easing: "linear",
  cornerRadius: 0,
  matchMode: "area",
  fp: 1,

  // H/V flare defaults
  hvHorizontal: 1,
  hvVertical: 1,

  thetaDivs: 32,
  wireframe: false,
  pressureColoring: false,
  showAxes: false,

  color: "#808080",
  metalness: 0.5,
  roughness: 0.5,

  computeAcoustics: false,
  minFreq: 100,
  maxFreq: 20000,
  freqPoints: 100,
};

/**
 * Custom controls hook with update functions
 */
export interface UseHornControlsReturn {
  values: ControlValues;
  updateValue: <K extends keyof ControlValues>(
    key: K,
    value: ControlValues[K],
  ) => void;
  handleExport: (format: string) => void;
  handleCompute: () => void;
}

/**
 * Custom hook for horn controls using useState
 * Replaces Leva's useControls with proper React state management
 */
export function useHornControls(
  onExport?: (format: string) => void,
  onCompute?: () => void,
): UseHornControlsReturn {
  // State for all control values
  const [values, setValues] = useState<ControlValues>(defaultValues);

  // Generic update function for any control value
  const updateValue = useCallback(
    <K extends keyof ControlValues>(key: K, value: ControlValues[K]) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  // Export handler
  const handleExport = useCallback(
    (format: string) => {
      if (onExport) {
        onExport(format);
      }
    },
    [onExport],
  );

  // Compute handler
  const handleCompute = useCallback(() => {
    if (onCompute) {
      onCompute();
    }
  }, [onCompute]);

  return {
    values,
    updateValue,
    handleExport,
    handleCompute,
  };
}
