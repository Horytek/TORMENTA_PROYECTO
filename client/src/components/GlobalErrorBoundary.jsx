import React from 'react';
import { Button } from "@heroui/react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Auto-reload on ChunkLoadError logic
        if (error?.message?.includes("Loading chunk") || error?.name === "ChunkLoadError") {
            // Prevent infinite loops using session storage
            const lastReload = sessionStorage.getItem("chunk_reload_ts");
            const now = Date.now();

            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem("chunk_reload_ts", now.toString());
                window.location.reload();
                return;
            }
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Algo salió mal</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            La aplicación ha encontrado un error inesperado. Por favor, intenta recargar la página.
                        </p>
                        <div className="pt-2">
                            <Button
                                color="primary"
                                size="lg"
                                onPress={this.handleReload}
                                startContent={<RefreshCcw size={20} />}
                                className="font-semibold shadow-lg shadow-blue-500/20"
                            >
                                Recargar Aplicación
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400 pt-4 break-words">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
