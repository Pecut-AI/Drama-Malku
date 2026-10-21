// Custom layout for watch pages - no global Header/Footer
// This overrides the root layout for /watch/* routes to provide immersive video experience

import { ContinueWatchingRecorder } from "@/components/ContinueWatchingRecorder";
import { WatchPlayerResilience } from "@/components/WatchPlayerResilience";

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just render children directly without Header/Footer wrapper
  // The watch pages have their own custom headers built-in.
  // ContinueWatchingRecorder mencatat posisi tontonan (Lanjut Menonton).
  // WatchPlayerResilience memulihkan pemutaran saat stream upstream terputus.
  return (
    <>
      <ContinueWatchingRecorder />
      <WatchPlayerResilience />
      {children}
    </>
  );
}
