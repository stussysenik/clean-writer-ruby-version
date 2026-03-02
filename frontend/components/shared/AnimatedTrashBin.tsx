import React, { useEffect, useState } from "react";

export type TrashBinState =
  | "hidden"
  | "idle"
  | "hover"
  | "accepting"
  | "rejecting"
  | "swallowing";

interface AnimatedTrashBinProps {
  isVisible: boolean;
  state: TrashBinState;
  onAnimationComplete?: () => void;
  themeColor?: string;
}

const AnimatedTrashBin: React.FC<AnimatedTrashBinProps> = ({
  isVisible,
  state,
  onAnimationComplete,
  themeColor = "#666",
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const [eyeState, setEyeState] = useState<"normal" | "happy" | "worried">(
    "normal",
  );

  // Handle eye expressions based on state
  useEffect(() => {
    switch (state) {
      case "hover":
        setEyeState("happy");
        break;
      case "rejecting":
        setEyeState("worried");
        break;
      case "swallowing":
        setEyeState("happy");
        break;
      default:
        setEyeState("normal");
    }
  }, [state]);

  // Handle swallow animation completion
  useEffect(() => {
    if (state === "swallowing") {
      setShowParticles(true);
      const timer = setTimeout(() => {
        setShowParticles(false);
        onAnimationComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state, onAnimationComplete]);

  if (!isVisible && state === "hidden") {
    return null;
  }

  const getContainerAnimation = () => {
    switch (state) {
      case "rejecting":
        return "shake 0.5s ease-in-out";
      case "swallowing":
        return "gulp 0.4s ease-in-out";
      default:
        return "none";
    }
  };

  const getLidRotation = () => {
    switch (state) {
      case "hover":
      case "accepting":
        return -45;
      case "swallowing":
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-end justify-center z-[60] pointer-events-none pb-6"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(100px)",
        transition:
          "opacity 300ms ease-out, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            state === "hover" || state === "accepting"
              ? "linear-gradient(to top, rgba(239, 68, 68, 0.2) 0%, transparent 100%)"
              : "linear-gradient(to top, rgba(128, 128, 128, 0.1) 0%, transparent 100%)",
          transition: "background 200ms ease",
        }}
      />

      {/* Trash bin container */}
      <div
        className="relative"
        style={{
          animation: getContainerAnimation(),
          transform: state === "hover" ? "scale(1.1)" : "scale(1)",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Particle effects on swallow */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: "50%",
                  top: "30%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: themeColor,
                  animation: `particle-${i} 0.6s ease-out forwards`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}

        {/* SVG Trash Bin with Face */}
        <svg
          width="80"
          height="100"
          viewBox="0 0 80 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bin body */}
          <path
            d="M15 35 L20 90 C20 95 25 98 40 98 C55 98 60 95 60 90 L65 35"
            fill={
              state === "hover" || state === "accepting" ? "#ef4444" : "#6b7280"
            }
            stroke={
              state === "hover" || state === "accepting" ? "#dc2626" : "#4b5563"
            }
            strokeWidth="2"
            style={{
              transition: "fill 200ms ease, stroke 200ms ease",
            }}
          />

          {/* Bin body stripes */}
          <path
            d="M25 45 L28 85"
            stroke={state === "hover" ? "#fca5a5" : "#9ca3af"}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M40 45 L40 85"
            stroke={state === "hover" ? "#fca5a5" : "#9ca3af"}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M55 45 L52 85"
            stroke={state === "hover" ? "#fca5a5" : "#9ca3af"}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Bin rim */}
          <rect
            x="10"
            y="30"
            width="60"
            height="8"
            rx="3"
            fill={
              state === "hover" || state === "accepting" ? "#f87171" : "#9ca3af"
            }
            stroke={
              state === "hover" || state === "accepting" ? "#ef4444" : "#6b7280"
            }
            strokeWidth="2"
          />

          {/* Lid group with rotation */}
          <g
            style={{
              transformOrigin: "40px 25px",
              transform: `rotate(${getLidRotation()}deg)`,
              transition:
                state === "swallowing"
                  ? "transform 150ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"
                  : "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Lid */}
            <ellipse
              cx="40"
              cy="25"
              rx="35"
              ry="8"
              fill={
                state === "hover" || state === "accepting"
                  ? "#f87171"
                  : "#9ca3af"
              }
              stroke={
                state === "hover" || state === "accepting"
                  ? "#ef4444"
                  : "#6b7280"
              }
              strokeWidth="2"
            />
            {/* Lid handle */}
            <rect
              x="32"
              y="15"
              width="16"
              height="8"
              rx="4"
              fill={
                state === "hover" || state === "accepting"
                  ? "#fca5a5"
                  : "#d1d5db"
              }
              stroke={
                state === "hover" || state === "accepting"
                  ? "#f87171"
                  : "#9ca3af"
              }
              strokeWidth="2"
            />
          </g>

          {/* Face - Eyes */}
          <g className="eyes">
            {/* Left eye */}
            <ellipse
              cx="30"
              cy="55"
              rx={eyeState === "happy" ? 5 : 6}
              ry={eyeState === "happy" ? 3 : eyeState === "worried" ? 7 : 6}
              fill="white"
              style={{ transition: "all 150ms ease" }}
            />
            <circle
              cx={eyeState === "worried" ? 31 : 30}
              cy={eyeState === "happy" ? 56 : 55}
              r="3"
              fill="#1f2937"
              style={{ transition: "all 150ms ease" }}
            />
            {/* Eye highlight */}
            <circle cx="28" cy="53" r="1.5" fill="white" />

            {/* Right eye */}
            <ellipse
              cx="50"
              cy="55"
              rx={eyeState === "happy" ? 5 : 6}
              ry={eyeState === "happy" ? 3 : eyeState === "worried" ? 7 : 6}
              fill="white"
              style={{ transition: "all 150ms ease" }}
            />
            <circle
              cx={eyeState === "worried" ? 51 : 50}
              cy={eyeState === "happy" ? 56 : 55}
              r="3"
              fill="#1f2937"
              style={{ transition: "all 150ms ease" }}
            />
            {/* Eye highlight */}
            <circle cx="48" cy="53" r="1.5" fill="white" />
          </g>

          {/* Mouth */}
          {eyeState === "happy" ? (
            <path
              d="M32 68 Q40 76 48 68"
              fill="none"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : eyeState === "worried" ? (
            <ellipse cx="40" cy="70" rx="6" ry="4" fill="#1f2937" />
          ) : (
            <path
              d="M35 70 L45 70"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Blush when happy */}
          {eyeState === "happy" && (
            <>
              <ellipse
                cx="22"
                cy="62"
                rx="4"
                ry="2"
                fill="#fca5a5"
                opacity="0.6"
              />
              <ellipse
                cx="58"
                cy="62"
                rx="4"
                ry="2"
                fill="#fca5a5"
                opacity="0.6"
              />
            </>
          )}
        </svg>

        {/* Label */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-3 py-1 rounded-full"
          style={{
            backgroundColor:
              state === "hover" || state === "accepting"
                ? "rgba(239, 68, 68, 0.9)"
                : "rgba(107, 114, 128, 0.9)",
            color: "white",
            transition: "background-color 200ms ease",
          }}
        >
          {state === "rejecting"
            ? "Can't delete!"
            : state === "hover" || state === "accepting"
              ? "Drop here!"
              : "Drag to delete"}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-10px) rotate(-5deg); }
          40% { transform: translateX(10px) rotate(5deg); }
          60% { transform: translateX(-10px) rotate(-5deg); }
          80% { transform: translateX(10px) rotate(5deg); }
        }

        @keyframes gulp {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          30% { transform: scaleY(0.9) scaleX(1.1); }
          50% { transform: scaleY(1.15) scaleX(0.95); }
          70% { transform: scaleY(0.95) scaleX(1.05); }
        }

        ${[...Array(8)]
          .map((_, i) => {
            const angle = i * 45 * (Math.PI / 180);
            const distance = 40 + Math.random() * 20;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance - 20;
            return `
            @keyframes particle-${i} {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              100% {
                transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0);
                opacity: 0;
              }
            }
          `;
          })
          .join("\n")}

        @media (prefers-reduced-motion: reduce) {
          .animated-trash-bin * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedTrashBin;
