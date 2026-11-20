"use client";

import React, { useEffect } from "react";
import { Check, X, Volume2, ShieldQuestion } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";

interface L6ConfirmProps {
  details: {
    sender: string;
    amount: string;
    promised_return: string;
    payment_mode: string;
    links_or_upi: string;
  };
  onConfirm: () => void;
  onReject: () => void;
}

export const L6Confirm: React.FC<L6ConfirmProps> = ({
  details,
  onConfirm,
  onReject,
}) => {
  const { t, speak } = useI18n();

  useEffect(() => {
    // Automatically speak confirmation summary aloud
    const spoken = `${t("l6_confirm.title")}. ${t("l6_confirm.field_sender")}: ${
      details.sender
    }. ${t("l6_confirm.field_amount")}: ${details.amount}. ${t(
      "l6_confirm.field_return"
    )}: ${details.promised_return}.`;
    speak(spoken);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-title text-charcoal">{t("l6_confirm.title")}</h1>
          <p className="text-body text-charcoal-secondary">{t("l6_confirm.sub")}</p>
        </div>
        <button
          onClick={() =>
            speak(`${t("l6_confirm.title")}. ${t("l6_confirm.sub")}`)
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ShieldQuestion size={24} className="text-teal-deep" />
          <span className="font-bold text-heading text-charcoal">
            {t("l6_confirm.title")}
          </span>
        </div>

        <div className="flex flex-col gap-3 text-[17px]">
          <div className="flex justify-between items-start">
            <span className="text-charcoal-secondary">{t("l6_confirm.field_sender")}:</span>
            <span className="font-bold text-charcoal text-right">{details.sender}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-charcoal-secondary">{t("l6_confirm.field_amount")}:</span>
            <span className="font-bold text-charcoal text-right">{details.amount}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-charcoal-secondary">{t("l6_confirm.field_return")}:</span>
            <span className="font-bold text-verdict-scam-text text-right">
              {details.promised_return}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-charcoal-secondary">{t("l6_confirm.field_payment")}:</span>
            <span className="font-medium text-charcoal text-right">
              {details.payment_mode}
            </span>
          </div>

          {details.links_or_upi && (
            <div className="flex justify-between items-start">
              <span className="text-charcoal-secondary">{t("l6_confirm.field_link_upi")}:</span>
              <span className="font-mono text-[15px] text-teal-deep text-right max-w-[200px] truncate">
                {details.links_or_upi}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Yes / No */}
      <div className="flex flex-col gap-3 mt-4">
        <TrustButton
          variant="primary"
          label={t("l6_confirm.yes_btn")}
          icon={<Check size={26} strokeWidth={2.5} />}
          onClick={onConfirm}
          speechText={t("l6_confirm.yes_btn")}
        />

        <TrustButton
          variant="ghost"
          label={t("l6_confirm.no_btn")}
          icon={<X size={26} />}
          onClick={onReject}
          speechText={t("l6_confirm.no_btn")}
        />
      </div>
    </div>
  );
};
