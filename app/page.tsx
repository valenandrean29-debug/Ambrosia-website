import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ShowcaseSection from "@/components/ShowcaseSection";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background">
      <TopBanner />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        
        {/* Whey Protein Showcase */}
        <ShowcaseSection 
          id="whey-protein"
          categoryName="Whey Protein"
          categoryFilter="whey"
          bannerImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
          bannerTitle="Your fave protein just got even better"
          bannerSubtitle="New formulations, gorgeous new flavors, and optimized macros for your ultimate recovery."
          buttonText="Shop Whey Protein"
          buttonHref="/shop/whey-protein"
        />

        {/* Gainer Showcase */}
        <ShowcaseSection 
          id="gainer"
          categoryName="Mass Gainer"
          categoryFilter="gainer"
          bannerImage="https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=2070&auto=format&fit=crop"
          bannerTitle="Bulk up with premium quality calories"
          bannerSubtitle="High-quality complex carbs and isolate protein to help you reach your mass goals."
          buttonText="Shop Mass Gainer"
          buttonHref="/shop/gainer"
        />

        {/* Creatine Showcase */}
        <ShowcaseSection 
          id="creatine"
          categoryName="Creatine"
          categoryFilter="creatine"
          bannerImage="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2069&auto=format&fit=crop"
          bannerTitle="Power your most intense workouts"
          bannerSubtitle="Pure, unadulterated creatine monohydrate to increase your strength and performance."
          buttonText="Shop Creatine"
          buttonHref="/shop/creatine"
        />
        
      </main>
    </div>
  );
}
