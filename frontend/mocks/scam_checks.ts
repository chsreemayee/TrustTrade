export interface WarningSign {
  code: string;
  weight: number;
  evidence: string;
  source: string;
}

export interface VerificationCheck {
  name: string;
  status: "found" | "not_found" | "could_not_check";
  source: string;
  as_of: string;
}

export interface ScamCheckVerdict {
  check_id: string;
  verdict: "scam" | "careful" | "no_signs" | "could_not_check";
  score: number;
  always_rule: string | null;
  signs: WarningSign[];
  checks: VerificationCheck[];
  explanation: Record<string, string>; // per language
  what_to_do: Record<string, string[]>; // per language
  lesson_id: string;
  extracted_details: {
    sender: string;
    amount: string;
    promised_return: string;
    payment_mode: string;
    links_or_upi: string;
  };
}

export const MOCK_VERDICTS: Record<string, ScamCheckVerdict> = {
  // Scenario 1: VIP Stock Group / Double Money (SCAM)
  vip_double_money: {
    check_id: "chk-8921-scam",
    verdict: "scam",
    score: 5.0,
    always_rule: "Send money and get it doubled in 30 days",
    signs: [
      {
        code: "GUARANTEED_RETURN",
        weight: 2,
        evidence: "Double money guaranteed in 30 days",
        source: "TrustTrade rules",
      },
      {
        code: "PERSONAL_UPI",
        weight: 2,
        evidence: "Pay to rahul89@okhdfcbank",
        source: "UPI ID rules",
      },
      {
        code: "TELEGRAM_VIP",
        weight: 1,
        evidence: "Join secret VIP insider group",
        source: "TrustTrade phrase rules",
      },
    ],
    checks: [
      {
        name: "SEBI Registered Intermediary",
        status: "not_found",
        source: "SEBI list, checked 20 Nov 2026",
        as_of: "2026-11-20",
      },
      {
        name: "UPI Handle Classification",
        status: "not_found",
        source: "NPCI Merchant Registry",
        as_of: "2026-11-20",
      },
      {
        name: "NSE ASM/GSM Surveillance",
        status: "could_not_check",
        source: "NSE Surveillance (Coming soon)",
        as_of: "2026-11-20",
      },
    ],
    explanation: {
      te: "ఇది స్పష్టమైన మోసం. 30 రోజుల్లో డబ్బు రెట్టింపు చేస్తామని వాగ్దానం చేస్తున్నారు మరియు వ్యక్తిగత UPI కి చెల్లించమంటున్నారు. ఈ వ్యక్తి SEBI లో నమోదు కాలేదు.",
      hi: "यह स्पष्ट रूप से धोखाधड़ी (स्कैम) है। 30 दिनों में पैसा दोगुना करने का झूठा वादा किया गया है और व्यक्तिगत यूपीआई पर पैसे मांगे हैं। यह सेबी में पंजीकृत नहीं है।",
      en: "This message has all signs of a scam. Guaranteed double returns in 30 days and asking money into a personal UPI ID. This sender is not registered with SEBI.",
      kn: "ಇದು ಸಂಪೂರ್ಣ ವಂಚನೆಯ ಲಕ್ಷಣವಾಗಿದೆ. 30 ದಿನಗಳಲ್ಲಿ ಹಣ ದ್ವಿಗುಣಗೊಳಿಸುವ ಆಮಿಷವೊಡ್ಡಲಾಗಿದೆ ಮತ್ತು ವೈಯಕ್ತಿಕ UPI ಗೆ ಹಣ ಕೇಳುತ್ತಿದ್ದಾರೆ. ಇವರು ಸೆಬಿಯಲ್ಲಿ ನೋಂದಾಯಿತರಲ್ಲ.",
      ta: "இது மோசடி போல தெரிகிறது. 30 நாட்களில் பணம் இரட்டிப்பாகும் என்ற வாக்குறுதி மற்றும் தனிநபர் UPI-க்கு பணம் கேட்கிறார்கள். இவர் SEBI-யில் பதிவு செய்யப்படவில்லை.",
      ml: "ഇത് കബളിപ്പിക്കലാണ്. 30 ദിവസത്തിനുള്ളിൽ പണം ഇരട്ടിയാക്കുമെന്ന് വാഗ്ദാനം നൽകുകയും വ്യക്തിഗത UPI-ലേക്ക് പണം ആവശ്യപ്പെടുകയും ചെയ്യുന്നു. ഇയാൾ സെബിയിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല.",
    },
    what_to_do: {
      te: [
        "డబ్బులు ఎవరికీ పంపవద్దు.",
        "ఈ నంబరును బ్లాక్ చేయండి మరియు రిపోర్ట్ చేయండి.",
        "మీరు ఇప్పటికే చెల్లించి ఉంటే, వెంటనే 1930 కు ఫోన్ చేయండి.",
      ],
      hi: [
        "कोई पैसा न भेजें।",
        "इस नंबर या ग्रुप को तुरंत ब्लॉक और रिपोर्ट करें।",
        "यदि आपने पैसे भेज दिए हैं, तो तुरंत 1930 पर कॉल करें।",
      ],
      en: [
        "Do not send any money.",
        "Block and report this number immediately.",
        "If you already paid, call 1930 immediately.",
      ],
      kn: [
        "ಯಾವುದೇ ಹಣವನ್ನು ಕಳುಹಿಸಬೇಡಿ.",
        "ಈ ನಂಬರ್ ಅಥವಾ ಗ್ರೂಪ್ ಅನ್ನು ಬ್ಲಾಕ್ ಮಾಡಿ.",
        "ನೀವು ಈಗಾಗಲೇ ಹಣ ಪಾವತಿಸಿದ್ದರೆ, ತಕ್ಷಣ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
      ],
      ta: [
        "பணம் அனுப்ப வேண்டாம்.",
        "இந்த எண்ணை உடனே பிளாக் செய்து புகார் அளியுங்கள்.",
        "நீங்கள் ஏற்கனவே செலுத்தியிருந்தால், உடனே 1930 ஐ அழைக்கவும்.",
      ],
      ml: [
        "പണം അയക്കരുത്.",
        "ഈ നമ്പറും ഗ്രൂപ്പും ഉടൻ ബ്ലോക്ക് ചെയ്ത് റിപ്പോർട്ട് ചെയ്യുക.",
        "പണം അയച്ചിട്ടുണ്ടെങ്കിൽ, ഉടൻ 1930 എന്ന നമ്പറിൽ വിളിക്കുക.",
      ],
    },
    lesson_id: "scam_guaranteed_returns",
    extracted_details: {
      sender: "+91 98765 43210 (VIP Stock Club)",
      amount: "₹5,000",
      promised_return: "100% in 30 days",
      payment_mode: "Personal UPI ID",
      links_or_upi: "rahul89@okhdfcbank",
    },
  },

  // Scenario 2: High return promise but semi-official looking (CAREFUL)
  careful_high_return: {
    check_id: "chk-4421-careful",
    verdict: "careful",
    score: 1.5,
    always_rule: null,
    signs: [
      {
        code: "HIGH_RETURN",
        weight: 1,
        evidence: "Claims 15% guaranteed monthly profit on penny stock",
        source: "TrustTrade rules",
      },
      {
        code: "SHORT_LINK",
        weight: 0.5,
        evidence: "Uses bit.ly short link",
        source: "URL rules",
      },
    ],
    checks: [
      {
        name: "SEBI Registered Intermediary",
        status: "could_not_check",
        source: "SEBI list, checked 20 Nov 2026",
        as_of: "2026-11-20",
      },
      {
        name: "Domain Registration",
        status: "not_found",
        source: "Whois registry",
        as_of: "2026-11-20",
      },
    ],
    explanation: {
      te: "జాగ్రత్తగా ఉండండి! నెలకు 15% లాభం సాధ్యం కాదు. షార్ట్ లింక్‌లు క్లిక్ చేయవద్దు మరియు అపరిచిత వ్యక్తుల మాటలు నమ్మి డబ్బు పెట్టవద్దు.",
      hi: "सावधान रहें! हर महीने 15% का पक्का मुनाफा असंभव है। किसी भी शॉर्ट लिंक पर क्लिक न करें और बिना जांचे पैसे न लगाएं।",
      en: "Be careful! Monthly 15% return is unrealistically high in the stock market. Do not click shortened links and never transfer money on tips.",
      kn: "ಎಚ್ಚರದಿಂದಿರಿ! ತಿಂಗಳಿಗೆ 15% ಲಾಭ ಅಸಾಧ್ಯ. ಅಪರಿಚಿತ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಮತ್ತು ಯಾರ ಮಾತು ಕೇಳಿ ಹಣ ಹೂಡಬೇಡಿ.",
      ta: "எச்சரிக்கையாக இருங்கள்! மாதந்தோறும் 15% லாபம் சாத்தியமில்லை. எந்த விசித்திரமான லிங்க்கையும் தொடாதீர்கள்.",
      ml: "ശ്രദ്ധിക്കുക! പ്രതിമാസം 15% ലാഭം അസാധ്യമാണ്. അജ്ഞാത ലിങ്കുകളിൽ ക്ലിക്ക് ചെയ്യരുത്, ആരുടെയെങ്കിലും വാക്ക് കേട്ട് പണം നൽകരുത്.",
    },
    what_to_do: {
      te: [
        "లింక్‌లను తెరవవద్దు.",
        "రిజిస్టర్డ్ బ్రోకర్ ద్వారా మాత్రమే సమాచారం పొందండి.",
        "ఎవరికీ పాస్‌వర్డ్ లేదా OTP ఇవ్వవద్దు.",
      ],
      hi: [
        "शॉर्ट लिंक न खोलें।",
        "केवल सेबी-पंजीकृत ब्रोकर से ही जानकारी लें।",
        "किसी के साथ ओटीपी या पिन साझा न करें।",
      ],
      en: [
        "Do not open the shortened link.",
        "Check with a SEBI-registered broker only.",
        "Never share OTP or PIN with anyone.",
      ],
      kn: [
        "ಲಿಂಕ್ ಅನ್ನು ತೆರೆಯಬೇಡಿ.",
        "ಸೆಬಿ ನೋಂದಾಯಿತ ಬ್ರೋಕರ್ ಮೂಲಕ ಮಾತ್ರ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.",
        "ಯಾರಿಗೂ ಓಟಿಪಿ ಅಥವಾ ಪಿನ್ ನೀಡಬೇಡಿ.",
      ],
      ta: [
        "லிங்கை திறக்க வேண்டாம்.",
        "SEBI பதிவுபெற்ற தரகர் மூலம் மட்டுமே உறுதி செய்யவும்.",
        "யாருடனும் OTP அல்லது பின் எண்ணை பகிராதீர்கள்.",
      ],
      ml: [
        "ലിങ്ക് തുറക്കരുത്.",
        "സെബി രജിസ്റ്റർ ചെയ്ത ബ്രോക്കർ വഴി മാത്രം വിവരങ്ങൾ നേടുക.",
        "ആരുമായും ഒടിപിയോ യുപിഐ പിൻ നമ്പറോ പങ്കിടരുത്.",
      ],
    },
    lesson_id: "scam_vip_groups",
    extracted_details: {
      sender: "Smart Wealth Alert",
      amount: "₹10,000",
      promised_return: "15% per month",
      payment_mode: "Website link",
      links_or_upi: "https://bit.ly/fast-wealth-gain",
    },
  },

  // Scenario 3: Real Bank or Broker SMS (NO WARNING SIGNS)
  no_warning_signs: {
    check_id: "chk-1102-safe",
    verdict: "no_signs",
    score: 0,
    always_rule: null,
    signs: [],
    checks: [
      {
        name: "SEBI Registered Intermediary",
        status: "found",
        source: "SEBI list, checked 20 Nov 2026",
        as_of: "2026-11-20",
      },
      {
        name: "Sender ID Header",
        status: "found",
        source: "TRAI DLT Registry",
        as_of: "2026-11-20",
      },
    ],
    explanation: {
      te: "ఈ సందేశంలో ఎటువంటి మోసపూరిత గుర్తులు కనిపించలేదు. ఇది సాధారణ బ్రోకర్ లేదా బ్యాంక్ నిర్ధారణ సందేశం లాగా ఉంది.",
      hi: "इस संदेश में कोई धोखाधड़ी के संकेत नहीं मिले हैं। यह अधिकृत बैंक या पंजीकृत ब्रोकर का सामान्य अलर्ट प्रतीत होता है।",
      en: "No warning signs were detected in this message. It looks like a standard trade or balance alert from a registered provider.",
      kn: "ಈ ಸಂದೇಶದಲ್ಲಿ ಯಾವುದೇ ವಂಚನೆಯ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಇದು ನೋಂದಾಯಿತ ಬ್ರೋಕರ್ ಅಥವಾ ಬ್ಯಾಂಕ್‌ನ ಸಾಮಾನ್ಯ ಸಂದೇಶವಾಗಿದೆ.",
      ta: "இந்த செய்தியில் எந்தவித மோசடி அறிகுறிகளும் காணப்படவில்லை. இது பதிவு செய்யப்பட்ட வங்கியின் முறையான தகவல் போல் உள்ளது.",
      ml: "ഈ സന്ദേശത്തിൽ കബളിപ്പിക്കലിന്റെ ലക്ഷണങ്ങളൊന്നും കണ്ടെത്തിയില്ല. ഇത് ബാങ്കിന്റെയോ രജിസ്റ്റർ ചെയ്ത ബ്രോക്കറുടെയോ അറിയിപ്പാണ്.",
    },
    what_to_do: {
      te: [
        "మీ బ్యాంక్ లేదా బ్రోకర్ యాప్‌లో ఖాతా వివరాలు సరిచూసుకోండి.",
        "ఎవరితోనూ OTP పంచుకోవద్దు.",
        "స్థిరమైన రాబడి హామీ ఇచ్చే ఎవరికీ ఎప్పుడూ చెల్లించవద్దు.",
      ],
      hi: [
        "अपने आधिकारिक बैंक या ब्रोकर ऐप में स्टेटमेंट जांचें।",
        "किसी के साथ ओटीपी शेयर न करें।",
        "निश्चित रिटर्न का वादा करने वाले को कभी पैसे न दें।",
      ],
      en: [
        "Verify details directly in your official banking or trading app.",
        "Never share OTP with anyone under any circumstances.",
        "Never pay anyone who promises fixed returns.",
      ],
      kn: [
        "ನಿಮ್ಮ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಅಥವಾ ಬ್ರೋಕರ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.",
        "ಯಾರೊಂದಿಗೂ ಓಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
        "ಖಚಿತ ಲಾಭದ ಆಮಿಷವೊಡ್ಡುವವರಿಗೆ ಎಂದಿಗೂ ಹಣ ನೀಡಬೇಡಿ.",
      ],
      ta: [
        "உங்கள் வங்கி அல்லது புரோக்கர் செயலியில் விவரங்களை சரிபார்க்கவும்.",
        "யாருடனும் OTP-ஐ பகிர வேண்டாம்.",
        "நிலையான லாபம் தருவதாக கூறுபவர்களிடம் பணம் செலுத்த வேண்டாம்.",
      ],
      ml: [
        "നിങ്ങളുടെ ബാങ്ക് അല്ലെങ്കിൽ ബ്രോക്കർ ആപ്പിൽ വിവരങ്ങൾ ഉറപ്പാക്കുക.",
        "ആരുമായും ഒടിപി പങ്കിടരുത്.",
        "നിശ്ചിത വരുമാനം വാഗ്ദാനം ചെയ്യുന്ന ആർക്കും ഒരിക്കലും പണം നൽകരുത്.",
      ],
    },
    lesson_id: "start_safely",
    extracted_details: {
      sender: "HDFC Securities (AD-HDFCBK)",
      amount: "₹1,240 (Order executed)",
      promised_return: "None (Market trade)",
      payment_mode: "Demat linked account",
      links_or_upi: "hdfcsec.com",
    },
  },

  // Scenario 4: Incomplete / could not fully check
  could_not_check: {
    check_id: "chk-0099-unknown",
    verdict: "could_not_check",
    score: 0.5,
    always_rule: null,
    signs: [
      {
        code: "UNCONFIRMED_ENTITY",
        weight: 0.5,
        evidence: "Name provided does not match official SEBI records",
        source: "SEBI Intermediary Registry",
      },
    ],
    checks: [
      {
        name: "SEBI Registered Intermediary",
        status: "could_not_check",
        source: "SEBI list, checked 20 Nov 2026",
        as_of: "2026-11-20",
      },
      {
        name: "URL / Domain Verification",
        status: "could_not_check",
        source: "Network check unavailable",
        as_of: "2026-11-20",
      },
    ],
    explanation: {
      te: "ఈ సమాచారాన్ని పూర్తిగా నిర్ధారించలేకపోయాము. తగినంత వివరాలు లేవు లేదా బ్రోకర్ పేరు అధికారిక జాబితాలో సరిపోలడం లేదు.",
      hi: "इस जानकारी की पूरी जांच नहीं हो सकी। विवरण अधूरा है अथवा ब्रोकर का नाम आधिकारिक सूची में नहीं मिला।",
      en: "We could not fully verify this tip. Some details are incomplete or the sender name is not found in official registry records.",
      kn: "ಈ ಮಾಹಿತಿಯನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ. ಸಾಕಷ್ಟು ವಿವರಗಳಿಲ್ಲ ಅಥವಾ ಅಧಿಕೃತ ದಾಖಲೆಗಳಲ್ಲಿ ಹೆಸರು ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
      ta: "இந்த தகவலை முழுமையாக சரிபார்க்க முடியவில்லை. தேவையான விவரங்கள் குறைவாக உள்ளன.",
      ml: "ഈ വിവരം പൂർണ്ണമായി പരിശോധിക്കാൻ കഴിഞ്ഞില്ല. വിവരങ്ങൾ അപൂർണ്ണമാണ് അല്ലെങ്കിൽ ഔദ്യോഗിക പട്ടികയിൽ പേരില്ല.",
    },
    what_to_do: {
      te: [
        "ధృవీకరించని లింక్‌లు లేదా పేర్లను నమ్మవద్దు.",
        "మీ స్వంత నిర్ణయంతో జాగ్రత్తగా ఉండండి.",
        "ఎవరికీ ముందస్తు రుసుములు చెల్లించవద్దు.",
      ],
      hi: [
        "अपुष्ट लिंक या नामों पर भरोसा न करें।",
        "पूरी तरह सतर्क रहें और कोई अग्रिम शुल्क न दें।",
        "केवल सेबी अधिकृत स्रोतों से जांच करें।",
      ],
      en: [
        "Do not trust unverified tips or names.",
        "Exercise caution and never pay any upfront fees.",
        "Consult official SEBI registered intermediaries.",
      ],
      kn: [
        "ದೃಢೀಕರಿಸದ ಲಿಂಕ್ ಅಥವಾ ಹೆಸರುಗಳನ್ನು ನಂಬಬೇಡಿ.",
        "ಯಾವುದೇ ಮುಂಗಡ ಶುಲ್ಕ ಪಾವತಿಸಬೇಡಿ.",
        "ಅಧಿಕೃತ ಮೂಲಗಳಿಂದ ಪರಿಶೀಲಿಸಿ.",
      ],
      ta: [
        "சரிபார்க்கப்படாத தகவல்களை நம்ப வேண்டாம்.",
        "எந்த முன்பணமும் செலுத்த வேண்டாம்.",
        "அதிகாரப்பூர்வ தளங்களில் சரிபார்க்கவும்.",
      ],
      ml: [
        "സ്ഥിരീകരിക്കാത്ത വിവരങ്ങൾ വിശ്വസിക്കരുത്.",
        "മുൻകൂർ ഫീസ് ഒന്നും നൽകരുത്.",
        "ഔദ്യോഗികമായി രജിസ്റ്റർ ചെയ്ത ഇടനിലക്കാരെ മാത്രം ആശ്രയിക്കുക.",
      ],
    },
    lesson_id: "what_is_share",
    extracted_details: {
      sender: "Unknown Telegram Channel",
      amount: "Not specified",
      promised_return: "Quick profit tips",
      payment_mode: "Unknown",
      links_or_upi: "t.me/tips998",
    },
  },
};
