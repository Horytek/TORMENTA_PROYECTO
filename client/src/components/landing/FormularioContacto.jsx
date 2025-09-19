import { useState } from "react";
import { motion } from "framer-motion";

export const FormularioContacto = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    tipoConsulta: "",
    mensaje: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Aquí iría la lógica de envío del formulario
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Mensaje enviado correctamente. Te contactaremos pronto.");
      setFormData({
        nombre: "",
        email: "",
        empresa: "",
        telefono: "",
        tipoConsulta: "",
        mensaje: ""
      });
    }, 2000);
  };

  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1" id="formulario-contacto">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-full md:w-10/12 lg:w-2/3 xl:w-1/2 2xl:w-[800px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center mb-12">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Contáctanos</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </div>
        </motion.div>

        <div className="max-w-full mx-auto px-2 sm:px-4">
          <div className="bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 lg:p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10">
              
              <motion.form
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="block text-white font-medium text-sm">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white placeholder-secondary-text focus:border-secondary-color focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-colors duration-200"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-white font-medium text-sm">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white placeholder-secondary-text focus:border-secondary-color focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-colors duration-200"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Información empresarial */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="empresa" className="block text-white font-medium text-sm">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white placeholder-secondary-text focus:border-primary-color focus:outline-none focus:ring-2 focus:ring-primary-color/20 transition-colors duration-200"
                      placeholder="Empresa/Tienda (opcional)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="telefono" className="block text-white font-medium text-sm">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white placeholder-secondary-text focus:border-primary-color focus:outline-none focus:ring-2 focus:ring-primary-color/20 transition-colors duration-200"
                      placeholder="+51 987 654 321"
                    />
                  </div>
                </div>

                {/* Tipo de consulta */}
                <div className="space-y-2">
                  <label htmlFor="tipoConsulta" className="block text-white font-medium text-sm">
                    Tipo de consulta *
                  </label>
                  <select
                    id="tipoConsulta"
                    name="tipoConsulta"
                    value={formData.tipoConsulta}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white focus:border-secondary-color focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-colors duration-200"
                  >
                    <option value="">Selecciona el tipo de consulta</option>
                    <option value="productos">Consulta sobre productos</option>
                    <option value="disponibilidad">Disponibilidad y tallas</option>
                    <option value="precios">Información de precios</option>
                    <option value="asesoria">Asesoría de moda</option>
                    <option value="mayorista">Ventas por mayor</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label htmlFor="mensaje" className="block text-white font-medium text-sm">
                    Mensaje *
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-bgDark3 border border-gray-600/30 rounded-xl text-white placeholder-secondary-text focus:border-secondary-color focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-colors duration-200 resize-vertical"
                    placeholder="Describe tu consulta, talla buscada, estilo preferido, etc..."
                  />
                </div>

                {/* Botón de envío */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-secondary-color to-primary-color hover:from-secondary-color/90 hover:to-primary-color/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Enviando mensaje...
                      </div>
                    ) : (
                      "Enviar mensaje"
                    )}
                  </button>
                </div>

                {/* Nota de privacidad */}
                <div className="text-center text-secondary-text text-sm">
                  Al enviar este formulario, aceptas nuestra{" "}
                  <a href="/privacy-policy" className="text-secondary-color hover:underline">
                    Política de Privacidad
                  </a>
                </div>
              </motion.form>
            </div>
        </div>
        </div>
      </div>
    </section>
  );
};
