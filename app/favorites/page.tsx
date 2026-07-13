"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Link from "next/link";
import { Trash2, Heart, ArrowRight, ShoppingCart } from "lucide-react";

interface FavoriteItem {
  id: string; // favorite item id
  user_id: string;
  product_id: string;
}

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  image_url: string;
  brand?: string;
  flavor?: string;
}

interface FavoriteItemWithProduct extends FavoriteItem {
  product: ProductDetails | null;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItemWithProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Fetch favorite items
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      if (!favoritesData || favoritesData.length === 0) {
        setFavoriteItems([]);
        return;
      }

      // Fetch associated products
      const productIds = favoritesData.map((item) => item.product_id);
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productError) throw productError;

      // Combine the data
      const combined = favoritesData.map((item) => {
        const product = productData?.find((p) => p.id.toString() === item.product_id.toString()) || null;
        return { ...item, product };
      });

      setFavoriteItems(combined);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    // Optimistic UI update
    setFavoriteItems((prev) => prev.filter((item) => item.id !== favoriteId));

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      // Revert on error
      fetchFavorites();
    }
  };

  const moveToCart = async (favoriteItem: FavoriteItemWithProduct) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      // Check if product is already in cart
      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', favoriteItem.product_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingCartItem) {
        // Update quantity
        await supabase
          .from('cart')
          .update({ quantity: existingCartItem.quantity + 1 })
          .eq('id', existingCartItem.id);
      } else {
        // Insert new cart item
        await supabase
          .from('cart')
          .insert([
            { user_id: userId, product_id: favoriteItem.product_id, quantity: 1 }
          ]);
      }
      
      alert("Moved to cart!");
      // Optionally remove from favorites after moving to cart
      // await removeFavorite(favoriteItem.id); 
    } catch (err: any) {
      console.error("Error moving to cart:", err);
      alert("Failed to move to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full animate-pulse">
           <div className="h-10 bg-surface w-1/4 rounded mb-10"></div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="bg-surface w-full aspect-[4/5] rounded-xl" />
                  <div className="h-4 bg-surface w-3/4 rounded" />
                  <div className="h-4 bg-surface w-1/2 rounded" />
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background min-h-screen">
      <TopBanner />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Your Wishlist</h1>
          <span className="text-sm font-medium text-secondary">{favoriteItems.length} items</span>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {favoriteItems.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-surface/30 rounded-2xl border border-dashed border-border-custom">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 text-red-500/80">
              <Heart className="w-10 h-10" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">Your wishlist is empty</h2>
            <p className="text-secondary max-w-md mb-8">
              Keep track of your favorite premium supplements. Click the heart icon on any product to save it here.
            </p>
            <Link 
              href="/"
              className="bg-foreground text-background font-medium px-8 py-3.5 rounded-full hover:bg-foreground/90 transition-all flex items-center gap-2"
            >
              Discover Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {favoriteItems.map((item) => (
              <div key={item.id} className="group relative flex flex-col">
                <div className="relative aspect-[4/5] bg-surface overflow-hidden mb-5 rounded-sm border border-border-custom/50">
                  <img
                    src={item.product?.image_url || `https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1470&auto=format&fit=crop`}
                    alt={item.product?.name || "Product"}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); removeFavorite(item.id); }}
                    className="absolute top-4 right-4 w-9 h-9 bg-white shadow-sm rounded-full flex items-center justify-center text-red-500 hover:bg-gray-50 transition-colors z-10"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" strokeWidth={2} />
                  </button>
                  
                  {/* Quick Add to Cart Overlay on Desktop */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                    <button 
                      onClick={(e) => { e.preventDefault(); moveToCart(item); }}
                      className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
                
                <Link href={`/product/${item.product?.id}`} className="flex flex-col gap-0.5 flex-1">
                  <h4 className="text-sm font-medium text-foreground">{item.product?.name || "Unknown Product"}</h4>
                  {item.product?.brand && (
                    <p className="text-[13px] text-secondary">{item.product.brand}</p>
                  )}
                  <p className="text-sm font-bold text-foreground mt-2 mb-3">
                    Rp {item.product?.price?.toLocaleString('id-ID') || '0'}
                  </p>
                </Link>

                {/* Mobile Add to Cart */}
                <button 
                  onClick={() => moveToCart(item)}
                  className="md:hidden w-full border border-border-custom text-foreground font-medium py-2.5 rounded-lg hover:bg-surface transition-colors mt-auto text-sm"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
