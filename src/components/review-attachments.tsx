import { attachmentKind, formatBytes, isOurAttachment, type Attachment } from "@/lib/attachments";

// Anexos de uma review: imagens/GIFs em grade (clicar abre grande), vídeos com player, PDF e Word como arquivo.
export function ReviewAttachments({ attachments }: { attachments: unknown }) {
  const list = (Array.isArray(attachments) ? attachments : []).filter(isOurAttachment);
  if (!list.length) return null;
  const images = list.filter((a) => attachmentKind(a.type) === "image");
  const videos = list.filter((a) => attachmentKind(a.type) === "video");
  const files = list.filter((a) => ["pdf", "doc"].includes(attachmentKind(a.type)));

  return (
    <div className="mt-2 space-y-2">
      {/* Imagens lado a lado numa linha só (rola para o lado se não couberem) */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="block shrink-0 overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- anexo do Storage, largura pela proporção */}
              <img
                src={a.url}
                alt={a.name}
                loading="lazy"
                className={`w-auto max-w-72 object-cover transition hover:opacity-90 ${images.length === 1 ? "h-56" : "h-36"}`}
              />
            </a>
          ))}
        </div>
      )}
      {videos.map((a) => (
        <video key={a.url} src={a.url} controls preload="metadata" className="max-h-80 w-full max-w-md rounded-lg border border-border bg-black" />
      ))}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((a) => (
            <li key={a.url}>
              <FileChip attachment={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileChip({ attachment: a }: { attachment: Attachment }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      download={a.name}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 py-1.5 ps-1.5 pe-3 text-xs transition hover:border-muted"
    >
      <AttachmentIcon type={a.type} className="size-8" />
      <span className="max-w-48 truncate" title={a.name}>
        {a.name}
      </span>
      <span className="text-muted">{formatBytes(a.size)}</span>
    </a>
  );
}

// Ícone de arquivo com o rótulo do tipo (PDF, DOC, VÍDEO, IMG).
export function AttachmentIcon({ type, className }: { type: string; className?: string }) {
  const kind = attachmentKind(type);
  const label = { pdf: "PDF", doc: "DOC", video: "▶", image: "IMG" }[kind];
  const color = { pdf: "bg-red-500/15 text-red-400", doc: "bg-blue-500/15 text-blue-400", video: "bg-surface-2 text-fg", image: "bg-surface-2 text-fg" }[kind];
  return (
    <span className={`grid shrink-0 place-items-center rounded-md text-[9px] font-bold tracking-wider ${color} ${className ?? ""}`}>
      {label}
    </span>
  );
}
