"use client";

import { useParams } from "next/navigation";
import { DramalettoWatchPage } from "@/components/DramalettoWatchPage";

export default function VibeShortWatchPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoWatchPage provider="vibeshort" name="VibeShort" id={params.id} />;
}
