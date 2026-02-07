import React, { useEffect, useState } from 'react';

// Components
import { Navbar } from '../../components/landing/Navbar';
import Hero from '../../components/landing/Hero';
import BlueprintSection from '../../components/landing/blueprint/BlueprintSection';
import CaseStudy from '../../components/landing/CaseStudy';
import { Pricing } from '../../components/landing/Pricing';
import { FAQ } from '../../components/landing/FAQ';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Styles
import '../../components/landing/styles/landing-theme.css';

export default function LandingPage() {
  const [isPocketMode, setIsPocketMode] = useState(false);

  // Isolate Landing Page Styles
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page bg-landing-primary overflow-x-hidden" data-theme="landing">
      <Navbar isPocketMode={isPocketMode} setIsPocketMode={setIsPocketMode} />

      {/* Act 1: Living Dashboard */}
      <div id="home">
        <Hero isPocketMode={isPocketMode} />
      </div>

      {/* Act 2: Architecture & Security */}
      <div id="features">
        <BlueprintSection isPocketMode={isPocketMode} />
      </div>

      {/* Act 3: Review / Social Proof */}
      <div id="feedback">
        <CaseStudy isPocketMode={isPocketMode} />
      </div>

      {/* Act 3: Pricing */}
      <div id="pricing">
        <Pricing isPocketMode={isPocketMode} />
      </div>

      <FAQ isPocketMode={isPocketMode} />

      <Footer />
      <ScrollUpButton />
    </div>
  );
}