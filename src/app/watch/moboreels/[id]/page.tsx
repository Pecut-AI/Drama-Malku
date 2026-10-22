"use client";

import { useParams } from "next/navigation";
import { DramalettoWatchPage } from "@/components/DramalettoWatchPage";

export default function MoboReelsWatchPage() {
  const params = useParams<{ id: string }>();
  return <DramalettoWatchPage provider="moboreels" name="MoboReels" id={params.id} />;
}
