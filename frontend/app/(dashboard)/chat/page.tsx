"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import {
  Plus, Send, Mic, MicOff, Trash2, Bot, User,
  Loader2, MessageSquare, Volume2, VolumeX,
  StopCircle, ImageIcon, X, Sparkles, Radio,
  ChevronRight, Info, Pin, Pencil, Check,
} from "lucide-react";
import { GifButton } from "@/components/ui/GifButton";
import api from "@/lib/api";
import { useStreamChat, type ImageAttachment } from "@/hooks/useStreamChat";
import { useWakeWord } from "@/hooks/useWakeWord";
import { useTTS } from "@/hooks/useTTS";
import { useMicInput } from "@/hooks/useMicInput";
import type { ChatSession, ChatMessage } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* ── Helixa badge (replaces "Groq") ─────────────────────────────────────── */
function HelixaBadge({ model }: { model?: string | null }) {
  if (!model || model === "unavailable") return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7" }}
    >
      <Bot className="w-2.5 h-2.5" />
      Helixa
    </span>
  );
}

/* ── RAG badge ───────────────────────────────────────────────────────────── */
function RagBadge({ grounding, sources }: {
  grounding?: ChatMessage["rag_grounding"];
  sources?: string[] | null;
}) {
  if (!grounding || grounding === "no_match") return null;
  if (grounding === "grounded" && sources?.length) {
    const unique = Array.from(new Set(sources));
    return (
      <span
        title={`Grounded in: ${unique.join(", ")}`}
        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium cursor-help"
        style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669" }}
      >
        {unique.length} {unique.length === 1 ? "source" : "sources"}
      </span>
    );
  }
  return null;
}

/* ── Entity badge ────────────────────────────────────────────────────────── */
function EntityBadge({ entity, type }: { entity: string; type: string }) {
  const cfg: Record<string, { bg: string; border: string; color: string }> = {
    disease:    { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    chemical:   { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
    medication: { bg: "#ecfdf5", border: "#a7f3d0", color: "#059669" },
    negated:    { bg: "#f8fafc", border: "#e2e8f0", color: "#64748b" },
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

/* ── Floating voice orb ──────────────────────────────────────────────────── */
function VoiceOrb({ state }: {
  state: "idle" | "listening_for_wake" | "recording" | "speaking";
}) {
  if (state === "idle") return null;

  const cfg = {
    listening_for_wake: { ring: "#9D93C1", glow: "rgba(157,147,193,0.45)", label: 'Say "Hey Helixa"' },
    recording:          { ring: "#f87171", glow: "rgba(248,113,113,0.45)", label: "Recording…" },
    speaking:           { ring: "#6ee7b7", glow: "rgba(110,231,183,0.45)", label: "Speaking…" },
  }[state];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 16 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="fixed bottom-24 right-5 z-50 flex flex-col items-center gap-2"
    >
      {/* Orb with gif + rings */}
      <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
        {/* Outer slow-ping ring */}
        <span className="absolute inset-0 rounded-full animate-ping"
          style={{ background: cfg.ring, opacity: 0.18 }} />
        {/* Middle ring */}
        <span className="absolute rounded-full"
          style={{
            inset: 4, borderRadius: "50%",
            border: `2px solid ${cfg.ring}`,
            opacity: 0.55,
            animation: "voiceOrbPulse 1.8s ease-in-out infinite",
          }} />
        {/* Core dark circle with gif */}
        <div className="relative rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: 48, height: 48,
            background: "#000",
            boxShadow: `0 0 0 2px ${cfg.ring}, 0 0 24px ${cfg.glow}`,
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/button.gif" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Label pill */}
      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
        style={{
          background: "rgba(0,0,0,0.82)",
          color: "#F0EEF8",
          border: `1px solid ${cfg.ring}`,
          backdropFilter: "blur(6px)",
        }}>
        {cfg.label}
      </span>

      <style>{`
        @keyframes voiceOrbPulse {
          0%, 100% { transform: scale(1);   opacity: 0.55; }
          50%       { transform: scale(1.12); opacity: 0.25; }
        }
      `}</style>
    </motion.div>
  );
}

/* ── Image attachment preview ────────────────────────────────────────────── */
function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = URL.createObjectURL(file);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }} className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="attachment" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
      <button onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
        <X className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  );
}

/* ── Message bubble ──────────────────────────────────────────────────────── */
function MessageBubble({
  message, onSpeak, isSpeaking,
}: {
  message: ChatMessage & { isStreaming?: boolean; streamContent?: string };
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}) {
  const isUser  = message.role === "user";
  const content = message.isStreaming ? (message.streamContent ?? "") : message.content;
  const entities = message.extracted_entities as Record<string, string[]> | null;

  // Strip any disclaimer footer the model still appended despite instructions
  const displayContent = content
    .replace(/\n?---\n?\*?.*?informational only.*?\*?\.?\s*$/im, "")
    .replace(/\n?---\n?\*?.*?not a substitute.*?\*?\.?\s*$/im, "")
    .trim();

  // For image-only messages the content is the placeholder "[Image attached]" — don't show it as a text bubble
  const isImageOnly = isUser && message.image_data && displayContent === "[Image attached]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? "#dbeafe" : "#f0f9ff",
          border: `1px solid ${isUser ? "#bfdbfe" : "#e0f2fe"}`,
        }}>
        {isUser
          ? <User className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />
          : <Bot  className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />}
      </div>

      {/* Bubble + meta */}
      <div className={`flex flex-col gap-1.5 max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>

        {/* Persisted image — shown for user messages that included an image */}
        {isUser && message.image_data && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={message.image_data}
            alt="Attached image"
            className="rounded-xl object-cover"
            style={{
              maxWidth: "240px",
              maxHeight: "240px",
              border: "1px solid #bfdbfe",
              boxShadow: "0 1px 4px rgba(15,23,42,.08)",
            }}
          />
        )}

        {/* Text bubble — hidden when message is image-only */}
        {!isImageOnly && (
          <div
            className="prose-chat"
            style={isUser ? {
              background: "#0284c7", color: "#fff",
              borderRadius: message.image_data ? "12px 12px 4px 12px" : "16px 16px 4px 16px",
              padding: "9px 13px", fontSize: "14px", lineHeight: "1.6", wordBreak: "break-word",
            } : {
              background: "#fff", color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "16px 16px 16px 4px",
              boxShadow: "0 1px 3px rgba(15,23,42,.06)",
              padding: "9px 13px", fontSize: "14px", lineHeight: "1.6", wordBreak: "break-word",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-flex gap-1 ml-1 align-middle">
                <span className="typing-dot" style={{ background: "#94a3b8" }} />
                <span className="typing-dot" style={{ background: "#94a3b8" }} />
                <span className="typing-dot" style={{ background: "#94a3b8" }} />
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className={`flex items-center gap-1.5 px-0.5 flex-wrap ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px]" style={{ color: "#94a3b8" }}>
            {formatDateTime(message.created_at)}
          </span>
          {!isUser && <HelixaBadge model={message.model_used} />}
          {!isUser && <RagBadge grounding={message.rag_grounding} sources={message.rag_sources} />}

          {/* Disclaimer — hover icon only, no permanent text */}
          {!isUser && !message.isStreaming && (
            <span
              title="This is for informational purposes only. Not a substitute for professional medical advice."
              className="cursor-help"
              style={{ color: "#cbd5e1" }}
            >
              <Info className="w-3 h-3" />
            </span>
          )}

          {/* TTS button */}
          {!isUser && !message.isStreaming && onSpeak && (
            <button
              onClick={() => onSpeak(content)}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors"
              style={{
                background: isSpeaking ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${isSpeaking ? "#a7f3d0" : "#e2e8f0"}`,
                color: isSpeaking ? "#059669" : "#94a3b8",
              }}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              {isSpeaking ? "Stop" : "Speak"}
            </button>
          )}
        </div>

        {/* Entity tags */}
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

/* ── Follow-up suggestion chips ──────────────────────────────────────────── */
function SuggestionChips({ suggestions, onSelect, disabled }: {
  suggestions: string[]; onSelect: (s: string) => void; disabled: boolean;
}) {
  if (!suggestions.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-1.5 px-1 ml-10">
      <span className="w-full flex items-center gap-1 text-[10px] font-medium" style={{ color: "#94a3b8" }}>
        <Sparkles className="w-3 h-3" /> Suggested follow-ups
      </span>
      {suggestions.map((s, i) => (
        <button key={i} disabled={disabled} onClick={() => onSelect(s)}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all disabled:opacity-50"
          style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; }}
        >
          <ChevronRight className="w-3 h-3" />{s}
        </button>
      ))}
    </motion.div>
  );
}

/* ── Toggle switch ───────────────────────────────────────────────────────── */
function Toggle({ enabled, onChange, label, icon }: {
  enabled: boolean; onChange: () => void; label: string; icon: React.ReactNode;
}) {
  return (
    <button onClick={onChange}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
      style={{
        background: enabled ? "#f0f9ff" : "transparent",
        border: `1px solid ${enabled ? "#bae6fd" : "#e2e8f0"}`,
        color: enabled ? "#0284c7" : "#94a3b8",
      }}
      title={label}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
      <span className="relative w-7 h-3.5 rounded-full ml-1 flex-shrink-0 transition-colors"
        style={{ background: enabled ? "#0284c7" : "#e2e8f0" }}>
        <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all"
          style={{ left: enabled ? "calc(100% - 12px)" : "2px" }} />
      </span>
    </button>
  );
}

/* ── Update videos for sidebar panel ────────────────────────────────────── */
const UPDATE_VIDEOS = [
  { src: "/videos/vid_3.mp4", label: "Personalize treatment plans" },
  { src: "/videos/vid_2.mp4", label: "Vision analysis" },
  { src: "/videos/vid_3.mp4", label: "Voice assistance" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput]           = useState("");
  const [streamingMsg, setStreamingMsg] = useState<{ content: string } | null>(null);
  // Optimistic state bundles text + image preview so they're always in sync
  const [optimistic, setOptimistic] = useState<{ text: string; imageUrl: string | null } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [wakeEnabled, setWakeEnabled] = useState(false);

  const threadRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const speakingMsgRef = useRef<string | null>(null);

  const { streamMessage, isStreaming, abort } = useStreamChat();
  const { speak, stopSpeaking, toggleTTS, ttsState, isTTSEnabled, isSupported: ttsOk } = useTTS();
  const { state: micState, isSupported: micOk, start: startMic, stop: stopMic } = useMicInput();
  const recording = micState === "recording";

  /* ── Wake word ─────────────────────────────────────────────────────────── */
  // Both refs updated every render so handlers never hold stale closures
  const startRecordingRef = useRef<() => void>(() => {});
  const handleWakeRef = useRef<() => void>(() => {});
  handleWakeRef.current = () => {
    if (!activeSessionId) {
      toast.info("Start a conversation first, then use the wake word.");
      return;
    }
    toast.success("Listening…", { duration: 1500 });
    startRecordingRef.current();
  };
  const handleWake = useCallback(() => handleWakeRef.current(), []);

  const { state: wakeState, start: startWake, stop: stopWake, isSupported: wakeOk } =
    useWakeWord({ onWake: handleWake });

  const toggleWake = useCallback(() => {
    if (wakeEnabled) { stopWake(); setWakeEnabled(false); }
    else             { startWake(); setWakeEnabled(true); }
  }, [wakeEnabled, startWake, stopWake]);

  /* ── Sessions ──────────────────────────────────────────────────────────── */
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
    mutationFn: () => api.post("/api/chat/sessions", { title: "New conversation" }).then(r => r.data),
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions() }); setActiveSessionId(s.id); setSuggestions([]); },
    onError: () => toast.error("Failed to create conversation"),
  });
  const deleteSession = useMutation({
    mutationFn: (id: string) => api.delete(`/api/chat/sessions/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions() });
      if (activeSessionId === id) { setActiveSessionId(null); setSuggestions([]); }
    },
    onError: () => toast.error("Failed to delete conversation"),
  });
  const renameSession = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.patch(`/api/chat/sessions/${id}`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions() }),
    onError: () => toast.error("Failed to rename conversation"),
  });

  const messages: ChatMessage[] = activeSession?.messages ?? [];

  /* ── Scroll ────────────────────────────────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages.length, streamingMsg?.content, optimistic, scrollToBottom]);

  /* ── Image → base64 (browser-side, no server upload) ──────────────────── */
  const readImageAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ── Send ──────────────────────────────────────────────────────────────── */
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if ((!msg && !imageFile) || !activeSessionId) return;

    // Capture before clearing — needed for the optimistic bubble
    const capturedFile = imageFile;
    const capturedPreviewUrl = imagePreviewUrl;

    // Encode image to base64 in the browser — no server upload, no proxy issues
    let imageAttachment: ImageAttachment | null = null;
    if (capturedFile) {
      try {
        const dataUrl = await readImageAsDataURL(capturedFile);
        imageAttachment = { data: dataUrl, mediaType: capturedFile.type || "image/jpeg" };
      } catch (e) {
        console.error("Image read failed", e);
        toast.error("Could not read image file — sending text only");
      }
      setImageFile(null);
      setImagePreviewUrl(null);
    }

    setInput("");
    setSuggestions([]);
    // Set both text and image URL atomically so the optimistic bubble always renders both
    setOptimistic({ text: msg, imageUrl: capturedPreviewUrl });
    setStreamingMsg({ content: "" });

    let fullResponse = "";
    try {
      const result = await streamMessage(activeSessionId, msg, (chunk) => {
        fullResponse += chunk;
        setStreamingMsg(prev => ({ content: (prev?.content ?? "") + chunk }));
      }, imageAttachment);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
      if (isTTSEnabled && fullResponse) speak(fullResponse);
    } catch (err) {
      console.error("Stream error", err);
      toast.error("Failed to get a response — please try again");
    } finally {
      setOptimistic(null);
      setStreamingMsg(null);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSession(activeSessionId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions() });
    }
  }, [input, imageFile, activeSessionId, streamMessage, isTTSEnabled, speak, qc]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Recording (browser SpeechRecognition — no server dependency) ────── */
  const startRecording = useCallback(() => {
    if (!micOk) { toast.error("Voice input not supported in this browser"); return; }
    startMic((transcript) => {
      if (!transcript) { toast.info("No speech detected — please try again"); return; }
      if (wakeEnabled) {
        handleSend(transcript);
      } else {
        setInput(prev => (prev ? prev + " " : "") + transcript);
        inputRef.current?.focus();
      }
    });
  }, [micOk, startMic, wakeEnabled, handleSend]);
  // Keep ref current so handleWakeRef (declared above) can always call the latest version
  startRecordingRef.current = startRecording;

  const stopRecording = useCallback(() => stopMic(), [stopMic]);

  /* ── TTS per-message ───────────────────────────────────────────────────── */
  const handleSpeakMessage = (text: string) => {
    if (ttsState === "speaking" && speakingMsgRef.current === text) {
      stopSpeaking(); speakingMsgRef.current = null;
    } else {
      speakingMsgRef.current = text; speak(text);
    }
  };

  /* ── Orb state ─────────────────────────────────────────────────────────── */
  const orbState =
    ttsState === "speaking"           ? "speaking"            :
    micState === "recording"          ? "recording"           :
    wakeEnabled && wakeState === "listening_for_wake" ? "listening_for_wake" :
    "idle";

  /* ── Image pick ────────────────────────────────────────────────────────── */
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image too large (max 10 MB)"); return; }
    // Revoke any previous object URL before creating a new one
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleImageRemove = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  /* ── Pinned sessions (local state, persisted to localStorage) ─────────── */
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("helixa_pinned") ?? "[]")); }
    catch { return new Set(); }
  });

  const togglePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("helixa_pinned", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const pinned  = sessions.filter(s => pinnedIds.has(s.id));
  const recents = sessions.filter(s => !pinnedIds.has(s.id));

  /* ── Update video carousel (sidebar panel) ─────────────────────────────── */
  const [updateVidIdx, setUpdateVidIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUpdateVidIdx(i => (i + 1) % UPDATE_VIDEOS.length), 8000);
    return () => clearInterval(t);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        /* ── Scrollbars ── */
        .chat-thread::-webkit-scrollbar,
        .sidebar-list::-webkit-scrollbar { width: 3px; }
        .chat-thread::-webkit-scrollbar-track,
        .sidebar-list::-webkit-scrollbar-track { background: transparent; }
        .chat-thread::-webkit-scrollbar-thumb,
        .sidebar-list::-webkit-scrollbar-thumb { background: #CBC5D9; border-radius: 4px; }

        /* ── Prose ── */
        .prose-chat p            { margin: 0 0 0.45em; }
        .prose-chat p:last-child { margin-bottom: 0; }
        .prose-chat ul, .prose-chat ol { padding-left: 1.2em; margin: 0.2em 0; }
        .prose-chat li           { margin: 0.1em 0; }
        .prose-chat strong       { font-weight: 600; }
        .prose-chat h2, .prose-chat h3 { font-size: 0.9em; font-weight: 700; margin: 0.6em 0 0.2em; }
        .prose-chat hr           { margin: 0.4em 0; border-color: #E3E0EA; }

        /* ── Input ── */
        .chat-input::placeholder { color: #8B8894; font-size: 13.5px; }
        .chat-input:focus        { outline: none; }

        /* ── Mic pulse ── */
        @keyframes mic-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
          50%     { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
        .mic-active { animation: mic-pulse 1.2s ease infinite; }

        /* ── Chat background orbs ── */
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-20px) scale(1.04); }
        }
        .chat-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .chat-bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.18;
          animation: float 6s ease-in-out infinite;
        }

        /* ── Input glow on focus ── */
        .input-wrap:focus-within {
          border-color: #9D93C1 !important;
          box-shadow: 0 0 0 3px rgba(157,147,193,0.15) !important;
        }

        /* ── Sidebar section label ── */
        .sidebar-section {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #8B8894;
          padding: 8px 10px 4px;
        }
      `}</style>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

      <div className="flex h-screen overflow-hidden bg-surface-bg font-sans">

        {/* ══════════════════════════════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════════════════════════════ */}
        <div className="w-56 flex-shrink-0 flex flex-col bg-surface-card"
          style={{ borderRight: "1px solid #E3E0EA" }}>

          {/* Logo + new chat */}
          <div className="p-3 flex-shrink-0 space-y-2.5" style={{ borderBottom: "1px solid #E3E0EA" }}>
            <div className="flex items-center gap-2 px-1 py-0.5">
              <Image src="/images/Logo.png" alt="Helixa" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-sm tracking-tight" style={{ color: "#2A2830" }}>Helixa</span>
            </div>
            <button onClick={() => createSession.mutate()} disabled={createSession.isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "linear-gradient(135deg,#9D93C1,#7C6FA0)", color: "#fff", boxShadow: "0 4px 14px rgba(157,147,193,.35)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              {createSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              New conversation
            </button>
          </div>

          {/* Session list */}
          <div className="sidebar-list flex-1 overflow-y-auto py-1">

            {sessions.length === 0 && (
              <p className="text-center py-10 text-[11px] text-ink-faint">No conversations yet</p>
            )}

            {/* Pinned group */}
            {pinned.length > 0 && (
              <>
                <div className="sidebar-section flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </div>
                {pinned.map(s => <SidebarItem key={s.id} s={s} active={s.id === activeSessionId}
                  pinned onSelect={() => { setActiveSessionId(s.id); setSuggestions([]); }}
                  onPin={e => togglePin(s.id, e)}
                  onDelete={e => { e.stopPropagation(); deleteSession.mutate(s.id); }}
                  onRename={(id, title) => renameSession.mutate({ id, title })} />)}
              </>
            )}

            {/* Recent group */}
            {recents.length > 0 && (
              <>
                {pinned.length > 0 && <div className="sidebar-section mt-1">Recent</div>}
                {recents.map(s => <SidebarItem key={s.id} s={s} active={s.id === activeSessionId}
                  pinned={false} onSelect={() => { setActiveSessionId(s.id); setSuggestions([]); }}
                  onPin={e => togglePin(s.id, e)}
                  onDelete={e => { e.stopPropagation(); deleteSession.mutate(s.id); }}
                  onRename={(id, title) => renameSession.mutate({ id, title })} />)}
              </>
            )}
          </div>

          {/* Updates video panel */}
          <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid #E3E0EA" }}>
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#EDEBF2" }}>
              <AnimatePresence mode="wait">
                <motion.video
                  key={UPDATE_VIDEOS[updateVidIdx].src}
                  src={UPDATE_VIDEOS[updateVidIdx].src}
                  autoPlay muted loop playsInline
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                style={{ background: "linear-gradient(to top, rgba(42,40,48,0.75) 0%, transparent 100%)" }}>
                <p className="text-[10px] font-medium text-white truncate">
                  {UPDATE_VIDEOS[updateVidIdx].label}
                </p>
              </div>
              {/* Dot indicators */}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {UPDATE_VIDEOS.map((_, i) => (
                  <button key={i} onClick={() => setUpdateVidIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === updateVidIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-ink-faint mt-1.5 text-center">What&apos;s new in Helixa</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN AREA
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: "#FAFAFC" }}>

          {/* Wake-word banner */}
          <AnimatePresence>
            {wakeEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(90deg,#EDEBF2,#F7F6FA)", borderBottom: "1px solid #E3E0EA", color: "#7C6FA0" }}>
                <Radio className="w-3 h-3 animate-pulse" />
                Wake word active — say &ldquo;Hey Helixa&rdquo; to start speaking
              </motion.div>
            )}
          </AnimatePresence>

          {activeSessionId ? (
            <>
              {/* Subtle flowing background orbs */}
              <div className="chat-bg">
                <div className="chat-bg-orb w-96 h-96 -top-20 -right-20"
                  style={{ background: "#9D93C1", animationDelay: "0s" }} />
                <div className="chat-bg-orb w-80 h-80 bottom-10 -left-10"
                  style={{ background: "#B3AAD0", animationDelay: "2s" }} />
                <div className="chat-bg-orb w-60 h-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ background: "#EDEBF2", animationDelay: "4s" }} />
              </div>

              {/* Thread */}
              <div ref={threadRef} className="chat-thread relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg}
                    onSpeak={ttsOk ? handleSpeakMessage : undefined}
                    isSpeaking={ttsState === "speaking" && speakingMsgRef.current === msg.content} />
                ))}

                {/* Optimistic user bubble */}
                {optimistic && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: [0.16, 1, 0.3, 1] }}
                    className="flex gap-3 flex-row-reverse">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#EDEBF2", border: "1px solid #CBC5D9" }}>
                      <User className="w-3.5 h-3.5" style={{ color: "#7C6FA0" }} />
                    </div>
                    <div className="flex flex-col gap-1.5 max-w-[72%] items-end">
                      {optimistic.imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={optimistic.imageUrl} alt="attached image" className="rounded-xl object-cover"
                          style={{ maxWidth: "200px", maxHeight: "200px", border: "1px solid #CBC5D9" }} />
                      )}
                      {optimistic.text && (
                        <div style={{
                          background: "linear-gradient(135deg,#9D93C1,#7C6FA0)", color: "#fff",
                          borderRadius: optimistic.imageUrl ? "12px 12px 4px 12px" : "16px 16px 4px 16px",
                          padding: "9px 14px", fontSize: "14px", lineHeight: "1.6", wordBreak: "break-word",
                        }}>
                          {optimistic.text}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Streaming AI bubble */}
                {streamingMsg !== null && (
                  <MessageBubble message={{
                    id: "stream", session_id: activeSessionId!, role: "assistant", content: "",
                    image_data: null, created_at: new Date().toISOString(),
                    model_used: null, extracted_entities: null, rag_sources: null, rag_grounding: null,
                    isStreaming: true, streamContent: streamingMsg.content,
                  } as ChatMessage & { isStreaming: boolean; streamContent: string }} />
                )}

                {/* Follow-up chips */}
                {!isStreaming && suggestions.length > 0 && (
                  <SuggestionChips suggestions={suggestions}
                    onSelect={s => { setInput(s); inputRef.current?.focus(); }}
                    disabled={isStreaming} />
                )}
              </div>

              {/* ── Input area ─────────────────────────────────────────────── */}
              <div className="relative z-10 flex-shrink-0 px-4 pb-4 pt-2"
                style={{ borderTop: "1px solid #E3E0EA", background: "rgba(250,250,252,0.92)", backdropFilter: "blur(8px)" }}>

                {/* Image preview strip */}
                <AnimatePresence>
                  {imageFile && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="mb-2.5 flex items-center gap-2.5">
                      <ImagePreview file={imageFile} onRemove={handleImageRemove} />
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "#4A4750" }}>Image attached</p>
                        <p className="text-[10px]" style={{ color: "#8B8894" }}>Helixa vision AI will analyze it</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input box */}
                <div className="input-wrap flex items-end gap-2 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: "#fff",
                    border: `1px solid ${recording ? "#fca5a5" : "#E3E0EA"}`,
                    boxShadow: recording ? "0 0 0 3px rgba(239,68,68,0.12)" : "0 1px 3px rgba(15,23,42,.04)",
                  }}>
                  <textarea ref={inputRef} value={input}
                    onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={recording ? "Listening…" : "Ask Helixa about your health…"}
                    rows={1} className="chat-input flex-1 bg-transparent resize-none font-sans"
                    style={{ color: "#2A2830", minHeight: "22px", maxHeight: "120px", caretColor: "#9D93C1", fontSize: "14px", lineHeight: "1.6" }} />

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => imageInputRef.current?.click()} disabled={isStreaming}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: imageFile ? "#EDEBF2" : "transparent", color: imageFile ? "#7C6FA0" : "#8B8894" }}
                      title="Attach image"
                      onMouseEnter={e => { if (!imageFile) e.currentTarget.style.color = "#4A4750"; }}
                      onMouseLeave={e => { if (!imageFile) e.currentTarget.style.color = "#8B8894"; }}>
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    <button onClick={recording ? stopRecording : startRecording} disabled={isStreaming}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${recording ? "mic-active" : ""}`}
                      style={{ background: recording ? "#fef2f2" : "transparent", color: recording ? "#dc2626" : "#8B8894" }}
                      title={recording ? "Stop recording" : "Voice input"}
                      onMouseEnter={e => { if (!recording && !isStreaming) e.currentTarget.style.color = "#4A4750"; }}
                      onMouseLeave={e => { if (!recording) e.currentTarget.style.color = "#8B8894"; }}>
                      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {isStreaming ? (
                      <button onClick={abort}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "#fef2f2", color: "#dc2626" }} title="Stop generating">
                        <StopCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleSend()}
                        disabled={(!input.trim() && !imageFile) || isStreaming}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          background: (!input.trim() && !imageFile)
                            ? "#EDEBF2"
                            : "linear-gradient(135deg,#9D93C1,#7C6FA0)",
                          color: (!input.trim() && !imageFile) ? "#B3AAD0" : "#fff",
                          boxShadow: (!input.trim() && !imageFile) ? "none" : "0 4px 10px rgba(157,147,193,.4)",
                        }} title="Send">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between mt-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    {wakeOk && (
                      <Toggle enabled={wakeEnabled} onChange={toggleWake}
                        label="Wake word" icon={<Radio className="w-3 h-3" />} />
                    )}
                    {ttsOk && (
                      <Toggle enabled={isTTSEnabled} onChange={toggleTTS}
                        label="Voice reply" icon={<Volume2 className="w-3 h-3" />} />
                    )}
                  </div>
                  <p className="text-[10px] text-ink-faint">↵ send · ⇧↵ new line</p>
                </div>
              </div>
            </>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               LAUNCH SCREEN
            ══════════════════════════════════════════════════════════════ */
            <div className="flex-1 flex flex-col items-center justify-center gap-0 relative overflow-hidden">
              {/* Background orbs */}
              <div className="chat-bg">
                <div className="chat-bg-orb w-[500px] h-[500px] -top-32 -right-32"
                  style={{ background: "#9D93C1", animationDelay: "0s" }} />
                <div className="chat-bg-orb w-96 h-96 -bottom-20 -left-20"
                  style={{ background: "#B3AAD0", animationDelay: "2.5s" }} />
              </div>

              <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg px-6">

                {/* Logo + wordmark — bare, no container box */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-3">
                  <Image src="/images/Logo.png" alt="Helixa" width={72} height={72} className="drop-shadow-md" />
                  <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#2A2830" }}>
                      Helixa AI Health Assistant
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#636262" }}>
                      Voice · Vision · Intelligence all in one place
                    </p>
                  </div>
                </motion.div>

                {/* Intro video — full width, taller */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-2xl overflow-hidden shadow-xl"
                  style={{ border: "1px solid #E3E0EA", aspectRatio: "16/8" }}>
                  <video
                    src="/videos/vid_6.mp4"
                    autoPlay muted loop playsInline
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* CTA — GifButton */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <GifButton
                    label="Start a conversation"
                    onClick={() => createSession.mutate()}
                    loading={createSession.isPending}
                  />
                </motion.div>

                <p className="text-[11px] text-ink-faint text-center">
                  Say <span className="font-semibold" style={{ color: "#7C6FA0" }}>&ldquo;Hey Helixa&rdquo;</span> after enabling wake word · Upload images for AI vision analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating orb */}
      <AnimatePresence>
        <VoiceOrb state={orbState} />
      </AnimatePresence>
    </>
  );
}

/* ── Sidebar session item with inline rename ──────────────────────────────── */
function SidebarItem({ s, active, pinned, onSelect, onPin, onDelete, onRename }: {
  s: { id: string; title: string };
  active: boolean;
  pinned: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(s.title);
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  };

  const commit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== s.title) onRename(s.id, trimmed);
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { commit(e); }
    else if (e.key === "Escape") { setEditing(false); }
  };

  return (
    <div
      onClick={editing ? undefined : onSelect}
      className="flex items-center gap-2 mx-1.5 px-2.5 py-2 rounded-lg cursor-pointer group transition-all"
      style={{
        background: active ? "#EDEBF2" : "transparent",
        border: `1px solid ${active ? "#CBC5D9" : "transparent"}`,
        cursor: editing ? "default" : "pointer",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F7F6FA"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>

      <MessageSquare className="w-3 h-3 flex-shrink-0" style={{ color: active ? "#7C6FA0" : "#8B8894" }} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={e => e.stopPropagation()}
          className="flex-1 text-xs font-medium bg-white rounded px-1.5 py-0.5 outline-none min-w-0"
          style={{ color: "#2A2830", border: "1px solid #9D93C1", boxShadow: "0 0 0 2px rgba(157,147,193,.2)" }}
        />
      ) : (
        <span className="text-xs flex-1 truncate font-medium" style={{ color: active ? "#2A2830" : "#4A4750" }}>
          {s.title}
        </span>
      )}

      <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${editing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {editing ? (
          <button onClick={commit} title="Save"
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ color: "#7C6FA0" }}>
            <Check className="w-2.5 h-2.5" />
          </button>
        ) : (
          <button onClick={startEdit} title="Rename"
            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
            style={{ color: "#8B8894" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#7C6FA0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8B8894")}>
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
        <button onClick={onPin} title={pinned ? "Unpin" : "Pin"}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ color: pinned ? "#7C6FA0" : "#8B8894" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#7C6FA0")}
          onMouseLeave={e => (e.currentTarget.style.color = pinned ? "#7C6FA0" : "#8B8894")}>
          <Pin className="w-2.5 h-2.5" />
        </button>
        <button onClick={onDelete} title="Delete"
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ color: "#8B8894" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
          onMouseLeave={e => (e.currentTarget.style.color = "#8B8894")}>
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
