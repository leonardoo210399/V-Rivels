import { useEffect, useRef, useState } from "react";
import { mapImages } from "@/assets/images/maps";
import { Zap } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const SKIRMISH_MAPS = ["Skirmish A", "Skirmish B", "Skirmish C"];
const CARD_WIDTH = 200; // Width of each card
const CARD_GAP = 16; // Gap between cards
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;
const VISIBLE_ITEMS = 5; // How many items visible in the viewport
const TOTAL_ITEMS = 80; // Total items in the strip
const WINNER_INDEX = 65; // Index where the winner will be placed (must be > VISIBLE_ITEMS and < TOTAL_ITEMS)

export default function MapLottery({ winnerMap, onComplete }) {
  const containerRef = useRef(null);
  const stripRef = useRef(null);
  const [items, setItems] = useState([]);

  // Generate the strip of maps
  useEffect(() => {
    const newItems = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      if (i === WINNER_INDEX) {
        newItems.push(winnerMap);
      } else {
        // Random map that ISN'T the winner immediately adjacent if possible (to make it pop),
        // but random is fine.
        const random =
          SKIRMISH_MAPS[Math.floor(Math.random() * SKIRMISH_MAPS.length)];
        newItems.push(random);
      }
    }
    setItems(newItems);
  }, [winnerMap]);

  useGSAP(() => {
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      // Calculate target position
      // We want WINNER_INDEX to end up in the center of the container.
      // Container width is likely fluid, but let's assume we center it relative to viewport or container.
      // Let's rely on the center marker.
      // Center of container is Width / 2.
      // Center of Item is (Index * ITEM_SIZE) + (CARD_WIDTH / 2).
      // We want TranslateX such that: CenterContainer = (CenterItem + TranslateX)
      // => TranslateX = CenterContainer - CenterItem
      // => TranslateX = (ContainerWidth / 2) - ((WINNER_INDEX * ITEM_SIZE) + (CARD_WIDTH / 2))

      const containerWidth = containerRef.current.offsetWidth;
      const targetX =
        containerWidth / 2 - (WINNER_INDEX * ITEM_SIZE + CARD_WIDTH / 2);

      // Add some randomness to land slightly off-center (but still within the card) for realism?
      // Nah, let's hit dead center for clarity or a tiny jitter.
      const jitter = Math.random() * 40 - 20;

      const tl = gsap.timeline({
        onComplete: () => {
          // Wait a moment then trigger complete
          setTimeout(onComplete, 1000);
        },
      });

      tl.to(stripRef.current, {
        x: targetX + jitter,
        duration: 6,
        ease: "power4.out", // Fast start, slow end (simulates friction)
      });
    }, containerRef);

    return () => ctx.revert();
  }, [items]);

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950/80 shadow-2xl shadow-amber-900/20">
      {/* Center Marker Line */}
      <div className="absolute top-0 bottom-0 left-1/2 z-20 w-1 -translate-x-1/2 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)]" />

      {/* Rolling Strip */}
      <div
        ref={containerRef}
        className="relative flex h-64 items-center overflow-hidden py-4"
      >
        <div
          ref={stripRef}
          className="flex items-center gap-4 px-4 will-change-transform"
          style={{ width: `${items.length * ITEM_SIZE}px` }}
        >
          {items.map((mapName, idx) => {
            const mapInfo = { name: mapName, image: mapImages[mapName] };
            const isWinner = idx === WINNER_INDEX;

            return (
              <div
                key={idx}
                className={`relative flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${isWinner ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]" : "border-white/10 bg-slate-900"} `}
                style={{
                  width: `${CARD_WIDTH}px`,
                  height: "180px",
                }}
              >
                {/* Card Content */}
                <div className="absolute inset-0">
                  <div
                    className="h-full w-full bg-cover bg-center opacity-60"
                    style={{
                      backgroundImage: `url(${typeof mapInfo.image === "string" ? mapInfo.image : mapInfo.image?.src || ""})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                </div>
                <div className="absolute right-0 bottom-3 left-0 text-center">
                  <span
                    className={`text-xs font-black tracking-wider uppercase ${isWinner ? "text-amber-400" : "text-slate-300"}`}
                  >
                    {mapName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute right-4 bottom-2 flex items-center gap-1.5 opacity-50">
        <Zap className="h-3 w-3 text-amber-500" />
        <span className="text-[9px] font-bold tracking-widest text-amber-500 uppercase">
          Rolling Map...
        </span>
      </div>
    </div>
  );
}
