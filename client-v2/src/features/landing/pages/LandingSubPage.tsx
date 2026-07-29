import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ScrollUpButton } from "../components/ScrollUpButton";
import { useMode } from "../hooks/useMode";
import { useUserStore } from "@/store/useUserStore";
import {
  Lock,
  Eye,
  Cookie,
  Database,
  Users,
  Server,
  Scale,
  Mail,
  Phone,
  MapPin,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LandingSubPageProps {
  pageId: "sobre-nosotros" | "equipo" | "actualizaciones" | "terminos" | "privacidad" | "contactanos";
}

export default function LandingSubPage({ pageId }: LandingSubPageProps) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const { mode, setMode } = useMode();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [isAuthenticated, navigate, pageId]);

  const renderContent = () => {
    switch (pageId) {
      case "sobre-nosotros":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Info className="h-6 w-6 text-primary" /> Nuestra Misión
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Horytek nació con el propósito de democratizar el acceso a tecnología de gestión empresarial de primer nivel para los negocios de todo el Perú. Creemos firmemente que el control minucioso de inventario, la velocidad en el punto de venta y la emisión simplificada de comprobantes tributarios son pilares fundamentales para el crecimiento comercial.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" /> Escalabilidad Sin Límites
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nuestra plataforma ERP está construida utilizando tecnologías cloud modernas que garantizan un tiempo de actividad del 99.9%. Puede comenzar con un solo almacén y crecer hasta cientos de sucursales sin experimentar demoras en sus consultas.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Innovación Constante
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No nos quedamos quietos. Adaptamos constantemente el sistema a los nuevos lineamientos de la SUNAT e incorporamos optimizaciones sugeridas directamente por nuestros clientes en sus operaciones del día a día.
                </p>
              </div>
            </div>
          </div>
        );

      case "equipo":
        return (
          <div className="space-y-8 animate-fade-in">
            <p className="text-muted-foreground leading-relaxed">
              En Horytek nos rodeamos de profesionales talentosos con un foco único: construir el ERP más rápido y fácil de usar del mercado.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">Ingeniería</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Desarrolladores dedicados a pulir el rendimiento del sistema, la integridad del Kárdex y la exactitud del costo por prenda.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Server className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">Soporte SUNAT</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Especialistas en facturación electrónica listos para guiarte en el proceso de homologación ante la SUNAT.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">Experiencia</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Diseñadores UX enfocados en que cada flujo de venta, traslado o reporte se complete con la menor cantidad de clics.
                </p>
              </div>
            </div>
          </div>
        );

      case "actualizaciones":
        return (
          <div className="space-y-8 animate-fade-in">
            <p className="text-muted-foreground leading-relaxed">
              Mantente al tanto de las últimas versiones y mejoras de la plataforma:
            </p>

            <div className="relative border-l border-border pl-6 space-y-8 ml-3">
              <div className="space-y-2">
                <div className="absolute -left-2 h-4 w-4 rounded-full border border-primary bg-background flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Versión 2.4.0</span>
                  <span className="text-xs text-muted-foreground">Julio 2026</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rediseño del módulo de Inventario y Kardex. Migración total a la base de datos de inventario unificado para simplificar los traslados y el seguimiento.
                </p>
              </div>

              <div className="space-y-2">
                <div className="absolute -left-2 h-4 w-4 rounded-full border border-border bg-background flex items-center justify-center" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Versión 2.3.5</span>
                  <span className="text-xs text-muted-foreground">Mayo 2026</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lanzamiento de guías de remisión electrónicas integradas directamente con la API de la SUNAT, reduciendo a segundos la emisión.
                </p>
              </div>

              <div className="space-y-2">
                <div className="absolute -left-2 h-4 w-4 rounded-full border border-border bg-background flex items-center justify-center" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Versión 2.2.0</span>
                  <span className="text-xs text-muted-foreground">Marzo 2026</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lanzamiento oficial de Horytek Pocket POS, permitiendo a los clientes realizar operaciones desde dispositivos móviles Android e iOS.
                </p>
              </div>
            </div>
          </div>
        );

      case "terminos":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="rounded-lg bg-muted/50 p-5 border border-border flex items-start gap-4">
              <Scale className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">Acuerdo del Usuario</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al registrarse o utilizar Horytek, usted acepta regirse por estos términos y condiciones. Por favor, léalos detenidamente.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">1. Limitación de Responsabilidad</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Horytek se esfuerza por mantener la máxima disponibilidad del servicio ERP. Sin embargo, no seremos responsables por daños indirectos, pérdida de beneficios o interrupción de operaciones comerciales. Nuestra responsabilidad total se limitará a la suma pagada en los últimos 12 meses.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">2. Suscripciones y Facturación</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Los planes se facturan por adelantado de manera mensual o anual. El impago del servicio resultará en la suspensión del acceso al ERP tras un periodo de gracia prudencial para la descarga de comprobantes e inventarios.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">3. Ley Aplicable</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este contrato se rige íntegramente por las leyes de la República del Perú. Cualquier controversia será resuelta ante los juzgados competentes de Lima, Perú.
                </p>
              </div>
            </div>
          </div>
        );

      case "privacidad":
        return (
          <div className="space-y-8 animate-fade-in">
            <p className="text-muted-foreground leading-relaxed">
              La protección de los datos de su negocio es nuestra máxima prioridad. Esta política detalla la información que recopilamos y cómo la mantenemos segura.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Datos Recopilados
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Almacenamos información de registro (nombre, RUC, correo electrónico), datos transaccionales, de inventario y de ventas necesarios para el correcto funcionamiento del ERP y las declaraciones electrónicas a la SUNAT.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Máxima Seguridad
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Toda la comunicación se encripta mediante protocolos seguros (TLS) en tránsito y los datos se resguardan en servidores con encriptación AES-256 en reposo, respaldados por copias de seguridad diarias redundantes.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Uso de Datos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bajo ninguna circunstancia venderemos o cederemos su información a terceros. La información es estrictamente confidencial y se comparte únicamente con entidades públicas por obligación fiscal de ley (SUNAT).
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" /> Cookies y Sesiones
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies técnicas y de seguridad exclusivamente para mantener iniciada su sesión en el panel de control y resguardar la identidad de cada usuario autorizado.
                </p>
              </div>
            </div>
          </div>
        );

      case "contactanos":
        return (
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] animate-fade-in">
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Estamos a tu disposición para ayudarte a migrar tus datos, configurar el facturador SUNAT o absolver dudas comerciales.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Correo de Soporte</p>
                    <p className="text-sm font-medium text-foreground">soporte@horytek.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Línea de Atención</p>
                    <p className="text-sm font-medium text-foreground">+51 987 654 321</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Oficina Central</p>
                    <p className="text-sm font-medium text-foreground">San Isidro, Lima, Perú</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Mensaje enviado. Nuestro equipo se pondrá en contacto pronto.'); }} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Envíanos un mensaje</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nombre</label>
                  <Input id="name" placeholder="Ej. Juan Pérez" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Correo electrónico</label>
                  <Input id="email" type="email" placeholder="juan@empresa.com" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-medium text-muted-foreground">Asunto</label>
                <Input id="subject" placeholder="Consulta comercial / demostración" required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium text-muted-foreground">Mensaje</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="Detalla tu consulta aquí..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar mensaje
              </Button>
            </form>
          </div>
        );
    }
  };

  const getPageMeta = () => {
    switch (pageId) {
      case "sobre-nosotros":
        return { title: "Sobre nosotros", subtitle: "Innovación y robustez para la gestión de su negocio." };
      case "equipo":
        return { title: "Nuestro Equipo", subtitle: "Dedicados a construir la mejor tecnología ERP." };
      case "actualizaciones":
        return { title: "Actualizaciones", subtitle: "Nuevas funcionalidades y correcciones del sistema." };
      case "terminos":
        return { title: "Términos y condiciones", subtitle: "Condiciones generales de uso del software ERP." };
      case "privacidad":
        return { title: "Política de privacidad", subtitle: "Garantizando la máxima confidencialidad de sus datos." };
      case "contactanos":
        return { title: "Contáctanos", subtitle: "Resuelva sus dudas con nuestros especialistas." };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between">
      <div>
        <Header mode={mode} onModeChange={setMode} />

        <main className="mx-auto max-w-4xl px-6 py-16 md:py-24 space-y-12">
          {/* Header de la Subpágina */}
          <div className="space-y-4 text-center sm:text-left border-b border-border pb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Horytek · Información
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {meta.title}
            </h1>
            <p className="text-base text-muted-foreground">
              {meta.subtitle}
            </p>
          </div>

          {/* Contenido Dinámico */}
          <div className="pb-12">
            {renderContent()}
          </div>
        </main>
      </div>

      <Footer />
      <ScrollUpButton />
    </div>
  );
}
