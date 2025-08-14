/**
 * Leva UI controls for horn parameters
 */

import React from 'react';
import { useControls, folder, button } from 'leva';
import { ProfileType } from '../profiles/types';
import { CrossSectionMode } from '../math/hornMath';

/**
 * Control values type
 */
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
  
  // Cross-section parameters
  crossSectionMode: CrossSectionMode;
  aspect: number;
  nStart?: number; // Superellipse
  nEnd?: number; // Superellipse
  easing?: 'linear' | 'cubic';
  cornerRadius?: number; // Rectangular
  matchMode?: 'area' | 'dimensions';
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
  profileType: 'exponential' as ProfileType,
  throatRadius: 25,
  mouthRadius: 150,
  length: 300,
  segments: 50,
  
  crossSectionMode: 'circle',
  aspect: 1,
  thetaDivs: 32,
  wireframe: false,
  pressureColoring: false,
  showAxes: false,
  
  color: '#808080',
  metalness: 0.5,
  roughness: 0.5,
  
  computeAcoustics: false,
  minFreq: 100,
  maxFreq: 20000,
  freqPoints: 100
};

/**
 * Hook for horn controls - simplified flat structure
 */
export function useHornControls(
  onExport?: (format: string) => void,
  onCompute?: () => void
): ControlValues {
  // Use a flat control structure for better reactivity
  // Don't use a function, pass the object directly
  const controls = useControls({
    profileType: {
      value: defaultValues.profileType,
      options: Object.values(ProfileType),
      label: 'Profile Type'
    },
    throatRadius: {
      value: defaultValues.throatRadius,
      min: 10,
      max: 100,
      step: 1,
      label: 'Throat Radius (mm)'
    },
    mouthRadius: {
      value: defaultValues.mouthRadius,
      min: 50,
      max: 500,
      step: 5,
      label: 'Mouth Radius (mm)'
    },
    length: {
      value: defaultValues.length,
      min: 50,
      max: 1000,
      step: 10,
      label: 'Length (mm)'
    },
    segments: {
      value: defaultValues.segments,
      min: 10,
      max: 200,
      step: 1,
      label: 'Segments'
    },
    
    // Profile-specific parameters
    T: {
      value: 0.707,
      min: 0.1,
      max: 1,
      step: 0.01,
      label: 'T-Factor',
      render: (get) => get('profileType') === 'hypex'
    },
    coverage: {
      value: 90,
      min: 30,
      max: 120,
      step: 5,
      label: 'Coverage (deg)',
      render: (get) => get('profileType') === 'jmlc'
    },
    eccentricity: {
      value: 0.7,
      min: 0.1,
      max: 0.95,
      step: 0.05,
      label: 'Eccentricity',
      render: (get) => get('profileType') === 'oblateSpheroid'
    },
    curvature: {
      value: 2,
      min: 1,
      max: 4,
      step: 0.1,
      label: 'Curvature',
      render: (get) => get('profileType') === 'parabolic'
    },
    spiralRate: {
      value: 0.5,
      min: 0.1,
      max: 2,
      step: 0.1,
      label: 'Spiral Rate',
      render: (get) => get('profileType') === 'hyperbolicSpiral'
    },
    tStart: {
      value: 0.5,
      min: 0.1,
      max: 1,
      step: 0.05,
      label: 'T Start',
      render: (get) => get('profileType') === 'petf'
    },
    tEnd: {
      value: 1.0,
      min: 0.1,
      max: 1,
      step: 0.05,
      label: 'T End',
      render: (get) => get('profileType') === 'petf'
    },
    
    // Cross-section parameters
    crossSectionMode: {
      value: defaultValues.crossSectionMode,
      options: ['circle', 'ellipse', 'superellipse', 'rectangular', 'stereographic'],
      label: 'Cross Section'
    },
    aspect: {
      value: defaultValues.aspect,
      min: 0.25,
      max: 4,
      step: 0.05,
      label: 'Aspect Ratio',
      render: (get) => get('crossSectionMode') !== 'circle'
    },
    nStart: {
      value: 2,
      min: 1,
      max: 10,
      step: 0.1,
      label: 'N Start',
      render: (get) => get('crossSectionMode') === 'superellipse'
    },
    nEnd: {
      value: 2,
      min: 1,
      max: 10,
      step: 0.1,
      label: 'N End',
      render: (get) => get('crossSectionMode') === 'superellipse'
    },
    easing: {
      value: 'linear' as const,
      options: ['linear', 'cubic'],
      label: 'N Easing',
      render: (get) => get('crossSectionMode') === 'superellipse'
    },
    cornerRadius: {
      value: 0,
      min: 0,
      max: 20,
      step: 1,
      label: 'Corner Radius',
      render: (get) => get('crossSectionMode') === 'rectangular'
    },
    matchMode: {
      value: 'area' as const,
      options: ['area', 'dimensions'],
      label: 'Match Mode',
      render: (get) => get('crossSectionMode') === 'rectangular'
    },
    fp: {
      value: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      label: 'Focal Parameter',
      render: (get) => get('crossSectionMode') === 'stereographic'
    },
    
    // Display options
    thetaDivs: {
      value: defaultValues.thetaDivs,
      min: 8,
      max: 64,
      step: 4,
      label: 'Theta Divisions'
    },
    wireframe: {
      value: defaultValues.wireframe,
      label: 'Wireframe'
    },
    pressureColoring: {
      value: defaultValues.pressureColoring,
      label: 'Pressure Coloring'
    },
    showAxes: {
      value: defaultValues.showAxes,
      label: 'Show Axes'
    },
    
    // Material
    color: {
      value: defaultValues.color,
      label: 'Color'
    },
    metalness: {
      value: defaultValues.metalness,
      min: 0,
      max: 1,
      step: 0.05,
      label: 'Metalness'
    },
    roughness: {
      value: defaultValues.roughness,
      min: 0,
      max: 1,
      step: 0.05,
      label: 'Roughness'
    },
    
    // Acoustic parameters
    computeAcoustics: {
      value: defaultValues.computeAcoustics,
      label: 'Compute Acoustics'
    },
    minFreq: {
      value: defaultValues.minFreq,
      min: 20,
      max: 1000,
      step: 10,
      label: 'Min Freq (Hz)',
      render: (get) => get('computeAcoustics')
    },
    maxFreq: {
      value: defaultValues.maxFreq,
      min: 1000,
      max: 20000,
      step: 100,
      label: 'Max Freq (Hz)',
      render: (get) => get('computeAcoustics')
    },
    freqPoints: {
      value: defaultValues.freqPoints,
      min: 20,
      max: 500,
      step: 10,
      label: 'Freq Points',
      render: (get) => get('computeAcoustics')
    },
    
    // Export buttons
    'Export STL': button(() => onExport && onExport('stl')),
    'Export OBJ': button(() => onExport && onExport('obj')),
    'Export Profile CSV': button(() => onExport && onExport('profile-csv')),
    'Export Hornresp': button(() => onExport && onExport('hornresp')),
    'Export Acoustics': button(() => onExport && onExport('acoustics')),
    'Compute': button(() => onCompute && onCompute())
  });
  
  // Debug log to see what we're getting
  console.log('Leva controls:', controls);
  
  // Return controls directly - they're already flat
  // The buttons are functions but won't interfere with the ControlValues interface
  return controls as ControlValues;
}

/**
 * Preset configurations
 */
export const presets = {
  baseline: {
    profileType: 'exponential' as ProfileType,
    throatRadius: 25,
    mouthRadius: 150,
    length: 300,
    segments: 50,
    crossSectionMode: 'circle' as CrossSectionMode,
    aspect: 1,
    thetaDivs: 32
  },
  petfRectangular: {
    profileType: 'petf' as ProfileType,
    throatRadius: 38,
    mouthRadius: 200,
    length: 400,
    segments: 80,
    crossSectionMode: 'rectangular' as CrossSectionMode,
    aspect: 1.5,
    thetaDivs: 32,
    tStart: 0.5,
    tEnd: 1.0,
    cornerRadius: 10
  },
  sphericalElliptical: {
    profileType: 'spherical' as ProfileType,
    throatRadius: 20,
    mouthRadius: 120,
    length: 250,
    segments: 60,
    crossSectionMode: 'ellipse' as CrossSectionMode,
    aspect: 0.75,
    thetaDivs: 24
  }
};

/**
 * Load a preset configuration
 */
export function loadPreset(name: keyof typeof presets) {
  return presets[name];
}