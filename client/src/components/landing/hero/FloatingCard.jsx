import { motion } from 'framer-motion';

const FloatingCard = ({ icon: Icon, label, value, trend, trendUp, delay = 0, className = "" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8 }}
            className={`absolute flex items-center gap-4 min-w-[200px] p-4 rounded-2xl 
        bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl shadow-black/20 
        hover:bg-white/10 transition-colors cursor-default
        ${className}`}
        >
            <div className={`p-3 rounded-xl ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div>
                <div className="text-landing-text-muted text-xs font-medium tracking-wide uppercase opacity-80">{label}</div>
                <div className="text-white font-bold text-lg font-manrope tracking-tight">{value}</div>
                <div className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend}
                </div>
            </div>
        </motion.div>
    );
};

export default FloatingCard;
