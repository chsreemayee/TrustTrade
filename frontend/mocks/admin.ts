export interface ScamRule {
  id: string;
  code: string;
  pattern: string;
  languages: string[];
  weight: number; // 2 | 1 | 0.5
  is_always_scam: boolean;
  lesson_id: string;
  active: boolean;
}

export interface ReviewItem {
  id: string;
  check_id: string;
  reported_text: string;
  reason: string;
  status: "open" | "approved" | "dismissed";
  timestamp: string;
}

export interface AdminStats {
  total_checks: number;
  scams_caught: number;
  active_learners: number;
  drills_played: number;
  sebi_records_count: number;
  sebi_last_refresh: string;
}

export const MOCK_SCAM_RULES: ScamRule[] = [
  {
    id: "rule-1",
    code: "GUARANTEED_RETURN",
    pattern: "guaranteed returns|100% profit|assured return|డబుల్ మనీ|पक्का मुनाफा|ಖಚಿತ ಲಾಭ|உத்தரவாத லாபம்|ഉറപ്പായ ലാഭം",
    languages: ["te", "hi", "en", "kn", "ta", "ml"],
    weight: 2,
    is_always_scam: true,
    lesson_id: "scam_guaranteed_returns",
    active: true,
  },
  {
    id: "rule-2",
    code: "PERSONAL_UPI",
    pattern: "@okaxis|@okhdfcbank|@paytm personal handle format",
    languages: ["te", "hi", "en", "kn", "ta", "ml"],
    weight: 2,
    is_always_scam: false,
    lesson_id: "scam_vip_groups",
    active: true,
  },
  {
    id: "rule-3",
    code: "DOWNLOAD_APK",
    pattern: ".apk|download app from link|డౌన్‌లోడ్ లింక్|ऐप लिंक",
    languages: ["te", "hi", "en", "kn", "ta", "ml"],
    weight: 2,
    is_always_scam: true,
    lesson_id: "scam_fake_apps",
    active: true,
  },
  {
    id: "rule-4",
    code: "URGENT_ACTION",
    pattern: "last 5 seats|only today|త్వరపడండి|सीमित सीटें|ಕೊನೆಯ ಅವಕಾಶ|கடைசி வாய்ப்பு|അവസാന അവസരം",
    languages: ["te", "hi", "en", "kn", "ta", "ml"],
    weight: 1,
    is_always_scam: false,
    lesson_id: "scam_vip_groups",
    active: true,
  },
  {
    id: "rule-5",
    code: "VIP_TELEGRAM",
    pattern: "VIP channel|insider trading|జాక్‌పాట్ షేర్లు|जैकपॉट शेयर",
    languages: ["te", "hi", "en", "kn", "ta", "ml"],
    weight: 1,
    is_always_scam: false,
    lesson_id: "scam_vip_groups",
    active: true,
  },
];

export const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    check_id: "chk-8921-scam",
    reported_text: "Join VIP telegram channel, pay ₹5,000 to personal UPI for jackpot tips with 100% assured return.",
    reason: "User flagged as urgent scam circulating in SHG WhatsApp group.",
    status: "open",
    timestamp: "2026-11-20 11:42",
  },
  {
    id: "rev-2",
    check_id: "chk-7712-borderline",
    reported_text: "Claiming to be SEBI registered analyst asking ₹500 entry fee on bit.ly link.",
    reason: "Verdict gave 'Be careful' but user claims it's an active fraud group.",
    status: "open",
    timestamp: "2026-11-20 10:15",
  },
  {
    id: "rev-3",
    check_id: "chk-4421-careful",
    reported_text: "Government subsidy scheme stock gift link.",
    reason: "False claim using Prime Minister scheme name.",
    status: "approved",
    timestamp: "2026-11-19 16:30",
  },
];

export const MOCK_ADMIN_STATS: AdminStats = {
  total_checks: 1842,
  scams_caught: 1320,
  active_learners: 512,
  drills_played: 4620,
  sebi_records_count: 14820,
  sebi_last_refresh: "2026-11-20 06:00 AM",
};
