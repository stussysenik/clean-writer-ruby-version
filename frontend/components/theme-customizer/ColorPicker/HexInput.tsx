import React, { useState, useEffect } from "react";

interface HexInputProps {
  value: string;
  onChange: (value: string) => void;
}

const HexInput: React.FC<HexInputProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Ensure it starts with #
    if (!val.startsWith("#")) {
      val = "#" + val.replace("#", "");
    }

    // Only allow valid hex characters
    val = val.replace(/[^#0-9A-Fa-f]/g, "");

    // Limit to 7 characters (#RRGGBB)
    val = val.slice(0, 7);

    setInputValue(val);

    // Only call onChange if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    // On blur, reset to valid value if current is invalid
    if (!/^#[0-9A-Fa-f]{6}$/i.test(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-20 px-2 py-1 text-sm font-mono rounded border border-current/20 bg-transparent focus:outline-none focus:ring-1 focus:ring-current/40"
      placeholder="#000000"
      maxLength={7}
    />
  );
};

export default HexInput;
