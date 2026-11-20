"use client";

import React from "react";
import { Check, X, HelpCircle, ArrowLeft, Volume2, Shield } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { ScamCheckVerdict } from "../../mocks/scam_checks";
import { TrustButton } from "../TrustButton";

interface L9VerdictDetailsProps {
  verdictData: ScamCheckVerdict;
  onBack: () => void;
}

export const L9VerdictDetails: React.FC<L9VerdictDetailsProps> = ({
  verdictData,
  onBack,
}) => {
  const { t, speak } = useI18n();

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-title text-charcoal">{t("l9_details.title")}</h1>
            <p className="text-[14px] text-charcoal-secondary">{t("l9_details.sub")}</p>
          </div>
        </div>
        <button
          onClick={() =>
            speak(`${t("l9_details.title")}. ${t("l9_details.sub")}`)
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Checks List */}
      <div className="flex flex-col gap-3">
        {verdictData.checks.map((chk, idx) => {
          let statusBadge = null;
          if (chk.status === "found") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-verdict-no_signs-bg text-verdict-no_signs-text text-[14px] font-bold">
                <Check size={16} strokeWidth={3} />
                {t("l9_details.status_found")}
              </span>
            );
          } else if (chk.status === "not_found") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-verdict-scam-bg text-verdict-scam-text text-[14px] font-bold">
                <X size={16} strokeWidth={3} />
                {t("l9_details.status_not_found")}
              </span>
            );
          } else {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-verdict-could_not_check-bg text-verdict-could_not_check-text text-[14px] font-bold">
                <HelpCircle size={16} strokeWidth={2.5} />
                {t("l9_details.status_could_not_check")}
              </span>
            );
          }

          return (
            <div
              key={idx}
              className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-[18px] text-charcoal flex items-center gap-2">
                  <Shield size={20} className="text-teal-deep" />
                  <span>{chk.name}</span>
                </div>
                {statusBadge}
              </div>

              <div className="text-[14px] text-charcoal-secondary flex flex-col gap-0.5 mt-1 pt-2 border-t border-border">
                <div>
                  <span className="font-semibold">{t("l9_details.source_label")}: </span>
                  <span>{chk.source}</span>
                </div>
                <div>
                  <span className="font-semibold">{t("l9_details.as_of_label")}: </span>
                  <span>{chk.as_of}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="mt-4">
        <TrustButton
          variant="primary"
          label={t("l9_details.back_to_verdict")}
          icon={<ArrowLeft size={24} />}
          onClick={onBack}
          speechText={t("l9_details.back_to_verdict")}
        />
      </div>
    </div>
  );
};
