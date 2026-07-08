"use client";

import { useCallback, useRef, useState } from "react";

export type MicInputState = "idle" | "recording" | "unsupported";

export function useMicInput() {
  const [state, setState] = useState<MicInputState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback((onResult: (text: string) => void) => {
    if (!isSupported) { setState("unsupported"); return; }
    if (recognitionRef.current) return;

    const win = window as unknown as Record<string, unknown>;
    const SR = (win.SpeechRecognition ?? win.webkitSpeechRecognition) as
      (new () => SpeechRecognition) | undefined;
    if (!SR) { setState("unsupported"); return; }

    onResultRef.current = onResult;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => setState("recording");

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript && onResultRef.current) {
        onResultRef.current(transcript);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Mic recognition error:", event.error);
      }
      recognitionRef.current = null;
      setState("idle");
    };

    rec.onend = () => {
      recognitionRef.current = null;
      setState("idle");
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setState("idle");
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setState("idle");
  }, []);

  return { state, isSupported, start, stop };
}
