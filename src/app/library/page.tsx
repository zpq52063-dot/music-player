import { LibraryPage } from "@/components/library/LibraryPage";
import { BottomPlayer } from "@/components/layout/BottomPlayer";
import { MobileNav } from "@/components/layout/MobileNav";

export default function Page() {
  return (
    <>
      <LibraryPage />
      <BottomPlayer />
      <MobileNav />
    </>
  );
}
