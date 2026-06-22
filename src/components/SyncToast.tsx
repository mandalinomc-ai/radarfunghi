"use client";

interface SyncToastProps {
  message: string | null;
  onDismiss: () => void;
  tone?: "warning" | "success";
}

export default function SyncToast({
  message,
  onDismiss,
  tone = "warning",
}: SyncToastProps) {
  if (!message) return null;

  const styles =
    tone === "success"
      ? {
          box: "bg-green-950/95 border-green-500/40",
          icon: "text-green-300",
          text: "text-green-100",
          btn: "text-green-400 hover:text-green-200",
        }
      : {
          box: "bg-orange-950/95 border-orange-500/40",
          icon: "text-orange-300",
          text: "text-orange-100",
          btn: "text-orange-400 hover:text-orange-200",
        };

  return (
    <div className="fixed top-[calc(var(--safe-top)+72px)] left-1/2 -translate-x-1/2 z-[1200] pointer-events-auto px-3 max-w-[92vw] md:max-w-md animate-in fade-in slide-in-from-top-2">
      <div
        className={`flex items-start gap-2 border rounded-xl px-4 py-3 shadow-2xl ${styles.box}`}
      >
        <span className={`text-sm shrink-0 ${styles.icon}`}>
          {tone === "success" ? "🍄" : "⚠"}
        </span>
        <p className={`text-xs leading-relaxed flex-1 ${styles.text}`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 text-sm px-1 ${styles.btn}`}
          aria-label="Chiudi"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
