"use client";

import React from "react";
import {
  Home,
  BookOpen,
  TrendingUp,
  ShieldAlert,
  Target,
  Award,
} from "lucide-react";
import { useI18n } from "../lib/i18n";

export type TabKey = "home" | "learn" | "practice" | "scam_check" | "drill" | "badges";

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useI18n();

  const navItems: { key: TabKey; labelKey: string; icon: React.ReactNode }[] = [
    { key: "home", labelKey: "nav.home", icon: <Home size={24} strokeWidth={2} /> },
    { key: "learn", labelKey: "nav.learn", icon: <BookOpen size={24} strokeWidth={2} /> },
    { key: "practice", labelKey: "nav.practice", icon: <TrendingUp size={24} strokeWidth={2} /> },
    { key: "scam_check", labelKey: "nav.scam_check", icon: <ShieldAlert size={24} strokeWidth={2} /> },
    { key: "drill", labelKey: "nav.drill", icon: <Target size={24} strokeWidth={2} /> },
    { key: "badges", labelKey: "nav.badges", icon: <Award size={24} strokeWidth={2} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-1 py-1 max-w-[480px] mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          const label = t(item.labelKey);

          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 min-w-0 ${
                isActive
                  ? "text-teal-deep font-bold"
                  : "text-charcoal-secondary hover:text-charcoal font-medium"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? "bg-teal-light text-teal-deep" : "text-charcoal-secondary"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[12px] truncate w-full text-center mt-0.5 leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
