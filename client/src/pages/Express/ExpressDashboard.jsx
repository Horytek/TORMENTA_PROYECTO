import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/express.services";
import { DashboardHeader } from "./Dashboard/DashboardHeader";
import { StatsCards } from "./Dashboard/StatsCards";
import { ActionsGrid } from "./Dashboard/ActionsGrid";

import { RecentActivity } from "./Dashboard/RecentActivity";
import { StockAlerts } from "./Dashboard/StockAlerts";
import { WeeklyChart } from "./Dashboard/WeeklyChart";
import { TopProduct } from "./Dashboard/TopProduct";

function ExpressDashboard() {
    const [stats, setStats] = useState({ todayTotal: 0, todayCount: 0, recentSales: [], lowStock: [], weeklySales: [], topProduct: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-zinc-950 px-4 pb-24 pt-2 space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Modular Components */}
            <DashboardHeader loading={loading} onRefresh={loadStats} />

            <StatsCards stats={stats} />

            {/* Charts Row */}
            <WeeklyChart data={stats.weeklySales} />

            <ActionsGrid />

            {/* Insights Row */}
            <TopProduct product={stats.topProduct} />
            <StockAlerts products={stats.lowStock} />
            <RecentActivity sales={stats.recentSales} />
        </div>
    );
}
export default ExpressDashboard;
