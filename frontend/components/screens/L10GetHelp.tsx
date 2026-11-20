"use client";

import React from "react";
import {
  PhoneCall,
  Globe,
  FileCheck,
  Camera,
  CreditCard,
  ArrowLeft,
  Volume2,
  AlertOctagon,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";

interface L10GetHelpProps {
  onBack: () => void;
}

export const L10GetHelp: React.FC<L10GetHelpProps> = ({ onBack }) => {
  const { t, speak } = useI18n();

  const handleCall1930 = () => {
    speak("Calling 1930 national cyber fraud helpline");
    if (typeof window !== "undefined") {
      window.location.href = "tel:1930";
    }
  };

  const handleOpenCyberPortal = () => {
    if (typeof window !== "undefined") {
      window.open("https://cybercrime.gov.in", "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-title text-charcoal">{t("l10_help.title")}</h1>
            <p className="text-[14px] text-charcoal-secondary">{t("l10_help.sub")}</p>
          </div>
        </div>
        <button
          onClick={() =>
            speak(`${t("l10_help.title")}. ${t("l10_help.sub")}`)
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Urgent Emergency Call 1930 Card */}
      <div className="bg-verdict-scam-bg rounded-card p-5 border-2 border-verdict-scam-border shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-verdict-scam-text text-white flex items-center justify-center flex-shrink-0">
            <PhoneCall size={26} />
          </div>
          <div>
            <h3 className="text-heading text-verdict-scam-text leading-tight">
              {t("l10_help.call_1930_title")}
            </h3>
            <p className="text-[14px] text-charcoal-secondary mt-0.5">
              {t("l10_help.call_1930_desc")}
            </p>
          </div>
        </div>

        <button
          onClick={handleCall1930}
          className="w-full min-h-[56px] rounded-btn bg-verdict-scam-text hover:bg-[#911a11] active:scale-95 text-white font-bold text-[18px] flex items-center justify-center gap-3 shadow-md transition-all"
        >
          <PhoneCall size={26} />
          <span>Call 1930 Now</span>
        </button>
      </div>

      {/* Cybercrime Portal Link */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-light text-teal-deep flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h4 className="font-bold text-[17px] text-charcoal">
              cybercrime.gov.in
            </h4>
            <p className="text-[14px] text-charcoal-secondary">
              {t("l10_help.cybercrime_portal_desc")}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCyberPortal}
          className="px-4 py-2 rounded-btn bg-cream-dark text-teal-deep font-bold text-[15px] border border-border hover:bg-border"
        >
          Open
        </button>
      </div>

      {/* What to Keep Ready (Proofs Checklist) */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-3">
        <div className="font-bold text-heading text-charcoal flex items-center gap-2">
          <AlertOctagon size={22} className="text-marigold" />
          <span>{t("l10_help.what_to_keep_title")}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-cream/50">
            <Camera size={22} className="text-teal-deep flex-shrink-0 mt-0.5" />
            <span className="text-[16px] text-charcoal">
              {t("l10_help.keep_screenshots")}
            </span>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-cream/50">
            <FileCheck size={22} className="text-teal-deep flex-shrink-0 mt-0.5" />
            <span className="text-[16px] text-charcoal">
              {t("l10_help.keep_utr")}
            </span>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-cream/50">
            <CreditCard size={22} className="text-teal-deep flex-shrink-0 mt-0.5" />
            <span className="text-[16px] text-charcoal">
              {t("l10_help.keep_bank")}
            </span>
          </div>
        </div>
      </div>

      {/* Back to Verdict */}
      <div className="mt-2">
        <TrustButton
          variant="secondary"
          label={t("l10_help.back_btn")}
          icon={<ArrowLeft size={24} />}
          onClick={onBack}
          speechText={t("l10_help.back_btn")}
        />
      </div>
    </div>
  );
};
