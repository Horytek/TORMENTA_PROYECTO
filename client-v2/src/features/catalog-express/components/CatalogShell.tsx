import { useEffect, type ReactNode } from "react";
import "../styles/catalog-express.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap";

type Props = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function CatalogShell({ children, className = "", title }: Props) {
  useEffect(() => {
    const id = "cx-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = FONT_HREF;
  }, []);

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  return <div className={`cx ${className}`}>{children}</div>;
}
