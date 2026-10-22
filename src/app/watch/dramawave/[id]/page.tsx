"use client";

import { useParams } from "next/navigation";
import { DramalettoWatchPage } from "@/components/DramalettoWatchPage";

export default function DramaWaveWatchPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoWatchPage provider="dramawave" name="DramaWave" id={params.id} />;
}
