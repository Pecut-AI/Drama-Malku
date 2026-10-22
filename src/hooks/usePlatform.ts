"use client";

import { create } from "zustand";

export type Platform = "pinedrama" | "dramabox" | "reelshort" | "shortmax" | "netshort" | "melolo" | "freereels" | "dramanova" | "goodshort" | "flickreels" | "moboreels" | "dramawave" | "vibeshort";

/** Sumber data platform: dramaletto.com atau agregator sansekai. */
export type PlatformSource = "dramaletto" | "sansekai";

export interface PlatformInfo {
  id: Platform;
  name: string;
  logo: string;
  apiBase: string;
  source: PlatformSource;
}

// Urutan platform (perintah Elnath, 23 Okt 2026): platform yang ada di
// dramaletto lebih dulu (mengikuti urutan provider di dramaletto),
// di bawahnya baru platform yang hanya ada di sansekai.
export const PLATFORMS: PlatformInfo[] = [
  // --- Grup DramaLetto ---
  {
    id: "netshort",
    name: "NetShort",
    logo: "/netshort.webp",
    apiBase: "/api/netshort",
    source: "dramaletto",
  },
  {
    id: "moboreels",
    name: "MoboReels",
    logo: "/moboreels.svg",
    apiBase: "/api/moboreels",
    source: "dramaletto",
  },
  {
    id: "dramawave",
    name: "DramaWave",
    logo: "/dramawave.svg",
    apiBase: "/api/dramawave",
    source: "dramaletto",
  },
  {
    id: "goodshort",
    name: "GoodShort",
    logo: "/goodshort.jpg",
    apiBase: "/api/goodshort",
    source: "dramaletto",
  },
  {
    id: "flickreels",
    name: "FlickReels",
    logo: "/flickreels.webp",
    apiBase: "/api/flickreels",
    source: "dramaletto",
  },
  {
    id: "shortmax",
    name: "ShortMax",
    logo: "/shortmax.webp",
    apiBase: "/api/shortmax",
    source: "dramaletto",
  },
  {
    id: "vibeshort",
    name: "VibeShort",
    logo: "/vibeshort.svg",
    apiBase: "/api/vibeshort",
    source: "dramaletto",
  },
  // --- Grup khusus Sansekai ---
  {
    id: "pinedrama",
    name: "PineDrama",
    logo: "/pinedrama.png",
    apiBase: "/api/pinedrama",
    source: "sansekai",
  },
  {
    id: "dramabox",
    name: "DramaBox",
    logo: "/dramabox.webp",
    apiBase: "/api/dramabox",
    source: "sansekai",
  },
  {
    id: "reelshort",
    name: "ReelShort",
    logo: "/reelshort.webp",
    apiBase: "/api/reelshort",
    source: "sansekai",
  },
  {
    id: "melolo",
    name: "Melolo",
    logo: "/melolo.webp",
    apiBase: "/api/melolo",
    source: "sansekai",
  },
  {
    id: "freereels",
    name: "FreeReels",
    logo: "/freereels.webp",
    apiBase: "/api/freereels",
    source: "sansekai",
  },
  // api lagi error - 12-09-2026
  // {
  //   id: "dramanova",
  //   name: "DramaNova",
  //   logo: "/dramanova.png",
  //   apiBase: "/api/dramanova",
  //   source: "sansekai",
  // },
];

interface PlatformState {
  currentPlatform: Platform;
  setPlatform: (platform: Platform) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: "melolo",
  setPlatform: (platform) => set({ currentPlatform: platform }),
}));

export function usePlatform() {
  const { currentPlatform, setPlatform } = usePlatformStore();
  const platformInfo = PLATFORMS.find((p) => p.id === currentPlatform)!;

  const getPlatformInfo = (platformId: Platform) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  };

  return {
    currentPlatform,
    platformInfo,
    setPlatform,
    platforms: PLATFORMS,
    getPlatformInfo,
    isPineDrama: currentPlatform === "pinedrama",
    isDramaBox: currentPlatform === "dramabox",
    isReelShort: currentPlatform === "reelshort",
    isShortMax: currentPlatform === "shortmax",
    isNetShort: currentPlatform === "netshort",
    isMelolo: currentPlatform === "melolo",
    isFreeReels: currentPlatform === "freereels",
    isDramaNova: currentPlatform === "dramanova",
    isGoodShort: currentPlatform === "goodshort",
    isFlickReels: currentPlatform === "flickreels",
    isMoboReels: currentPlatform === "moboreels",
    isDramaWave: currentPlatform === "dramawave",
    isVibeShort: currentPlatform === "vibeshort",
  };
}
