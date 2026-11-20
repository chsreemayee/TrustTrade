"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Volume2,
  Wallet,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Company } from "../../mocks/companies";
import { api } from "../../lib/api";
import { formatRupees } from "../../lib/formatters";
import { TrustButton } from "../TrustButton";

interface L16BuySellProps {
  company: Company;
  mode: "buy" | "sell";
  walletCash: number;
  userOwnsShares?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const L16BuySell: React.FC<L16BuySellProps> = ({
  company,
  mode,
  walletCash,
  userOwnsShares = 0,
  onSuccess,
  onCancel,
}) => {
  const { t, speak, lang } = useI18n();
  const [rupees, setRupees] = useState(500); // default ₹500 as in PRD demo script!
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const price = company.current_price;
  const estimatedShares = parseFloat((rupees / price).toFixed(4));

  const handleIncrement = () => {
    setRupees((prev) => prev + 100);
    setErrorMessage(null);
  };

  const handleDecrement = () => {
    if (rupees > 100) {
      setRupees((prev) => prev - 100);
      setErrorMessage(null);
    }
  };

  const handleConfirm = async () => {
    if (mode === "buy") {
      if (rupees > walletCash) {
        setErrorMessage("Insufficient cash in wallet");
        speak("Insufficient cash in wallet");
        return;
      }

      setIsSubmitting(true);
      try {
        await api.buyStock(company.ticker, rupees);
        const spokenMsg = t("l16_trade.success_buy", {
          shares: estimatedShares,
          name: company.name,
        });
        speak(spokenMsg);
        onSuccess();
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to buy shares");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Sell stock
      setIsSubmitting(true);
      try {
        await api.sellStock(company.ticker);
        const spokenMsg = t("l16_trade.success_sell", {
          name: company.name,
        });
        speak(spokenMsg);
        onSuccess();
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to sell");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[720px] p-4 bg-cream pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pt-1 mb-2">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-heading text-charcoal">
            {mode === "buy" ? t("l16_trade.buy_title") : t("l16_trade.sell_title")}
          </h2>

          <button
            onClick={() =>
              speak(
                `${company.name}. Price: ${formatRupees(
                  company.current_price
                )}. Amount: ${formatRupees(rupees)}`
              )
            }
            className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
          >
            <Volume2 size={22} />
          </button>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold flex items-center gap-2 mb-3">
          <AlertCircle size={18} className="flex-shrink-0 text-amber-700" />
          <span>{t("l16_trade.disclaimer")}</span>
        </div>
      </div>

      {/* Main Trade Controls */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <div className="font-bold text-[18px] text-charcoal">{company.name}</div>
            <div className="text-[14px] text-charcoal-secondary font-mono">
              1 share = {formatRupees(company.current_price, true)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[12px] text-charcoal-secondary block">Available Cash</span>
            <span className="font-bold text-[16px] text-teal-deep font-mono">
              {formatRupees(walletCash)}
            </span>
          </div>
        </div>

        {/* Step Controller (+ / - in steps of ₹100) */}
        {mode === "buy" ? (
          <div className="flex flex-col items-center gap-2 my-2">
            <span className="text-[15px] font-semibold text-charcoal-secondary">
              {t("l16_trade.amount_label")}
            </span>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={rupees <= 100}
                className="w-14 h-14 rounded-2xl bg-cream border border-border text-charcoal flex items-center justify-center hover:bg-cream-dark active:scale-95 disabled:opacity-40"
              >
                <Minus size={28} strokeWidth={2.5} />
              </button>

              <div className="text-[32px] font-bold text-teal-deep font-mono min-w-[140px] text-center">
                {formatRupees(rupees)}
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-14 h-14 rounded-2xl bg-teal-deep text-white flex items-center justify-center hover:bg-teal-hover active:scale-95 shadow-sm"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            </div>

            <span className="text-[13px] text-charcoal-secondary">
              {t("l16_trade.steps_hint")}
            </span>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-[18px] text-charcoal font-bold block mb-1">
              Selling all your {userOwnsShares} shares of {company.name}
            </span>
            <span className="text-[22px] font-bold text-teal-deep font-mono">
              Value: {formatRupees(userOwnsShares * company.current_price, true)}
            </span>
          </div>
        )}

        {/* Shares you get breakdown */}
        {mode === "buy" && (
          <div className="p-3 bg-cream/50 rounded-xl flex items-center justify-between text-[16px]">
            <span className="text-charcoal-secondary">
              {t("l16_trade.shares_estimate")}
            </span>
            <span className="font-bold text-charcoal font-mono text-[18px]">
              {estimatedShares} shares
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-verdict-scam-bg text-verdict-scam-text text-[14px] text-center font-semibold">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <TrustButton
          variant="primary"
          label={
            mode === "buy"
              ? t("l16_trade.confirm_buy")
              : t("l16_trade.confirm_sell")
          }
          icon={<CheckCircle size={24} />}
          onClick={handleConfirm}
          disabled={isSubmitting}
        />

        <TrustButton
          variant="ghost"
          label={t("common.cancel")}
          onClick={onCancel}
        />
      </div>
    </div>
  );
};
