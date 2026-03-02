import React from "react";
import ColorSwatch from "./ColorSwatch";
import HexInput from "./HexInput";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presets?: string[];
  label?: string;
}

const DEFAULT_PRESETS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#95E1D3",
  "#0078BF",
  "#F15060",
  "#00A95C",
  "#9B59B6",
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  presets = DEFAULT_PRESETS,
  label,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs uppercase tracking-wide opacity-70">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-11 h-11 cursor-pointer rounded-md border-0 p-0 bg-transparent"
            style={{
              minWidth: "44px",
              minHeight: "44px",
            }}
          />
        </div>

        {/* Preset swatches */}
        <div className="flex gap-1 flex-wrap">
          {presets.map((preset) => (
            <ColorSwatch
              key={preset}
              color={preset}
              isSelected={color.toLowerCase() === preset.toLowerCase()}
              onClick={() => onChange(preset)}
            />
          ))}
        </div>

        {/* Hex input */}
        <HexInput value={color} onChange={onChange} />
      </div>
    </div>
  );
};

export default ColorPicker;
