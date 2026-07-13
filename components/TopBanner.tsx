"use client";

import {
  Truck,
  ShieldCheck,
  BadgeCheck,
  Banknote,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const bannerItems = [
  {
    icon: ShieldCheck,
    text: "Suplemen Lokal Terpercaya",
  },
  {
    icon: Truck,
    text: "Pengiriman Cepat ke Seluruh Indonesia",
  },
  {
    icon: BadgeCheck,
    text: "100% Produk Original",
  },
  {
    icon: Banknote,
    text: "Harga Terjangkau",
  },
];

export default function TopBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPos = 0;

    const scroll = () => {
      if (!isPaused) {
        scrollPos += 0.5;
        if (scrollPos >= scrollContainer.scrollWidth / 2) {
          scrollPos = 0;
        }
        scrollContainer.scrollLeft = scrollPos;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <div className="bg-banner-dark text-white/90 py-2.5 overflow-hidden relative">
      <div
        ref={scrollRef}
        className="flex overflow-hidden whitespace-nowrap"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Duplicate items for infinite scroll effect */}
        {[...bannerItems, ...bannerItems].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-8 shrink-0"
          >
            <item.icon className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-xs font-medium tracking-wide">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
