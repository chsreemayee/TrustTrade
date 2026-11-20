"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Mic,
  ArrowRight,
  Volume2,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  TrendingDown,
  Coins,
  Shield,
  X,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Lesson } from "../../mocks/lessons";
import { TrustButton } from "../TrustButton";
import { startSpeechRecognition } from "../../lib/speech";

interface L12LessonPlayerProps {
  lesson: Lesson;
  onBack: () => void;
  onStartQuiz: () => void;
}

export const L12LessonPlayer: React.FC<L12LessonPlayerProps> = ({
  lesson,
  onBack,
  onStartQuiz,
}) => {
  const { t, speak, stopSpeak, isSpeaking, lang } = useI18n();
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [tutorReply, setTutorReply] = useState<string | null>(null);
  const [isListeningQuestion, setIsListeningQuestion] = useState(false);

  const scenes = lesson.scenes;
  const currentScene = scenes[currentSceneIdx] || scenes[0];

  const playSceneAudio = () => {
    const caption = currentScene.caption[lang] || currentScene.caption.en || "";
    const script = currentScene.script[lang] || currentScene.script.en || "";
    speak(`${caption}. ${script}`);
    setIsPlaying(true);
  };

  useEffect(() => {
    playSceneAudio();
  }, [currentSceneIdx]);

  const handleTogglePlay = () => {
    if (isSpeaking) {
      stopSpeak();
      setIsPlaying(false);
    } else {
      playSceneAudio();
    }
  };

  const handleNextScene = () => {
    if (currentSceneIdx < scenes.length - 1) {
      setCurrentSceneIdx(currentSceneIdx + 1);
    } else {
      if (lesson.quiz && lesson.quiz.length > 0) {
        onStartQuiz();
      } else {
        onBack();
      }
    }
  };

  const handleReplay = () => {
    setCurrentSceneIdx(0);
    playSceneAudio();
  };

  const handleAskMic = () => {
    setIsListeningQuestion(true);
    startSpeechRecognition(lang, {
      onResult: (transcript) => {
        setIsListeningQuestion(false);
        setQuestionText(transcript);
        handleSendQuestion(transcript);
      },
      onError: () => setIsListeningQuestion(false),
      onEnd: () => setIsListeningQuestion(false),
    });
  };

  const handleSendQuestion = (q: string) => {
    const qLower = (q || questionText).toLowerCase();

    let reply = "";
    if (qLower.includes("buy") || qLower.includes("share") || qLower.includes("కొనాలా") || qLower.includes("खरीदूं")) {
      reply = t("l19_big_mic.stock_refusal");
    } else {
      reply =
        lang === "te"
          ? "ద్రవ్యోల్బణం వల్ల చేతిలోని నగదు విలువ తగ్గుతుంది. కాబట్టి సరైన డీమ్యాట్ ఖాతాతో సురక్షిత కంపెనీలలో మాత్రమే పెట్టుబడి నేర్చుకోవాలి."
          : lang === "hi"
          ? "महंगाई के कारण नकद पैसे की खरीदारी क्षमता घटती है। इसलिए अधिकृत डीमैट खाते से सुरक्षित तरीके से ही निवेश करें।"
          : "Inflation reduces cash purchasing power over time. Always start safely through SEBI registered brokers only.";
    }

    setTutorReply(reply);
    speak(reply);
  };

  // Helper to render SVG illustrations based on scene
  const renderIllustration = (type: string) => {
    return (
      <div className="w-full h-44 bg-teal-light/40 rounded-card flex flex-col items-center justify-center border-2 border-teal-deep/20 p-4">
        {type.includes("cash") ? (
          <Coins size={64} className="text-marigold" strokeWidth={1.8} />
        ) : type.includes("tomatoes") ? (
          <ShoppingBag size={64} className="text-verdict-scam-text" strokeWidth={1.8} />
        ) : type.includes("rising") ? (
          <TrendingDown size={64} className="text-verdict-careful-text" strokeWidth={1.8} />
        ) : (
          <Shield size={64} className="text-teal-deep" strokeWidth={1.8} />
        )}
        <span className="text-[14px] font-semibold text-charcoal-secondary mt-2">
          {lesson.title[lang] || lesson.title.en}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between min-h-screen p-4 pb-20 bg-cream">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
        >
          <ArrowLeft size={22} />
        </button>

        <span className="text-[15px] font-bold text-charcoal-secondary">
          {t("l12_lesson_player.scene_label", {
            current: currentSceneIdx + 1,
            total: scenes.length,
          })}
        </span>

        <button
          onClick={() => setShowAskModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-marigold text-charcoal font-bold text-[14px] shadow-sm"
        >
          <Mic size={16} />
          <span>{t("l12_lesson_player.btn_ask")}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4 my-auto">
        {/* Illustration */}
        {renderIllustration(currentScene.illustration_type)}

        {/* Caption Card */}
        <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-teal-light text-teal-deep">
              Scene {currentSceneIdx + 1}
            </span>
            <button
              onClick={() => playSceneAudio()}
              className="p-1 rounded-full text-teal-deep hover:bg-cream"
            >
              <Volume2 size={22} />
            </button>
          </div>

          <h3 className="text-heading text-charcoal leading-snug">
            {currentScene.caption[lang] || currentScene.caption.en}
          </h3>

          <p className="text-body text-charcoal-secondary leading-relaxed mt-1">
            {currentScene.script[lang] || currentScene.script.en}
          </p>
        </div>
      </div>

      {/* Media Player Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReplay}
            className="p-3 rounded-full bg-white border border-border text-charcoal shadow-sm hover:bg-cream-dark"
            aria-label={t("l12_lesson_player.btn_replay")}
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-16 h-16 rounded-full bg-teal-deep text-white flex items-center justify-center shadow-lg active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isSpeaking ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>

          <button
            onClick={handleNextScene}
            className="p-3 rounded-full bg-white border border-border text-teal-deep shadow-sm hover:bg-cream-dark"
            aria-label="Next"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {/* Next / Quiz Action */}
        <TrustButton
          variant={currentSceneIdx === scenes.length - 1 ? "accent" : "primary"}
          label={
            currentSceneIdx === scenes.length - 1
              ? lesson.quiz
                ? t("l12_lesson_player.btn_quiz")
                : t("common.back")
              : t("common.next")
          }
          icon={
            currentSceneIdx === scenes.length - 1 ? (
              <CheckCircle2 size={24} />
            ) : (
              <ArrowRight size={24} />
            )
          }
          onClick={handleNextScene}
        />
      </div>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-sm p-5 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-heading text-charcoal flex items-center gap-2">
                <HelpCircle size={22} className="text-teal-deep" />
                <span>{t("l12_lesson_player.ask_modal_title")}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAskModal(false);
                  setTutorReply(null);
                }}
                className="p-1 text-charcoal-secondary hover:text-charcoal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={t("l12_lesson_player.ask_placeholder")}
                className="flex-1 p-2.5 rounded-xl border border-border bg-cream/30 text-[16px] text-charcoal"
              />
              <button
                onClick={handleAskMic}
                className={`p-2.5 rounded-full border ${
                  isListeningQuestion
                    ? "bg-marigold text-charcoal animate-pulse"
                    : "bg-teal-light text-teal-deep"
                }`}
              >
                <Mic size={20} />
              </button>
            </div>

            {tutorReply && (
              <div className="p-3 bg-teal-light/50 border border-teal-deep/30 rounded-xl mb-3 text-[15px] text-charcoal leading-relaxed">
                <span className="font-bold text-teal-deep block mb-1">
                  Job-based Tutor (≤40 words):
                </span>
                {tutorReply}
              </div>
            )}

            <button
              onClick={() => handleSendQuestion(questionText)}
              className="w-full py-2.5 rounded-btn bg-teal-deep text-white font-semibold text-[16px]"
            >
              Ask Tutor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
