"use client";
import { useCallback, useEffect, useState, useRef } from "react";

const DualRangeSlider = ({ min, max, onChange, initialMin, initialMax }) => {
  const [minVal, setMinVal] = useState(initialMin || min);
  const [maxVal, setMaxVal] = useState(initialMax || max);
  const minValRef = useRef(initialMin || min);
  const maxValRef = useRef(initialMax || max);
  const range = useRef(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [min, max],
  );

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxValRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxValRef.current);

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minValRef.current) {
      const minPercent = getPercent(minValRef.current);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  useEffect(() => {
    onChange({ min: minVal, max: maxVal });
  }, [minVal, maxVal, onChange]);

  return (
    <div className="relative flex w-full items-center justify-center px-1 py-6">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), min);
          // Prevent crossing
          const newVal = Math.min(value, maxVal - 1);
          setMinVal(newVal);
          minValRef.current = newVal;
        }}
        className="thumb thumb--left pointer-events-none absolute top-1/2 left-0 z-30 h-0 w-full -translate-y-1/2 outline-none"
        style={{ zIndex: minVal > max - 100 && "5" }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), max);
          // Prevent crossing
          const newVal = Math.max(value, minVal + 1);
          setMaxVal(newVal);
          maxValRef.current = newVal;
        }}
        className="thumb thumb--right pointer-events-none absolute top-1/2 left-0 z-40 h-0 w-full -translate-y-1/2 outline-none"
      />

      <div className="relative h-1 w-full">
        <div className="track absolute z-10 h-1 w-full rounded-full bg-slate-800" />
        <div
          ref={range}
          className="range absolute z-20 h-1 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
        />

        {/* Floating Value Labels */}
        <div className="absolute top-5 left-0 -translate-x-1/2 text-[10px] font-black tracking-wider text-slate-400">
          {minVal}
        </div>
        <div className="absolute top-5 right-0 translate-x-1/2 text-[10px] font-black tracking-wider text-slate-400">
          {maxVal}
        </div>
      </div>

      <style jsx>{`
        /* Webkit Thumbs */
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          pointer-events: auto;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background-color: #0f172a; /* slate-950 */
          border: 2px solid #f43f5e; /* rose-500 */
          box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
          cursor: grab;
          /* Removed margin-top hack, relying on flex/absolute centering */
          transition: transform 0.1s;
        }

        .thumb::-webkit-slider-thumb:active {
          transform: scale(1.2);
          cursor: grabbing;
          background-color: #f43f5e;
          border-color: #fff;
        }

        /* Mozilla Thumbs */
        .thumb::-moz-range-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background-color: #0f172a;
          border: 2px solid #f43f5e;
          box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
          cursor: grab;
          border: none;
          transition: transform 0.1s;
        }

        .thumb::-moz-range-thumb:active {
          transform: scale(1.2);
          cursor: grabbing;
          background-color: #f43f5e;
          border-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default DualRangeSlider;
