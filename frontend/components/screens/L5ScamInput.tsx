"use client";

import React, { useState } from "react";
import {
  Mic,
  FileText,
  Camera,
  Link2,
  CheckCircle,
  XCircle,
  Volume2,
  Upload,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";
import { BigMicButton } from "../BigMicButton";

interface L5ScamInputProps {
  initialText?: string;
  onProceed: (inputData: {
    type: "voice" | "text" | "screenshot" | "link";
    text: string;
    urlOrUpi?: string;
    fileName?: string;
  }) => void;
  onCancel: () => void;
}

export const L5ScamInput: React.FC<L5ScamInputProps> = ({
  initialText = "",
  onProceed,
  onCancel,
}) => {
  const { t, speak, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<"mic" | "type" | "photo" | "link">("mic");
  const [inputText, setInputText] = useState(initialText);
  const [linkOrUpi, setLinkOrUpi] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleMicTranscript = (transcript: string) => {
    setInputText(transcript);
    setActiveTab("type"); // switch to text view to review
    speak(`${t("l6_confirm.title")}: ${transcript}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      setInputText(`[Screenshot / QR Code: ${file.name}]`);
      speak(`${file.name} uploaded.`);
    }
  };

  const handleSampleClick = (sampleType: "scam" | "careful" | "real" | "unknown") => {
    if (sampleType === "scam") {
      const text =
        lang === "te"
          ? "నమస్కారం! మా VIP గ్రూప్‌లో చేరండి. నెలకు 20% గ్యారెంటీ లాభం. 30 రోజుల్లో డబ్బు రెట్టింపు. rahul89@okhdfcbank కి ₹5,000 పంపండి."
          : lang === "hi"
          ? "नमस्ते! हमारे वीआईपी ग्रुप में शामिल हों। हर महीने 20% पक्का मुनाफा। 30 दिनों में पैसा डबल। rahul89@okhdfcbank पर ₹5,000 भेजें।"
          : "Join our VIP stock group. 20% guaranteed monthly profit. Double your money in 30 days. Pay ₹5,000 to rahul89@okhdfcbank.";
      setInputText(text);
      setLinkOrUpi("rahul89@okhdfcbank");
      setActiveTab("type");
    } else if (sampleType === "careful") {
      const text =
        lang === "te"
          ? "జాక్‌పాట్ స్టాక్ నెలకు 15% లాభం. ఇప్పుడే చూడండి: https://bit.ly/fast-wealth-gain"
          : lang === "hi"
          ? "जैकपॉट शेयर टिप हर महीने 15% मुनाफा। अभी देखें: https://bit.ly/fast-wealth-gain"
          : "Jackpot stock 15% monthly profit. Check now: https://bit.ly/fast-wealth-gain";
      setInputText(text);
      setLinkOrUpi("https://bit.ly/fast-wealth-gain");
      setActiveTab("type");
    } else if (sampleType === "real") {
      const text =
        lang === "te"
          ? "SBI బ్యాంక్: మీ ఖాతా XX4589 లో ₹500 జమ అయ్యాయి. అందుబాటులో ఉన్న బ్యాలెన్స్ ₹3,420."
          : lang === "hi"
          ? "एसबीआई बैंक: खाता XX4589 में ₹500 जमा किए गए। उपलब्ध बैलेंस ₹3,420 है।"
          : "SBI Bank: A/C XX4589 credited by ₹500.00 via UPI. Avail Bal: ₹3,420.00.";
      setInputText(text);
      setActiveTab("type");
    } else {
      setInputText("Short tip");
      setActiveTab("type");
    }
  };

  const handleCheck = () => {
    const textToCheck = inputText.trim() || linkOrUpi.trim() || (uploadedFile ? `Image: ${uploadedFile}` : "");
    if (!textToCheck) {
      speak(t("common.voice_error"));
      return;
    }

    onProceed({
      type: activeTab === "mic" ? "voice" : activeTab === "photo" ? "screenshot" : activeTab === "link" ? "link" : "text",
      text: textToCheck,
      urlOrUpi: linkOrUpi,
      fileName: uploadedFile || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 bg-cream min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-title text-charcoal">{t("l5_scam_input.title")}</h1>
          <p className="text-body text-charcoal-secondary">{t("l5_scam_input.sub")}</p>
        </div>
        <button
          onClick={() => speak(`${t("l5_scam_input.title")}. ${t("l5_scam_input.sub")}`)}
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-white rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("mic")}
          className={`flex flex-col items-center py-2 px-1 rounded-xl font-semibold text-[13px] transition-colors ${
            activeTab === "mic"
              ? "bg-teal-deep text-white shadow-sm"
              : "text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Mic size={20} className="mb-0.5" />
          <span>{t("l5_scam_input.mic_tab")}</span>
        </button>

        <button
          onClick={() => setActiveTab("type")}
          className={`flex flex-col items-center py-2 px-1 rounded-xl font-semibold text-[13px] transition-colors ${
            activeTab === "type"
              ? "bg-teal-deep text-white shadow-sm"
              : "text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <FileText size={20} className="mb-0.5" />
          <span>{t("l5_scam_input.type_tab")}</span>
        </button>

        <button
          onClick={() => setActiveTab("photo")}
          className={`flex flex-col items-center py-2 px-1 rounded-xl font-semibold text-[13px] transition-colors ${
            activeTab === "photo"
              ? "bg-teal-deep text-white shadow-sm"
              : "text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Camera size={20} className="mb-0.5" />
          <span>{t("l5_scam_input.screenshot_tab")}</span>
        </button>

        <button
          onClick={() => setActiveTab("link")}
          className={`flex flex-col items-center py-2 px-1 rounded-xl font-semibold text-[13px] transition-colors ${
            activeTab === "link"
              ? "bg-teal-deep text-white shadow-sm"
              : "text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Link2 size={20} className="mb-0.5" />
          <span>{t("l5_scam_input.link_tab")}</span>
        </button>
      </div>

      {/* Tab 1: Mic Input */}
      {activeTab === "mic" && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col items-center">
          <BigMicButton
            onTranscript={handleMicTranscript}
            label={t("l5_scam_input.mic_card_title")}
            subLabel={t("l5_scam_input.mic_card_sub")}
          />
        </div>
      )}

      {/* Tab 2: Type Input */}
      {activeTab === "type" && (
        <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-2">
          <label className="text-[16px] font-semibold text-charcoal">
            {t("l5_scam_input.type_placeholder")}
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("l5_scam_input.type_placeholder")}
            className="w-full p-3 rounded-xl border border-border bg-cream/40 text-[17px] focus:outline-none focus:ring-2 focus:ring-teal-deep text-charcoal"
          />
        </div>
      )}

      {/* Tab 3: Screenshot / QR Code */}
      {activeTab === "photo" && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-teal-light text-teal-deep flex items-center justify-center mb-3">
            <Upload size={32} />
          </div>
          <h3 className="text-heading text-charcoal">
            {t("l5_scam_input.upload_box_title")}
          </h3>
          <p className="text-body text-charcoal-secondary mt-1">
            {t("l5_scam_input.upload_box_sub")}
          </p>

          <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-btn bg-teal-deep text-white font-semibold shadow-sm hover:bg-teal-hover active:scale-95 transition-transform">
            <Camera size={22} />
            <span>{t("l5_scam_input.screenshot_tab")}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {uploadedFile && (
            <div className="mt-3 p-2 bg-teal-light text-teal-deep rounded-lg text-[15px] font-medium flex items-center gap-2">
              <CheckCircle size={18} />
              <span>{uploadedFile}</span>
            </div>
          )}

          <p className="text-[13px] text-charcoal-secondary mt-4 border-t border-border pt-3">
            {t("l5_scam_input.upload_privacy_note")}
          </p>
        </div>
      )}

      {/* Tab 4: Link / UPI */}
      {activeTab === "link" && (
        <div className="bg-white rounded-card p-4 border border-border shadow-card flex flex-col gap-3">
          <label className="text-[16px] font-semibold text-charcoal">
            {t("l5_scam_input.link_placeholder")}
          </label>
          <input
            type="text"
            value={linkOrUpi}
            onChange={(e) => setLinkOrUpi(e.target.value)}
            placeholder={t("l5_scam_input.link_placeholder")}
            className="w-full p-3 rounded-xl border border-border bg-cream/40 text-[17px] focus:outline-none focus:ring-2 focus:ring-teal-deep text-charcoal"
          />
        </div>
      )}

      {/* Quick Testing Samples */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card">
        <div className="text-[15px] font-bold text-charcoal mb-2">
          {t("l5_scam_input.quick_samples_title")}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSampleClick("scam")}
            className="text-left p-2.5 rounded-xl border border-verdict-scam-border bg-verdict-scam-bg text-verdict-scam-text text-[15px] font-medium hover:brightness-95 flex items-center justify-between"
          >
            <span>{t("l5_scam_input.sample_scam_vip")}</span>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-white/70">Scam</span>
          </button>

          <button
            type="button"
            onClick={() => handleSampleClick("careful")}
            className="text-left p-2.5 rounded-xl border border-verdict-careful-border bg-verdict-careful-bg text-verdict-careful-text text-[15px] font-medium hover:brightness-95 flex items-center justify-between"
          >
            <span>{t("l5_scam_input.sample_careful")}</span>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-white/70">Careful</span>
          </button>

          <button
            type="button"
            onClick={() => handleSampleClick("real")}
            className="text-left p-2.5 rounded-xl border border-verdict-no_signs-border bg-verdict-no_signs-bg text-verdict-no_signs-text text-[15px] font-medium hover:brightness-95 flex items-center justify-between"
          >
            <span>{t("l5_scam_input.sample_real")}</span>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-white/70">Safe alert</span>
          </button>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <TrustButton
          variant="primary"
          label={t("l5_scam_input.check_btn")}
          icon={<CheckCircle size={26} strokeWidth={2.2} />}
          onClick={handleCheck}
          speechText={t("l5_scam_input.check_btn")}
        />

        <TrustButton
          variant="ghost"
          label={t("l5_scam_input.cancel_btn")}
          icon={<XCircle size={24} />}
          onClick={onCancel}
          speechText={t("l5_scam_input.cancel_btn")}
        />
      </div>
    </div>
  );
};
