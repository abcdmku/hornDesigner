import { ProfileType } from "../profiles/types";

export interface FieldDef {
  key: string;
  label: string;
  type: "number";
  min?: number;
  max?: number;
}

// Common base fields shared by most profiles
const baseFields: FieldDef[] = [
    { key: "throatRadius", label: "Throat Radius (mm)", type: "number", min: 1 },
    { key: "mouthRadius", label: "Mouth Radius (mm)", type: "number", min: 1 },
    { key: "length", label: "Length (mm)", type: "number", min: 1 },
    { key: "segments", label: "Segments", type: "number", min: 3 },
];

export const profileFields: Record<ProfileType, FieldDef[]> = {
    [ProfileType.CONICAL]: baseFields,
    [ProfileType.EXPONENTIAL]: [
        ...baseFields,
        { key: "m", label: "Flare Constant m", type: "number", min: 0 },
    ],
    [ProfileType.HYPEX]: [
        ...baseFields,
        { key: "m", label: "Flare Constant m", type: "number", min: 0 },
        { key: "T", label: "T (shape factor)", type: "number", min: 0 },
    ],
    [ProfileType.TRACTRIX]: [
        ...baseFields,
        { key: "cutoffFrequency", label: "Cutoff Frequency (Hz)", type: "number", min: 0 },
    ],
    [ProfileType.JMLC]: [
        ...baseFields,
        { key: "cutoffFrequency", label: "Cutoff Frequency (Hz)", type: "number", min: 0 },
        { key: "alpha", label: "Mouth Angle (deg)", type: "number", min: 0, max: 180 },
    ],
    [ProfileType.OBLATE_SPHEROID]: [
        ...baseFields,
        { key: "throatAngle", label: "Throat Angle (deg)", type: "number", min: 0, max: 89 },
        { key: "beta", label: "Beta (2–8)", type: "number", min: 0 },
    ],
    [ProfileType.SPHERICAL]: baseFields,
    [ProfileType.PARABOLIC]: baseFields,
    [ProfileType.HYPERBOLIC_SPIRAL]: [
        ...baseFields,
        { key: "beta", label: "Beta (shape)", type: "number", min: 0 },
    ],
    [ProfileType.WN_ALO]: [
        ...baseFields,
        { key: "beta", label: "Beta", type: "number", min: 0 },
        { key: "eta", label: "Eta", type: "number", min: 0 },
    ],
    [ProfileType.PETF]: [
        ...baseFields,
        { key: "m", label: "Flare Constant m", type: "number", min: 0 },
        { key: "T0", label: "T₀", type: "number", min: 0 },
        { key: "Tadd", label: "ΔT", type: "number", min: 0 },
        { key: "power", label: "Power (1–3)", type: "number", min: 0 },
    ],
    [ProfileType.HYPERBOLIC]: baseFields
};
