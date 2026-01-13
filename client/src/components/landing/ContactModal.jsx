import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Send, Loader2 } from "lucide-react";

/**
 * ContactModal — Premium Glass (coherente con la landing)
 */
export const ContactModal = ({
  isOpen,
  onClose,
  title = "Consulta",
  type = "contact",
}) => {
  const [formData, setFormData] = useState({
    email: "",
    message: "",
    tipo: type,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    // mantiene "tipo" sincronizado si cambian props
    setFormData((p) => ({ ...p, tipo: type }));
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({ email: "", message: "", tipo: type });

      setTimeout(() => {
        onClose?.();
        setSubmitStatus(null);
      }, 2500);
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.button
            aria-label="Cerrar modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#060a14]/70 backdrop-blur-xl shadow-[0_35px_120px_rgba(0,0,0,0.75)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Accent line (más sutil y premium) */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-400/70 to-indigo-500/0" />

            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-28 -right-28 h-[420px] w-[420px] rounded-full bg-indigo-500/12 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-fuchsia-500/6 blur-[140px]" />

            {/* Vignette interna para legibilidad */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />

            {/* Header */}
            <div className="relative flex items-start justify-between px-7 pt-7 pb-4 md:px-8 md:pt-8 md:pb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                    {type === "demo" ? "Solicitud de demo" : "Consulta"}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white tracking-tight font-manrope">
                  {title}
                </h2>
                <p className="mt-2 text-sm md:text-[15px] text-white/55 font-medium max-w-[44ch]">
                  Completa el formulario y te responderemos pronto.
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="relative px-7 pb-7 md:px-8 md:pb-8">
              {submitStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-200">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="text-white/55">
                    Gracias. Te contactaremos en breve.
                  </p>

                  <button
                    onClick={onClose}
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-white/85 block"
                    >
                      Correo corporativo
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="ejemplo@empresa.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30
                                 outline-none transition
                                 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-white/85 block"
                    >
                      ¿Cómo podemos ayudarte?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Cuéntanos sobre tu negocio y lo que necesitas..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30
                                 outline-none transition
                                 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20"
                    />
                    <p className="text-xs text-white/35">
                      Respuesta estimada: &lt; 24h (días hábiles).
                    </p>
                  </div>

                  {/* Error */}
                  {submitStatus === "error" && (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                      <AlertCircle className="h-5 w-5 text-red-300" />
                      <p className="text-sm text-red-100">
                        Ocurrió un error al enviar. Inténtalo de nuevo.
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-4 text-white font-bold
                               shadow-[0_10px_45px_rgba(99,102,241,0.30)] hover:shadow-[0_14px_60px_rgba(99,102,241,0.40)]
                               transition-all duration-200
                               hover:scale-[1.01] active:scale-[0.99]
                               disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar solicitud
                        <Send className="h-4 w-4 -rotate-45" />
                      </>
                    )}
                  </button>

                  {/* Secondary action */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
