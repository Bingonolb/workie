"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Briefcase, CheckCheck, MessageCircle, Trash2, MoreHorizontal, X } from "lucide-react";
import { markAllRead, markRead, deleteNotification, getNotifications, type Notification } from "@/lib/actions/notifications";

/* ── helpers ── */
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

const TYPE_CFG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new_job_offer: { icon: <Briefcase size={15} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  review_reply:  { icon: <MessageCircle size={15} />, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

/* ── single item ── */
function NotifItem({ n, onRead, onDelete, onClose }: {
  n: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? { icon: <Bell size={15} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" };
  const data = n.data as Record<string, string>;
  const href = n.type === "review_reply" && data.company_id
    ? `/company/${data.company_id}#avis`
    : n.type === "new_job_offer" && data.company_id
    ? `/company/${data.company_id}`
    : "/explore";

  const [menuOpen, setMenuOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const triggerDelete = async () => {
    setMenuOpen(false);
    setExiting(true);
    await onDelete(n.id);
  };

  return (
    <div style={{
      opacity: exiting ? 0 : 1,
      maxHeight: exiting ? 0 : 200,
      overflow: "hidden",
      transition: "all 0.22s ease",
    }}>
      <Link
        href={href}
        onClick={(e) => {
          if (menuOpen) { e.preventDefault(); return; }
          if (!n.read) onRead(n.id);
          onClose();
        }}
        style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          padding: "12px 14px", borderRadius: 12, textDecoration: "none",
          background: n.read ? "transparent" : "rgba(139,92,246,0.05)",
          border: `1px solid ${n.read ? "transparent" : "rgba(139,92,246,0.15)"}`,
          transition: "background 0.15s",
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: n.read ? 600 : 800, color: "var(--text)", marginBottom: 2, lineHeight: 1.35 }}>
            {n.title}
          </p>
          {n.body && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {n.body}
            </p>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{timeAgo(n.created_at)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#8b5cf6", marginTop: 4 }} />}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, background: menuOpen ? "var(--surface3,var(--border))" : "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); }} />
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: 160, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 10, overflow: "hidden" }}>
                  {!n.read && (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onRead(n.id); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>
                      <CheckCheck size={13} color="var(--text-muted)" /> Marquer comme lu
                    </button>
                  )}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerDelete(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={13} /> Supprimer
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

/* ── main component ── */
export function NavBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const openDrawer = async () => {
    setOpen(true);
    if (notifications === null) {
      setLoading(true);
      const { notifications: notifs } = await getNotifications();
      setNotifications(notifs);
      setLoading(false);
    }
  };

  const closeDrawer = () => setOpen(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleRead = (id: string) => {
    setNotifications(prev => prev?.map(n => n.id === id ? { ...n, read: true } : n) ?? null);
    setUnread(prev => Math.max(0, prev - 1));
    markRead(id);
  };

  const handleDelete = async (id: string) => {
    const notif = notifications?.find(n => n.id === id);
    const ok = await deleteNotification(id);
    if (!ok) return;
    setNotifications(prev => prev?.filter(n => n.id !== id) ?? null);
    if (notif && !notif.read) setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev?.map(n => ({ ...n, read: true })) ?? null);
    setUnread(0);
  };

  return (
    <>
      {/* Bell button */}
      <button
        type="button"
        onClick={openDrawer}
        aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", cursor: "pointer" }}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 50, background: "#8b5cf6", color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        style={{
          position: "fixed", inset: 0, zIndex: 10099,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(400px, 100vw)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.15)",
          zIndex: 10100,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Notifications</span>
            {unread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, background: "#8b5cf6", color: "#fff", borderRadius: 50, padding: "2px 7px" }}>{unread}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAllRead} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
                <CheckCheck size={13} /> Tout lire
              </button>
            )}
            <button type="button" onClick={closeDrawer} aria-label="Fermer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "12px 16px 40px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 68, borderRadius: 12, background: "var(--surface2)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
            </div>
          )}

          {!loading && notifications?.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <Bell size={40} style={{ opacity: 0.15, margin: "0 auto 16px", display: "block" }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucune notification</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Sauvegarde des entreprises pour recevoir leurs nouvelles offres d&apos;emploi.</p>
              <Link href="/explore" onClick={closeDrawer} style={{ fontSize: 13, color: "#8b5cf6", fontWeight: 700, textDecoration: "none" }}>
                Explorer les entreprises →
              </Link>
            </div>
          )}

          {!loading && notifications && notifications.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {notifications.map(n => (
                <NotifItem key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} onClose={closeDrawer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
