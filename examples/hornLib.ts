import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

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
  type: 'bolt-on' | 'screw-on';
  throatDiameter: number;       // mm
  flangeThickness: number;      // mm
  boltCount?: number;           // bolt-on only
  boltHoleDiameter?: number;    // bolt-on only
  boltCircleDiameter?: number;  // bolt-on only
  threadPitch?: number;         // screw-on only
}

export function buildHornAssembly(
  hornParams: HornProfileParams,
  plateParams: MountPlateParams,
  driverParams: DriverMountParams
): THREE.Mesh {
  const horn = buildHorn(hornParams);
  const plate = buildMountPlate(hornParams, plateParams);
  const driverFlange = buildDriverFlange(driverParams);

  // Merge meshes into single manifold geometry
  const hornWithPlate = CSG.union(horn, plate);
  const fullHorn = CSG.union(hornWithPlate, driverFlange);

  return fullHorn;
}

function buildHorn(params: HornProfileParams): THREE.Mesh {
  const { throatDiameter, mouthWidth, mouthHeight, length, flareType, roundMouth, segments } = params;

  const shape = new THREE.Shape();

  const mouthH = roundMouth ? mouthWidth : (mouthHeight || mouthWidth);
  const steps = 50;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = t * length;
    let radius;
    if (flareType === 'exponential') {
      radius = (throatDiameter / 2) * Math.pow(mouthWidth / throatDiameter, t);
    } else {
      radius = (throatDiameter / 2) + t * ((mouthWidth / 2) - (throatDiameter / 2));
    }
    shape.lineTo(radius, z);
  }

  const geometry = new THREE.LatheGeometry(shape.extractPoints(steps).shape, segments);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x888888 }));
  return mesh;
}

function buildMountPlate(hornParams: HornProfileParams, plateParams: MountPlateParams): THREE.Mesh {
  let plateGeom: THREE.BufferGeometry;

  if (plateParams.type === 'rect') {
    const rectGeom = new THREE.BoxGeometry(plateParams.width!, plateParams.height!, plateParams.thickness);
    plateGeom = rectGeom;
  } else {
    const circGeom = new THREE.CylinderGeometry(plateParams.diameter! / 2, plateParams.diameter! / 2, plateParams.thickness, 64);
    plateGeom = circGeom;
  }

  // Position plate at horn mouth
  plateGeom.translate(0, 0, hornParams.length);

  // Cut bolt holes
  const plateMesh = new THREE.Mesh(plateGeom, new THREE.MeshStandardMaterial());
  const boltMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < plateParams.boltCount; i++) {
    const angle = (i / plateParams.boltCount) * Math.PI * 2;
    const x = Math.cos(angle) * (plateParams.boltCircleDiameter / 2);
    const y = Math.sin(angle) * (plateParams.boltCircleDiameter / 2);

    const holeGeom = new THREE.CylinderGeometry(plateParams.boltHoleDiameter / 2, plateParams.boltHoleDiameter / 2, plateParams.thickness * 2, 32);
    holeGeom.translate(x, y, hornParams.length);
    boltMeshes.push(new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial()));
  }

  let plateCSG = CSG.fromMesh(plateMesh);
  for (const hole of boltMeshes) {
    plateCSG = CSG.subtract(plateCSG, CSG.fromMesh(hole));
  }

  return CSG.toMesh(plateCSG, new THREE.Matrix4(), new THREE.MeshStandardMaterial({ color: 0x555555 }));
}

function buildDriverFlange(params: DriverMountParams): THREE.Mesh {
  const flangeGeom = new THREE.CylinderGeometry(params.throatDiameter / 2, params.throatDiameter / 2, params.flangeThickness, 64);
  flangeGeom.translate(0, 0, -params.flangeThickness);

  const flangeMesh = new THREE.Mesh(flangeGeom, new THREE.MeshStandardMaterial());

  if (params.type === 'bolt-on') {
    const boltMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < params.boltCount!; i++) {
      const angle = (i / params.boltCount!) * Math.PI * 2;
      const x = Math.cos(angle) * (params.boltCircleDiameter! / 2);
      const y = Math.sin(angle) * (params.boltCircleDiameter! / 2);

      const holeGeom = new THREE.CylinderGeometry(params.boltHoleDiameter! / 2, params.boltHoleDiameter! / 2, params.flangeThickness * 2, 32);
      holeGeom.translate(x, y, -params.flangeThickness);
      boltMeshes.push(new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial()));
    }

    let flangeCSG = CSG.fromMesh(flangeMesh);
    for (const hole of boltMeshes) {
      flangeCSG = CSG.subtract(flangeCSG, CSG.fromMesh(hole));
    }
    return CSG.toMesh(flangeCSG, new THREE.Matrix4(), new THREE.MeshStandardMaterial({ color: 0x777777 }));
  }

  return flangeMesh;
}
