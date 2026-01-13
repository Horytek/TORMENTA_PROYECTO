import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "./ui/GlassCard";
import { Send, Loader2 } from "lucide-react";

// Shadcn UI Components
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";

export const FormularioContacto = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    tipoConsulta: "",
    mensaje: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // General handler for native inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler specifically for Shadcn Select
  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      tipoConsulta: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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

  const tiposConsulta = [
    { key: "implementacion", label: "Implementación completa" },
    { key: "migracion", label: "Migración de sistema actual" },
    { key: "consultoria", label: "Consultoría y asesoría" },
    { key: "soporte", label: "Soporte técnico" },
    { key: "personalizacion", label: "Personalización de módulos" },
    { key: "capacitacion", label: "Capacitación del equipo" },
    { key: "demo", label: "Demo del sistema" }
  ];

  return (
    <section className="w-full pb-20 relative px-4" id="formulario-contacto">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-8 md:p-12 border-white/10 !bg-[#0A0B10]/80 backdrop-blur-xl relative overflow-hidden">

            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-manrope">
                ¿Listo para Transformar tu Empresa?
              </h2>
              <p className="text-white/50 text-lg">
                Completa el formulario y nuestro equipo se pondrá en contacto contigo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="nombre" className="text-white text-base font-semibold mb-1">Nombre completo</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Ej. Juan Pérez"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500 h-11"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="email" className="text-white text-base font-semibold mb-1">Email corporativo</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="empresa" className="text-white text-base font-semibold mb-1">Nombre de la empresa</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    placeholder="Ej. HoryTek S.A.C."
                    value={formData.empresa}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500 h-11"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="telefono" className="text-white text-base font-semibold mb-1">Teléfono de contacto</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+51 900 000 000"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500 h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-white text-base font-semibold mb-1">Tipo de consulta</Label>
                <Select
                  value={formData.tipoConsulta}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white focus:ring-indigo-500 h-11">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D26] border-white/10 text-white">
                    {tiposConsulta.map((tipo) => (
                      <SelectItem
                        key={tipo.key}
                        value={tipo.key}
                        className="text-white focus:bg-indigo-500/20 focus:text-white"
                      >
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="mensaje" className="text-white text-base font-semibold mb-1">Describe tu proyecto</Label>
                <Textarea
                  id="mensaje"
                  name="mensaje"
                  placeholder="Cuéntanos sobre tus necesidades, objetivos y requerimientos..."
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  required
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Consulta
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-white/40 pt-2">
                Al enviar este formulario, aceptas nuestra{" "}
                <button
                  type="button"
                  onClick={() => navigate('/landing/politica-de-privacidad')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-400/30 underline-offset-4"
                >
                  Política de Privacidad
                </button>
              </p>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};