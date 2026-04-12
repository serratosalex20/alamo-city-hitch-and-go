import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-24 overflow-hidden">
        <Hero />
        <FeatureGrid />

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-screen opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent" />
        </div>
      </main>
      <Footer />
    </>
  );
}
