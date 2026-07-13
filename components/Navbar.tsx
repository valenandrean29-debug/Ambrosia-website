"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  ChevronDown,
  Heart,
  ClipboardList,
  Dumbbell,
  Flame,
  Zap,
  ChevronRight,
} from "lucide-react";

const categories = [
  {
    name: "Whey Protein",
    icon: Dumbbell,
    accent: "text-accent-blue",
    badge: "Popular",
    description: "Build & recover faster",
    href: "#whey-protein",
  },
  {
    name: "Gainer",
    icon: Flame,
    accent: "text-accent-green",
    description: "Bulk up effectively",
    href: "#gainer",
  },
  {
    name: "Creatine",
    icon: Zap,
    accent: "text-amber-600",
    description: "Boost your performance",
    href: "#creatine",
  },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!error && count !== null) {
        setCartCount(count);
      }
    };

    fetchCartCount();

    const channel = supabase
      .channel('cart_badge_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart', filter: `user_id=eq.${user.id}` }, () => {
        fetchCartCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserName = () => {
    if (!user) return "";
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-custom">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-blue">
              ambrosia
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center h-full gap-8">
            {/* Shop */}
            <Link
              href="/"
              className="text-sm font-medium text-secondary hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
            >
              Shop
            </Link>

            {/* Category — popup on click */}
            <div ref={categoryRef} className="relative h-full flex items-center">
              <button
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="text-sm font-medium text-secondary hover:text-foreground transition-colors duration-200 flex items-center gap-1 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
              >
                Category
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Popup */}
              {isCategoryOpen && (
                <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-72 bg-background border border-border-custom rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Arrow indicator */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
                    <div className="w-3 h-3 bg-background border-l border-t border-border-custom rotate-45 translate-y-1 mx-auto" />
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary px-3 pt-2 pb-2">
                    Pilih Kategori
                  </p>

                  <div className="flex flex-col gap-0.5">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <a
                          key={cat.name}
                          href={cat.href}
                          onClick={() => setIsCategoryOpen(false)}
                          className="group flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-surface transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-surface group-hover:bg-background flex items-center justify-center transition-colors">
                              <Icon className={`w-4 h-4 ${cat.accent}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                                {cat.badge && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white bg-accent-green px-1.5 py-0.5 rounded-full">
                                    {cat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-secondary">{cat.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-secondary group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              className="p-2 rounded-full hover:bg-surface transition-colors duration-200"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] text-foreground" />
            </button>

            {/* Account */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent-blue transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-surface cursor-pointer">
                <User className="w-[18px] h-[18px]" />
                <span className="truncate max-w-[100px]">Hi, {getUserName()}</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent-blue transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-surface"
              >
                <User className="w-[18px] h-[18px]" />
                <span>Log in</span>
              </Link>
            )}

            {/* Favorites */}
            <Link
              href={user ? "/favorites" : "/login"}
              className="p-2 rounded-full hover:bg-surface transition-colors duration-200"
              aria-label="Favorites"
            >
              <Heart className="w-[18px] h-[18px] text-foreground" />
            </Link>

            {/* Order History */}
            <Link
              href={user ? "/orders" : "/login"}
              className="p-2 rounded-full hover:bg-surface transition-colors duration-200"
              aria-label="Order History"
            >
              <ClipboardList className="w-[18px] h-[18px] text-foreground" />
            </Link>

            {/* Cart */}
            <Link
              href={user ? "/cart" : "/login"}
              className="relative p-2 rounded-full hover:bg-surface transition-colors duration-200"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-[18px] h-[18px] text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-green text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-surface transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 bg-background border-t border-border-custom space-y-1">
          {/* Shop */}
          <Link
            href="/"
            className="block px-4 py-3 text-sm font-medium text-secondary hover:text-foreground hover:bg-surface rounded-xl transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Shop
          </Link>

          {/* Category — expandable section on mobile */}
          <div className="py-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary px-4 pt-3 pb-2">
              Category
            </p>
            <div className="flex flex-col gap-0.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <a
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${cat.accent}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white bg-accent-green px-1.5 py-0.5 rounded-full">
                        {cat.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {user ? (
            <div className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-surface rounded-xl transition-all duration-200 sm:hidden truncate">
              Hi, {getUserName()}
            </div>
          ) : (
            <Link
              href="/login"
              className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-surface rounded-xl transition-all duration-200 sm:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
