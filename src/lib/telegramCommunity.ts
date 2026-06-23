/** Link community Telegram MushroomRadar */
export const TELEGRAM_COMMUNITY = {
  bot: {
    label: "Avvia il Bot",
    username: "RADARFUNGHIBOT",
    url:
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.trim() ||
      "https://t.me/RADARFUNGHIBOT",
    description: "GPS live, foto funghi, Sprout Score",
  },
  group: {
    label: "Gruppo Community",
    url:
      process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL?.trim() ||
      "https://t.me/RADARFUNGHIBOT?startgroup=community",
    description: "Discussioni, segnalazioni e tips tra fungaioli",
  },
  channel: {
    label: "Canale Aggiornamenti",
    url:
      process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL?.trim() ||
      "https://t.me/RADARFUNGHIBOT?start=canale",
    description: "Allerte score, meteo e novità MushroomRadar",
  },
} as const;

export const TELEGRAM_COMMUNITY_HEADLINE =
  "Unisciti alla nostra community Telegram";
