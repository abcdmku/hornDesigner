/**
 * Custom Tailwind UI Controls
 * Replaces Leva with custom controls matching original ParameterSidebar styling
 */

import React, { memo, useCallback } from "react";

// ============================================================================
// BASE INPUT COMPONENTS
// ============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export const NumberInput = memo<NumberInputProps>(
  ({ label, value, onChange, min, max, step = 1, unit, className = "" }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        onChange(newValue);
      },
      [onChange],
    );

    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label} {unit && `(${unit})`}
        </label>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
        />
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";

// ============================================================================

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  showValue?: boolean;
}

export const SliderInput = memo<SliderInputProps>(
  ({ label, value, onChange, min, max, step, unit = "", showValue = true }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        onChange(newValue);
      },
      [onChange],
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        {showValue && (
          <div className="text-sm text-orange-300 mt-2 font-medium">
            {value}
            {unit}
          </div>
        )}
      </div>
    );
  },
);

SliderInput.displayName = "SliderInput";

// ============================================================================

interface SelectInputProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export const SelectInput = memo(
  <T extends string>({
    label,
    value,
    options,
    onChange,
  }: SelectInputProps<T>) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value as T);
      },
      [onChange],
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <select
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-gray-800 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
) as <T extends string>(props: SelectInputProps<T>) => React.ReactElement;

// ============================================================================

interface ToggleButtonProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  variant?: "default" | "primary";
}

export const ToggleButton = memo<ToggleButtonProps>(
  ({ label, value, onChange, variant = "default" }) => {
    const handleClick = useCallback(() => {
      onChange(!value);
    }, [onChange, value]);

    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all";
    const activeClasses =
      variant === "primary"
        ? "glass-button text-white"
        : "glass-button text-white";
    const inactiveClasses =
      "text-gray-400 hover:text-gray-300 hover:bg-white/5";

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClasses} ${value ? activeClasses : inactiveClasses}`}
      >
        {label}
      </button>
    );
  },
);

ToggleButton.displayName = "ToggleButton";

// ============================================================================

interface ButtonGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export const ButtonGroup = memo(
  <T extends string>({
    label,
    value,
    options,
    onChange,
  }: ButtonGroupProps<T>) => {
    const handleClick = useCallback(
      (newValue: T) => {
        onChange(newValue);
      },
      [onChange],
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <div className="flex space-x-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                value === option.value
                  ? "glass-button text-white"
                  : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  },
) as <T extends string>(props: ButtonGroupProps<T>) => React.ReactElement;

// ============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = memo<ColorPickerProps>(
  ({ label, value, onChange }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={value}
            onChange={handleChange}
            className="w-12 h-10 rounded-lg border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className="flex-1 px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
            placeholder="#808080"
          />
        </div>
      </div>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

interface ControlSectionProps {
  title: string;
  icon?:
    | "profile"
    | "crosssection"
    | "display"
    | "material"
    | "acoustic"
    | "export";
  children: React.ReactNode;
}

const iconColors = {
  profile: "bg-blue-400",
  crosssection: "bg-green-400",
  display: "bg-yellow-400",
  material: "bg-purple-400",
  acoustic: "bg-red-400",
  export: "bg-indigo-400",
};

export const ControlSection = memo<ControlSectionProps>(
  ({ title, icon = "profile", children }) => {
    const dotColor = iconColors[icon];

    return (
      <div className="glass-section p-5">
        <div className="flex items-center space-x-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    );
  },
);

ControlSection.displayName = "ControlSection";

// ============================================================================

interface ControlGridProps {
  children: React.ReactNode;
  cols?: 2 | 3;
}

export const ControlGrid = memo<ControlGridProps>(({ children, cols = 2 }) => {
  const gridClass = cols === 2 ? "grid-cols-2" : "grid-cols-3";

  return <div className={`grid ${gridClass} gap-3`}>{children}</div>;
});

ControlGrid.displayName = "ControlGrid";

// ============================================================================

interface ConditionalSectionProps {
  condition: boolean;
  children: React.ReactNode;
}

export const ConditionalSection = memo<ConditionalSectionProps>(
  ({ condition, children }) => {
    if (!condition) return null;
    return <>{children}</>;
  },
);

ConditionalSection.displayName = "ConditionalSection";

// ============================================================================

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export const ActionButton = memo<ActionButtonProps>(
  ({ label, onClick, variant = "secondary", icon }) => {
    const baseClasses =
      "w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2";
    const variantClasses =
      variant === "primary"
        ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
        : "glass-button text-white hover:scale-105";

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
      </button>
    );
  },
);

ActionButton.displayName = "ActionButton";
