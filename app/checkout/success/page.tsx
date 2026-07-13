"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
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
          Thank you for your purchase! We've received your payment and your order is now being processed. 
          Your premium supplements will be on their way shortly.
        </p>
        <Link 
          href="/"
          className="bg-foreground text-background font-medium px-8 py-3.5 rounded-full hover:bg-foreground/90 transition-all flex items-center gap-2"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    </div>
  );
}
