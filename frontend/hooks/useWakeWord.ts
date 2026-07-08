"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WAKE_PHRASES = ["hey helixa", "hi helixa", "helixa", "hello helixa", "ok helixa"];

export type WakeWordState = "idle" | "listening_for_wake" | "unsupported";

interface UseWakeWordOptions {
  onWake: () => void;
  autoStart?: boolean;
}

export function useWakeWord({ onWake, autoStart = false }: UseWakeWordOptions) {
  const [state, setState] = useState<WakeWordState>("idle");

  // Keep callbacks in refs so the SpeechRecognition handler never holds stale closures
  const onWakeRef    = useRef(onWake);
  const activeRef    = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onWakeRef.current = onWake; }, [onWake]);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const _createRecognition = useCallback((): SpeechRecognition | null => {
    if (!isSupported) return null;
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition as
        (new () => SpeechRecognition) | undefined ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as
        (new () => SpeechRecognition) | undefined;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = "en-US";
    rec.maxAlternatives = 3;

    rec.onstart = () => setState("listening_for_wake");

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (!activeRef.current) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Check every alternative transcript
        for (let a = 0; a < result.length; a++) {
          const t = result[a].transcript.toLowerCase().trim();
          if (WAKE_PHRASES.some(p => t.includes(p))) {
            // Stop listening, fire callback
            activeRef.current = false;
            rec.stop();
            setState("idle");
            onWakeRef.current();
            return;
          }
        }
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        activeRef.current = false;
        setState("unsupported");
      }
      // "no-speech" and "aborted" are benign — let onend restart
    };

    rec.onend = () => {
      if (!activeRef.current) return;
      // Restart after a short gap — browser stops recognition after silence
      restartTimer.current = setTimeout(() => {
        if (!activeRef.current) return;
        try { rec.start(); } catch { /* already started */ }
      }, 250);
    };

    return rec;
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported) { setState("unsupported"); return; }
    if (activeRef.current) return; // already running
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }

    const rec = _createRecognition();
    if (!rec) { setState("unsupported"); return; }

    recognitionRef.current = rec;
    activeRef.current = true;
    try { rec.start(); } catch { setState("idle"); activeRef.current = false; }
  }, [isSupported, _createRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setState("idle");
  }, []);

  // Auto-start
  useEffect(() => {
    if (autoStart && isSupported) start();
    return stop;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, isSupported, start, stop };
}
