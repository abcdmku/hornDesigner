/**
 * AppV2 - Main demo application for horn designer v2
 */
/// <reference types="vite/client" />

import React, { Suspense, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Stats } from '@react-three/drei';
import { button, useControls } from 'leva';
import * as THREE from 'three';

import { HornMesh, HornWithAxes } from './HornMesh';
import { useHornControls, presets, loadPreset } from './Controls';
import { ProfileParams } from '../profiles/types';
import { CrossSectionSpec } from '../math/hornMath';
import { getProfileFunction } from '../profiles';
import { ExportUtils } from '../geometry/exporters';
import { createHornGeometry } from '../geometry/hornGeometry';
import { solveTL, FrequencyResponse } from '../math/tlSolver';
import { calculatePolarPattern, PolarPattern } from '../math/protoDirectivity';

/**
 * Main App component
 */
export const AppV2: React.FC = () => {
  const [acousticData, setAcousticData] = useState<{
    frequencyResponse?: FrequencyResponse[];
    polarPatterns?: PolarPattern[];
  }>({});
  
  const [isComputing, setIsComputing] = useState(false);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  
  // Preset controls
  const { preset } = useControls('Presets', {
    preset: {
      value: 'baseline',
      options: Object.keys(presets),
      label: 'Load Preset'
    },
    'Load': button(() => {
      const presetData = loadPreset(preset as keyof typeof presets);
      // Note: In a real app, you'd update the controls with preset values
      console.log('Loading preset:', preset, presetData);
    })
  });
  
  // Main horn controls
  const controls = useHornControls(
    handleExport,
    handleComputeAcoustics
  );
  
  console.log('AppV2 - controls received:', controls);
  console.log('AppV2 - profileType:', controls.profileType);
  
  // Prepare profile parameters
  const profileParams: ProfileParams = {
    throatRadius: controls.throatRadius,
    mouthRadius: controls.mouthRadius,
    length: controls.length,
    segments: controls.segments,
    // Add profile-specific parameters
    T: controls.T,
    coverage: controls.coverage,
    eccentricity: controls.eccentricity,
    curvature: controls.curvature,
    spiralRate: controls.spiralRate,
    tStart: controls.tStart,
    tEnd: controls.tEnd
  };
  
  // Prepare cross-section specification
  const crossSection: CrossSectionSpec = {
    mode: controls.crossSectionMode,
    aspect: controls.aspect,
    n_schedule: controls.nStart && controls.nEnd ? {
      start: controls.nStart,
      end: controls.nEnd,
      easing: controls.easing || 'linear'
    } : undefined,
    stereographic: controls.fp ? {
      fp: controls.fp,
      normalize: true
    } : undefined,
    rectangular: {
      matchMode: controls.matchMode,
      cornerRadius: controls.cornerRadius
    },
    hv_diff: controls.hvHorizontal && controls.hvVertical ? {
      horizontal: controls.hvHorizontal,
      vertical: controls.hvVertical
    } : undefined
  };
  
  // Handle export
  async function handleExport(format: string) {
    console.log('Exporting format:', format);
    
    try {
      // Generate profile
      const profileFunc = getProfileFunction(controls.profileType);
      if (!profileFunc) {
        console.error('Unknown profile type');
        return;
      }
      
      const profile = profileFunc(profileParams);
      
      switch (format) {
        case 'stl':
        case 'obj':
          // Create geometry if not cached
          if (!geometryRef.current) {
            geometryRef.current = await createHornGeometry(
              profile,
              crossSection,
              controls.thetaDivs
            );
          }
          ExportUtils.exportGeometry(geometryRef.current, format as 'stl' | 'obj', 'horn_v2');
          break;
          
        case 'profile-csv':
          ExportUtils.exportProfile(profile, 'csv', 'horn_profile');
          break;
          
        case 'hornresp':
          ExportUtils.exportProfile(profile, 'hornresp', 'horn_input');
          break;
          
        case 'acoustics':
          if (acousticData.frequencyResponse || acousticData.polarPatterns) {
            ExportUtils.exportAcoustics(acousticData, 'csv', 'horn_acoustics');
          } else {
            console.log('No acoustic data to export. Compute acoustics first.');
          }
          break;
          
        default:
          console.error('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }
  
  // Handle acoustic computation
  async function handleComputeAcoustics() {
    if (isComputing) return;
    
    setIsComputing(true);
    console.log('Computing acoustics...');
    
    try {
      // Generate profile
      const profileFunc = getProfileFunction(controls.profileType);
      if (!profileFunc) {
        console.error('Unknown profile type');
        return;
      }
      
      const profile = profileFunc(profileParams);
      
      // Generate frequency points
      const frequencies: number[] = [];
      const logMin = Math.log10(controls.minFreq);
      const logMax = Math.log10(controls.maxFreq);
      
      for (let i = 0; i < controls.freqPoints; i++) {
        const logFreq = logMin + (logMax - logMin) * (i / (controls.freqPoints - 1));
        frequencies.push(Math.pow(10, logFreq));
      }
      
      // Solve TL
      const frequencyResponse = solveTL({
        profile,
        frequencies
      });
      
      // Calculate directivity at key frequencies
      const polarFrequencies = [500, 1000, 2000, 5000, 10000];
      const polarPatterns: PolarPattern[] = [];
      
      for (const freq of polarFrequencies) {
        if (freq >= controls.minFreq && freq <= controls.maxFreq) {
          const pattern = calculatePolarPattern(
            {
              mode: controls.crossSectionMode,
              width: controls.mouthRadius * 2,
              height: controls.mouthRadius * 2 / (controls.aspect || 1),
              n: controls.nEnd
            },
            freq
          );
          polarPatterns.push(pattern);
        }
      }
      
      setAcousticData({ frequencyResponse, polarPatterns });
      console.log('Acoustics computed successfully');
      
    } catch (error) {
      console.error('Acoustic computation error:', error);
    } finally {
      setIsComputing(false);
    }
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [500, 500, 500], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <Environment preset="studio" />
          
          {/* Horn Mesh */}
          <HornWithAxes
            profileType={controls.profileType}
            profileParams={profileParams}
            crossSection={crossSection}
            thetaDivs={controls.thetaDivs}
            material={{
              color: controls.color,
              metalness: controls.metalness,
              roughness: controls.roughness,
              wireframe: controls.wireframe,
              doubleSided: true
            }}
            pressureColoring={controls.pressureColoring}
            showAxes={controls.showAxes}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1}
          />
          
          {/* Grid */}
          <Grid
            args={[1000, 1000]}
            cellSize={50}
            cellThickness={0.5}
            cellColor="#6f6f6f"
            sectionSize={100}
            sectionThickness={1}
            sectionColor="#9d9d9d"
            fadeDistance={2000}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={2000}
            minDistance={10}
          />
          
          {/* Performance stats */}
          {import.meta.env.MODE === 'development' && <Stats />}
        </Suspense>
      </Canvas>
      
      {/* Status overlay */}
      {isComputing && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            fontSize: '18px'
          }}
        >
          Computing acoustics...
        </div>
      )}
      
      {/* Info panel */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '300px'
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Horn Designer v2</h3>
        <p style={{ margin: '5px 0' }}>
          Profile: {controls.profileType}
        </p>
        <p style={{ margin: '5px 0' }}>
          Cross-section: {controls.crossSectionMode}
        </p>
        <p style={{ margin: '5px 0' }}>
          Dimensions: {controls.throatRadius}mm → {controls.mouthRadius}mm × {controls.length}mm
        </p>
        {acousticData.frequencyResponse && (
          <p style={{ margin: '5px 0', color: '#4CAF50' }}>
            ✓ Acoustics computed
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Standalone app wrapper
 */
export default function HornDesignerV2() {
  return <AppV2 />;
}