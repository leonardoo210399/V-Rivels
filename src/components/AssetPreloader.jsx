"use client";
import { useEffect } from "react";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";

// NOTE: Maps are very large (3-7MB each), so we DO NOT preload them globally.
// They should be lazy-loaded by components that specifically need them.
// import { mapImages } from "@/assets/images/maps";

export default function AssetPreloader() {
  useEffect(() => {
    const preloadImage = (src) => {
      // Don't preload if user is on data saver or slow connection
      if (navigator.connection?.saveData) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
      });
    };

    const getSafeSrc = (asset) => {
      if (!asset) return null;
      return typeof asset === "object" ? asset.src : asset;
    };

    const runPreload = async () => {
      // only preload critical UI elements: Ranks and Agents
      const criticalQueue = [];

      // Collect Rank Icons
      Object.values(rankIcons).forEach((icon) => {
        const src = getSafeSrc(icon);
        if (src) criticalQueue.push(src);
      });

      // Collect Agent Icons
      // (Prioritize only main agents if list is huge, but agent icons are small enough to load all)
      Object.values(agentIcons).forEach((icon) => {
        const src = getSafeSrc(icon);
        if (src) criticalQueue.push(src);
      });

      // Execute Critical Preload
      if (criticalQueue.length > 0) {
        await Promise.allSettled(criticalQueue.map(preloadImage));
      }
    };

    // Use requestIdleCallback to ensure we don't block critical main-thread work
    if ("requestIdleCallback" in window) {
      // Wait a bit longer to ensure LCP has happened
      setTimeout(() => {
        requestIdleCallback(
          () => {
            runPreload();
          },
          { timeout: 5000 },
        );
      }, 3000);
    } else {
      setTimeout(runPreload, 4000);
    }
  }, []);

  return null;
}
