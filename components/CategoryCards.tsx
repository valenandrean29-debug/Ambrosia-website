"use client";

import { ChevronRight, Dumbbell, Flame, Zap, FlaskConical, Lock, LayoutGrid } from "lucide-react";
import { useState } from "react";

interface Category {
  name: string;
  icon: React.ElementType;
  href: string;
  accent?: string;
  badge?: string;
  comingSoon?: boolean;
  description: string;
}

const categories: Category[] = [
  {
    name: "Whey Protein",
    icon: Dumbbell,
    href: "#whey-protein",
    accent: "text-accent-blue",
    badge: "Popular",
    description: "Build & recover faster",
  },
  {
    name: "Gainer",
    icon: Flame,
    href: "#gainer",
    accent: "text-accent-green",
    description: "Bulk up effectively",
  },
  {
    name: "Creatine",
    icon: Zap,
    href: "#creatine",
    accent: "text-amber-600",
    description: "Boost your performance",
  },
  {
    name: "Pre-Workout",
    icon: FlaskConical,
    href: "/shop/pre-workout",
    accent: "text-rose-500",
    description: "Maximize your energy",
  },
  {
    name: "BCAA",
    icon: Lock,
    href: "#",
    comingSoon: true,
    description: "Coming soon",
  },
  {
    name: "Browse All",
    icon: LayoutGrid,
    href: "/shop",
    description: "Explore all products",
  },
];

function CategoryCard({ category }: { category: Category }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.icon;

  if (category.comingSoon) {
    return (
      <div className="relative bg-surface/60 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 opacity-50 cursor-not-allowed border border-border-custom/50">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-background flex items-center justify-center">
            <Icon className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{category.name}</h3>
            <p className="text-xs text-secondary mt-0.5">{category.description}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary bg-border-custom/80 px-2.5 py-1 rounded-full">
          Soon
        </span>
      </div>
    );
  }

  return (
    <a
      href={category.href}
      className="group relative bg-surface rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 border border-transparent hover:border-border-custom transition-all duration-300 hover:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div className={`w-11 h-11 rounded-xl bg-background flex items-center justify-center transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
          <Icon className={`w-5 h-5 ${category.accent || "text-foreground"} transition-colors duration-300`} />
        </div>

        {/* Text */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
              {category.name}
            </h3>
            {category.badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-accent-green px-2 py-0.5 rounded-full">
                {category.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5">{category.description}</p>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight
        className={`w-4 h-4 text-secondary transition-all duration-300 shrink-0 ${isHovered ? "translate-x-1 text-foreground" : ""
          }`}
      />
    </a>
  );
}

export function CategoryGrid() {
  return (
    <div className="w-full">
      {/* Grid: 4 main categories top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {categories.slice(0, 4).map((category) => (
          <CategoryCard key={category.name} category={category} />
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categories.slice(4).map((category) => (
          <CategoryCard key={category.name} category={category} />
        ))}
      </div>
    </div>
  );
}

export default function CategoryCards() {
  return (
    <section id="categories" className="px-6 lg:px-8 pb-20 sm:pb-28 max-w-7xl mx-auto">
      {/* Section Divider */}
      <div className="w-full h-px bg-border-custom mb-10 sm:mb-14" />
      <CategoryGrid />
    </section>
  );
}
