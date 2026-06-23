"use client";

import dynamic from "next/dynamic";
import { useGlobalChat } from "@/context/GlobalChatContext";
import MastroChatFab from "@/components/MastroChatFab";

const MushroomChatPanel = dynamic(
  () => import("@/components/MushroomChatPanel"),
  { ssr: false }
);

export default function GlobalChatDock() {
  const { chatOpen, setChatOpen, messages, loading, sendMessage } =
    useGlobalChat();

  return (
    <>
      <MastroChatFab
        onClick={() => setChatOpen(!chatOpen)}
        hidden={chatOpen}
      />
      {chatOpen && (
        <div className="fixed bottom-0 right-0 left-0 md:left-auto md:w-[420px] z-[2400] p-3 md:p-4 safe-bottom pointer-events-auto">
          <div className="enterprise-panel rounded-2xl border border-neon/25 shadow-2xl overflow-hidden max-h-[min(70dvh,640px)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-enterprise-border/50 bg-enterprise-panel/90">
              <p className="text-sm font-semibold text-sage-100">
                Mastro Fungaiolo
              </p>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="text-sage-400 hover:text-sage-200 text-lg px-2 touch-manipulation"
                aria-label="Chiudi chat"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <MushroomChatPanel
                messages={messages}
                loading={loading}
                onSend={sendMessage}
                onClear={() => {}}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
