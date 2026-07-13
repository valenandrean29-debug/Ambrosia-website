"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import { Heart, ChevronRight, Share } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const toggleFavorite = async () => {
    try {
      setTogglingFavorite(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const { data: existing, error: fetchError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
        alert("Removed from favorites!");
      } else {
        await supabase.from('favorites').insert([{ user_id: userId, product_id: id }]);
        alert("Added to favorites!");
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      alert(err.message || "An error occurred");
    } finally {
      setTogglingFavorite(false);
    }
  };

  const addToCart = async () => {
    try {
      setAddingToCart(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingCartItem) {
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: existingCartItem.quantity + 1 })
          .eq('id', existingCartItem.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart')
          .insert([
            { user_id: userId, product_id: id, quantity: 1 }
          ]);
          
        if (insertError) throw insertError;
      }

      alert("Added to cart!");
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-20 w-full animate-pulse flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 aspect-[4/5] bg-surface rounded-sm"></div>
          <div className="w-full md:w-1/2 flex flex-col gap-6 pt-8">
            <div className="h-10 bg-surface w-3/4 rounded"></div>
            <div className="h-6 bg-surface w-1/4 rounded"></div>
            <div className="h-32 bg-surface w-full rounded mt-8"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-32 w-full flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-medium text-foreground mb-4">Product Not Found</h1>
          <p className="text-secondary max-w-md">The product you are looking for does not exist or has been removed.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background min-h-screen">
      <TopBanner />
      <Navbar />
      
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-xs text-secondary font-medium uppercase tracking-widest">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>Shop</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{product.name}</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 pb-24 w-full">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Product Image */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-[4/5] bg-surface rounded-sm overflow-hidden border border-border-custom/30">
              <img 
                src={product.image_url || `https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1470&auto=format&fit=crop`} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground leading-[1.1]">
                {product.name}
              </h1>
              <button className="p-3 bg-surface hover:bg-border-custom transition-colors rounded-full shrink-0">
                <Share className="w-4 h-4 text-foreground" />
              </button>
            </div>
            
            <p className="text-xl sm:text-2xl font-semibold text-foreground mb-8">
              Rp {product.price?.toLocaleString('id-ID') || '0'}
            </p>

            <div className="w-full h-px bg-border-custom mb-8" />

            <div className="mb-8">
              <h3 className="text-sm font-medium text-foreground mb-3">Description</h3>
              <p className="text-secondary leading-relaxed text-sm sm:text-base">
                {product.description || "Premium locally formulated supplement designed to elevate your performance and recovery. Built with the highest quality ingredients for serious athletes."}
              </p>
            </div>

            {product.flavor && (
              <div className="mb-10">
                <h3 className="text-sm font-medium text-foreground mb-3">Flavor</h3>
                <div className="inline-flex px-4 py-2 bg-surface border border-border-custom rounded-full text-sm font-medium text-foreground">
                  {product.flavor}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-auto">
              <button 
                onClick={addToCart}
                disabled={addingToCart}
                className="flex-1 bg-foreground text-background font-medium py-4 rounded-full hover:bg-foreground/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button 
                onClick={toggleFavorite}
                disabled={togglingFavorite}
                className="w-14 h-14 border border-border-custom rounded-full flex items-center justify-center hover:bg-surface transition-colors shrink-0 disabled:opacity-50"
              >
                <Heart className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
