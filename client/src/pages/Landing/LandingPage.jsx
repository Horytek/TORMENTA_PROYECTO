import React, { useEffect } from 'react';

// Components
import { Navbar } from '../../components/landing/Navbar';
import Hero from '../../components/landing/Hero';
import BlueprintSection from '../../components/landing/blueprint/BlueprintSection';
import CaseStudy from '../../components/landing/CaseStudy';
import { Pricing } from '../../components/landing/Pricing';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Styles
import '../../components/landing/styles/landing-theme.css';

export default function LandingPage() {
  // Isolate Landing Page Styles
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page bg-landing-primary overflow-x-hidden" data-theme="landing">
      <Navbar />

      {/* Act 1: Living Dashboard */}
      <div id="home">
        <Hero />
      </div>

      {/* Act 2: Architecture & Security */}
      <div id="features">
        <BlueprintSection />
      </div>

      {/* Act 3: Review / Social Proof */}
      <div id="feedback">
        <CaseStudy />
      </div>

      {/* Act 3: Pricing */}
      <div id="pricing">
        <Pricing />
      </div>

      <Footer />
      <ScrollUpButton />
    </div>
  );
}