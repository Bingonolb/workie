"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Briefcase, CheckCheck, ArrowLeft, MessageCircle } from "lucide-react";
import { getNotifications, markAllRead, markRead, type Notification } from "@/lib/actions/notifications";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new_job_offer: {
    icon: <Briefcase size={16} />,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
  review_reply: {
    icon: <MessageCircle size={16} />,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = () => {
    getNotifications().then(r => {
      setNotifications(r.notifications);
      setUnread(r.unread);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    });
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "40px 20px 80px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
          <ArrowLeft size={15} /> Retour
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Notifications</h1>
        {unread > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, background: "#8b5cf6", color: "#fff", borderRadius: 50, padding: "2px 8px" }}>
            {unread}
          </span>
        )}
        {unread > 0 && (
          <button onClick={handleMarkAllRead} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
            <CheckCheck size={14} /> Tout lire
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, background: "var(--surface2)", borderRadius: 14, border: "1px solid var(--border)" }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <Bell size={44} style={{ opacity: 0.15, margin: "0 auto 20px", display: "block" }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Aucune notification</p>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            Sauvegarde des entreprises pour recevoir leurs nouvelles offres d&apos;emploi.
          </p>
          <Link href="/explore" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>
            Explorer les entreprises →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] ?? { icon: <Bell size={16} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" };
            const data = n.data as Record<string, string>;
            const href = n.type === "review_reply" && data.company_id
              ? `/company/${data.company_id}#avis`
              : n.type === "new_job_offer" && data.company_id
              ? `/company/${data.company_id}`
              : "/jobs";

            return (
              <Link
                key={n.id}
                href={href}
                onClick={() => !n.read && handleMarkRead(n.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "16px 18px", borderRadius: 14, textDecoration: "none",
                  background: n.read ? "var(--surface)" : "var(--surface2)",
                  border: `1px solid ${n.read ? "var(--border)" : "rgba(139,92,246,0.25)"}`,
                  position: "relative",
                  transition: "border-color 0.15s",
                }}
              >
                {/* Unread dot */}
                {!n.read && (
                  <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6" }} />
                )}

                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: n.read ? 600 : 800, color: "var(--text)", marginBottom: 2, lineHeight: 1.3 }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.body}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
