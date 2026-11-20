export const VOICE_LANG_MAP: Record<string, string> = {
  te: "te-IN",
  hi: "hi-IN",
  en: "en-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  ml: "ml-IN",
};

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  lang: string = "te",
  speedRate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLocale = VOICE_LANG_MAP[lang] || "en-IN";
  utterance.lang = targetLocale;
  utterance.rate = speedRate; // 0.8 slow, 1.0 normal, 1.2 fast

  // Try to find the best available matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang === targetLocale || v.lang.startsWith(lang)
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function startSpeechRecognition(
  lang: string,
  handlers: SpeechRecognitionHandlers
): { stop: () => void } | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    handlers.onError("Speech recognition not supported in this browser");
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = VOICE_LANG_MAP[lang] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      handlers.onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      handlers.onError(event.error || "Speech recognition error");
    };

    recognition.onend = () => {
      handlers.onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {}
      },
    };
  } catch (err: any) {
    handlers.onError(err.message || "Failed to start recognition");
    return null;
  }
}
