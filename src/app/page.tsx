import { HomePage } from "@/components/home/HomePage";
import { BottomPlayer } from "@/components/layout/BottomPlayer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchPage } from "@/components/search/SearchPage";

export default function Page() {
  return (
    <>
      <HomePage />
      <BottomPlayer />
      <MobileNav />
      <SearchPage />
    </>
  );
}
