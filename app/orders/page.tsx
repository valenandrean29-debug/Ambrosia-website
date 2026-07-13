"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Link from "next/link";
import { Package, ChevronRight, ClipboardList, ArrowRight } from "lucide-react";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Fetch orders with their items
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
      case "settled":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "expired":
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-surface text-secondary border-border-custom";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen">
        <TopBanner />
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 w-full animate-pulse">
          <div className="h-10 bg-surface w-1/3 rounded mb-10"></div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface rounded-2xl"></div>
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

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 w-full">
        <h1 className="text-3xl font-medium tracking-tight text-foreground mb-8">Order History</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-surface/30 rounded-2xl border border-dashed border-border-custom">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">No orders yet</h2>
            <p className="text-secondary max-w-md mb-8">
              You haven't placed any orders yet. Start exploring our premium supplement collection!
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
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-surface/30 border border-border-custom rounded-2xl overflow-hidden transition-all"
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border-custom shrink-0">
                      <Package className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">ORD-{order.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-secondary mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">
                        Rp {order.total_amount?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-secondary transition-transform duration-200 ${expandedOrder === order.id ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                {/* Expanded Order Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-border-custom px-5 sm:px-6 py-5">
                    {/* Order Items */}
                    <div className="flex flex-col gap-3 mb-5">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                            <p className="text-xs text-secondary mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="border-t border-border-custom/50 pt-4 flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Subtotal</span>
                        <span className="text-foreground font-medium">
                          Rp {(order.total_amount - order.shipping_cost).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Shipping Fee</span>
                        <span className="text-foreground font-medium">
                          Rp {order.shipping_cost?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border-custom/50">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">
                          Rp {order.total_amount?.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
