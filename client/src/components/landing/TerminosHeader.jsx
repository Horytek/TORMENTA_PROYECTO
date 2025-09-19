export const TerminosHeader = () => {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 pt-20">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-color/5 to-primary-color/5"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-tr from-primary-color/20 to-transparent rounded-full blur-2xl"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-secondary-color/20 to-primary-color/20 rounded-full px-6 py-3 mb-8 border border-secondary-color/30">
            <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 animate-pulse"></div>
            <span className="text-secondary-color font-semibold text-sm">Marco Legal</span>
          </div>
          
          {/* Título */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Términos y{" "}
            <span className="bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
              Condiciones
            </span>
          </h1>
          
          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-secondary-text max-w-4xl mx-auto mb-12 leading-relaxed">
            Condiciones de uso de los servicios de HoryTek y nuestro{" "}
            <span className="text-white font-semibold">sistema ERP HoryCore</span>.
          </p>
          
          {/* Línea decorativa */}
          <div className="w-32 h-1 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full"></div>
        </div>
      </div>
      
      {/* Elementos decorativos adicionales */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-color/50 to-transparent"></div>
    </section>
  );
};