import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/express.services";
import { DashboardHeader } from "./Dashboard/DashboardHeader";
import { StatsCards } from "./Dashboard/StatsCards";
import { ActionsGrid } from "./Dashboard/ActionsGrid";

import { RecentActivity } from "./Dashboard/RecentActivity";
import { StockAlerts } from "./Dashboard/StockAlerts";
import { WeeklyChart } from "./Dashboard/WeeklyChart";
import { TopProduct } from "./Dashboard/TopProduct";

function ExpressDashboard({ demoMode = false }) {
    const [stats, setStats] = useState({ todayTotal: 0, todayCount: 0, recentSales: [], lowStock: [], weeklySales: [], topProduct: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        if (demoMode) {
            setStats({
                todayTotal: 1250.50,
                todayCount: 15,
                recentSales: [
                    { id: 1, total: 150.00, created_at: new Date().toISOString() },
                    { id: 2, total: 45.90, created_at: new Date(Date.now() - 3600000).toISOString() }, // 1 hr ago
                    { id: 3, total: 200.00, created_at: new Date(Date.now() - 7200000).toISOString() } // 2 hrs ago
                ],
                lowStock: [
                    { id: 101, name: "Producto Demo A", stock: 3 },
                    { id: 102, name: "Producto Demo B", stock: 1 }
                ],
                weeklySales: [
                    { total: 800, count: 10 }, { total: 1200, count: 18 }, { total: 950, count: 12 },
                    { total: 1100, count: 15 }, { total: 1500, count: 22 }, { total: 1300, count: 19 },
                    { total: 1250, count: 15 }
                ],
                topProduct: { name: "Producto Estrella", total_sold: 45, total_revenue: 2250.00 }
            });
            setLoading(false);
            return;
        }

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
        <div className="min-h-full bg-zinc-950 px-4 pb-24 pt-2 space-y-6 animate-in fade-in zoom-in duration-500">
            {/* Modular Components */}
            <DashboardHeader loading={loading} onRefresh={loadStats} />

            <StatsCards stats={stats} />

            <ActionsGrid demoMode={demoMode} />

            {/* Main Content Area */}
            <div className="space-y-6">
                <RecentActivity sales={stats.recentSales} />

                {/* Secondary Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StockAlerts products={stats.lowStock} />
                    <TopProduct product={stats.topProduct} />
                </div>

                <div className="h-64 w-full">
                    <WeeklyChart data={stats.weeklySales} />
                </div>
            </div>
        </div>
    );
}
export default ExpressDashboard;
