"use client";

import React from "react";
import {
  ArrowLeft,
  Volume2,
  AlertCircle,
  TrendingUp,
  Briefcase,
  ShoppingCart,
  MinusCircle,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Company } from "../../mocks/companies";
import { formatRupees } from "../../lib/formatters";
import { TrustButton } from "../TrustButton";

interface L15CompanyPageProps {
  company: Company;
  onBack: () => void;
  onOpenTrade: (mode: "buy" | "sell") => void;
  userOwnsShares?: number;
}

export const L15CompanyPage: React.FC<L15CompanyPageProps> = ({
  company,
  onBack,
  onOpenTrade,
  userOwnsShares = 0,
}) => {
  const { t, speak, lang } = useI18n();

  const description = company.description[lang] || company.description.en;
  const isUp = company.price_change >= 0;

  // Job example (defaults to vegetable seller or shopkeeper)
  const jobEx =
    company.job_example?.vegetable_seller?.[lang] ||
    company.job_example?.vegetable_seller?.en ||
    company.job_example?.shopkeeper?.[lang] ||
    company.job_example?.shopkeeper?.en ||
    description;

  const handleSpeakOverview = () => {
    speak(`${company.name}. ${description}. ${t("l15_company.job_connection")}: ${jobEx}`);
  };

  // SVG 1-month trend line
  const history = company.history || [company.previous_close, company.current_price];
  const minVal = Math.min(...history) * 0.99;
  const maxVal = Math.max(...history) * 1.01;
  const range = maxVal - minVal || 1;

  const points = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 300 + 10;
      const y = 90 - ((val - minVal) / range) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
        >
          <ArrowLeft size={22} />
        </button>

        <span className="text-[15px] font-bold text-charcoal-secondary font-mono">
          {company.ticker}
        </span>

        <button
          onClick={handleSpeakOverview}
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Mandatory Disclaimer (PRD Requirement) */}
      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold flex items-center gap-2">
        <AlertCircle size={18} className="flex-shrink-0 text-amber-700" />
        <span>{t("l15_company.disclaimer")}</span>
      </div>

      {/* Company Header Card */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex items-center gap-4">
        <div
          style={{ backgroundColor: company.tile_colour }}
          className="w-16 h-16 rounded-2xl text-white font-bold text-[22px] flex items-center justify-center flex-shrink-0 shadow-md"
        >
          {company.initials}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold text-charcoal leading-tight truncate">
            {company.name}
          </h1>
          <div className="text-[14px] text-charcoal-secondary mt-0.5">
            {company.sector[lang] || company.sector.en}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[22px] font-bold text-charcoal font-mono">
              {formatRupees(company.current_price, true)}
            </span>
            <span
              className={`text-[13px] font-bold font-mono inline-flex items-center ${
                isUp ? "text-gain" : "text-loss"
              }`}
            >
              {isUp ? "▲" : "▼"} {company.change_percent}%
            </span>
          </div>
        </div>
      </div>

      {/* 1-Month Price Trend Chart */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2">
        <div className="flex items-center justify-between text-[14px] font-bold text-charcoal">
          <span>{t("l15_company.one_month_trend")}</span>
          <span className="text-[12px] text-charcoal-secondary font-mono">
            Past 30 days
          </span>
        </div>

        <div className="w-full h-28 flex items-center justify-center pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100">
            <polyline
              fill="none"
              stroke={isUp ? "#1E7B34" : "#B42318"}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* What it does */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-heading text-charcoal">
            {t("l15_company.what_it_does")}
          </h3>
          <button
            onClick={() => speak(description)}
            className="p-1 rounded-full text-teal-deep hover:bg-cream"
          >
            <Volume2 size={20} />
          </button>
        </div>
        <p className="text-body text-charcoal leading-relaxed">{description}</p>
      </div>

      {/* How it connects to your work (Job Connection) */}
      <div className="bg-teal-light/40 rounded-card p-4 border border-teal-deep/30 shadow-card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-heading text-teal-deep flex items-center gap-2">
            <Briefcase size={22} />
            <span>{t("l15_company.job_connection")}</span>
          </h3>
          <button
            onClick={() => speak(jobEx)}
            className="p-1 rounded-full text-teal-deep hover:bg-cream"
          >
            <Volume2 size={20} />
          </button>
        </div>
        <p className="text-body text-charcoal leading-relaxed">{jobEx}</p>
      </div>

      {/* Buy / Sell Action Buttons */}
      <div className="flex gap-3 mt-2">
        <TrustButton
          variant="primary"
          label={t("l15_company.buy_btn")}
          icon={<ShoppingCart size={24} />}
          onClick={() => onOpenTrade("buy")}
          speechText={t("l15_company.buy_btn")}
        />

        {userOwnsShares > 0 && (
          <TrustButton
            variant="ghost"
            label={t("l15_company.sell_btn")}
            icon={<MinusCircle size={24} />}
            onClick={() => onOpenTrade("sell")}
            speechText={t("l15_company.sell_btn")}
          />
        )}
      </div>
    </div>
  );
};
