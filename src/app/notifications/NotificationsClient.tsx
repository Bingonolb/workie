"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, Briefcase, CheckCheck, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import { markAllRead, markRead, deleteNotification, type Notification } from "@/lib/actions/notifications";

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
  new_job_offer: { icon: <Briefcase size={16} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  review_reply:  { icon: <MessageCircle size={16} />, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

function NotificationItem({ n, onRead, onDelete }: {
  n: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const cfg = TYPE_CONFIG[n.type] ?? { icon: <Bell size={16} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" };
  const data = n.data as Record<string, string>;
  const href = n.type === "review_reply" && data.company_id
    ? `/company/${data.company_id}#avis`
    : n.type === "new_job_offer" && data.company_id
    ? `/company/${data.company_id}`
    : "/jobs";

  const [menuOpen, setMenuOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const triggerDelete = async () => {
    setMenuOpen(false);
    setExiting(true);
    await onDelete(n.id);
  };

  return (
    <div style={{
      opacity: exiting ? 0 : 1,
      transform: exiting ? "scale(0.97) translateY(-4px)" : "none",
      transition: exiting ? "all 0.22s ease" : "none",
      maxHeight: exiting ? 0 : 200,
      overflow: "hidden",
    }}>
      <Link
        href={href}
        onClick={(e) => {
          if (menuOpen) { e.preventDefault(); return; }
          if (!n.read) onRead(n.id);
        }}
        style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "14px 16px", borderRadius: 14, textDecoration: "none",
          background: n.read ? "var(--surface)" : "var(--surface2)",
          border: `1px solid ${n.read ? "var(--border)" : "rgba(139,92,246,0.25)"}`,
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: n.read ? 600 : 800, color: "var(--text)", marginBottom: 2, lineHeight: 1.3 }}>
            {n.title}
          </p>
          {n.body && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {n.body}
            </p>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{timeAgo(n.created_at)}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          {!n.read && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", marginTop: 2 }} />
          )}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); }}
              className="notif-menu-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 7,
                background: menuOpen ? "var(--surface3)" : "transparent",
                border: "none", cursor: "pointer", color: "var(--text-muted)",
              }}
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop to close menu on outside tap (mobile-friendly) */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 9 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }}
                />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  width: 160, background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
                  zIndex: 10, overflow: "hidden",
                }}>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onRead(n.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", textAlign: "left" }}
                    >
                      <CheckCheck size={14} color="var(--text-muted)" /> Marquer comme lu
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerDelete(); }}
                    style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer", textAlign: "left" }}
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function NotificationsClient({ initialNotifications, initialUnread }: {
  initialNotifications: Notification[];
  initialUnread: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    markRead(id);
  };

  const handleDelete = async (id: string): Promise<void> => {
    const notif = notifications.find(n => n.id === id);
    const ok = await deleteNotification(id);
    if (!ok) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "40px 20px 100px", maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
          ← Retour
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

      {notifications.length === 0 ? (
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
          {notifications.map(n => (
            <NotificationItem key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <style>{`
        .notif-menu-btn { opacity: 0.4; transition: opacity 0.15s, background 0.15s; }
        .notif-menu-btn:hover { opacity: 1; background: var(--surface3) !important; }
        @media (max-width: 768px) { .notif-menu-btn { opacity: 1; } }
      `}</style>
    </div>
  );
}
