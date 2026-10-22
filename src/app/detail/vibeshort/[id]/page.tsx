"use client";

import { useParams } from "next/navigation";
import { DramalettoDetailPage } from "@/components/DramalettoDetailPage";

export default function VibeShortDetailPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoDetailPage provider="vibeshort" name="VibeShort" id={params.id} />;
}
