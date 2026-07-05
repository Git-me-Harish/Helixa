"use client";

import { useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StreamEvent {
  type: "chunk" | "done" | "error";
  content?: string;
  model?: string;
  entities?: Record<string, unknown>;
  rag_sources?: string[];
}

interface UseStreamChatReturn {
  streamMessage: (sessionId: string, message: string, onChunk: (text: string, model: string) => void) => Promise<{
    entities: Record<string, unknown> | null;
    rag_sources: string[];
  }>;
  isStreaming: boolean;
  abort: () => void;
}

export function useStreamChat(): UseStreamChatReturn {
  const { token } = useAuthStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const streamMessage = useCallback(
    async (
      sessionId: string,
      message: string,
      onChunk: (text: string, model: string) => void
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      let entities: Record<string, unknown> | null = null;
      let rag_sources: string[] = [];

      try {
        const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message, session_id: sessionId }),
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              if (event.type === "chunk" && event.content) {
                onChunk(event.content, event.model || "unknown");
              } else if (event.type === "done") {
                entities = event.entities || null;
                rag_sources = event.rag_sources || [];
              } else if (event.type === "error") {
                throw new Error(event.content);
              }
            } catch (parseErr) {
              // malformed SSE line — skip
            }
          }
        }
      } finally {
        setIsStreaming(false);
      }

      return { entities, rag_sources };
    },
    [token]
  );

  return { streamMessage, isStreaming, abort };
}
