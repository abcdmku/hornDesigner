/**
 * HornMesh React Three Fiber component
 * Renders horn geometry with materials and optional pressure coloring
 */

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ProfilePoint, ProfileParams } from "../profiles/types";
import { getProfileFunction } from "../profiles";
import { CrossSectionSpec } from "../math/hornMath";
import { profileToRings, ringsToGeometry } from "../geometry/hornGeometry";

/**
 * HornMesh component props
 */
export interface HornMeshProps {
  profileType: string;
  profileParams: ProfileParams;
  crossSection: CrossSectionSpec;
  thetaDivs?: number;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
    wireframe?: boolean;
    doubleSided?: boolean;
  };
  pressureColoring?: boolean;
  rotation?: THREE.Euler | [number, number, number];
  position?: THREE.Vector3 | [number, number, number];
  scale?: number;
}

/**
 * Memoized horn mesh component
 */
export const HornMesh: React.FC<HornMeshProps> = React.memo(
  ({
    profileType,
    profileParams,
    crossSection,
    thetaDivs = 32,
    material = {},
    pressureColoring = false,
    rotation = [0, 0, 0],
    position = [0, 0, 0],
    scale = 1,
  }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);

    // Generate profile points
    const profile = useMemo(() => {
      console.log("HornMesh received profileType:", profileType);
      console.log("HornMesh received profileParams:", profileParams);
      const profileFunc = getProfileFunction(profileType);
      if (!profileFunc) {
        console.error(`Unknown profile type: ${profileType}`);
        return [];
      }

      try {
        return profileFunc(profileParams);
      } catch (error) {
        console.error("Error generating profile:", error);
        return [];
      }
    }, [profileType, profileParams]);

    // Create geometry
    const geometry = useMemo(() => {
      if (profile.length === 0) {
        return new THREE.BufferGeometry();
      }

      try {
        // Using synchronous version
        const rings = profileToRings(profile, crossSection, thetaDivs);
        const geo = ringsToGeometry(rings, thetaDivs);
        geometryRef.current = geo;
        return geo;
      } catch (error) {
        console.error("Error creating geometry:", error);
        return new THREE.BufferGeometry();
      }
    }, [profile, crossSection, thetaDivs]);

    // Create material
    const meshMaterial = useMemo(() => {
      const {
        color = "#808080",
        metalness = 0.5,
        roughness = 0.5,
        wireframe = false,
        doubleSided = true,
      } = material;

      if (pressureColoring) {
        // Create material with vertex colors for pressure visualization
        return new THREE.MeshStandardMaterial({
          vertexColors: true,
          metalness,
          roughness,
          wireframe,
          side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color,
          metalness,
          roughness,
          wireframe,
          side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
        });
      }
    }, [material, pressureColoring]);

    // Apply pressure coloring if enabled
    useEffect(() => {
      if (pressureColoring && geometryRef.current) {
        applyPressureColors(geometryRef.current);
      }
    }, [pressureColoring, geometry]);

    // Optional rotation animation
    useFrame((state, delta) => {
      if (meshRef.current && material.wireframe) {
        // Slow rotation for wireframe view
        meshRef.current.rotation.y += delta * 0.1;
      }
    });

    // Clean up geometry on unmount
    useEffect(() => {
      return () => {
        if (geometryRef.current) {
          geometryRef.current.dispose();
        }
      };
    }, []);

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={meshMaterial}
        rotation={rotation as any}
        position={position as any}
        scale={scale}
        castShadow
        receiveShadow
      />
    );
  },
);

/**
 * Apply pressure-based coloring to geometry
 */
function applyPressureColors(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  if (!positions) return;

  const vertexCount = positions.count;
  const colors = new Float32Array(vertexCount * 3);

  // Find z-range for normalization
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < vertexCount; i++) {
    const z = positions.array[i * 3 + 2];
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  const zRange = maxZ - minZ;

  // Apply gradient coloring based on z-position (pressure proxy)
  for (let i = 0; i < vertexCount; i++) {
    const z = positions.array[i * 3 + 2];
    const t = (z - minZ) / zRange; // Normalize to 0-1

    // Create gradient from blue (high pressure) to red (low pressure)
    const hue = (1 - t) * 240; // Blue to Red in HSL
    const color = new THREE.Color();
    color.setHSL(hue / 360, 1, 0.5);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * Helper component for horn with axes helper
 */
export const HornWithAxes: React.FC<HornMeshProps & { showAxes?: boolean }> = (
  props,
) => {
  const { showAxes = false, ...hornProps } = props;

  return (
    <group>
      <HornMesh {...hornProps} />
      {showAxes && <axesHelper args={[100]} />}
    </group>
  );
};

/**
 * Helper component for horn with bounding box
 */
export const HornWithBounds: React.FC<
  HornMeshProps & { showBounds?: boolean }
> = (props) => {
  const { showBounds = false, ...hornProps } = props;
  const boxRef = useRef<THREE.BoxHelper>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (showBounds && meshRef.current && boxRef.current) {
      boxRef.current.setFromObject(meshRef.current);
    }
  }, [showBounds]);

  return (
    <group>
      <mesh ref={meshRef}>
        <HornMesh {...hornProps} />
      </mesh>
      {showBounds && (
        <boxHelper ref={boxRef} args={[meshRef.current!, 0xffff00]} />
      )}
    </group>
  );
};
