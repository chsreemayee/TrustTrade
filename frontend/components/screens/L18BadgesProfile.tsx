"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Globe,
  Briefcase,
  Gauge,
  LogOut,
  Trash2,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Search,
  Eye,
  TrendingUp,
  CalendarCheck,
  AlertOctagon,
  Lock,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Badge, getLevelInfo } from "../../mocks/badges";
import { api } from "../../lib/api";
import { TrustButton } from "../TrustButton";

interface L18BadgesProfileProps {
  onChangeLanguage: () => void;
  onChangeJob: () => void;
  onLogout: () => void;
}

export const L18BadgesProfile: React.FC<L18BadgesProfileProps> = ({
  onChangeLanguage,
  onChangeJob,
  onLogout,
}) => {
  const { t, speak, voiceSpeed, setVoiceSpeed, lang } = useI18n();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userName, setUserName] = useState("Lakshmi");
  const [userJob, setUserJob] = useState("vegetable_seller");

  useEffect(() => {
    loadBadges();
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("trusttrade_user_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name) setUserName(parsed.name);
          if (parsed.job) setUserJob(parsed.job);
        } catch (e) {}
      }
    }
  }, []);

  const loadBadges = async () => {
    const b = await api.getBadges();
    setBadges(b);
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const levelInfo = getLevelInfo(unlockedCount);

  // Badge icon mapper
  const renderBadgeIcon = (code: string, unlocked: boolean) => {
    const iconSize = 28;
    const colorClass = unlocked ? "text-marigold" : "text-charcoal-secondary/40";

    switch (code) {
      case "first_check":
        return <ShieldCheck size={iconSize} className={colorClass} />;
      case "first_lesson":
        return <BookOpen size={iconSize} className={colorClass} />;
      case "money_basics":
        return <GraduationCap size={iconSize} className={colorClass} />;
      case "scam_spotter":
        return <Search size={iconSize} className={colorClass} />;
      case "sharp_eye":
        return <Eye size={iconSize} className={colorClass} />;
      case "first_trade":
        return <TrendingUp size={iconSize} className={colorClass} />;
      case "patient_investor":
        return <CalendarCheck size={iconSize} className={colorClass} />;
      case "protector":
        return <AlertOctagon size={iconSize} className={colorClass} />;
      default:
        return <Award size={iconSize} className={colorClass} />;
    }
  };

  const handleDeleteData = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      speak("Your saved data has been erased successfully.");
      onLogout();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 bg-cream min-h-screen">
      {/* Profile Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-title text-charcoal">{t("l18_badges.title")}</h1>
          <p className="text-body text-charcoal-secondary">
            {userName} • {t(`l4_login.job_${userJob}`)}
          </p>
        </div>
        <button
          onClick={() =>
            speak(
              `${userName}. ${t("l18_badges.level_heading")}: ${
                levelInfo.title[lang] || levelInfo.title.en
              }. ${t("l18_badges.badges_earned_count", {
                earned: unlockedCount,
                total: 8,
              })}`
            )
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Level Bar Card */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[13px] text-charcoal-secondary uppercase font-bold">
              {t("l18_badges.level_heading")}
            </span>
            <div className="text-[24px] font-bold text-teal-deep">
              {levelInfo.title[lang] || levelInfo.title.en}
            </div>
          </div>
          <span className="font-bold text-[16px] text-marigold bg-marigold/15 px-3 py-1 rounded-full">
            {t("l18_badges.badges_earned_count", {
              earned: unlockedCount,
              total: 8,
            })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-cream-dark h-3.5 rounded-full overflow-hidden">
          <div
            style={{ width: `${(unlockedCount / 8) * 100}%` }}
            className="h-full bg-teal-deep rounded-full transition-all duration-500"
          />
        </div>

        <div className="flex justify-between text-[12px] font-bold text-charcoal-secondary">
          <span>Beginner (0-2)</span>
          <span>Learner (3-5)</span>
          <span>Guardian (6-8)</span>
        </div>
      </div>

      {/* 8 Badges Grid */}
      <div className="flex flex-col gap-2">
        <h2 className="text-heading text-charcoal">
          {t("l18_badges.badges_grid_title")}
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((badge) => {
            const name = badge.name[lang] || badge.name.en;
            const desc = badge.description[lang] || badge.description.en;

            return (
              <div
                key={badge.code}
                onClick={() => speak(`${name}. ${desc}`)}
                className={`p-3.5 rounded-card border text-left flex flex-col justify-between min-h-[120px] transition-all cursor-pointer ${
                  badge.unlocked
                    ? "bg-white border-marigold/60 shadow-card"
                    : "bg-cream-dark/50 border-border opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      badge.unlocked ? "bg-marigold/20" : "bg-black/5"
                    }`}
                  >
                    {renderBadgeIcon(badge.code, badge.unlocked)}
                  </div>
                  {!badge.unlocked && (
                    <Lock size={16} className="text-charcoal-secondary" />
                  )}
                </div>

                <div className="mt-2">
                  <div className="font-bold text-[15px] text-charcoal leading-tight">
                    {name}
                  </div>
                  <div className="text-[12px] text-charcoal-secondary mt-0.5 line-clamp-2">
                    {desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-3 mt-1">
        <h3 className="text-heading text-charcoal">
          {t("l18_badges.settings_title")}
        </h3>

        {/* Change Language */}
        <button
          onClick={onChangeLanguage}
          className="flex items-center justify-between p-3 rounded-xl bg-cream/50 hover:bg-cream border border-border text-charcoal"
        >
          <div className="flex items-center gap-2.5 font-semibold text-[16px]">
            <Globe size={20} className="text-teal-deep" />
            <span>{t("l18_badges.change_language")}</span>
          </div>
          <span className="text-[14px] text-teal-deep font-bold">Change</span>
        </button>

        {/* Change Job */}
        <button
          onClick={onChangeJob}
          className="flex items-center justify-between p-3 rounded-xl bg-cream/50 hover:bg-cream border border-border text-charcoal"
        >
          <div className="flex items-center gap-2.5 font-semibold text-[16px]">
            <Briefcase size={20} className="text-teal-deep" />
            <span>{t("l18_badges.change_job")}</span>
          </div>
          <span className="text-[14px] text-teal-deep font-bold">Change</span>
        </button>

        {/* Voice Speed */}
        <div className="p-3 rounded-xl bg-cream/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[16px] text-charcoal flex items-center gap-2">
              <Gauge size={20} className="text-teal-deep" />
              <span>{t("l18_badges.voice_speed")}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 0.8, label: t("l18_badges.voice_speed_slow") },
              { rate: 1.0, label: t("l18_badges.voice_speed_normal") },
              { rate: 1.2, label: t("l18_badges.voice_speed_fast") },
            ].map((s) => (
              <button
                key={s.rate}
                onClick={() => {
                  setVoiceSpeed(s.rate);
                  speak(`Voice speed set to ${s.label}`);
                }}
                className={`py-2 px-2 rounded-lg font-bold text-[14px] border ${
                  voiceSpeed === s.rate
                    ? "bg-teal-deep text-white border-teal-deep"
                    : "bg-white text-charcoal border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Delete Data button (DPDP compliance) */}
        <button
          onClick={handleDeleteData}
          className="flex items-center justify-center gap-2 p-3 rounded-xl text-loss hover:bg-verdict-scam-bg border border-verdict-scam-border font-semibold text-[15px] mt-2"
        >
          <Trash2 size={18} />
          <span>Delete my data</span>
        </button>
      </div>
    </div>
  );
};
