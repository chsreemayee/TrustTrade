"use client";

import React, { useState } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface MobileShellProps {
  children: React.ReactNode;
  isAdminView?: boolean;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  isAdminView = false,
}) => {
  const { fontClass } = useI18n();
  const [deviceFrame, setDeviceFrame] = useState(true);

  if (isAdminView) {
    return (
      <div className={`min-h-screen bg-[#F8F9FA] text-[#1F2933] ${fontClass}`}>
        {/* Admin top bar banner */}
        <div className="bg-charcoal text-white px-6 py-2.5 flex items-center justify-between text-[14px]">
          <div className="flex items-center gap-2 font-semibold">
            <Monitor size={18} className="text-marigold" />
            <span>TrustTrade Admin Portal</span>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto p-6">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#EBE5DA] flex flex-col items-center justify-start sm:py-6 ${fontClass}`}
    >
      {/* Desktop view controller bar */}
      <div className="hidden sm:flex items-center gap-3 mb-3 bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-border shadow-sm text-[14px]">
        <Smartphone size={16} className="text-teal-deep" />
        <span className="font-semibold text-charcoal">
          360 × 800 Android Viewport
        </span>
        <button
          onClick={() => setDeviceFrame(!deviceFrame)}
          className="text-[12px] px-2 py-0.5 rounded bg-cream border border-border text-charcoal-secondary hover:text-charcoal"
        >
          {deviceFrame ? "Hide Frame" : "Show Frame"}
        </button>
      </div>

      {/* Mobile container - exactly 360x800 proportions on desktop, native on mobile */}
      <div
        className={`w-full max-w-[390px] sm:w-[360px] bg-cream min-h-screen sm:min-h-[800px] sm:max-h-[840px] sm:overflow-y-auto relative transition-all ${
          deviceFrame
            ? "sm:border-[8px] sm:border-[#2D3748] sm:rounded-[36px] sm:shadow-2xl"
            : "sm:border sm:border-border sm:rounded-2xl sm:shadow-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
