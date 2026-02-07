import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Users, Package, ShoppingCart, TrendingUp, AlertCircle, DollarSign, Activity,
    Building2, Bell, Settings, Plus, PackagePlus, UserPlus, ArrowUpRight, Trophy, Crown, ShoppingBag, LayoutGrid, RotateCw, Clock
} from 'lucide-react';
import dashboardDark from '../../../assets/images/dashboard-dark.png';
import ExpressDashboard from '../../../pages/Express/ExpressDashboard';
// import dashboardLight from '../../../assets/images/dashboard-light.png'; // Prepared for light mode toggle if needed

const LivingDashboard = ({ activeSector = 'retail', isPocketMode = false }) => {
    // Standard ERP View (Laptop)
    const LaptopView = () => (
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

    // Pocket View (Mobile Phone)
    const MobileView = () => (
        <div className="relative w-[340px] h-[700px] mx-auto group perspective-[1000px]">
            {/* Phone Bezel */}
            <motion.div
                initial={{ opacity: 0, rotateY: -10 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-[#000000] rounded-[3rem] border-8 border-[#121212] shadow-2xl overflow-hidden z-20"
            >
                {/* Status Bar Mock */}
                <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#000000] to-transparent z-30 flex justify-between px-6 pt-10 items-start">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <Building2 size={10} className="text-gray-500" />
                            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">EMPRESA</span>
                        </div>
                        <span className="text-white text-lg font-black tracking-tight">Bodega Express</span>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"><Bell size={18} /></div>
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"><Settings size={18} /></div>
                    </div>
                </div>

                {/* Internal Screen Content */}
                <div className="w-full h-full bg-zinc-950 pt-28 pb-8 overflow-hidden relative rounded-b-[2.5rem]">
                    <div className="h-full overflow-y-auto scrollbar-hide">
                        <ExpressDashboard demoMode={true} />
                    </div>

                    {/* Navigation Mock (Bottom Floating Bar) - Optional: Keep or Remove? 
                        ExpressDashboard has its own flow, but for visual flair maybe keep it active?
                        Actually, ExpressLayout has a bottom bar. ExpressDashboard itself doesn't.
                        However, adding a fake navigation bar overlay makes it look more "App-like" in the demo.
                     */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 flex justify-around items-center z-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] pointer-events-none">
                        <div className="flex flex-col items-center gap-1 text-blue-500">
                            <LayoutGrid size={20} />
                            <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                        <ShoppingBag size={20} className="text-zinc-600" />
                        <Package size={20} className="text-zinc-600" />
                        <Users size={20} className="text-zinc-600" />
                    </div>
                </div>
            </motion.div>
        </div>
    );

    return isPocketMode ? <MobileView /> : <LaptopView />;
};

export default LivingDashboard;
