import { Navbar } from "../components/marketing/Navbar";
import { HeroSection } from "../components/marketing/HeroSection";
import { IntelligenceEngines } from "../components/marketing/IntelligenceEngines";
import { RegulatoryCore } from "../components/marketing/RegulatoryCore";
import { TrustBar } from "../components/marketing/TrustBar";
import { PricingSection } from "../components/marketing/PricingSection";
import { CredentialsSection } from "../components/marketing/CredentialsSection";
import { CTABanner } from "../components/marketing/CtaBanner";
import { Footer } from "../components/marketing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <IntelligenceEngines />
        <RegulatoryCore />
        <TrustBar />
        <PricingSection />
        <CredentialsSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
