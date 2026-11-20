"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Check,
  HelpCircle,
  Volume2,
  FileText,
  BookOpen,
  Flag,
  RotateCcw,
  PhoneCall,
  Home,
  CheckCircle,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { ScamCheckVerdict } from "../../mocks/scam_checks";
import { TrustButton } from "../TrustButton";
import { api } from "../../lib/api";

interface L8VerdictProps {
  verdictData: ScamCheckVerdict;
  onSeeDetails: () => void;
  onLearnWhy: (lessonId: string) => void;
  onAlreadyPaid: () => void;
  onHome: () => void;
}

export const L8Verdict: React.FC<L8VerdictProps> = ({
  verdictData,
  onSeeDetails,
  onLearnWhy,
  onAlreadyPaid,
  onHome,
}) => {
  const { t, speak, lang } = useI18n();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const verdict = verdictData.verdict;
  const explanation =
    verdictData.explanation[lang] || verdictData.explanation.en || "";
  const whatToDoList =
    verdictData.what_to_do[lang] || verdictData.what_to_do.en || [];

  // Determine styling, icon, and label by verdict
  let verdictColorClass = "";
  let verdictIcon: React.ReactNode = null;
  let verdictWord = "";
  let mandatoryWarning = "";

  switch (verdict) {
    case "scam":
      verdictColorClass = "bg-verdict-scam-bg text-verdict-scam-text border-verdict-scam-border";
      verdictIcon = <X size={36} strokeWidth={3} className="text-verdict-scam-text" />;
      verdictWord = t("l8_verdict.verdict_scam");
      mandatoryWarning = t("l8_verdict.mandatory_scam_warning");
      break;

    case "careful":
      verdictColorClass = "bg-verdict-careful-bg text-verdict-careful-text border-verdict-careful-border";
      verdictIcon = <AlertTriangle size={36} strokeWidth={2.8} className="text-verdict-careful-text" />;
      verdictWord = t("l8_verdict.verdict_careful");
      mandatoryWarning = "";
      break;

    case "no_signs":
      verdictColorClass = "bg-verdict-no_signs-bg text-verdict-no_signs-text border-verdict-no_signs-border";
      verdictIcon = <Check size={36} strokeWidth={3} className="text-verdict-no_signs-text" />;
      verdictWord = t("l8_verdict.verdict_no_signs");
      mandatoryWarning = t("l8_verdict.mandatory_no_signs_warning");
      break;

    case "could_not_check":
    default:
      verdictColorClass = "bg-verdict-could_not_check-bg text-verdict-could_not_check-text border-verdict-could_not_check-border";
      verdictIcon = <HelpCircle size={36} strokeWidth={2.8} className="text-verdict-could_not_check-text" />;
      verdictWord = t("l8_verdict.verdict_could_not_check");
      mandatoryWarning = "";
      break;
  }

  const handleHearAgain = () => {
    const fullText = `${verdictWord}. ${explanation}. ${mandatoryWarning}. ${whatToDoList.join(
      ". "
    )}`;
    speak(fullText);
  };

  useEffect(() => {
    // Automatically read verdict aloud when screen lands
    handleHearAgain();
  }, []);

  const handleSendReport = async () => {
    if (reportReason.trim()) {
      await api.reportScam(verdictData.check_id, reportReason);
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
      }, 1500);
    }
  };

  const handleThisWasWrong = () => {
    setFeedbackSent(true);
    speak(t("l8_verdict.feedback_thanks"));
    setTimeout(() => {
      setFeedbackSent(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Top Verdict Band (Colour + Icon + Word) */}
      <div
        className={`rounded-card p-5 border-2 shadow-card flex flex-col items-center text-center ${verdictColorClass}`}
      >
        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center mb-2 shadow-sm">
          {verdictIcon}
        </div>
        <div className="text-[28px] font-bold tracking-tight leading-tight">
          {verdictWord}
        </div>

        {/* Score indicator chip */}
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/70 text-[14px] font-bold">
          Risk Score: {verdictData.score}
        </div>
      </div>

      {/* Mandatory Regulatory Warning Notices */}
      {mandatoryWarning && (
        <div
          className={`p-3.5 rounded-card border font-bold text-[16px] text-center ${
            verdict === "scam"
              ? "bg-verdict-scam-bg text-verdict-scam-text border-verdict-scam-border"
              : "bg-verdict-no_signs-bg text-verdict-no_signs-text border-verdict-no_signs-border"
          }`}
        >
          {mandatoryWarning}
        </div>
      )}

      {/* Explanation Card */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] font-bold text-charcoal">
            {lang === "te" ? "వివరణ:" : lang === "hi" ? "विवरण:" : "Explanation:"}
          </span>
          <button
            onClick={() => speak(explanation)}
            className="p-1 rounded-full text-teal-deep hover:bg-cream"
          >
            <Volume2 size={20} />
          </button>
        </div>
        <p className="text-body text-charcoal leading-relaxed">{explanation}</p>
      </div>

      {/* Top 3 Warning Signs with Source Chips (>=15px) */}
      {verdictData.signs && verdictData.signs.length > 0 && (
        <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2.5">
          <div className="text-[17px] font-bold text-charcoal flex items-center gap-2">
            <AlertTriangle size={20} className="text-verdict-scam-text" />
            <span>{t("l8_verdict.warning_signs_heading")}</span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {verdictData.signs.slice(0, 3).map((sign, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-verdict-scam-bg/50 border border-verdict-scam-border/60 flex flex-col gap-1.5"
              >
                <div className="text-[16px] font-semibold text-charcoal">
                  • {sign.evidence}
                </div>
                {/* Source chip (never smaller than 15px) */}
                <div className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[15px] font-medium text-charcoal-secondary border border-border">
                  <span className="font-bold">{t("l8_verdict.source_chip_prefix")}</span>
                  <span>{sign.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to do right now */}
      {whatToDoList && whatToDoList.length > 0 && (
        <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2">
          <div className="text-[17px] font-bold text-charcoal flex items-center gap-2">
            <CheckCircle size={20} className="text-teal-deep" />
            <span>{t("l8_verdict.what_to_do_heading")}</span>
          </div>

          <ul className="flex flex-col gap-2 mt-1">
            {whatToDoList.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-[16px] text-charcoal"
              >
                <span className="w-6 h-6 rounded-full bg-teal-light text-teal-deep flex items-center justify-center font-bold text-[13px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackSent && (
        <div className="p-3 bg-teal-light text-teal-deep border border-teal-deep/30 rounded-xl text-center font-semibold text-[15px] animate-fade-in">
          {t("l8_verdict.feedback_thanks")}
        </div>
      )}

      {/* 7 Action Buttons (Required by PRD 4.3 & 5.2) */}
      <div className="flex flex-col gap-3 mt-2">
        {/* 1. Hear again */}
        <TrustButton
          variant="primary"
          label={t("l8_verdict.btn_hear_again")}
          icon={<Volume2 size={26} strokeWidth={2.2} />}
          onClick={handleHearAgain}
          speechText={t("l8_verdict.btn_hear_again")}
        />

        {/* 2. See details */}
        <TrustButton
          variant="secondary"
          label={t("l8_verdict.btn_see_details")}
          icon={<FileText size={24} />}
          onClick={onSeeDetails}
          speechText={t("l8_verdict.btn_see_details")}
        />

        {/* 3. Learn why (30 s) */}
        <TrustButton
          variant="secondary"
          label={t("l8_verdict.btn_learn_why")}
          icon={<BookOpen size={24} />}
          onClick={() => onLearnWhy(verdictData.lesson_id)}
          speechText={t("l8_verdict.btn_learn_why")}
        />

        {/* 4. Report scam */}
        <TrustButton
          variant="danger"
          label={t("l8_verdict.btn_report_scam")}
          icon={<Flag size={24} />}
          onClick={() => setShowReportModal(true)}
          speechText={t("l8_verdict.btn_report_scam")}
        />

        {/* 5. This was wrong */}
        <TrustButton
          variant="ghost"
          label={t("l8_verdict.btn_this_was_wrong")}
          icon={<RotateCcw size={22} />}
          onClick={handleThisWasWrong}
          speechText={t("l8_verdict.btn_this_was_wrong")}
        />

        {/* 6. Already paid? Get help */}
        <TrustButton
          variant="accent"
          label={t("l8_verdict.btn_already_paid")}
          icon={<PhoneCall size={24} />}
          onClick={onAlreadyPaid}
          speechText={t("l8_verdict.btn_already_paid")}
        />

        {/* 7. Home */}
        <TrustButton
          variant="ghost"
          label={t("l8_verdict.btn_home")}
          icon={<Home size={24} />}
          onClick={onHome}
          speechText={t("l8_verdict.btn_home")}
        />
      </div>

      {/* Report Scam Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-sm p-5 shadow-2xl border border-border">
            <h3 className="text-heading text-charcoal mb-1">
              {t("l8_verdict.report_modal_title")}
            </h3>
            <p className="text-[14px] text-charcoal-secondary mb-3">
              {t("l8_verdict.report_modal_sub")}
            </p>

            {reportSubmitted ? (
              <div className="p-4 bg-teal-light text-teal-deep rounded-xl text-center font-bold">
                {t("l8_verdict.report_thanks")}
              </div>
            ) : (
              <>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder={t("l8_verdict.report_reason_placeholder")}
                  className="w-full p-3 rounded-xl border border-border bg-cream/30 text-[16px] text-charcoal mb-3 focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 rounded-btn bg-cream-dark text-charcoal font-semibold text-[15px]"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleSendReport}
                    className="flex-1 py-2.5 rounded-btn bg-teal-deep text-white font-semibold text-[15px]"
                  >
                    {t("l8_verdict.submit_report")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
