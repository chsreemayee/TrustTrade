"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  FastForward,
  Volume2,
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Company, MOCK_COMPANIES } from "../../mocks/companies";
import { api, UserWallet } from "../../lib/api";
import { formatRupees } from "../../lib/formatters";
import { TrustButton } from "../TrustButton";

interface L14PracticeWalletProps {
  onSelectCompany: (company: Company) => void;
}

export const L14PracticeWallet: React.FC<L14PracticeWalletProps> = ({
  onSelectCompany,
}) => {
  const { t, speak, lang } = useI18n();
  const [wallet, setWallet] = useState<UserWallet>({
    cash: 10000,
    holdings: [],
    sim_days_forwarded: 0,
  });
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const w = await api.getWallet();
    setWallet(w);
  };

  const handleReset = async () => {
    const fresh = await api.resetWallet();
    setWallet(fresh);
    speak(
      lang === "te"
        ? "వాలెట్ రీసెట్ చేయబడింది. ₹10,000 అబద్ధపు నగదు తిరిగి వచ్చింది."
        : "Wallet reset. ₹10,000 pretend cash restored."
    );
  };

  const handleFastForward = async () => {
    setIsFastForwarding(true);
    const updated = await api.fastForwardWeek();
    setWallet(updated);
    setIsFastForwarding(false);
    speak(
      lang === "te"
        ? "1 వారం ముందుకు వెళ్ళారు. 5 రోజుల మార్కెట్ ఫలితాలు నవీకరించబడ్డాయి."
        : "Fast-forwarded 1 week. 5 trading days simulated."
    );
  };

  // Calculations
  const totalInvested = wallet.holdings.reduce(
    (sum, h) => sum + h.invested_rupees,
    0
  );
  const totalCurrentHoldingsVal = wallet.holdings.reduce(
    (sum, h) => sum + h.current_value,
    0
  );
  const totalPortfolio = wallet.cash + totalCurrentHoldingsVal;
  const overallGainLoss = totalCurrentHoldingsVal - totalInvested;
  const isGain = overallGainLoss >= 0;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-title text-charcoal">{t("l14_practice.title")}</h1>
          <p className="text-[14px] text-charcoal-secondary">
            {lang === "te" ? "₹10,000 డెమో నగదుతో నేర్చుకోండి" : "Learn safely with ₹10,000 pretend cash"}
          </p>
        </div>
        <button
          onClick={() =>
            speak(
              `${t("l14_practice.title")}. Balance: ${formatRupees(
                wallet.cash
              )}`
            )
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Mandatory Disclaimer (PRD requirement: Never Break These Rules) */}
      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold flex items-center gap-2">
        <AlertCircle size={18} className="flex-shrink-0 text-amber-700" />
        <span>{t("l14_practice.disclaimer")}</span>
      </div>

      {/* Wallet Card */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Wallet size={24} className="text-teal-deep" />
            <span className="font-bold text-[17px] text-charcoal">
              {t("l14_practice.wallet_balance")}
            </span>
          </div>
          <span className="text-[24px] font-bold text-teal-deep font-mono">
            {formatRupees(wallet.cash)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[15px]">
          <div>
            <span className="text-charcoal-secondary block text-[13px]">
              {t("l14_practice.invested_value")}
            </span>
            <span className="font-bold text-charcoal font-mono">
              {formatRupees(totalCurrentHoldingsVal)}
            </span>
          </div>

          <div>
            <span className="text-charcoal-secondary block text-[13px]">
              {t("l14_practice.total_value")}
            </span>
            <div className="flex items-center gap-1 font-bold font-mono">
              <span>{formatRupees(totalPortfolio)}</span>
              {wallet.holdings.length > 0 && (
                <span
                  className={`text-[13px] inline-flex items-center ${
                    isGain ? "text-gain" : "text-loss"
                  }`}
                >
                  {isGain ? "▲" : "▼"}{" "}
                  {formatRupees(Math.abs(overallGainLoss))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Demo Fast Forward Button & Reset */}
        <div className="flex gap-2 pt-2 border-t border-border mt-1">
          <button
            onClick={handleFastForward}
            disabled={isFastForwarding}
            className="flex-1 py-2.5 px-3 rounded-xl bg-marigold text-charcoal font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-marigold-hover shadow-sm transition-transform active:scale-95"
          >
            <FastForward size={18} />
            <span>{t("l14_practice.fast_forward_btn")}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-cream-dark text-charcoal-secondary hover:text-charcoal border border-border"
            title={t("l14_practice.reset_wallet_btn")}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* My Holdings Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-heading text-charcoal">{t("l14_practice.my_holdings")}</h2>

        {wallet.holdings.length === 0 ? (
          <div className="p-4 bg-white rounded-card border border-border text-center text-charcoal-secondary text-[15px]">
            {t("l14_practice.no_holdings")}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {wallet.holdings.map((h) => {
              const comp = MOCK_COMPANIES.find((c) => c.ticker === h.ticker);
              const isProfit = h.gain_loss_rupees >= 0;

              return (
                <div
                  key={h.ticker}
                  onClick={() => comp && onSelectCompany(comp)}
                  className="bg-white rounded-card p-3.5 border border-border shadow-card cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[17px] text-charcoal">
                      {h.name}
                    </div>
                    <div className="text-[13px] text-charcoal-secondary font-mono">
                      {h.shares} shares • Bought at {formatRupees(h.buy_price)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[17px] text-charcoal font-mono">
                      {formatRupees(h.current_value)}
                    </div>
                    <div
                      className={`text-[13px] font-bold font-mono inline-flex items-center gap-0.5 ${
                        isProfit ? "text-gain" : "text-loss"
                      }`}
                    >
                      <span>{isProfit ? "▲" : "▼"}</span>
                      <span>{formatRupees(Math.abs(h.gain_loss_rupees))}</span>
                      <span>({h.gain_loss_percent}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 20 Companies List */}
      <div className="flex flex-col gap-2.5 mt-2">
        <h2 className="text-heading text-charcoal">
          {t("l14_practice.companies_list")}
        </h2>

        <div className="flex flex-col gap-2.5">
          {MOCK_COMPANIES.map((company) => {
            const isUp = company.price_change >= 0;

            return (
              <div
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className="bg-white rounded-card p-3.5 border border-border hover:border-teal-deep shadow-card cursor-pointer flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  {/* Initial tile logo */}
                  <div
                    style={{ backgroundColor: company.tile_colour }}
                    className="w-12 h-12 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    {company.initials}
                  </div>

                  <div>
                    <div className="font-bold text-[17px] text-charcoal leading-tight">
                      {company.name}
                    </div>
                    <div className="text-[13px] text-charcoal-secondary mt-0.5">
                      {company.sector[lang] || company.sector.en}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-[17px] text-charcoal font-mono">
                    {formatRupees(company.current_price, true)}
                  </div>
                  <div
                    className={`text-[13px] font-bold font-mono inline-flex items-center gap-0.5 ${
                      isUp ? "text-gain" : "text-loss"
                    }`}
                  >
                    <span>{isUp ? "▲" : "▼"}</span>
                    <span>{company.change_percent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
