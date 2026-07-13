"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string | number;
  name: string;
  subtitle?: string;
  flavor?: string;
  price: number;
  image_url?: string;
  is_new?: boolean;
  brand?: string;
}

interface ShowcaseSectionProps {
  id?: string;
  categoryName: string;
  categoryFilter?: string;
  bannerImage: string;
  bannerTitle: string;
  bannerSubtitle: string;
  buttonText: string;
  buttonHref?: string;
}

export default function ShowcaseSection({
  id = "showcase",
  categoryName,
  categoryFilter,
  bannerImage,
  bannerTitle,
  bannerSubtitle,
  buttonText,
  buttonHref = "#",
}: ShowcaseSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = async (e: React.MouseEvent, productId: string | number) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      window.location.href = '/login';
      return;
    }

    const userId = session.user.id;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
        alert("Removed from favorites!");
      } else {
        await supabase.from('favorites').insert([{ user_id: userId, product_id: productId }]);
        alert("Added to favorites!");
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      alert(err.message || "An error occurred");
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth * 0.8;
      current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    async function fetchProducts() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from("products")
          .select("*")
          .limit(12);

        if (categoryFilter) {
          query = query.eq("category", categoryFilter);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoryFilter]);

  return (
    <section className="px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto border-t border-border-custom/50" id={id}>
      <div className="mb-12">
        <h2 className="text-xs uppercase tracking-widest font-bold text-foreground mb-4">New In: {categoryName}</h2>

        {/* Banner Illustration */}
        <div className="w-full bg-surface aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] relative overflow-hidden rounded-xl flex items-center justify-center group">
          <img
            src={bannerImage}
            alt={`${categoryName} Illustration`}
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          <div className="relative z-10 w-full px-8 md:px-16 flex flex-col items-start text-left">
            <h3 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-4 max-w-lg leading-tight uppercase">
              {bannerTitle}
            </h3>
            <p className="text-white/90 text-sm md:text-base max-w-md mb-8">
              {bannerSubtitle}
            </p>
            <div className="flex gap-4">
              <Link href={buttonHref} className="px-6 py-3 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="bg-surface w-full aspect-[4/5] rounded-xl" />
              <div className="h-4 bg-surface w-3/4 rounded" />
              <div className="h-4 bg-surface w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="relative group/carousel">
          {products.length > 4 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); scroll('left'); }}
                className="absolute left-0 top-[35%] -translate-y-1/2 -translate-x-1/2 z-20 bg-white shadow-lg p-2.5 rounded-full text-foreground hover:scale-110 transition-transform opacity-0 group-hover/carousel:opacity-100 hidden md:flex border border-border-custom"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => { e.preventDefault(); scroll('right'); }}
                className="absolute right-0 top-[35%] -translate-y-1/2 translate-x-1/2 z-20 bg-white shadow-lg p-2.5 rounded-full text-foreground hover:scale-110 transition-transform opacity-0 group-hover/carousel:opacity-100 hidden md:flex border border-border-custom"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <Link href={`/product/${product.id}`} key={product.id} className="group relative flex flex-col cursor-pointer shrink-0 snap-start w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(25%-24px)]">
                <div className="relative aspect-[4/5] bg-surface overflow-hidden mb-5 rounded-sm">
                  <img
                    src={product.image_url || `https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1470&auto=format&fit=crop`}
                    alt={product.name}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out p-2"
                  />
                  <button 
                    onClick={(e) => toggleFavorite(e, product.id)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white shadow-sm rounded-full flex items-center justify-center text-foreground hover:bg-gray-50 transition-colors z-10"
                  >
                    <Heart className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <div className="absolute bottom-4 left-4 px-2 py-1 bg-white text-foreground text-[10px] font-bold uppercase tracking-wider z-10">
                    {product.is_new !== false ? 'NEW & IMPROVED' : 'BEST SELLER'}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-medium text-foreground">{product.name}</h4>
                {product.brand && (
                  <p className="text-[13px] text-secondary">{product.brand}</p>
                )}
                <p className="text-sm font-bold text-foreground mt-2">
                    Rp {product.price?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full border border-dashed border-border-custom rounded-xl p-16 flex flex-col items-center justify-center text-center bg-surface/30">
          <h3 className="text-2xl font-medium text-foreground mb-3 tracking-tight">Coming Soon</h3>
          <p className="text-secondary max-w-md mx-auto text-sm leading-relaxed">
            Our premium {categoryName} collection is currently in the works. We're finalizing the formula to bring you the best local supplements. Stay tuned!
          </p>
        </div>
      )}
    </section>
  );
}
