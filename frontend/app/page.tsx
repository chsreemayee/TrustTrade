"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav, TabKey } from "../components/BottomNav";
import { MobileShell } from "../components/MobileShell";
import { L1LanguagePicker } from "../components/screens/L1LanguagePicker";
import { L2SpokenTour } from "../components/screens/L2SpokenTour";
import { L3Home } from "../components/screens/L3Home";
import { L4SaveProgress } from "../components/screens/L4SaveProgress";
import { L5ScamInput } from "../components/screens/L5ScamInput";
import { L6Confirm } from "../components/screens/L6Confirm";
import { L7Checking } from "../components/screens/L7Checking";
import { L8Verdict } from "../components/screens/L8Verdict";
import { L9VerdictDetails } from "../components/screens/L9VerdictDetails";
import { L10GetHelp } from "../components/screens/L10GetHelp";
import { L11LearnHome } from "../components/screens/L11LearnHome";
import { L12LessonPlayer } from "../components/screens/L12LessonPlayer";
import { L13Quiz } from "../components/screens/L13Quiz";
import { L14PracticeWallet } from "../components/screens/L14PracticeWallet";
import { L15CompanyPage } from "../components/screens/L15CompanyPage";
import { L16BuySell } from "../components/screens/L16BuySell";
import { L17ScamDrill } from "../components/screens/L17ScamDrill";
import { L18BadgesProfile } from "../components/screens/L18BadgesProfile";
import { L19BigMicAnswer } from "../components/screens/L19BigMicAnswer";
import { MOCK_VERDICTS, ScamCheckVerdict } from "../mocks/scam_checks";
import { MOCK_LESSONS, Lesson } from "../mocks/lessons";
import { MOCK_COMPANIES, Company } from "../mocks/companies";
import { api, UserWallet } from "../lib/api";
import { useI18n, LanguageCode } from "../lib/i18n";

export type ActiveScreen =
  | "l1_language"
  | "l2_tour"
  | "l3_home"
  | "l4_login"
  | "l5_scam_input"
  | "l6_confirm"
  | "l7_checking"
  | "l8_verdict"
  | "l9_details"
  | "l10_help"
  | "l11_learn"
  | "l12_lesson_player"
  | "l13_quiz"
  | "l14_practice"
  | "l15_company"
  | "l16_buy_sell"
  | "l17_drill"
  | "l18_badges"
  | "l19_big_mic";

export default function AppRoot() {
  const { lang, t, speak } = useI18n();

  // Screen & Tab navigation
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>("l1_language");
  const [currentTab, setCurrentTab] = useState<TabKey>("home");

  // Data states
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(MOCK_LESSONS[0]);
  const [selectedCompany, setSelectedCompany] = useState<Company>(MOCK_COMPANIES[0]);
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [wallet, setWallet] = useState<UserWallet>({ cash: 10000, holdings: [], sim_days_forwarded: 0 });
  const [prefilledInputText, setPrefilledInputText] = useState("");
  const [micQuestionText, setMicQuestionText] = useState("");

  const [activeVerdict, setActiveVerdict] = useState<ScamCheckVerdict>(
    MOCK_VERDICTS.vip_double_money
  );

  useEffect(() => {
    // Refresh wallet on mount
    api.getWallet().then(setWallet);
  }, []);

  // L1 Language Selected -> Open L2 Tour or Home
  const handleLanguageSelected = (selectedLang: LanguageCode) => {
    speak(t("l1_picker.welcome_spoken"));
    setCurrentScreen("l2_tour");
  };

  // L2 Spoken Tour Finish
  const handleFinishTour = () => {
    setCurrentScreen("l3_home");
    setCurrentTab("home");
  };

  // Home Navigation
  const handleHomeNavigate = (screenName: string, params?: any) => {
    if (screenName === "scam_check") {
      setPrefilledInputText(params?.prefillText || "");
      setCurrentScreen("l5_scam_input");
      setCurrentTab("scam_check");
    } else if (screenName === "learn") {
      setCurrentScreen("l11_learn");
      setCurrentTab("learn");
    } else if (screenName === "practice") {
      api.getWallet().then(setWallet);
      setCurrentScreen("l14_practice");
      setCurrentTab("practice");
    } else if (screenName === "drill") {
      setCurrentScreen("l17_drill");
      setCurrentTab("drill");
    } else if (screenName === "lesson_player") {
      const found = MOCK_LESSONS.find((l) => l.id === params?.lessonId) || MOCK_LESSONS[0];
      setSelectedLesson(found);
      setCurrentScreen("l12_lesson_player");
      setCurrentTab("learn");
    }
  };

  // Home Big Mic -> L19 Big Mic Answer (or L5 if tip)
  const handleHomeMicTranscript = (transcript: string) => {
    const lower = transcript.toLowerCase();
    if (
      lower.includes("double") ||
      lower.includes("guaranteed") ||
      lower.includes("whatsapp") ||
      lower.includes("మోసం") ||
      lower.includes("దోగునా")
    ) {
      setPrefilledInputText(transcript);
      setCurrentScreen("l5_scam_input");
      setCurrentTab("scam_check");
    } else {
      setMicQuestionText(transcript);
      setCurrentScreen("l19_big_mic");
    }
  };

  // L5 -> L6 handler
  const handleProceedFromInput = async (inputData: {
    type: "voice" | "text" | "screenshot" | "link";
    text: string;
    urlOrUpi?: string;
  }) => {
    const verdictResult = await api.checkScamTip(inputData);
    setActiveVerdict(verdictResult);
    setCurrentScreen("l6_confirm");
  };

  // Bottom Nav Bar Selection
  const handleSelectTab = (tab: TabKey) => {
    setCurrentTab(tab);
    switch (tab) {
      case "home":
        setCurrentScreen("l3_home");
        break;
      case "learn":
        setCurrentScreen("l11_learn");
        break;
      case "practice":
        api.getWallet().then(setWallet);
        setCurrentScreen("l14_practice");
        break;
      case "scam_check":
        setPrefilledInputText("");
        setCurrentScreen("l5_scam_input");
        break;
      case "drill":
        setCurrentScreen("l17_drill");
        break;
      case "badges":
        setCurrentScreen("l18_badges");
        break;
    }
  };

  // Render the current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case "l1_language":
        return <L1LanguagePicker onLanguageSelected={handleLanguageSelected} />;

      case "l2_tour":
        return <L2SpokenTour onFinishTour={handleFinishTour} />;

      case "l3_home":
        return (
          <L3Home
            onNavigate={handleHomeNavigate}
            onMicTranscript={handleHomeMicTranscript}
          />
        );

      case "l4_login":
        return (
          <L4SaveProgress
            onSuccess={() => {
              setCurrentScreen("l18_badges");
              setCurrentTab("badges");
            }}
            onLater={() => {
              setCurrentScreen("l3_home");
              setCurrentTab("home");
            }}
          />
        );

      case "l5_scam_input":
        return (
          <L5ScamInput
            initialText={prefilledInputText}
            onProceed={handleProceedFromInput}
            onCancel={() => {
              setCurrentScreen("l3_home");
              setCurrentTab("home");
            }}
          />
        );

      case "l6_confirm":
        return (
          <L6Confirm
            details={activeVerdict.extracted_details}
            onConfirm={() => setCurrentScreen("l7_checking")}
            onReject={() => setCurrentScreen("l5_scam_input")}
          />
        );

      case "l7_checking":
        return (
          <L7Checking
            onComplete={() => {
              api.unlockBadge("first_check");
              setCurrentScreen("l8_verdict");
            }}
          />
        );

      case "l8_verdict":
        return (
          <L8Verdict
            verdictData={activeVerdict}
            onSeeDetails={() => setCurrentScreen("l9_details")}
            onLearnWhy={(lessonId) => {
              const matchedLesson =
                MOCK_LESSONS.find((l) => l.id === lessonId) || MOCK_LESSONS[2];
              setSelectedLesson(matchedLesson);
              setCurrentScreen("l12_lesson_player");
              setCurrentTab("learn");
            }}
            onAlreadyPaid={() => setCurrentScreen("l10_help")}
            onHome={() => {
              setCurrentScreen("l3_home");
              setCurrentTab("home");
            }}
          />
        );

      case "l9_details":
        return (
          <L9VerdictDetails
            verdictData={activeVerdict}
            onBack={() => setCurrentScreen("l8_verdict")}
          />
        );

      case "l10_help":
        return (
          <L10GetHelp onBack={() => setCurrentScreen("l8_verdict")} />
        );

      case "l11_learn":
        return (
          <L11LearnHome
            onSelectLesson={(lessonId) => {
              const l = MOCK_LESSONS.find((item) => item.id === lessonId) || MOCK_LESSONS[0];
              setSelectedLesson(l);
              setCurrentScreen("l12_lesson_player");
            }}
          />
        );

      case "l12_lesson_player":
        return (
          <L12LessonPlayer
            lesson={selectedLesson}
            onBack={() => setCurrentScreen("l11_learn")}
            onStartQuiz={() => setCurrentScreen("l13_quiz")}
          />
        );

      case "l13_quiz":
        return (
          <L13Quiz
            questions={selectedLesson.quiz || MOCK_LESSONS[0].quiz || []}
            onFinish={() => {
              setCurrentScreen("l11_learn");
              setCurrentTab("learn");
            }}
            onRetakeLesson={() => setCurrentScreen("l12_lesson_player")}
          />
        );

      case "l14_practice":
        return (
          <L14PracticeWallet
            onSelectCompany={(company) => {
              setSelectedCompany(company);
              setCurrentScreen("l15_company");
            }}
          />
        );

      case "l15_company":
        const userHolding = wallet.holdings.find(
          (h) => h.ticker === selectedCompany.ticker
        );
        return (
          <L15CompanyPage
            company={selectedCompany}
            userOwnsShares={userHolding?.shares || 0}
            onBack={() => setCurrentScreen("l14_practice")}
            onOpenTrade={(mode) => {
              setTradeMode(mode);
              setCurrentScreen("l16_buy_sell");
            }}
          />
        );

      case "l16_buy_sell":
        const currentHolding = wallet.holdings.find(
          (h) => h.ticker === selectedCompany.ticker
        );
        return (
          <L16BuySell
            company={selectedCompany}
            mode={tradeMode}
            walletCash={wallet.cash}
            userOwnsShares={currentHolding?.shares || 0}
            onSuccess={async () => {
              const w = await api.getWallet();
              setWallet(w);
              setCurrentScreen("l14_practice");
            }}
            onCancel={() => setCurrentScreen("l15_company")}
          />
        );

      case "l17_drill":
        return <L17ScamDrill />;

      case "l18_badges":
        return (
          <L18BadgesProfile
            onChangeLanguage={() => setCurrentScreen("l1_language")}
            onChangeJob={() => setCurrentScreen("l4_login")}
            onLogout={() => {
              setCurrentScreen("l1_language");
              setCurrentTab("home");
            }}
          />
        );

      case "l19_big_mic":
        return (
          <L19BigMicAnswer
            question={micQuestionText}
            onLearnMoreLesson={(lessonId) => {
              const matched = MOCK_LESSONS.find((l) => l.id === lessonId) || MOCK_LESSONS[0];
              setSelectedLesson(matched);
              setCurrentScreen("l12_lesson_player");
              setCurrentTab("learn");
            }}
            onRouteToScamCheck={(tipText) => {
              setPrefilledInputText(tipText);
              setCurrentScreen("l5_scam_input");
              setCurrentTab("scam_check");
            }}
            onBack={() => {
              setCurrentScreen("l3_home");
              setCurrentTab("home");
            }}
          />
        );

      default:
        return (
          <L3Home
            onNavigate={handleHomeNavigate}
            onMicTranscript={handleHomeMicTranscript}
          />
        );
    }
  };

  const isFullScreenSplash = currentScreen === "l1_language" || currentScreen === "l2_tour";
  const showBottomNav = !isFullScreenSplash;

  return (
    <MobileShell isAdminView={false}>
      {!isFullScreenSplash && (
        <TopBar
          screenTitle={t("common.app_name")}
          onLanguageChangeRequested={() => setCurrentScreen("l1_language")}
        />
      )}

      <main className="w-full flex-1">{renderScreen()}</main>

      {showBottomNav && (
        <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
      )}
    </MobileShell>
  );
}
