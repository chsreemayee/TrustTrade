"use client";

import React from "react";
import { Volume2 } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface TrustButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "verdict_action";
  speechText?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "default" | "sm";
}

export const TrustButton: React.FC<TrustButtonProps> = ({
  label,
  icon,
  onClick,
  variant = "primary",
  speechText,
  className = "",
  disabled = false,
  fullWidth = true,
  type = "button",
  size = "default",
}) => {
  const { speak } = useI18n();

  const handleSpeakerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(speechText || label);
  };

  const baseStyles =
    "relative flex items-center justify-between rounded-btn transition-all duration-150 select-none font-semibold text-btn active:scale-[0.98]";
  const heightStyle = size === "sm" ? "min-h-[48px] py-2 px-3" : "min-h-[56px] py-3 px-4";
  const widthStyle = fullWidth ? "w-full" : "w-auto";

  let variantStyles = "";
  let speakerColor = "";

  switch (variant) {
    case "primary":
      variantStyles = "bg-teal-deep hover:bg-teal-hover text-white shadow-sm border border-teal-deep";
      speakerColor = "text-white/80 hover:text-white";
      break;
    case "accent":
      variantStyles = "bg-marigold hover:bg-marigold-hover text-charcoal shadow-sm border border-[#e09c00]";
      speakerColor = "text-charcoal/80 hover:text-charcoal";
      break;
    case "danger":
      variantStyles = "bg-verdict-scam-bg text-verdict-scam-text border border-verdict-scam-border hover:bg-[#fed7d7]";
      speakerColor = "text-verdict-scam-text/80 hover:text-verdict-scam-text";
      break;
    case "ghost":
      variantStyles = "bg-transparent text-charcoal hover:bg-cream-dark border border-border";
      speakerColor = "text-charcoal-secondary hover:text-charcoal";
      break;
    case "verdict_action":
      variantStyles = "bg-white text-charcoal hover:bg-cream-dark border border-border shadow-card";
      speakerColor = "text-teal-deep";
      break;
    case "secondary":
    default:
      variantStyles = "bg-white text-charcoal hover:bg-cream-dark border border-border shadow-card";
      speakerColor = "text-charcoal-secondary hover:text-charcoal";
      break;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${heightStyle} ${widthStyle} ${variantStyles} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <div className="flex items-center gap-3 text-left flex-1 min-w-0 pr-2">
        {icon && (
          <span className="flex-shrink-0 flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="truncate text-[18px] font-semibold leading-normal">{label}</span>
      </div>

      <button
        type="button"
        onClick={handleSpeakerClick}
        aria-label={`Listen to ${label}`}
        className={`flex-shrink-0 p-1.5 rounded-full hover:bg-black/10 active:scale-90 transition-transform ${speakerColor}`}
      >
        <Volume2 size={24} strokeWidth={2} />
      </button>
    </button>
  );
};
