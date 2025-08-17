/**
 * AppV2 - Main demo application for horn designer v2
 */
/// <reference types="vite/client" />

import React, { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Stats } from "@react-three/drei";
import * as THREE from "three";

import { HornWithAxes } from "./HornMesh";
import { useHornControls } from "./CustomControlsHook";
import { CustomControlSidebar } from "./CustomControlSidebar";
import { Profile2DViewV2 } from "./Profile2DViewV2";
import { ProfileParams } from "../profiles/types";
import { CrossSectionSpec } from "../math/hornMath";
import { getProfileFunction } from "../profiles";
import { ExportUtils } from "../geometry/exporters";
import { createHornGeometry } from "../geometry/hornGeometry";
import { solveTL, FrequencyResponse } from "../math/tlSolver";
import { calculatePolarPattern, PolarPattern } from "../math/protoDirectivity";

/**
 * Main App component
 */
export const AppV2: React.FC = () => {
  const [acousticData, setAcousticData] = useState<{
    frequencyResponse?: FrequencyResponse[];
    polarPatterns?: PolarPattern[];
  }>({});

  const [isComputing, setIsComputing] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Main horn controls using custom hook
  const controls = useHornControls(handleExport, handleComputeAcoustics);

  console.log("AppV2 - controls received:", controls);
  console.log("AppV2 - profileType:", controls.values.profileType);

  // Prepare profile parameters
  const profileParams: ProfileParams = {
    throatRadius: controls.values.throatRadius,
    mouthRadius: controls.values.mouthRadius,
    length: controls.values.length,
    segments: controls.values.segments,
    // Add profile-specific parameters
    T: controls.values.T,
    coverage: controls.values.coverage,
    eccentricity: controls.values.eccentricity,
    curvature: controls.values.curvature,
    spiralRate: controls.values.spiralRate,
    tStart: controls.values.tStart,
    tEnd: controls.values.tEnd,
  };

  // Prepare cross-section specification
  const crossSection: CrossSectionSpec = {
    mode: controls.values.crossSectionMode,
    aspect: controls.values.aspect,
    n_schedule:
      controls.values.nStart && controls.values.nEnd
        ? {
            start: controls.values.nStart,
            end: controls.values.nEnd,
            easing: controls.values.easing || "linear",
          }
        : undefined,
    stereographic: controls.values.fp
      ? {
          fp: controls.values.fp,
          normalize: true,
        }
      : undefined,
    rectangular: {
      matchMode: controls.values.matchMode,
      cornerRadius: controls.values.cornerRadius,
    },
    hv_diff:
      controls.values.hvHorizontal && controls.values.hvVertical
        ? {
            horizontal: controls.values.hvHorizontal,
            vertical: controls.values.hvVertical,
          }
        : undefined,
  };

  // Handle export
  async function handleExport(format: string) {
    console.log("Exporting format:", format);

    try {
      // Generate profile
      const profileFunc = getProfileFunction(controls.values.profileType);
      if (!profileFunc) {
        console.error("Unknown profile type");
        return;
      }

      const profile = profileFunc(profileParams);

      switch (format) {
        case "stl":
        case "obj":
          // Create geometry if not cached
          if (!geometryRef.current) {
            geometryRef.current = await createHornGeometry(
              profile,
              crossSection,
              controls.values.thetaDivs,
            );
          }
          ExportUtils.exportGeometry(
            geometryRef.current,
            format as "stl" | "obj",
            "horn_v2",
          );
          break;

        case "profile-csv":
          ExportUtils.exportProfile(profile, "csv", "horn_profile");
          break;

        case "hornresp":
          ExportUtils.exportProfile(profile, "hornresp", "horn_input");
          break;

        case "acoustics":
          if (acousticData.frequencyResponse || acousticData.polarPatterns) {
            ExportUtils.exportAcoustics(acousticData, "csv", "horn_acoustics");
          } else {
            console.log("No acoustic data to export. Compute acoustics first.");
          }
          break;

        default:
          console.error("Unknown export format:", format);
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  }

  // Handle acoustic computation
  async function handleComputeAcoustics() {
    if (isComputing) return;

    setIsComputing(true);
    console.log("Computing acoustics...");

    try {
      // Generate profile
      const profileFunc = getProfileFunction(controls.values.profileType);
      if (!profileFunc) {
        console.error("Unknown profile type");
        return;
      }

      const profile = profileFunc(profileParams);

      // Generate frequency points
      const frequencies: number[] = [];
      const logMin = Math.log10(controls.values.minFreq);
      const logMax = Math.log10(controls.values.maxFreq);

      for (let i = 0; i < controls.values.freqPoints; i++) {
        const logFreq =
          logMin + (logMax - logMin) * (i / (controls.values.freqPoints - 1));
        frequencies.push(Math.pow(10, logFreq));
      }

      // Solve TL
      const frequencyResponse = solveTL({
        profile,
        frequencies,
      });

      // Calculate directivity at key frequencies
      const polarFrequencies = [500, 1000, 2000, 5000, 10000];
      const polarPatterns: PolarPattern[] = [];

      for (const freq of polarFrequencies) {
        if (
          freq >= controls.values.minFreq &&
          freq <= controls.values.maxFreq
        ) {
          const pattern = calculatePolarPattern(
            {
              mode: controls.values.crossSectionMode,
              width: controls.values.mouthRadius * 2,
              height:
                (controls.values.mouthRadius * 2) /
                (controls.values.aspect || 1),
              n: controls.values.nEnd,
            },
            freq,
          );
          polarPatterns.push(pattern);
        }
      }

      setAcousticData({ frequencyResponse, polarPatterns });
      console.log("Acoustics computed successfully");
    } catch (error) {
      console.error("Acoustic computation error:", error);
    } finally {
      setIsComputing(false);
    }
  }

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">
      {/* Custom Control Sidebar */}
      <CustomControlSidebar controls={controls} />

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* 3D Canvas or 2D View */}
        {viewMode === '3d' ? (
          <Canvas
          camera={{ position: [500, 500, 500], fov: 45 }}
          shadows
          gl={{ preserveDrawingBuffer: true }}
          style={{ width: "100%", height: "100%" }}
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
              profileType={controls.values.profileType}
              profileParams={profileParams}
              crossSection={crossSection}
              thetaDivs={controls.values.thetaDivs}
              material={{
                color: controls.values.color,
                metalness: controls.values.metalness,
                roughness: controls.values.roughness,
                wireframe: controls.values.wireframe,
                doubleSided: true,
              }}
              pressureColoring={controls.values.pressureColoring}
              showAxes={controls.values.showAxes}
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
            {import.meta.env.MODE === "development" && <Stats />}
          </Suspense>
        </Canvas>
        ) : (
          <Profile2DViewV2
            profileType={controls.values.profileType}
            profileParams={profileParams}
            onToggle3D={() => setViewMode('3d')}
          />
        )}

        {/* View Toggle Button */}
        <div className="absolute bottom-8 right-8 z-50">
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-medium hover:scale-105 transition-all flex items-center space-x-2 shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === '3d' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              )}
            </svg>
            <span>{viewMode === '3d' ? '2D View' : '3D View'}</span>
          </button>
        </div>

        {/* Status overlay */}
        {isComputing && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "20px",
              borderRadius: "10px",
              fontSize: "18px",
            }}
          >
            Computing acoustics...
          </div>
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
