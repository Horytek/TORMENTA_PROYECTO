

export const FAQ = ({ isPocketMode }) => (
  // Using the classes from the Pricing.jsx block: mt-24 pt-16 border-t border-white/10
  // But since it's a separate section now, we might adjust top spacing, 
  // keeping the border-t to maintain visual continuity if that was desired.
  // The original block was: <div className="mt-24 pt-16 border-t border-white/10 relative">
  <section className="relative py-20 bg-[#02040a]" id="dudas-frecuentes">
    <div className="container mx-auto px-4 relative z-10">
      {/* Separator Line centered and constrained */}
      <div className="border-t border-white/10 max-w-4xl mx-auto mb-16" />

      <div className="text-center mb-12">
        <span className="text-landing-accent text-sm font-bold tracking-widest uppercase mb-2 block font-manrope">Dudas Frecuentes</span>
        <h4 className="text-2xl md:text-3xl font-bold text-white font-manrope">Resolvemos tus dudas en segundos</h4>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto font-manrope">
        {isPocketMode ? (
          <>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Necesito computadora?</div>
              <p className="text-sm text-gray-400 leading-relaxed">No. Horytek Pocket funciona perfectamente en tu celular o tablet. Tú eliges dónde vender.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Puedo cancelar cuando sea?</div>
              <p className="text-sm text-gray-400 leading-relaxed">Totalmente. El Plan Diario y Semanal no requieren contrato. El Mensual puedes cancelarlo cuando quieras.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Soporte técnico incluido?</div>
              <p className="text-sm text-gray-400 leading-relaxed">Sí. Incluso en los planes Pocket, tienes acceso a nuestro centro de ayuda y soporte vía WhatsApp.</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Incluye implementación?</div>
              <p className="text-sm text-gray-400 leading-relaxed">Sí, todos los planes incluyen onboarding guiado y carga inicial de datos para que empieces a vender desde el día 1.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Puedo cancelar cuando sea?</div>
              <p className="text-sm text-gray-400 leading-relaxed">Totalmente. No creemos en los contratos forzosos. Si no te sirve, puedes cancelar tu suscripción mensual en cualquier momento.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="font-bold text-white mb-3 text-lg">¿Migración desde Excel?</div>
              <p className="text-sm text-gray-400 leading-relaxed">Contamos con plantillas de importación masiva. Sube tu inventario y clientes en segundos.</p>
            </div>
          </>
        )}
      </div>
    </div>
  </section>
);
