import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Detailed } from "@react-three/drei";
import { HornProfileParams, MountPlateParams, DriverMountParams } from "../types";
import { getCachedGeometry, clearGeometryCache } from "./GeometryUtils";
import {
  HORN_GEOMETRY_CONSTANTS,
  PerformanceMode,
} from "./horn-geometry/HornGeometryConstants";
import {
  createOptimizedCircularHorn,
  createOptimizedRectangularHorn,
} from "./horn-geometry/HornProfileGenerator";
import { createOptimizedPlate } from "./horn-geometry/PlateGeometryGenerator";
import { createOptimizedDriver } from "./horn-geometry/DriverGeometryGenerator";
import {
  getHornMaterial,
  getPlateMaterial,
  getDriverMaterial,
  disposeMaterials,
} from "./horn-geometry/MaterialFactory";

interface OptimizedHornGeometryProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  showMountingPlate: boolean;
  showDriverMount: boolean;
  performanceMode?: PerformanceMode;
  enableLOD?: boolean;
}

const OptimizedHornGeometry = React.memo(({
  hornParams,
  plateParams,
  driverParams,
  showMountingPlate,
  showDriverMount,
  performanceMode = "high",
  enableLOD = true,
}: OptimizedHornGeometryProps) => {
  const geometryRefs = useRef<THREE.BufferGeometry[]>([]);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      geometryRefs.current.forEach(geometry => {
        if (geometry && typeof geometry.dispose === "function") {
          geometry.dispose();
        }
      });
      geometryRefs.current = [];
      clearGeometryCache();
      disposeMaterials();
    };
  }, [hornParams, plateParams, driverParams]);
  
  const perfSettings = useMemo(
    () => HORN_GEOMETRY_CONSTANTS.PERFORMANCE_SETTINGS[performanceMode],
    [performanceMode]
  );
  
  const hornGeometry = useMemo(() => {
    const cacheKey = `horn_${JSON.stringify(hornParams)}_${performanceMode}`;
    
    return getCachedGeometry(cacheKey, () => {
      const startTime = performance.now();
      
      const geometry = hornParams.roundMouth
        ? createOptimizedCircularHorn(hornParams, perfSettings.hornSteps)
        : createOptimizedRectangularHorn(hornParams, perfSettings.hornSteps);
      
      const elapsed = performance.now() - startTime;
      if (elapsed > HORN_GEOMETRY_CONSTANTS.PERFORMANCE_WARNING_THRESHOLD_MS) {
        console.warn(`Horn geometry creation took ${elapsed.toFixed(1)}ms`);
      }
      
      geometryRefs.current.push(geometry);
      return geometry;
    });
  }, [hornParams, performanceMode, perfSettings]);
  
  const plateGeometries = useMemo(() => {
    if (!showMountingPlate) return null;
    
    const startTime = performance.now();
    
    const geometries = {
      high: createOptimizedPlate(plateParams, hornParams, "high", perfSettings.enableCSG),
      medium: createOptimizedPlate(plateParams, hornParams, "medium", perfSettings.enableCSG),
      low: createOptimizedPlate(plateParams, hornParams, "low", perfSettings.enableCSG),
    };
    
    geometryRefs.current.push(geometries.high, geometries.medium, geometries.low);
    
    const elapsed = performance.now() - startTime;
    if (elapsed > HORN_GEOMETRY_CONSTANTS.PERFORMANCE_WARNING_THRESHOLD_MS) {
      console.warn(`Plate LOD geometry creation took ${elapsed.toFixed(1)}ms`);
    }
    
    return geometries;
  }, [plateParams, hornParams, showMountingPlate, perfSettings.enableCSG]);
  
  const driverGeometries = useMemo(() => {
    if (!showDriverMount) return null;
    
    const startTime = performance.now();
    
    const geometries = {
      high: createOptimizedDriver(driverParams, "high", perfSettings.enableCSG),
      medium: createOptimizedDriver(driverParams, "medium", perfSettings.enableCSG),
      low: createOptimizedDriver(driverParams, "low", perfSettings.enableCSG),
    };
    
    geometryRefs.current.push(geometries.high, geometries.medium, geometries.low);
    
    const elapsed = performance.now() - startTime;
    if (elapsed > HORN_GEOMETRY_CONSTANTS.PERFORMANCE_WARNING_THRESHOLD_MS) {
      console.warn(`Driver LOD geometry creation took ${elapsed.toFixed(1)}ms`);
    }
    
    return geometries;
  }, [driverParams, showDriverMount, perfSettings.enableCSG]);
  
  const renderLODContent = () => (
    <group>
      <mesh geometry={hornGeometry} castShadow receiveShadow material={getHornMaterial()} />
      
      {showMountingPlate && plateGeometries && (
        <Detailed distances={[...HORN_GEOMETRY_CONSTANTS.LOD_DISTANCES]}>
          <mesh geometry={plateGeometries.high} castShadow receiveShadow material={getPlateMaterial()} />
          <mesh geometry={plateGeometries.medium} castShadow receiveShadow material={getPlateMaterial()} />
          <mesh geometry={plateGeometries.low} castShadow receiveShadow material={getPlateMaterial()} />
        </Detailed>
      )}
      
      {showDriverMount && driverGeometries && (
        <Detailed distances={[...HORN_GEOMETRY_CONSTANTS.LOD_DISTANCES]}>
          <mesh geometry={driverGeometries.high} castShadow receiveShadow material={getDriverMaterial()} />
          <mesh geometry={driverGeometries.medium} castShadow receiveShadow material={getDriverMaterial()} />
          <mesh geometry={driverGeometries.low} castShadow receiveShadow material={getDriverMaterial()} />
        </Detailed>
      )}
    </group>
  );
  
  const renderSimpleContent = () => (
    <group>
      <mesh geometry={hornGeometry} castShadow receiveShadow material={getHornMaterial()} />
      
      {showMountingPlate && plateGeometries && (
        <mesh geometry={plateGeometries.high} castShadow receiveShadow material={getPlateMaterial()} />
      )}
      
      {showDriverMount && driverGeometries && (
        <mesh geometry={driverGeometries.high} castShadow receiveShadow material={getDriverMaterial()} />
      )}
    </group>
  );
  
  return enableLOD && plateGeometries && driverGeometries
    ? renderLODContent()
    : renderSimpleContent();
});

OptimizedHornGeometry.displayName = "OptimizedHornGeometry";

export default OptimizedHornGeometry;