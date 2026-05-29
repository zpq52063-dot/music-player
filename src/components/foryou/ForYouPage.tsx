"use client";

import { PersonalizedGreeting } from "./PersonalizedGreeting";
import { TopArtistsSection } from "./TopArtistsSection";
import { RecentlyPlayedCarousel } from "./RecentlyPlayedCarousel";
import { SmartPlaylistSection } from "@/components/smart/SmartPlaylistSection";
import { HighFrequencySongsSection } from "./HighFrequencySongsSection";
import { CompletionRateSummary } from "./CompletionRateSummary";

export function ForYouPage() {
  return (
    <div className="animate-fade-in space-y-8 px-4 pb-44 pt-8">
      <PersonalizedGreeting />
      <TopArtistsSection />
      <RecentlyPlayedCarousel />
      <SmartPlaylistSection />
      <HighFrequencySongsSection />
      <CompletionRateSummary />
    </div>
  );
}
