export interface Badge {
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  unlocked: boolean;
  earned_at?: string;
}

export const MOCK_BADGES: Badge[] = [
  {
    code: "first_check",
    name: { te: "మొదటి తనిఖీ", hi: "पहला चेक", en: "First Check", kn: "ಮೊದಲ ಪರಿಶೀಲನೆ", ta: "முதல் சோதனை", ml: "ആദ്യ പരിശോധന" },
    description: { te: "మీ మొదటి టిప్‌ను స్కామ్ చెక్ చేశారు", hi: "पहली बार निवेश टिप की जांच की", en: "Completed your first Scam Check", kn: "ಮೊದಲ ಬಾರಿಗೆ ಟಿಪ್ ಪರಿಶೀಲಿಸಿದ್ದೀರಿ", ta: "உங்கள் முதல் டிப் சரிபார்க்கப்பட்டது", ml: "ആദ്യത്തെ ടിപ്പ് പരിശോധിച്ചു" },
    icon: "ShieldCheck",
    unlocked: true,
    earned_at: "2026-11-20",
  },
  {
    code: "first_lesson",
    name: { te: "మొదటి పాఠం", hi: "पहला पाठ", en: "First Lesson", kn: "ಮೊದಲ ಪಾಠ", ta: "முதல் பாடம்", ml: "ആദ്യ പാഠം" },
    description: { te: "మొదటి కథా పాఠాన్ని పూర్తి చేశారు", hi: "पहला कहानी पाठ पूरा किया", en: "Finished your first story lesson", kn: "ಮೊದಲ ಕಥಾ ಪಾಠ ಮುಗಿಸಿದ್ದೀರಿ", ta: "முதல் கதை பாடத்தை முடித்தீர்கள்", ml: "ആദ്യ പാഠം പൂർത്തിയാക്കി" },
    icon: "BookOpen",
    unlocked: true,
    earned_at: "2026-11-20",
  },
  {
    code: "money_basics",
    name: { te: "డబ్బు మూలాలు", hi: "पैसे की समझ", en: "Money Basics", kn: "ಹಣದ ಮೂಲತತ್ವ", ta: "பண அடிப்படைகள்", ml: "പണത്തിന്റെ അടിസ്ഥാനങ്ങൾ" },
    description: { te: "మొత్తం 6 ప్రాథమిక పాఠాలు పూర్తి చేశారు", hi: "सभी 6 बुनियादी पाठ पूरे किए", en: "Finished all 6 foundational lessons", kn: "ಎಲ್ಲ 6 ಪಾಠಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ", ta: "அனைத்து 6 அடிப்படை பாடங்களையும் முடித்தீர்கள்", ml: "എല്ലാ 6 അടിസ്ഥാന പാഠങ്ങളും പൂർത്തിയാക്കി" },
    icon: "GraduationCap",
    unlocked: false,
  },
  {
    code: "scam_spotter",
    name: { te: "స్కామ్ పసిగట్టే నేర్పరి", hi: "स्कैम खोजी", en: "Scam Spotter", kn: "ವಂಚನೆ ಪತ್ತೆದಾರ", ta: "மோசடி கண்டுபிடிப்பாளர்", ml: "തട്ടിപ്പ് കണ്ടുപിടിക്കുന്നയാൾ" },
    description: { te: "5 డ్రిల్స్‌లో సరైన సమాధానం చెప్పారు", hi: "5 ड्रिल्स में सही जवाब पहचाना", en: "Correctly identified 5 drills", kn: "5 ಡ್ರಿಲ್‌ಗಳಲ್ಲಿ ಸರಿಯಾಗಿ ಉತ್ತರಿಸಿದ್ದೀರಿ", ta: "5 பயிற்சிகளில் சரியான விடை அளித்தீர்கள்", ml: "5 ഡ്രില്ലുകൾ ശരിയായി കണ്ടെത്തി" },
    icon: "SearchCheck",
    unlocked: false,
  },
  {
    code: "sharp_eye",
    name: { te: "తీవ్ర నిఘా కన్ను", hi: "पारखी नज़र", en: "Sharp Eye", kn: "ಚುರುಕು ನೋಟ", ta: "கூர்மையான பார்வை", ml: "സൂക്ഷ്മ ദൃഷ്ടി" },
    description: { te: "వరుసగా 5 డ్రిల్స్‌లో సరైన సమాధానం చెప్పారు", hi: "लगातार 5 ड्रिल्स में सही जवाब दिए", en: "Identified 5 drills right in a row", kn: "ಸತತವಾಗಿ 5 ಡ್ರಿಲ್‌ಗಳನ್ನು ಸರಿಯಾಗಿ ಉತ್ತರಿಸಿದ್ದೀರಿ", ta: "தொடர்ந்து 5 பயிற்சிகளில் வென்றீர்கள்", ml: "തുടർച്ചയായി 5 ഡ്രില്ലുകൾ ശരിയാക്കി" },
    icon: "Eye",
    unlocked: false,
  },
  {
    code: "first_trade",
    name: { te: "మొదటి ప్రాక్టీస్ కొనుగోలు", hi: "पहला ट्रेड", en: "First Trade", kn: "ಮೊದಲ ವಹಿವಾಟು", ta: "முதல் வர்த்தகம்", ml: "ആദ്യ വ്യാപാരം" },
    description: { te: "ప్రాక్టీస్ వాలెట్‌లో మొదటి షేర్ కొన్నారు", hi: "प्रैक्टिस वॉलेट में पहला शेयर खरीदा", en: "Made your first pretend buy", kn: "ಅಣಕು ವಾಲೆಟ್‌ನಲ್ಲಿ ಮೊದಲ ಷೇರು ಖರೀದಿಸಿದ್ದೀರಿ", ta: "பயிற்சி பணத்தில் முதல் பங்கு வாங்கினீர்கள்", ml: "ഡെമോ വാലറ്റിൽ ആദ്യ ഓഹരി വാങ്ങി" },
    icon: "TrendingUp",
    unlocked: false,
  },
  {
    code: "patient_investor",
    name: { te: "ఓర్పుగల పెట్టుబడిదారు", hi: "धैर्यवान निवेशक", en: "Patient Investor", kn: "ತಾಳ್ಮೆಯ ಹೂಡಿಕೆದಾರ", ta: "பொறுமையான முதலீட்டாளர்", ml: "ക്ഷമയുള്ള നിക്ഷേപകൻ" },
    description: { te: "ఒక షేరును 7 రోజులు ఉంచుకున్నారు", hi: "एक शेयर को 7 दिनों तक संभाल कर रखा", en: "Held a pretend share for 7 days", kn: "ಒಂದು ಷೇರನ್ನು 7 ದಿನಗಳವರೆಗೆ ಇಟ್ಟುಕೊಂಡಿದ್ದೀರಿ", ta: "ஒரு பங்கை 7 நாட்கள் வைத்திருந்தீர்கள்", ml: "ഒരു ഓഹരി 7 ദിവസം കൈവശം വെച്ചു" },
    icon: "CalendarCheck",
    unlocked: false,
  },
  {
    code: "protector",
    name: { te: "రక్షకుడు", hi: "सुरक्षा प्रहरी", en: "Protector", kn: "ರಕ್ಷಕ", ta: "பாதுகாவலர்", ml: "സംരക്ഷകൻ" },
    description: { te: "ఇతరులను రక్షించడానికి మోసాన్ని రిపోర్ట్ చేశారు", hi: "दूसरों को बचाने के लिए स्कैम की रिपोर्ट की", en: "Reported a scam to alert the community", kn: "ಇತರರನ್ನು ರಕ್ಷಿಸಲು ವಂಚನೆ ವರದಿ ಮಾಡಿದ್ದೀರಿ", ta: "பிறரை காக்க மோசடியை புகாரளித்தீர்கள்", ml: "മറ്റുള്ളവരെ സംരക്ഷിക്കാൻ തട്ടിപ്പ് റിപ്പോർട്ട് ചെയ്തു" },
    icon: "AlertOctagon",
    unlocked: false,
  },
];

export function getLevelInfo(badgesCount: number): {
  levelKey: "beginner" | "learner" | "guardian";
  title: Record<string, string>;
  minBadges: number;
  maxBadges: number;
} {
  if (badgesCount <= 2) {
    return {
      levelKey: "beginner",
      title: { te: "ప్రారంభకుడు", hi: "शुरुआती", en: "Beginner", kn: "ಆರಂಭಿಕ", ta: "தொடக்கநிலை", ml: "തുടക്കക്കാരൻ" },
      minBadges: 0,
      maxBadges: 2,
    };
  } else if (badgesCount <= 5) {
    return {
      levelKey: "learner",
      title: { te: "నేర్చుకునేవారు", hi: "सीखने वाला", en: "Learner", kn: "ಕಲಿಯುವವ", ta: "கற்பவர்", ml: "പഠിതാവ്" },
      minBadges: 3,
      maxBadges: 5,
    };
  } else {
    return {
      levelKey: "guardian",
      title: { te: "సంరక్షకుడు", hi: "गार्जियन (रक्षक)", en: "Guardian", kn: "ರಕ್ಷಕ", ta: "பாதுகாவலர்", ml: "ഗാർഡിയൻ" },
      minBadges: 6,
      maxBadges: 8,
    };
  }
}
