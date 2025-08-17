// v2/ui/HornDesignerUI.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ProfileType } from "../profiles/types";
import { profileRegistry } from "../profiles";
import { profileFields, FieldDef } from "./ProfileFields";
import { Profile2DViewV2 } from "./Profile2DViewV2";
import { ProfileParams } from "../profiles/shared";

export function HornDesignerUI() {
  const [profileType, setProfileType] = useState<ProfileType>(ProfileType.HYPEX);

  const defaultParams: Record<ProfileType, Partial<ProfileParams>> = {
      [ProfileType.CONICAL]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
      },
      [ProfileType.EXPONENTIAL]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          m: 0.005,
      },
      [ProfileType.HYPEX]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          m: 0.005,
          T: 0.7,
      },
      [ProfileType.TRACTRIX]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          cutoffFrequency: 400,
      },
      [ProfileType.JMLC]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          fc: 500,
          alpha0_deg: 45,
      },
      [ProfileType.OBLATE_SPHEROID]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          thetaThroatDeg: 10,
          beta: 2,
      },
      [ProfileType.SPHERICAL]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
      },
      [ProfileType.PARABOLIC]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
      },
      [ProfileType.HYPERBOLIC_SPIRAL]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          beta: 0.5,
      },
      [ProfileType.WN_ALO]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          beta: 0.5,
          eta: 0.3,
      },
      [ProfileType.PETF]: {
          throatRadius: 10,
          mouthRadius: 200,
          length: 300,
          segments: 100,
          m: 0.005,
          T0: 0.7,
          Tadd: 0.2,
          power: 2,
      },
      [ProfileType.HYPERBOLIC]: {}
  };

  const [params, setParams] = useState<ProfileParams>({
    type: profileType,
    ...defaultParams[profileType],
  } as any);

  // reset parameters when switching profile
  useEffect(() => {
    setParams({ type: profileType, ...defaultParams[profileType] } as any);
  }, [profileType]);

  const profileFn = profileRegistry[profileType];
  const profilePoints = useMemo(() => profileFn(params), [profileFn, params]);

  const fields = profileFields[profileType] || [];

  return (
    <div className="grid grid-cols-2 h-screen">
      {/* === Left: Controls === */}
      <div className="p-4 bg-gray-900 text-white space-y-4 overflow-auto">
        <h1 className="text-xl font-bold">Horn Designer v2</h1>

        <label className="block font-semibold">Profile Type:</label>
        <select
          value={profileType}
          className="w-full p-2 bg-gray-800 rounded"
          onChange={(e) => setProfileType(e.target.value as ProfileType)}
        >
          {Object.values(ProfileType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {fields.map((f: FieldDef) => (
          <div key={f.key}>
            <label className="block">{f.label}:</label>
            <input
              type={f.type}
              value={
                (params as any)[f.key] !== undefined
                  ? String((params as any)[f.key])
                  : ""
              }
              min={f.min}
              max={f.max}
              step="any"
              className="w-full p-2 bg-gray-800 rounded"
              onChange={(e) =>
                setParams((p: any) => ({
                  ...p,
                  [f.key]: Number(e.target.value),
                }))
              }
            />
          </div>
        ))}
      </div>

      {/* === Right: 2D Profile View === */}
      <div className="bg-black flex flex-col">
        {/* 2D Chart View */}
        <div className="flex-1 p-4">
          <Profile2DViewV2 profilePoints={profilePoints} />
        </div>
        
        {/* 3D View (optional - commented out for now) */}
        {/* <div className="flex-1">
          <Canvas
            camera={{
              position: [0, params.length ? params.length / 2 : 150, params.mouthRadius || 200],
              fov: 45,
            }}
          >
            <ambientLight />
            <directionalLight position={[0, 0, 500]} intensity={0.5} />
            <HornMesh profilePoints={profilePoints} />
            <OrbitControls />
          </Canvas>
        </div> */}
      </div>
    </div>
  );
}
