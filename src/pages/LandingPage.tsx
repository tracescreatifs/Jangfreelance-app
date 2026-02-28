import React, { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import FooterSection from '../components/landing/FooterSection';

const LandingPage: React.FC = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page min-h-screen bg-[#0a0a0a]">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
