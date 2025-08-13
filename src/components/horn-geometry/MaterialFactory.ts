import * as THREE from "three";
import { HORN_GEOMETRY_CONSTANTS } from "./HornGeometryConstants";

let hornMaterial: THREE.MeshStandardMaterial | null = null;
let plateMaterial: THREE.MeshStandardMaterial | null = null;
let driverMaterial: THREE.MeshStandardMaterial | null = null;

export function getHornMaterial(): THREE.MeshStandardMaterial {
  if (!hornMaterial) {
    hornMaterial = new THREE.MeshStandardMaterial({
      color: HORN_GEOMETRY_CONSTANTS.MATERIALS.horn.color,
      metalness: HORN_GEOMETRY_CONSTANTS.MATERIALS.horn.metalness,
      roughness: HORN_GEOMETRY_CONSTANTS.MATERIALS.horn.roughness,
      side: THREE.DoubleSide,
    });
  }
  return hornMaterial;
}

export function getPlateMaterial(): THREE.MeshStandardMaterial {
  if (!plateMaterial) {
    plateMaterial = new THREE.MeshStandardMaterial({
      color: HORN_GEOMETRY_CONSTANTS.MATERIALS.plate.color,
      metalness: HORN_GEOMETRY_CONSTANTS.MATERIALS.plate.metalness,
      roughness: HORN_GEOMETRY_CONSTANTS.MATERIALS.plate.roughness,
    });
  }
  return plateMaterial;
}

export function getDriverMaterial(): THREE.MeshStandardMaterial {
  if (!driverMaterial) {
    driverMaterial = new THREE.MeshStandardMaterial({
      color: HORN_GEOMETRY_CONSTANTS.MATERIALS.driver.color,
      metalness: HORN_GEOMETRY_CONSTANTS.MATERIALS.driver.metalness,
      roughness: HORN_GEOMETRY_CONSTANTS.MATERIALS.driver.roughness,
    });
  }
  return driverMaterial;
}

export function disposeMaterials(): void {
  if (hornMaterial) {
    hornMaterial.dispose();
    hornMaterial = null;
  }
  if (plateMaterial) {
    plateMaterial.dispose();
    plateMaterial = null;
  }
  if (driverMaterial) {
    driverMaterial.dispose();
    driverMaterial = null;
  }
}