import React from "react";
import {
  EyeOpenIcon,
  EyeClosedIcon,
  StrikethroughIcon,
  DownloadIcon,
  TrashIcon,
  WidthIcon,
  GearIcon,
  InfoCircledIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";

// Icon size constants for consistent sizing across the app
export const ICON_SIZE = {
  syntax: { desktop: 20, mobile: 24 },
  action: { desktop: 24, mobile: 28 },
};

// Wrapper for syntax icons with responsive sizing
interface SyntaxIconProps {
  className?: string;
}

// Text abbreviation style for part-of-speech icons
const textIconStyle: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontWeight: 700,
  fontSize: "12px",
  letterSpacing: "-0.02em",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "20px",
  height: "20px",
};

// Action Icons using Radix UI
export const IconEyeOpen = () => <EyeOpenIcon width={24} height={24} />;

export const IconEyeClosed = () => <EyeClosedIcon width={24} height={24} />;

export const IconStrike = () => <StrikethroughIcon width={24} height={24} />;

export const IconDownload = () => <DownloadIcon width={24} height={24} />;

export const IconWidth = () => <WidthIcon width={24} height={24} />;

export const IconTrash = () => <TrashIcon width={24} height={24} />;

// Part of Speech Icons using text abbreviations
// Clear, readable labels for each word type

// Noun - "N"
export const IconNoun: React.FC<SyntaxIconProps> = ({ className }) => (
  <span className={className} style={textIconStyle}>
    N
  </span>
);

// Pronoun - "Pron"
export const IconPronoun: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "10px", minWidth: "28px" }}
  >
    Pron
  </span>
);

// Verb - "V"
export const IconVerb: React.FC<SyntaxIconProps> = ({ className }) => (
  <span className={className} style={textIconStyle}>
    V
  </span>
);

// Adjective - "Adj"
export const IconAdj: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "11px", minWidth: "24px" }}
  >
    Adj
  </span>
);

// Adverb - "Adv"
export const IconAdverb: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "11px", minWidth: "24px" }}
  >
    Adv
  </span>
);

// Preposition - "Prep"
export const IconPreposition: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "10px", minWidth: "28px" }}
  >
    Prep
  </span>
);

// Conjunction - "Conj"
export const IconConj: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "10px", minWidth: "28px" }}
  >
    Conj
  </span>
);

// Article - "Art"
export const IconArticle: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "11px", minWidth: "24px" }}
  >
    Art
  </span>
);

// Interjection - "Int"
export const IconInterjection: React.FC<SyntaxIconProps> = ({ className }) => (
  <span
    className={className}
    style={{ ...textIconStyle, fontSize: "11px", minWidth: "24px" }}
  >
    Int
  </span>
);

// Magic wand icon for strikethrough cleanup
export const IconMagicClean = () => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 4V2" />
    <path d="M15 16v-2" />
    <path d="M8 9h2" />
    <path d="M20 9h2" />
    <path d="M17.8 11.8L22 7.6" />
    <path d="M15 9h.01" />
    <path d="M17.8 6.2L22 2" />
    <path d="M3 21l9-9" />
    <path d="M12.2 6.2L2 16.4" />
  </svg>
);

export const IconSettings = () => <GearIcon width={24} height={24} />;

// Info icon for legend
export const IconInfo = () => <InfoCircledIcon width={20} height={20} />;

// Sample text icon
export const IconSample = () => <ReaderIcon width={24} height={24} />;
