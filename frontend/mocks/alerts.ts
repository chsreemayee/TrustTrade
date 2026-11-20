export interface SafetyAlert {
  id: string;
  tag: Record<string, string>;
  title: Record<string, string>;
  body: Record<string, string>;
  action_label: Record<string, string>;
  sample_tip_key: string;
  active: boolean;
}

export const MOCK_ALERTS: SafetyAlert[] = [
  {
    id: "alert-1",
    tag: {
      te: "ముఖ్యమైన భద్రతా హెచ్చరిక",
      hi: "महत्वपूर्ण सुरक्षा चेतावनी",
      en: "Safety Alert",
      kn: "ಮುಖ್ಯ ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ",
      ta: "முக்கிய பாதுகாப்பு எச்சரிக்கை",
      ml: "പ്രധാന സുരക്ഷാ മുന്നറിയിപ്പ്",
    },
    title: {
      te: "WhatsApp పార్ట్‌టైమ్ జాబ్ మోసం",
      hi: "व्हाट्सएप पार्ट-टाइम जॉब फ्रॉड",
      en: "WhatsApp Part-time Job Scam",
      kn: "ವಾಟ್ಸಾಪ್ ಅರೆಕಾಲಿಕ ಕೆಲಸ ವಂಚನೆ",
      ta: "வாட்ஸ்அப் பகுதிநேர வேலை மோசடி",
      ml: "വാട്ട്സ്ആപ്പ് പാർട്ട് ടൈം ജോലി തട്ടിപ്പ്",
    },
    body: {
      te: "యూట్యూబ్ వీడియోలు లైక్ చేసి రోజుకు ₹3,000 ఇస్తామని రిజిస్ట్రేషన్ ఫీజు అడిగితే నమ్మవద్దు. ఇది ముఠాల మోసం.",
      hi: "वीडियो लाइक करके रोज ₹3,000 कमाने के नाम पर कोई रजिस्ट्रेशन फीस मांगे तो न दें। यह ठगी का जाल है।",
      en: "Do not pay any registration fee for YouTube like or review tasks. It is an organized fraud.",
      kn: "ಯೂಟ್ಯೂಬ್ ಲೈಕ್ ಮಾಡಿ ಹಣ ಗಳಿಸುವ ಹೆಸರಿನಲ್ಲಿ ನೋಂದಣಿ ಶುಲ್ಕ ಕೇಳಿದರೆ ಹಣ ನೀಡಬೇಡಿ. ಇದು ವಂಚನೆ.",
      ta: "வீடியோ லைக் செய்தால் பணம் தருவதாக கூறி முன்பணம் கேட்டால் கட்டாதீர்கள். இது திட்டமிட்ட மோசடி.",
      ml: "വീഡിയോ ലൈക്ക് ചെയ്ത് പണം നൽകാമെന്ന് പറഞ്ഞ് രജിസ്ട്രേഷൻ ഫീസ് ആവശ്യപ്പെട്ടാൽ നൽകരുത്.",
    },
    action_label: {
      te: "సరిచూసుకోండి",
      hi: "जांचें",
      en: "Check now",
      kn: "ಪರಿಶೀಲಿಸಿ",
      ta: "சரிபார்க்கவும்",
      ml: "പരിശോധിക്കുക",
    },
    sample_tip_key: "vip_double_money",
    active: true,
  },
];
