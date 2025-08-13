import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { BoltPosition, HoleParams, createMergedBoltHoles } from "./BoltPatternUtils";

export interface CSGResult {
  geometry: THREE.BufferGeometry;
  success: boolean;
  error?: string;
}

export function applyCsgOperations(
  baseMesh: THREE.Mesh,
  subtractMeshes: THREE.Mesh[],
  fallbackGeometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  try {
    baseMesh.updateMatrix();
    subtractMeshes.forEach(mesh => mesh.updateMatrix());
    
    let result: THREE.Mesh = baseMesh;
    for (const subtractMesh of subtractMeshes) {
      result = CSG.subtract(result, subtractMesh);
    }
    
    return result.geometry;
  } catch (error) {
    console.warn("CSG operation failed, using fallback geometry:", error);
    return fallbackGeometry;
  }
}

export function createFastCSGHoles(
  baseMesh: THREE.Mesh,
  holePositions: BoltPosition[],
  holeParams: HoleParams
): CSGResult {
  try {
    const evaluator = new Evaluator();
    evaluator.attributes = ["position", "normal"];
    evaluator.useGroups = false;
    
    if (!baseMesh.geometry) {
      throw new Error("Base mesh has no geometry");
    }
    
    const baseBrush = new Brush(baseMesh.geometry.clone());
    baseBrush.updateMatrixWorld();
    
    const mergedHoleGeometry = createMergedBoltHoles(holePositions, holeParams);
    
    const holeBrush = new Brush(mergedHoleGeometry);
    holeBrush.updateMatrixWorld();
    
    const result = evaluator.evaluate(baseBrush, holeBrush, SUBTRACTION);
    
    mergedHoleGeometry.dispose();
    baseBrush.geometry.dispose();
    holeBrush.geometry.dispose();
    
    return {
      geometry: result.geometry,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.warn("Fast CSG operation failed:", errorMessage);
    
    return {
      geometry: baseMesh.geometry.clone(),
      success: false,
      error: errorMessage,
    };
  }
}

export function subtractGeometries(
  baseGeometry: THREE.BufferGeometry,
  subtractGeometries: THREE.BufferGeometry[]
): CSGResult {
  try {
    const evaluator = new Evaluator();
    evaluator.attributes = ["position", "normal"];
    evaluator.useGroups = false;
    
    let resultBrush = new Brush(baseGeometry.clone());
    resultBrush.updateMatrixWorld();
    
    for (const subtractGeom of subtractGeometries) {
      const subtractBrush = new Brush(subtractGeom);
      subtractBrush.updateMatrixWorld();
      
      const tempResult = evaluator.evaluate(resultBrush, subtractBrush, SUBTRACTION);
      
      resultBrush.geometry.dispose();
      subtractBrush.geometry.dispose();
      
      resultBrush = new Brush(tempResult.geometry);
      resultBrush.updateMatrixWorld();
    }
    
    return {
      geometry: resultBrush.geometry,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.warn("Geometry subtraction failed:", errorMessage);
    
    return {
      geometry: baseGeometry.clone(),
      success: false,
      error: errorMessage,
    };
  }
}

export function validateCSGInput(mesh: THREE.Mesh): boolean {
  if (!mesh.geometry) {
    console.error("Mesh has no geometry");
    return false;
  }
  
  if (!mesh.geometry.attributes.position) {
    console.error("Geometry has no position attribute");
    return false;
  }
  
  const positionArray = mesh.geometry.attributes.position.array;
  if (positionArray.length === 0) {
    console.error("Geometry has no vertices");
    return false;
  }
  
  return true;
}

export function cleanupCSGGeometry(geometry: THREE.BufferGeometry): void {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  
  if (!geometry.attributes.normal) {
    const normals = new Float32Array(geometry.attributes.position.count * 3);
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.computeVertexNormals();
  }
}