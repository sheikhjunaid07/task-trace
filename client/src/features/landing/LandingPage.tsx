import './landing.css';
import { LandingNavbar } from './components/LandingNavbar';
import { Hero } from './components/Hero';
import { TrustBar } from './components/TrustBar';
import { FeatureShowcase } from './components/FeatureShowcase';
import { WorkflowSection } from './components/WorkflowSection';
import { ProductShowcase } from './components/ProductShowcase';
import { WhyTaskTrace } from './components/WhyTaskTrace';
import { Testimonials } from './components/Testimonials';
import { StatsSection } from './components/StatsSection';
import { PricingSection } from './components/PricingSection';
import { FinalCTA } from './components/FinalCTA';
import { LandingFooter } from './components/LandingFooter';

export function LandingPage() {
  return (
    <div className="relative w-full max-w-full overflow-x-hidden bg-page text-ink">
      <LandingNavbar />
      <Hero />
      <TrustBar />
      <FeatureShowcase />
      <WorkflowSection />
      <ProductShowcase />
      <WhyTaskTrace />
      <Testimonials />
      <StatsSection />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}