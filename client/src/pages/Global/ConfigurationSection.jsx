import { Card } from "@heroui/react";

const ConfigurationSection = ({ title, description, children }) => {
  return (
    <div className="animate-fadeIn">
      <div className="animate-fadeIn">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 rounded-lg mb-2">
            Configuración
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 overflow-hidden p-6">
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationSection;
