// Anexos das reviews (coluna entries.attachments). Os arquivos ficam no Storage, bucket "review-files".
export type Attachment = { url: string; name: string; type: string; size: number };

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export type AttachmentKind = "image" | "video" | "pdf" | "doc";

export function attachmentKind(type: string): AttachmentKind {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type === "application/pdf") return "pdf";
  return "doc";
}

// Só mostra arquivos do nosso bucket: a coluna é gravada pelo navegador, então um link de fora é ignorado.
export function isOurAttachment(a: unknown): a is Attachment {
  if (!a || typeof a !== "object") return false;
  const { url, name, type } = a as Attachment;
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-files/`;
  return typeof url === "string" && url.startsWith(base) && typeof name === "string" && ATTACHMENT_TYPES.includes(type);
}

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
