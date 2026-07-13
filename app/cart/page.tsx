"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

interface CartItem {
  id: string; // cart item id
  user_id: string;
  product_id: string;
  quantity: number;
}

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  image_url: string;
  brand?: string;
  flavor?: string;
}

interface CartItemWithProduct extends CartItem {
  product: ProductDetails | null;
}

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Fetch cart items
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", userId)
        .order('created_at', { ascending: false });

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        return;
      }

      // Fetch associated products
      const productIds = cartData.map((item) => item.product_id);
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productError) throw productError;

      // Combine the data
      const combined = cartData.map((item) => {
        const product = productData?.find((p) => p.id.toString() === item.product_id.toString()) || null;
        return { ...item, product };
      });

      setCartItems(combined);
    } catch (err: any) {
      console.error("Error fetching cart:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Optimistic UI update
    setCartItems((prev) => 
      prev.map((item) => item.id === cartId ? { ...item, quantity: newQuantity } : item)
    );

    try {
      const { error } = await supabase
        .from("cart")
        .update({ quantity: newQuantity })
        .eq("id", cartId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error updating quantity:", err);
      // Revert on error
      fetchCart(); 
    }
  };

  const removeItem = async (cartId: string) => {
    // Optimistic UI update
    setCartItems((prev) => prev.filter((item) => item.id !== cartId));

    try {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cartId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error removing item:", err);
      // Revert on error
      fetchCart();
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full animate-pulse">
           <div className="h-10 bg-surface w-1/4 rounded mb-10"></div>
           <div className="flex flex-col lg:flex-row gap-10">
              <div className="w-full lg:w-2/3 h-96 bg-surface rounded-xl"></div>
              <div className="w-full lg:w-1/3 h-64 bg-surface rounded-xl"></div>
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
        <h1 className="text-3xl font-medium tracking-tight text-foreground mb-8">Shopping Cart</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-surface/30 rounded-2xl border border-dashed border-border-custom">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">Your cart is empty</h2>
            <p className="text-secondary max-w-md mb-8">
              Looks like you haven't added any premium supplements to your cart yet.
            </p>
            <Link 
              href="/"
              className="bg-foreground text-background font-medium px-8 py-3.5 rounded-full hover:bg-foreground/90 transition-all flex items-center gap-2"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Cart Items List */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-surface/50 border border-border-custom rounded-2xl relative group">
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-4 right-4 p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-white rounded-xl overflow-hidden border border-border-custom/50">
                    <img 
                      src={item.product?.image_url || `https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1470&auto=format&fit=crop`} 
                      alt={item.product?.name || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col flex-1 justify-between py-1">
                    <div className="pr-10">
                      <h3 className="text-base sm:text-lg font-medium text-foreground leading-tight mb-1">
                        {item.product?.name || "Unknown Product"}
                      </h3>
                      {item.product?.flavor && (
                        <p className="text-xs sm:text-sm text-secondary mb-2">{item.product.flavor}</p>
                      )}
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        Rp {item.product?.price?.toLocaleString('id-ID') || '0'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center bg-background border border-border-custom rounded-full p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface text-foreground disabled:opacity-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface text-foreground transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-surface/50 border border-border-custom rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-medium text-foreground mb-6">Order Summary</h2>
                
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Subtotal</span>
                    <span className="text-foreground font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Shipping</span>
                    <span className="text-foreground font-medium">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-border-custom mb-6" />

                <div className="mb-6 flex flex-col gap-2">
                  <label htmlFor="address" className="text-sm font-medium text-foreground">
                    Shipping Address
                  </label>
                  <textarea 
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full shipping address..."
                    className="w-full bg-background border border-border-custom rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors resize-none h-24"
                    required
                  />
                  {!address.trim() && (
                    <p className="text-xs text-secondary mt-1">Please provide an address to proceed.</p>
                  )}
                </div>

                <div className="w-full h-px bg-border-custom mb-6" />

                <div className="flex justify-between items-end mb-8">
                  <span className="text-base font-medium text-foreground">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-semibold text-foreground">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                    <p className="text-xs text-secondary mt-1">VAT included</p>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/checkout?address=${encodeURIComponent(address)}`)}
                  disabled={!address.trim()}
                  className="w-full bg-foreground text-background font-medium py-4 rounded-xl hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
