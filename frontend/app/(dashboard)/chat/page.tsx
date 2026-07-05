"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Send, Mic, MicOff, Trash2, Bot, User,
  AlertTriangle, Loader2, MessageSquare, Cpu
} from "lucide-react";
import api from "@/lib/api";
import { useStreamChat } from "@/hooks/useStreamChat";
import type { ChatSession, ChatMessage } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* ── Model badge ────────────────────────────────────────────────────────── */
function ModelBadge({ model }: { model?: string | null }) {
  if (!model) return null;
  const isGroq = model.includes("llama") || model.includes("70b") || model.includes("groq");
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{
        background: isGroq ? "#e0f2fe" : "#f5f3ff",
        border: `1px solid ${isGroq ? "#bae6fd" : "#ddd6fe"}`,
        color: isGroq ? "#0284c7" : "#7c3aed",
      }}
    >
      <Cpu className="w-2.5 h-2.5" />
      {isGroq ? "Groq" : "Local"}
    </span>
  );
}

/* ── Entity badge ───────────────────────────────────────────────────────── */
function EntityBadge({ entity, type }: { entity: string; type: string }) {
  const cfg: Record<string, { bg: string; border: string; color: string }> = {
    disease:   { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    chemical:  { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
    medication:{ bg: "#ecfdf5", border: "#a7f3d0", color: "#059669" },
    negated:   { bg: "#f8fafc", border: "#e2e8f0", color: "#64748b" },
  };
  const c = cfg[type] ?? cfg.disease;
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      {entity}
    </span>
  );
}

/* ── Message bubble ─────────────────────────────────────────────────────── */
function MessageBubble({
  message,
}: {
  message: ChatMessage & { isStreaming?: boolean; streamContent?: string };
}) {
  const isUser = message.role === "user";
  const content = message.isStreaming ? (message.streamContent ?? "") : message.content;
  const entities = message.extracted_entities as Record<string, string[]> | null;

  const userBubbleStyle: React.CSSProperties = {
    background: "#0284c7",
    color: "#ffffff",
    borderRadius: "18px 18px 4px 18px",
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: "1.625",
    wordBreak: "break-word",
  };

  const aiBubbleStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px 18px 18px 4px",
    boxShadow: "0 1px 3px rgba(15,23,42,.06)",
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: "1.625",
    color: "#0f172a",
    wordBreak: "break-word",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? "#dbeafe" : "#f0f9ff",
          border: `1px solid ${isUser ? "#bfdbfe" : "#e0f2fe"}`,
        }}
      >
        {isUser
          ? <User className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />
          : <Bot  className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
        <div style={isUser ? userBubbleStyle : aiBubbleStyle}>
          <div className="prose-chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          {message.isStreaming && (
            <span className="inline-flex gap-1 ml-1 align-middle">
              <span className="typing-dot" style={{ background: "#94a3b8" }} />
              <span className="typing-dot" style={{ background: "#94a3b8" }} />
              <span className="typing-dot" style={{ background: "#94a3b8" }} />
            </span>
          )}
        </div>

        <div className={`flex items-center gap-2 px-0.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px]" style={{ color: "#94a3b8" }}>
            {formatDateTime(message.created_at)}
          </span>
          {!isUser && <ModelBadge model={message.model_used} />}
        </div>

        {entities && Object.entries(entities).some(([, v]) => v?.length) && (
          <div className="flex flex-wrap gap-1 px-0.5">
            {Object.entries(entities).flatMap(([type, items]) =>
              (items ?? []).map((entity, i) => (
                <EntityBadge key={`${type}-${i}`} entity={entity} type={type} />
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Suggestion chips ───────────────────────────────────────────────────── */
const SUGGESTIONS = [
  "What do my latest vitals mean?",
  "Am I at risk for any conditions?",
  "Explain my current medications",
  "Should I be worried about these symptoms?",
];

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput]       = useState("");
  const [recording, setRecording] = useState(false);
  const [streamingMsg, setStreamingMsg] = useState<{ content: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const mrRef     = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { streamMessage } = useStreamChat();

  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: QUERY_KEYS.chatSessions(),
    queryFn: () => api.get("/api/chat/sessions").then(r => r.data),
  });

  const { data: activeSession } = useQuery({
    queryKey: QUERY_KEYS.chatSession(activeSessionId),
    queryFn: () => api.get(`/api/chat/sessions/${activeSessionId}`).then(r => r.data),
    enabled: !!activeSessionId,
  });

  const createSession = useMutation({
    mutationFn: () =>
      api.post("/api/chat/sessions", { title: "New conversation" }).then(r => r.data),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions()});
      setActiveSessionId(session.id);
    },
    onError: () => toast.error("Failed to create conversation"),
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.delete(`/api/chat/sessions/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions()});
      if (activeSessionId === id) setActiveSessionId(null);
    },
    onError: () => toast.error("Failed to delete conversation"),
  });

  const messages: ChatMessage[] = activeSession?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, streamingMsg?.content, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !activeSessionId) return;
    setInput("");
    setStreamingMsg({ content: "" });
    try {
      await streamMessage(
        activeSessionId, msg,
        (chunk) => setStreamingMsg(prev => ({ content: (prev?.content ?? "") + chunk })),
      );
    } finally {
      setStreamingMsg(null);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSession(activeSessionId)});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions()});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "recording.webm");
        try {
          const { data } = await api.post("/api/speech/transcribe", fd);
          setInput(prev => prev + (prev ? " " : "") + data.text);
          inputRef.current?.focus();
        } catch { /* ignore */ }
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch { /* mic denied */ }
  };

  const stopRecording = () => { mrRef.current?.stop(); setRecording(false); };

  return (
    <>
      {/* Scoped styles for textarea placeholder and scrollbar */}
      <style>{`
        .chat-input::placeholder { color: #94a3b8; }
        .chat-thread::-webkit-scrollbar { width: 4px; }
        .chat-thread::-webkit-scrollbar-track { background: transparent; }
        .chat-thread::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>

      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "#f0f4f8" }}
      >
        {/* ── Sessions sidebar ─────────────────────────────────────────── */}
        <div
          className="w-56 flex-shrink-0 flex flex-col"
          style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0" }}
        >
          {/* New conversation button */}
          <div className="p-3 flex-shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => createSession.mutate()}
              disabled={createSession.isPending}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "#0284c7", color: "#ffffff", border: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0369a1")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0284c7")}
            >
              {createSession.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Plus className="w-3.5 h-3.5" />
              }
              New conversation
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {sessions.length === 0 && (
              <div className="text-center py-8 text-[11px]" style={{ color: "#94a3b8" }}>
                No conversations yet
              </div>
            )}
            {sessions.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer group transition-all"
                  style={{
                    background: isActive ? "#e0f2fe" : "transparent",
                    border: `1px solid ${isActive ? "#bfdbfe" : "transparent"}`,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <MessageSquare
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: isActive ? "#0284c7" : "#94a3b8" }}
                  />
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ color: isActive ? "#0284c7" : "#64748b" }}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSession.mutate(s.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "#ffffff" }}>

          {/* Disclaimer banner */}
          <div
            className="flex items-center gap-2 px-4 py-2 text-xs flex-shrink-0"
            style={{
              background: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              color: "#92400e",
            }}
          >
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            For informational purposes only — not a substitute for professional medical advice.
          </div>

          {activeSessionId ? (
            <>
              {/* Messages thread */}
              <div
                ref={threadRef}
                className="chat-thread flex-1 overflow-y-auto px-6 py-6 space-y-5"
              >
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {streamingMsg !== null && (
                  <MessageBubble
                    message={{
                      id: "streaming",
                      role: "assistant",
                      content: "",
                      created_at: new Date().toISOString(),
                      isStreaming: true,
                      streamContent: streamingMsg.content,
                    } as ChatMessage & { isStreaming: boolean; streamContent: string }}
                  />
                )}
              </div>

              {/* Input area */}
              <div
                className="p-4 flex-shrink-0"
                style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}
              >
                <div
                  className="flex items-end gap-2 px-4 py-3 rounded-xl transition-all"
                  style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your health, medications, symptoms..."
                    rows={1}
                    className="chat-input flex-1 bg-transparent text-sm resize-none outline-none"
                    style={{
                      color: "#0f172a",
                      minHeight: "24px",
                      maxHeight: "120px",
                      caretColor: "#0284c7",
                    }}
                  />

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: recording ? "#fee2e2" : "transparent",
                        color: recording ? "#dc2626" : "#94a3b8",
                      }}
                      onMouseEnter={e => { if (!recording) e.currentTarget.style.color = "#64748b"; }}
                      onMouseLeave={e => { if (!recording) e.currentTarget.style.color = "#94a3b8"; }}
                      title={recording ? "Stop recording" : "Voice input"}
                    >
                      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || !!streamingMsg}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: (!input.trim() || !!streamingMsg) ? "#e0f2fe" : "#0284c7",
                        color: (!input.trim() || !!streamingMsg) ? "#7dd3fc" : "#ffffff",
                      }}
                    >
                      {streamingMsg
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
                <p className="text-center mt-2 text-[10px]" style={{ color: "#94a3b8" }}>
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center"
              style={{ background: "#f0f4f8" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}
              >
                <Bot className="w-7 h-7" style={{ color: "#0284c7" }} />
              </div>

              <div>
                <h2
                  className="text-lg font-semibold mb-2 tracking-tight"
                  style={{ color: "#0f172a" }}
                >
                  Your AI Health Assistant
                </h2>
                <p
                  className="text-sm max-w-xs leading-relaxed"
                  style={{ color: "#64748b" }}
                >
                  Ask about your medications, symptoms, or lab results. Get answers grounded in your health records.
                </p>
              </div>

              <button
                onClick={() => createSession.mutate()}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: "#0284c7", color: "#ffffff", border: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0369a1")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0284c7")}
              >
                Start a conversation
              </button>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      createSession.mutate(undefined, {
                        onSuccess: () => {
                          setInput(s);
                          setTimeout(() => inputRef.current?.focus(), 200);
                        },
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "#bfdbfe";
                      e.currentTarget.style.color = "#0284c7";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#64748b";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
