import type { SocialCitationSummary } from "./socialEvidence";

export interface MastroChatResponse {
  reply: string;
  recommendedHotspotId: string | null;
  socialEvidence?: SocialCitationSummary[];
}
