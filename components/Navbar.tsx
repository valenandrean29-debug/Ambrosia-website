"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { CategoryGrid } from "./CategoryCards";

const navLinks = [
  { label: "Shop", href: "/" },
  { label: "Category", href: "/category" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

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
            {navLinks.map((link) => {
              if (link.label === "Category") {
                return (
                  <div key={link.label} className="group h-full flex items-center">
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-secondary group-hover:text-foreground transition-colors duration-200 flex items-center gap-1 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 group-hover:after:w-full"
                    >
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
                    </Link>

                    {/* Mega Menu Dropdown */}
                    <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-border-custom shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top pt-6 pb-10">
                      <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <CategoryGrid />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-secondary hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              );
            })}
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
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-6 py-4 bg-background border-t border-border-custom space-y-1">
          {navLinks.map((link) => {
            if (link.label === "Category") {
              return (
                <div key={link.label} className="py-2 border-b border-border-custom/50 last:border-0">
                  <div className="text-sm font-medium text-foreground px-4 py-2 flex items-center justify-between">
                    <span>{link.label}</span>
                  </div>
                  <div className="pt-2 pb-4">
                    <CategoryGrid />
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-secondary hover:text-foreground hover:bg-surface rounded-xl transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
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
