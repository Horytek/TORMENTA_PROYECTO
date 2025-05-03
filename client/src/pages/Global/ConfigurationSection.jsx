import { Card } from "@heroui/react";

const ConfigurationSection = ({ title, description, children }) => {
  return (
    <div className="animate-fadeIn">
      <Card className="p-6 bg-white/50 backdrop-blur-sm border border-neutral-200/50 shadow-sm">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full mb-2">
            Configuración
          </div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">{title}</h2>
          <p className="text-neutral-600">{description}</p>
        </div>
        <div className="space-y-6">{children}</div>
      </Card>
    </div>
  );
};

export default ConfigurationSection;
