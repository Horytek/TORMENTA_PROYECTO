import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import { CONTACT_INQUIRY_TYPES, CONTACT_METHODS, LEGAL_CONTACT } from "../data/landing.data";

/**
 * No hay endpoint de backend para mensajes de contacto (el formulario del sitio original
 * tampoco lo tenía — simulaba éxito con un setTimeout y descartaba los datos). En vez de
 * fingir un envío que no llega a ningún lado, este abre el cliente de correo del usuario
 * con el mensaje precargado — es "menos pulido" pero realmente funciona.
 */
export default function ContactPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const isValid = nombre.trim() && email.trim() && mensaje.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const subject = `[Web] ${tipo || "Consulta"} — ${nombre}`;
    const body = [
      `Nombre: ${nombre}`,
      `Email: ${email}`,
      empresa && `Empresa: ${empresa}`,
      telefono && `Teléfono: ${telefono}`,
      tipo && `Tipo de consulta: ${tipo}`,
      "",
      mensaje,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:${LEGAL_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Contacto
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Contáctanos hoy mismo.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Cuéntanos sobre tu negocio y te ayudamos a elegir el plan correcto.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c_nombre">Nombre</Label>
                <Input id="c_nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c_email">Email</Label>
                <Input id="c_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c_empresa">Empresa (opcional)</Label>
                <Input id="c_empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c_telefono">Teléfono (opcional)</Label>
                <Input id="c_telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de consulta</Label>
              <Select value={tipo || undefined} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                <SelectContent>
                  {CONTACT_INQUIRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c_mensaje">Mensaje</Label>
              <Textarea
                id="c_mensaje"
                rows={5}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Cuéntanos en qué podemos ayudarte…"
                required
              />
            </div>

            <Button type="submit" disabled={!isValid} className="w-full gap-2">
              <Send className="h-4 w-4" /> Enviar mensaje
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Se abrirá tu cliente de correo con el mensaje listo para enviar a {LEGAL_CONTACT.email}.
            </p>
          </form>

          <aside className="space-y-3">
            {CONTACT_METHODS.map((m) => {
              const Icon = m.icon;
              const content = (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{m.label}</p>
                    <p className="truncate text-[13px] font-medium text-foreground">{m.value}</p>
                  </div>
                </>
              );
              return m.href ? (
                <a
                  key={m.label}
                  href={m.href}
                  target={m.href.startsWith("http") ? "_blank" : undefined}
                  rel={m.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  {content}
                </a>
              ) : (
                <div key={m.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  {content}
                </div>
              );
            })}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
