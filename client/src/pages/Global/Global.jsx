import ConfigurationSection from "./ConfigurationSection";
import PlanFeatures from "./PlanFeatures";
import PlanUsers from "./PlanUsers";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="w-full px-6 py-12 space-y-8">

        <ConfigurationSection
          title="Características de los Planes"
          description="Define qué características estarán disponibles en cada plan de pago."
        >
          <PlanFeatures />
        </ConfigurationSection>

        <ConfigurationSection
          title="Usuarios Asignados"
          description="Administra los usuarios y sus planes de pago correspondientes."
        >
          <PlanUsers />
        </ConfigurationSection>
      </div>
    </div>
  );
};

export default Index;