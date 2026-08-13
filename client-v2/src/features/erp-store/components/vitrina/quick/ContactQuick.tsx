import { MessageCircle } from "lucide-react";

export function ContactQuick({ telefono, className = "" }: { telefono?: string | null; className?: string }) {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const wa = digits.startsWith("51") ? digits : `51${digits}`;
  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noreferrer"
      className={`store-nav-btn inline-flex items-center gap-1.5 text-sm min-h-11 px-2 ${className}`}
      style={{ color: "var(--vitrina-accent)" }}
    >
      <MessageCircle className="size-4" />
      WhatsApp
    </a>
  );
}
