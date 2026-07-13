"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Link from "next/link";
import { CheckCircle2, MapPin, Truck, ShieldCheck, ArrowLeft } from "lucide-react";

interface CartItem {
  id: string;
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

const SHIPPING_FEE = 25000;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams?.get("address") || "";

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!address) {
      router.push("/cart");
      return;
    }
    fetchCart();
  }, [address, router]);

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
        router.push("/cart");
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
      console.error("Error fetching cart for checkout:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to checkout.");
      }

      const items = cartItems.map(item => ({
        name: item.product?.name?.substring(0, 50) || "Supplement",
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));

      items.push({
        name: "Shipping Fee",
        quantity: 1,
        price: SHIPPING_FEE,
      });

      const external_id = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_id,
          amount: grandTotal,
          description: `Ambrosia Order - ${cartItems.length} item(s)`,
          items,
          customer: {
            given_names: session.user.user_metadata?.name || "Customer",
            email: session.user.email,
          },
          success_redirect_url: window.location.origin + '/checkout/success',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment invoice");
      }

      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: session.user.id,
          total_amount: grandTotal,
          shipping_cost: SHIPPING_FEE,
          status: "Success",
        }])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
      }

      // Save order items
      if (orderData) {
        const orderItems = cartItems.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product?.price || 0,
          product_name: item.product?.name || "Unknown Product",
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          console.error("Error creating order items:", itemsError);
        }
      }

      // Clear cart before redirecting
      await supabase.from("cart").delete().eq("user_id", session.user.id);

      // Redirect to Xendit hosted payment page
      window.location.href = data.invoice_url;

    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred during payment processing.");
      setIsProcessing(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + SHIPPING_FEE;

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 w-full animate-pulse">
          <div className="h-10 bg-surface w-1/3 rounded mb-10"></div>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="w-full md:w-2/3 h-96 bg-surface rounded-xl"></div>
            <div className="w-full md:w-1/3 h-64 bg-surface rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 lg:px-8 py-24 w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-4">Payment Successful!</h1>
          <p className="text-secondary mb-8 leading-relaxed">
            Thank you for your purchase. We've received your order and are currently processing it. Your premium supplements will be shipped to:
            <br /><br />
            <span className="font-medium text-foreground bg-surface/50 p-3 rounded-lg block text-sm">
              {address}
            </span>
          </p>
          <Link
            href="/"
            className="bg-foreground text-background font-medium px-8 py-3.5 rounded-full hover:bg-foreground/90 transition-all"
          >
            Continue Shopping
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background min-h-screen">
      <TopBanner />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12 w-full">
        <Link href="/cart" className="inline-flex items-center text-sm font-medium text-secondary hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-medium tracking-tight text-foreground mb-8">Secure Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Left Column: Details */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">

            {/* Shipping Address Confirmation */}
            <div className="bg-surface/30 border border-border-custom rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border-custom">
                  <MapPin className="w-4 h-4 text-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground">Shipping Details</h2>
              </div>
              <div className="pl-11">
                <p className="text-secondary text-sm leading-relaxed bg-background p-4 rounded-xl border border-border-custom/50">
                  {address}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-surface/30 border border-border-custom rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border-custom">
                    <Truck className="w-4 h-4 text-foreground" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground">Order Items</h2>
                </div>
                <span className="text-sm font-medium text-secondary">{cartItems.length} items</span>
              </div>

              <div className="pl-11 flex flex-col gap-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-border-custom/50 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-border-custom/50 shrink-0">
                      <img
                        src={item.product?.image_url || `https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1470&auto=format&fit=crop`}
                        alt={item.product?.name || "Product"}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground leading-tight">{item.product?.name}</h3>
                      <p className="text-xs text-secondary mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        Rp {((item.product?.price || 0) * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-surface/50 border border-border-custom rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-medium text-foreground mb-6">Order Summary</h2>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="text-foreground font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Shipping Fee</span>
                  <span className="text-foreground font-medium">Rp {SHIPPING_FEE.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="w-full h-px bg-border-custom mb-6" />

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-medium text-foreground">Grand Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 justify-center text-xs text-secondary bg-background/50 py-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-accent-green" />
                <span>Secure SSL encrypted payment</span>
              </div>

              <button
                onClick={handleConfirmPay}
                disabled={isProcessing}
                className="w-full bg-foreground text-background font-medium py-4 rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {isProcessing ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
          <p className="text-secondary text-sm">Loading secure checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
