import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Users, Package, ShoppingCart, TrendingUp, AlertCircle, DollarSign, Activity } from 'lucide-react';
import dashboardDark from '../../../assets/images/dashboard-dark.png';
// import dashboardLight from '../../../assets/images/dashboard-light.png'; // Prepared for light mode toggle if needed

const LivingDashboard = ({ activeSector = 'retail' }) => {
    // We'll use the dark screenshot for the Hero section as it fits the "Night/Impact" theme

    return (
        <div className="relative w-full max-w-5xl mx-auto group">
            {/* Main Glass Container - The ERP Mockup */}
            <motion.div
                layout
                className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-landing-secondary-foreground/10 relative z-10 bg-[#0f121a]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Mockup Header / Browser Bar */}
                <div className="h-10 border-b border-landing-secondary-foreground/10 bg-landing-secondary/80 flex items-center px-4 justify-between backdrop-blur-md">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-black/20 text-landing-text-muted text-[10px] font-mono border border-white/5">
                        <span className="text-landing-accent">🔒</span> horycore.app/dashboard
                    </div>
                    <div className="w-6 h-6 rounded-full bg-landing-primary/50 border border-landing-secondary-foreground/10" />
                </div>

                {/* The Real Screenshot */}
                <div className="relative w-full overflow-hidden bg-landing-primary/40">
                    <img
                        src={dashboardDark}
                        alt="HoryCore Dashboard Interface"
                        className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.01]"
                    />

                    {/* Interactive Overlay Highlights */}
                    {/* These overlays appear on hover to highlight specific "active" areas of the screenshot */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute top-[15%] left-[2%] w-[22%] h-[15%] rounded-lg border-2 border-landing-accent/30 bg-landing-accent/5 shadow-[0_0_15px_rgba(0,189,214,0.1)]"
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute top-[15%] left-[26%] w-[22%] h-[15%] rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Decorative Glows */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-landing-accent/20 rounded-full blur-[80px] z-0" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] z-0" />
        </div>
    );
};

export default LivingDashboard;
