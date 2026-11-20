"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Phone,
  KeyRound,
  User,
  Briefcase,
  Mic,
  ArrowRight,
  Volume2,
  CheckCircle,
  Car,
  Store,
  Hammer,
  Home as HomeIcon,
  Sprout,
  ShoppingBag,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";
import { startSpeechRecognition } from "../../lib/speech";

interface L4SaveProgressProps {
  onSuccess: (profile: { name: string; phone: string; job: string }) => void;
  onLater: () => void;
}

export const L4SaveProgress: React.FC<L4SaveProgressProps> = ({
  onSuccess,
  onLater,
}) => {
  const { t, speak, lang } = useI18n();
  const [step, setStep] = useState<"prompt" | "phone" | "otp" | "profile">("prompt");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [selectedJob, setSelectedJob] = useState("vegetable_seller");
  const [isListeningName, setIsListeningName] = useState(false);

  const jobOptions = [
    {
      id: "vegetable_seller",
      labelKey: "l4_login.job_vegetable_seller",
      icon: <ShoppingBag size={28} className="text-teal-deep" />,
    },
    {
      id: "driver",
      labelKey: "l4_login.job_driver",
      icon: <Car size={28} className="text-teal-deep" />,
    },
    {
      id: "farmer",
      labelKey: "l4_login.job_farmer",
      icon: <Sprout size={28} className="text-teal-deep" />,
    },
    {
      id: "shopkeeper",
      labelKey: "l4_login.job_shopkeeper",
      icon: <Store size={28} className="text-teal-deep" />,
    },
    {
      id: "daily_wage",
      labelKey: "l4_login.job_daily_wage",
      icon: <Hammer size={28} className="text-teal-deep" />,
    },
    {
      id: "homemaker",
      labelKey: "l4_login.job_homemaker",
      icon: <HomeIcon size={28} className="text-teal-deep" />,
    },
  ];

  const handleNameMic = () => {
    setIsListeningName(true);
    startSpeechRecognition(lang, {
      onResult: (transcript) => {
        setIsListeningName(false);
        if (transcript) {
          setName(transcript);
          speak(transcript);
        }
      },
      onError: () => setIsListeningName(false),
      onEnd: () => setIsListeningName(false),
    });
  };

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      speak("OTP sent to mobile");
      setStep("otp");
    } else {
      speak("Please enter 10 digit mobile number");
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) {
      speak("OTP verified. Please tell your name and work.");
      setStep("profile");
    } else {
      speak("Please enter valid OTP");
    }
  };

  const handleComplete = () => {
    const profile = {
      name: name || "Learner",
      phone: phone || "9876543210",
      job: selectedJob,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("trusttrade_user_profile", JSON.stringify(profile));
    }
    speak(t("l4_login.saved_success"));
    onSuccess(profile);
  };

  return (
    <div className="flex flex-col min-h-[720px] p-4 bg-cream justify-between pb-10">
      {/* Header */}
      <div className="pt-2 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-light text-teal-deep flex items-center justify-center mx-auto mb-3 shadow-card">
          <ShieldCheck size={36} strokeWidth={2.2} />
        </div>
        <h1 className="text-title text-charcoal">{t("l4_login.prompt_heading")}</h1>
        <p className="text-body text-charcoal-secondary mt-1 max-w-[300px] mx-auto">
          {t("l4_login.prompt_sub")}
        </p>
      </div>

      {/* Step 1: Prompt */}
      {step === "prompt" && (
        <div className="flex flex-col gap-3 my-auto">
          <TrustButton
            variant="primary"
            label={t("l4_login.save_btn")}
            icon={<CheckCircle size={26} />}
            onClick={() => setStep("phone")}
            speechText={t("l4_login.save_btn")}
          />
          <TrustButton
            variant="ghost"
            label={t("l4_login.later_btn")}
            onClick={onLater}
            speechText={t("l4_login.later_btn")}
          />
        </div>
      )}

      {/* Step 2: Phone */}
      {step === "phone" && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-4 my-auto">
          <div className="flex items-center justify-between">
            <label className="text-heading text-charcoal flex items-center gap-2">
              <Phone size={22} className="text-teal-deep" />
              <span>{t("l4_login.phone_title")}</span>
            </label>
            <button
              onClick={() => speak(t("l4_login.phone_title"))}
              className="p-1 rounded-full text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-cream/40 rounded-xl border border-border">
            <span className="font-bold text-charcoal text-[18px]">+91</span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder={t("l4_login.phone_placeholder")}
              className="w-full bg-transparent text-[20px] font-bold text-charcoal focus:outline-none"
            />
          </div>

          <TrustButton
            variant="primary"
            label={t("l4_login.send_otp")}
            icon={<ArrowRight size={24} />}
            onClick={handleSendOtp}
            speechText={t("l4_login.send_otp")}
          />
        </div>
      )}

      {/* Step 3: OTP */}
      {step === "otp" && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-4 my-auto">
          <div className="flex items-center justify-between">
            <label className="text-heading text-charcoal flex items-center gap-2">
              <KeyRound size={22} className="text-teal-deep" />
              <span>{t("l4_login.otp_title")}</span>
            </label>
            <button
              onClick={() => speak(t("l4_login.otp_title"))}
              className="p-1 rounded-full text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>

          <input
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="w-full p-3 rounded-xl border border-border bg-cream/40 text-[24px] font-bold text-center tracking-widest text-charcoal focus:outline-none"
          />

          <TrustButton
            variant="primary"
            label={t("l4_login.verify_otp")}
            icon={<CheckCircle size={24} />}
            onClick={handleVerifyOtp}
            speechText={t("l4_login.verify_otp")}
          />
        </div>
      )}

      {/* Step 4: Name + 6 Job Icons */}
      {step === "profile" && (
        <div className="flex flex-col gap-4 my-auto">
          {/* Name input with Mic */}
          <div className="bg-white rounded-card p-4 border border-border shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[17px] text-charcoal flex items-center gap-2">
                <User size={20} className="text-teal-deep" />
                <span>{t("l4_login.name_prompt")}</span>
              </span>
              <button
                type="button"
                onClick={handleNameMic}
                className={`p-2 rounded-full border ${
                  isListeningName
                    ? "bg-marigold text-charcoal animate-pulse"
                    : "bg-teal-light text-teal-deep"
                }`}
              >
                <Mic size={20} />
              </button>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("l4_login.name_placeholder")}
              className="w-full p-2.5 rounded-xl border border-border bg-cream/30 text-[18px] text-charcoal"
            />
          </div>

          {/* 6 Job Icons Grid */}
          <div className="bg-white rounded-card p-4 border border-border shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[17px] text-charcoal flex items-center gap-2">
                <Briefcase size={20} className="text-teal-deep" />
                <span>{t("l4_login.job_prompt")}</span>
              </span>
              <button
                onClick={() => speak(t("l4_login.job_prompt"))}
                className="p-1 rounded-full text-teal-deep"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {jobOptions.map((job) => {
                const isSelected = selectedJob === job.id;
                const label = t(job.labelKey);

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setSelectedJob(job.id);
                      speak(label);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-teal-light border-teal-deep text-teal-deep font-bold"
                        : "bg-cream/40 border-border text-charcoal font-medium hover:bg-cream"
                    }`}
                  >
                    <div className="flex-shrink-0">{job.icon}</div>
                    <span className="text-[14px] leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <TrustButton
            variant="primary"
            label={t("common.save")}
            icon={<CheckCircle size={26} />}
            onClick={handleComplete}
            speechText={t("common.save")}
          />
        </div>
      )}

      {/* Compliance Notice */}
      <div className="text-[13px] text-charcoal-secondary text-center px-4">
        TrustTrade complies with India's DPDP Act, 2023. You can delete your data at any time from your profile.
      </div>
    </div>
  );
};
