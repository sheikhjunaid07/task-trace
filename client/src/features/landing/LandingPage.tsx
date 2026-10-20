import './landing.css';
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
    <div className="relative overflow-x-clip bg-page text-ink">
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