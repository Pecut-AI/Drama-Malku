"use client";

import { useParams } from "next/navigation";
import { DramalettoDetailPage } from "@/components/DramalettoDetailPage";

export default function MoboReelsDetailPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoDetailPage provider="moboreels" name="MoboReels" id={params.id} />;
}
