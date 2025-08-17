/**
 * Custom Control Sidebar
 * Replaces Leva controls with custom Tailwind UI matching original ParameterSidebar styling
 */

import React from "react";
import {
  NumberInput,
  SliderInput,
  SelectInput,
  ToggleButton,
  ColorPicker,
  ControlSection,
  ControlGrid,
  ConditionalSection,
  ActionButton,
} from "./CustomControls";
import { UseHornControlsReturn } from "./CustomControlsHook";
import { ProfileType } from "../profiles/types";
import { CrossSectionMode } from "../math/hornMath";

interface CustomControlSidebarProps {
  controls: UseHornControlsReturn;
}

// Profile type options for dropdown
const profileTypeOptions = Object.values(ProfileType).map((type) => ({
  value: type,
  label: getProfileDisplayName(type),
}));

// Helper function to get display names for profile types
function getProfileDisplayName(type: ProfileType): string {
  const displayNames: Record<ProfileType, string> = {
    conical: "Conical",
    exponential: "Exponential",
    hyperbolic: "Hyperbolic",
    hypex: "Hypex",
    tractrix: "Tractrix",
    leCleach: "Le Cléac'h",
    jmlc: "JMLC",
    oblateSpheroid: "Oblate Spheroid",
    spherical: "Spherical",
    parabolic: "Parabolic",
    hyperbolicSpiral: "Hyperbolic Spiral",
    wnAlo: "WnAlo",
    petf: "PETF",
  };
  return displayNames[type] || type;
}

// Cross-section mode options
const crossSectionOptions: { value: CrossSectionMode; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "ellipse", label: "Ellipse" },
  { value: "superellipse", label: "Superellipse" },
  { value: "rectangular", label: "Rectangular" },
  { value: "stereographic", label: "Stereographic" },
];

// Easing options
const easingOptions = [
  { value: "linear" as const, label: "Linear" },
  { value: "cubic" as const, label: "Cubic" },
];

// Match mode options
const matchModeOptions = [
  { value: "area" as const, label: "Area" },
  { value: "dimensions" as const, label: "Dimensions" },
];

export const CustomControlSidebar: React.FC<CustomControlSidebarProps> = ({
  controls,
}) => {
  const { values, updateValue, handleExport, handleCompute } = controls;

  return (
    <div className="w-[28rem] glass-dark rounded-r-3xl m-4 ml-0 flex flex-col h-[calc(100vh-2rem)] shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3 mb-2">
          <img src="./logo-icon.svg" alt="Logo" className="w-12 h-12" />
          <div>
            <h2 className="text-2xl font-bold text-white">Horn Designer V2</h2>
            <p className="text-sm text-gray-400">Advanced Horn Design Tool</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Profile Parameters Section */}
        <ControlSection title="Profile Parameters" icon="profile">
          <SelectInput
            label="Profile Type"
            value={values.profileType}
            options={profileTypeOptions}
            onChange={(value) => updateValue("profileType", value)}
          />

          <ControlGrid>
            <NumberInput
              label="Throat Diameter"
              value={values.throatRadius * 2}
              onChange={(value) => updateValue("throatRadius", value / 2)}
              min={20}
              max={200}
              step={1}
              unit="mm"
            />
            <NumberInput
              label="Mouth Diameter"
              value={values.mouthRadius * 2}
              onChange={(value) => updateValue("mouthRadius", value / 2)}
              min={100}
              max={1000}
              step={10}
              unit="mm"
            />
          </ControlGrid>

          <ControlGrid>
            <NumberInput
              label="Length"
              value={values.length}
              onChange={(value) => updateValue("length", value)}
              min={50}
              max={1000}
              step={10}
              unit="mm"
            />
            <NumberInput
              label="Segments"
              value={values.segments}
              onChange={(value) => updateValue("segments", value)}
              min={10}
              max={200}
              step={1}
            />
          </ControlGrid>
        </ControlSection>

        {/* Profile-Specific Options */}
        <ConditionalSection
          condition={
            values.profileType === "hypex" ||
            values.profileType === "tractrix" ||
            values.profileType === "leCleach" ||
            values.profileType === "jmlc" ||
            values.profileType === "oblateSpheroid" ||
            values.profileType === "parabolic" ||
            values.profileType === "hyperbolicSpiral" ||
            values.profileType === "petf"
          }
        >
          <ControlSection title="Profile Options" icon="profile">
            {/* T-Factor for Hypex */}
            <ConditionalSection condition={values.profileType === "hypex"}>
              <SliderInput
                label="T-Factor"
                value={values.T || 0.707}
                onChange={(value) => updateValue("T", value)}
                min={0.1}
                max={1.0}
                step={0.01}
              />
            </ConditionalSection>
            
            {/* Cutoff Frequency for Tractrix and Le Cléac'h */}
            <ConditionalSection condition={values.profileType === "tractrix" || values.profileType === "leCleach"}>
              <NumberInput
                label="Cutoff Frequency"
                value={values.cutoffFrequency || 500}
                onChange={(value) => updateValue("cutoffFrequency", value)}
                min={100}
                max={2000}
                step={50}
                unit="Hz"
              />
            </ConditionalSection>
            
            {/* Rollover controls for Le Cléac'h */}
            <ConditionalSection condition={values.profileType === "leCleach"}>
              <SliderInput
                label="Rollover Point"
                value={values.rolloverPoint || 0.7}
                onChange={(value) => updateValue("rolloverPoint", value)}
                min={0.5}
                max={0.9}
                step={0.05}
              />
              <SliderInput
                label="Rollover Strength"
                value={values.rolloverStrength || 0.8}
                onChange={(value) => updateValue("rolloverStrength", value)}
                min={0.1}
                max={1.0}
                step={0.1}
              />
            </ConditionalSection>

            {/* Coverage for JMLC */}
            <ConditionalSection condition={values.profileType === "jmlc"}>
              <SliderInput
                label="Coverage"
                value={values.coverage || 90}
                onChange={(value) => updateValue("coverage", value)}
                min={30}
                max={120}
                step={5}
                unit="°"
              />
            </ConditionalSection>

            {/* Eccentricity for Oblate Spheroid */}
            <ConditionalSection
              condition={values.profileType === "oblateSpheroid"}
            >
              <SliderInput
                label="Eccentricity"
                value={values.eccentricity || 0.7}
                onChange={(value) => updateValue("eccentricity", value)}
                min={0.1}
                max={0.95}
                step={0.05}
              />
            </ConditionalSection>

            {/* Curvature for Parabolic */}
            <ConditionalSection condition={values.profileType === "parabolic"}>
              <SliderInput
                label="Curvature"
                value={values.curvature || 2}
                onChange={(value) => updateValue("curvature", value)}
                min={1}
                max={4}
                step={0.1}
              />
            </ConditionalSection>

            {/* Spiral Rate for Hyperbolic Spiral */}
            <ConditionalSection
              condition={values.profileType === "hyperbolicSpiral"}
            >
              <SliderInput
                label="Spiral Rate"
                value={values.spiralRate || 0.5}
                onChange={(value) => updateValue("spiralRate", value)}
                min={0.1}
                max={2}
                step={0.1}
              />
            </ConditionalSection>

            {/* PETF Parameters */}
            <ConditionalSection condition={values.profileType === "petf"}>
              <ControlGrid>
                <SliderInput
                  label="T Start"
                  value={values.tStart || 0.5}
                  onChange={(value) => updateValue("tStart", value)}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                />
                <SliderInput
                  label="T End"
                  value={values.tEnd || 1.0}
                  onChange={(value) => updateValue("tEnd", value)}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                />
              </ControlGrid>
            </ConditionalSection>
          </ControlSection>
        </ConditionalSection>

        {/* Cross-Section Settings */}
        <ControlSection title="Cross-Section Settings" icon="crosssection">
          <SelectInput
            label="Cross-Section Mode"
            value={values.crossSectionMode}
            options={crossSectionOptions}
            onChange={(value) => updateValue("crossSectionMode", value)}
          />

          <ConditionalSection condition={values.crossSectionMode !== "circle"}>
            <NumberInput
              label="Aspect Ratio"
              value={values.aspect}
              onChange={(value) => updateValue("aspect", value)}
              min={0.25}
              max={4}
              step={0.05}
            />
          </ConditionalSection>

          {/* Superellipse options */}
          <ConditionalSection
            condition={values.crossSectionMode === "superellipse"}
          >
            <ControlGrid>
              <NumberInput
                label="N Start"
                value={values.nStart || 2}
                onChange={(value) => updateValue("nStart", value)}
                min={1}
                max={10}
                step={0.1}
              />
              <NumberInput
                label="N End"
                value={values.nEnd || 2}
                onChange={(value) => updateValue("nEnd", value)}
                min={1}
                max={10}
                step={0.1}
              />
            </ControlGrid>
            <SelectInput
              label="N Easing"
              value={values.easing || "linear"}
              options={easingOptions}
              onChange={(value) => updateValue("easing", value)}
            />
          </ConditionalSection>

          {/* Rectangular options */}
          <ConditionalSection
            condition={values.crossSectionMode === "rectangular"}
          >
            <ControlGrid>
              <NumberInput
                label="Corner Radius"
                value={values.cornerRadius || 0}
                onChange={(value) => updateValue("cornerRadius", value)}
                min={0}
                max={20}
                step={1}
                unit="mm"
              />
              <SelectInput
                label="Match Mode"
                value={values.matchMode || "area"}
                options={matchModeOptions}
                onChange={(value) => updateValue("matchMode", value)}
              />
            </ControlGrid>
          </ConditionalSection>

          {/* Stereographic options */}
          <ConditionalSection
            condition={values.crossSectionMode === "stereographic"}
          >
            <NumberInput
              label="Focal Parameter"
              value={values.fp || 1}
              onChange={(value) => updateValue("fp", value)}
              min={0.1}
              max={5}
              step={0.1}
            />
          </ConditionalSection>
        </ControlSection>

        {/* Display Options */}
        <ControlSection title="Display Options" icon="display">
          <SliderInput
            label="Theta Divisions"
            value={values.thetaDivs}
            onChange={(value) => updateValue("thetaDivs", value)}
            min={8}
            max={64}
            step={4}
            showValue={true}
          />

          <div className="space-y-2">
            <ToggleButton
              label="Wireframe"
              value={values.wireframe}
              onChange={(value) => updateValue("wireframe", value)}
            />
            <ToggleButton
              label="Pressure Coloring"
              value={values.pressureColoring}
              onChange={(value) => updateValue("pressureColoring", value)}
            />
            <ToggleButton
              label="Show Axes"
              value={values.showAxes}
              onChange={(value) => updateValue("showAxes", value)}
            />
          </div>
        </ControlSection>

        {/* Material Properties */}
        <ControlSection title="Material Properties" icon="material">
          <ColorPicker
            label="Color"
            value={values.color}
            onChange={(value) => updateValue("color", value)}
          />

          <ControlGrid>
            <SliderInput
              label="Metalness"
              value={values.metalness}
              onChange={(value) => updateValue("metalness", value)}
              min={0}
              max={1}
              step={0.05}
            />
            <SliderInput
              label="Roughness"
              value={values.roughness}
              onChange={(value) => updateValue("roughness", value)}
              min={0}
              max={1}
              step={0.05}
            />
          </ControlGrid>
        </ControlSection>

        {/* Acoustic Analysis */}
        <ControlSection title="Acoustic Analysis" icon="acoustic">
          <ToggleButton
            label="Compute Acoustics"
            value={values.computeAcoustics}
            onChange={(value) => updateValue("computeAcoustics", value)}
          />

          <ConditionalSection condition={values.computeAcoustics}>
            <ControlGrid>
              <NumberInput
                label="Min Frequency"
                value={values.minFreq}
                onChange={(value) => updateValue("minFreq", value)}
                min={20}
                max={1000}
                step={10}
                unit="Hz"
              />
              <NumberInput
                label="Max Frequency"
                value={values.maxFreq}
                onChange={(value) => updateValue("maxFreq", value)}
                min={1000}
                max={20000}
                step={100}
                unit="Hz"
              />
            </ControlGrid>
            <NumberInput
              label="Frequency Points"
              value={values.freqPoints}
              onChange={(value) => updateValue("freqPoints", value)}
              min={20}
              max={500}
              step={10}
            />
            <ActionButton
              label="Compute"
              onClick={handleCompute}
              variant="primary"
            />
          </ConditionalSection>
        </ControlSection>

        {/* Export Actions */}
        <ControlSection title="Export Actions" icon="export">
          <div className="space-y-2">
            <ActionButton
              label="Export STL"
              onClick={() => handleExport("stl")}
            />
            <ActionButton
              label="Export OBJ"
              onClick={() => handleExport("obj")}
            />
            <ActionButton
              label="Export Profile CSV"
              onClick={() => handleExport("profile-csv")}
            />
            <ActionButton
              label="Export Hornresp"
              onClick={() => handleExport("hornresp")}
            />
            <ActionButton
              label="Export Acoustics"
              onClick={() => handleExport("acoustics")}
            />
          </div>
        </ControlSection>
      </div>
    </div>
  );
};
