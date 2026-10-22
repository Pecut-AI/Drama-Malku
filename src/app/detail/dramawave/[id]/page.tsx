"use client";

import { useParams } from "next/navigation";
import { DramalettoDetailPage } from "@/components/DramalettoDetailPage";

export default function DramaWaveDetailPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoDetailPage provider="dramawave" name="DramaWave" id={params.id} />;
}
