"use client";

import { useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";

const carouselTexts = [
  "Gain your mass",
  "Fuel your Strength",
  "Optimalized your recovery",
];

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getOffset = (index: number) => {
    if (index === currentIndex) return 0;
    if (index === (currentIndex + 1) % carouselTexts.length) return 100;
    if (index === (currentIndex - 1 + carouselTexts.length) % carouselTexts.length) return -100;
    return 200;
  };

  return (
    <section className="relative px-6 lg:px-8 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 max-w-7xl mx-auto">
      {/* Hero Content */}
      <div className="max-w-4xl">
        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-medium tracking-tight leading-[0.92]">
          <span className="italic text-accent-blue inline-grid overflow-hidden">
            {carouselTexts.map((text, i) => (
              <span
                key={i}
                className="col-start-1 row-start-1 transition-all duration-700 ease-in-out"
                aria-hidden={i !== currentIndex}
                style={{
                  transform: `translateY(${getOffset(i)}%)`,
                  opacity: i === currentIndex ? 1 : 0,
                }}
              >
                {text}
              </span>
            ))}
          </span>
          <br />
          <span className="text-foreground">with isolate &</span>
          <br />
          <span className="text-foreground">plant supplements</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 sm:mt-8 text-base sm:text-lg text-secondary max-w-xl leading-relaxed">
          Exclusively offering premium isolate and plant-based nutrition.
          <br className="hidden sm:block" />
          Pure, local, and crafted for your fitness goals.
        </p>

        {/* CTA Area */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start gap-4">
          <a
            href="#categories"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/85 transition-all duration-300 hover:gap-3"
          >
            Shop Now
            <ArrowDown className="w-4 h-4 -rotate-90" />
          </a>
          <a
            href="/brands"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-border-custom text-foreground text-sm font-medium rounded-full hover:bg-surface transition-all duration-300"
          >
            Explore Brands
          </a>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute top-20 right-8 lg:right-16 hidden lg:block">
        <div className="w-48 h-48 rounded-full bg-accent-blue/10 blur-3xl" />
      </div>
      <div className="absolute bottom-10 right-32 hidden lg:block">
        <div className="w-32 h-32 rounded-full bg-accent-green/10 blur-3xl" />
      </div>
    </section>
  );
}
