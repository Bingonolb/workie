"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, Smile } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/messages";
import type { Message } from "@/lib/types";

const QUICK_EMOJIS = ["❤️", "😍", "🔥", "👍", "🙏", "😂", "⌚", "🤝", "💰", "✨"];

export function ChatWindow({
  matchId,
  currentUserId,
  otherUsername,
  otherAvatarUrl,
  otherWatchLabel,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  otherUsername: string;
  otherAvatarUrl?: string | null;
  otherWatchLabel: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = text ?? draft;
    if (!content.trim()) return;
    setDraft("");
    setShowEmojis(false);
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      match_id: matchId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    startTransition(() => {
      sendMessage(matchId, content);
    });
  };

  const addEmoji = (emoji: string) => {
    setDraft((d) => d + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
        <Link href="/messages" className="text-neutral-400 transition hover:text-neutral-700">
          <ArrowLeft size={20} />
        </Link>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200">
          {otherAvatarUrl && (
            <Image src={otherAvatarUrl} alt={otherUsername} width={40} height={40} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-semibold tracking-tight">{otherUsername}</p>
          <p className="text-xs text-neutral-400">{otherWatchLabel}</p>
        </div>
      </div>

      <div
        className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5"
        style={{ background: "linear-gradient(180deg, #fafaf9 0%, #f5f4f2 100%)" }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug shadow-sm ${
                    mine
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-white text-neutral-800 ring-1 ring-neutral-100"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="relative border-t border-neutral-100 bg-white p-3">
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-full left-3 mb-2 flex gap-1 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-neutral-100"
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => addEmoji(e)}
                  className="rounded-lg p-1.5 text-xl transition hover:scale-125 hover:bg-neutral-50"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojis((s) => !s)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
              showEmojis ? "bg-gold/20 text-gold-dark" : "text-neutral-400 hover:bg-neutral-50"
            }`}
          >
            <Smile size={20} />
          </button>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setShowEmojis(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Écris un message..."
            className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={isPending || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition disabled:opacity-40"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
