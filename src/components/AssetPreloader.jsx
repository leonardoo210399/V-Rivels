"use client";
import { useEffect } from "react";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";
import { mapImages } from "@/assets/images/maps";

const PRIORITY_MAPS = ["Ascent", "Bind", "Haven", "Split", "Icebox", "Breeze", "Fracture"];

export default function AssetPreloader() {
  useEffect(() => {
    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
      });
    };

    const getSafeSrc = (asset) => {
      if (!asset) return null;
      return typeof asset === 'object' ? asset.src : asset;
    };

    const runPreload = async () => {
      // 1. High Priority: Ranks & Agents
      // These are small and used frequently in Profile/Team Finder
      const highPriorityQueue = [];

      // Collect Rank Icons
      Object.values(rankIcons).forEach(icon => {
        const src = getSafeSrc(icon);
        if (src) highPriorityQueue.push(src);
      });

      // Collect Agent Icons
      Object.values(agentIcons).forEach(icon => {
        const src = getSafeSrc(icon);
        if (src) highPriorityQueue.push(src);
      });

      // Execute High Priority
      await Promise.allSettled(highPriorityQueue.map(preloadImage));
      console.log(`[AssetPreloader] Preloaded ${highPriorityQueue.length} icons.`);

      // 2. Medium Priority: Active Duty Maps
      // These are larger, so we load them sequentially to avoid clogging bandwidth
      const mapQueue = PRIORITY_MAPS.map(name => getSafeSrc(mapImages[name])).filter(Boolean);
      
      for (const src of mapQueue) {
        try {
          await preloadImage(src);
        } catch (e) {
          // ignore error
        }
      }
      console.log(`[AssetPreloader] Preloaded ${mapQueue.length} priority maps.`);

      // 3. Low Priority: Remaining Maps
      const loadedMaps = new Set(mapQueue);
      const remainingMaps = Object.values(mapImages)
        .map(getSafeSrc)
        .filter(src => src && !loadedMaps.has(src));

      for (const src of remainingMaps) {
        try {
          await preloadImage(src);
        } catch (e) {
          // ignore
        }
      }
    };

    // Use requestIdleCallback if available, otherwise fallback to timeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        runPreload();
      });
    } else {
      setTimeout(runPreload, 2000);
    }

  }, []);

  return null; // Invisible component
}
