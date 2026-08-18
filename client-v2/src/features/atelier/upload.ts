import {
  confirmAtelierFile,
  requestAtelierFileAuth,
} from "@/features/platform/api/atelier";
import type { AtelierFileCategory } from "./tokens";
import type { AtelierFileMeta } from "./types";

const IMAGEKIT_UPLOAD = "https://upload.imagekit.io/api/v1/files/upload";

type UploadRole = "cliente" | "creador";

type AuthPayload = {
  token: string;
  expire: number | string;
  signature: string;
  publicKey: string;
  folder: string;
  fileName: string;
  tags?: string[] | string;
  useUniqueFileName?: boolean;
  isPrivateFile?: boolean;
};

function asAuth(raw: unknown): AuthPayload {
  const body = raw as { data?: AuthPayload } & AuthPayload;
  return body.data ?? body;
}

function uploadToImageKit(
  form: FormData,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<{ fileId: string; filePath: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", IMAGEKIT_UPLOAD);
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      onProgress?.(Math.round((ev.loaded / ev.total) * 90));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          fileId?: string;
          filePath?: string;
          message?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && json.fileId) {
          resolve({ fileId: json.fileId, filePath: json.filePath || "" });
          return;
        }
        reject(new Error(json.message || "No se pudo guardar el archivo privado"));
      } catch {
        reject(new Error("No se pudo guardar el archivo privado"));
      }
    };
    xhr.onerror = () => reject(new Error("No se pudo conectar con el storage"));
    xhr.onabort = () => reject(new DOMException("Cancelado", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

/** Subida privada: auth → ImageKit isPrivateFile → confirm. Nunca usar la URL de respuesta en <img>. */
export async function uploadAtelierPrivateFile(opts: {
  file: File;
  category: AtelierFileCategory;
  role: UploadRole;
  id_request?: number;
  id_order?: number;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<AtelierFileMeta> {
  const { file, category, role, id_request, id_order, onProgress, signal } = opts;
  const authRes = await requestAtelierFileAuth(
    {
      category,
      id_request,
      id_order,
      file_name: file.name,
      mime: file.type,
      byte_size: file.size,
    },
    role,
  );
  const cfg = asAuth(authRes);
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", cfg.fileName);
  form.append("publicKey", cfg.publicKey);
  form.append("signature", cfg.signature);
  form.append("expire", String(cfg.expire));
  form.append("token", cfg.token);
  form.append("folder", cfg.folder);
  form.append("isPrivateFile", "true");
  form.append("useUniqueFileName", cfg.useUniqueFileName === false ? "false" : "false");
  const tags = Array.isArray(cfg.tags) ? cfg.tags.join(",") : cfg.tags;
  if (tags) form.append("tags", tags);

  const ik = await uploadToImageKit(form, onProgress, signal);
  onProgress?.(95);
  const confirmed = await confirmAtelierFile(
    {
      provider_file_id: ik.fileId,
      storage_key: ik.filePath,
      category,
      id_request,
      id_order,
      file_name: file.name,
      mime: file.type,
      byte_size: file.size,
    },
    role,
  );
  onProgress?.(100);
  return (confirmed.data || confirmed) as AtelierFileMeta;
}
