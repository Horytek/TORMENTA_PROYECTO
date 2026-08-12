import { useState } from "react";

type Props = {
  urls: string[];
};

export function ReviewMediaThumbs({ urls }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  if (!urls.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {urls.map((url) => (
          <button
            key={url}
            type="button"
            className="size-16 rounded-md overflow-hidden border store-hairline bg-black/5"
            onClick={() => setOpen(url)}
          >
            <img src={url} alt="" className="size-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
          aria-label="Cerrar imagen"
        >
          <img src={open} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        </button>
      )}
    </>
  );
}
