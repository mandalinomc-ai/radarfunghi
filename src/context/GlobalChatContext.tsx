"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMushroomChat } from "@/hooks/useMushroomChat";
import type { MushroomChatContext } from "@/lib/mushroomChatEngine";
import { useRadarSearch } from "@/context/RadarSearchContext";

interface GlobalChatContextValue {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  sendMessage: (text: string) => void;
  messages: ReturnType<typeof useMushroomChat>["messages"];
  loading: boolean;
  openWithMessage: (text: string) => void;
}

const GlobalChatContext = createContext<GlobalChatContextValue | null>(null);

export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const radar = useRadarSearch();

  const chatContext: MushroomChatContext = useMemo(
    () => ({
      liveZones: radar.liveZones,
      hotspots: radar.filteredHotspots,
      criteria: radar.criteria,
      defaultRangeKm: radar.rangeKm,
      lastUpdate: radar.lastUpdated,
      liveData: radar.liveData,
    }),
    [radar]
  );

  const chat = useMushroomChat(chatContext, {
    onRecommendedZone: (zoneId) => {
      const match = radar.filteredHotspots.find((h) => h.zone.id === zoneId);
      if (match) radar.setSelectedHotspot(match);
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      void chat.sendMessage(text);
    },
    [chat]
  );

  const openWithMessage = useCallback(
    (text: string) => {
      setChatOpen(true);
      void chat.sendMessage(text);
    },
    [chat]
  );

  const value = useMemo(
    () => ({
      chatOpen,
      setChatOpen,
      toggleChat: () => setChatOpen((v) => !v),
      sendMessage,
      messages: chat.messages,
      loading: chat.loading,
      openWithMessage,
    }),
    [chatOpen, sendMessage, chat.messages, chat.loading, openWithMessage]
  );

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
    </GlobalChatContext.Provider>
  );
}

export function useGlobalChat(): GlobalChatContextValue {
  const ctx = useContext(GlobalChatContext);
  if (!ctx) {
    throw new Error("useGlobalChat requires GlobalChatProvider");
  }
  return ctx;
}
