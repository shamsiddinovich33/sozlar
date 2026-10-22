"use client";

import { useCallback, useEffect, useState } from "react";

export type SpeechLang = "en" | "uz";

const LANG_TAGS: Record<SpeechLang, string> = { en: "en-US", uz: "uz-UZ" };

/** Text-to-speech via the browser's free Web Speech API. */
export function useSpeech() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string, lang: SpeechLang) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    // Without a matching voice (common for Uzbek), fall back to the browser's default voice.
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else if (lang === "en") {
      utterance.lang = LANG_TAGS.en;
    }
    utterance.rate = 0.95;
    synth.speak(utterance);
  }, []);

  return { supported, speak };
}
