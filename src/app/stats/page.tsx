import { StatsPage } from "@/components/stats/StatsPage";
import { BottomPlayer } from "@/components/layout/BottomPlayer";
import { MobileNav } from "@/components/layout/MobileNav";

export default function StatsRoutePage() {
  return (
    <>
      <StatsPage />
      <BottomPlayer />
      <MobileNav />
    </>
  );
}
