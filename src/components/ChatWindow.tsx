"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/messages";
import type { Message } from "@/lib/types";

export function ChatWindow({
  matchId,
  currentUserId,
  otherUsername,
  otherWatchLabel,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  otherUsername: string;
  otherWatchLabel: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const handleSend = () => {
    const content = draft;
    if (!content.trim()) return;
    setDraft("");
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <Link href="/messages" className="text-neutral-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-semibold">{otherUsername}</p>
          <p className="text-xs text-neutral-500">{otherWatchLabel}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-brand text-white" : "bg-white text-neutral-800 shadow-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écris un message..."
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
