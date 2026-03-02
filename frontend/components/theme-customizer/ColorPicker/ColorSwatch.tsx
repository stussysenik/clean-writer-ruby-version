import React from "react";

interface ColorSwatchProps {
  color: string;
  isSelected?: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  isSelected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        width: "32px",
        height: "32px",
        minWidth: "32px",
        minHeight: "32px",
        backgroundColor: color,
        boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
      }}
      title={color}
    />
  );
};

export default ColorSwatch;
