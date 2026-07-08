"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TTSState = "idle" | "speaking" | "paused" | "unsupported";

interface UseTTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  preferredVoiceLang?: string;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { rate = 1.0, pitch = 1.0, volume = 0.95, preferredVoiceLang = "en-US" } = options;
  const [ttsState, setTtsState] = useState<TTSState>("idle");
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load and cache best available voice
  useEffect(() => {
    if (!isSupported) return;

    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer: natural/enhanced voices first, then any en-US, then any en
      const preferred = voices.find(v => v.lang === preferredVoiceLang && v.name.includes("Natural"))
        ?? voices.find(v => v.lang === preferredVoiceLang && v.localService)
        ?? voices.find(v => v.lang === preferredVoiceLang)
        ?? voices.find(v => v.lang.startsWith("en"))
        ?? voices[0] ?? null;
      voiceRef.current = preferred;
    };

    loadVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
  }, [isSupported, preferredVoiceLang]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !isTTSEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, "code block omitted")
      .replace(/`[^`]+`/g, match => match.slice(1, -1))
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/---+/g, "")
      .replace(/⚠️|🚨|📚/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onstart = () => setTtsState("speaking");
    utterance.onpause = () => setTtsState("paused");
    utterance.onresume = () => setTtsState("speaking");
    utterance.onend = () => setTtsState("idle");
    utterance.onerror = () => setTtsState("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isTTSEnabled, rate, pitch, volume]);

  const stopSpeaking = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setTtsState("idle");
  }, [isSupported]);

  const pauseSpeaking = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setTtsState("paused");
  }, [isSupported]);

  const resumeSpeaking = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setTtsState("speaking");
  }, [isSupported]);

  const toggleTTS = useCallback(() => {
    setIsTTSEnabled(prev => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  return {
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    toggleTTS,
    ttsState,
    isTTSEnabled,
    isSupported,
  };
}
