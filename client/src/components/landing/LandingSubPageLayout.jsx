import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollUpButton } from './ScrollUpButton';
import ParticleWaveBackground from './3d/ParticleBackground';
import '../../styles/landing/index.css';

/**
 * Reusable layout for all Landing Sub-pages (About, Services, Team, etc.)
 * Ensures consistent background, font, and structure.
 */
export const LandingSubPageLayout = ({ children, activeSectorColor = '#3b82f6' }) => {

    useEffect(() => {
        document.body.classList.add('landing-body');
        return () => {
            document.body.classList.remove('landing-body');
        };
    }, []);

    return (
        <div className="landing-page min-h-screen bg-landing-primary relative overflow-x-hidden font-manrope selection:bg-landing-accent selection:text-black">
            {/* 1. Global Background */}
            <div className="fixed inset-0 z-0">
                <ParticleWaveBackground activeColor={activeSectorColor} />
            </div>

            {/* 2. Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-grow pt-24 pb-20">
                    {children}
                </main>

                <Footer />
            </div>

            <ScrollUpButton />
        </div>
    );
};
