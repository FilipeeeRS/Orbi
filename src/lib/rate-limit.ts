import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "./supabase/admin";

// Limite de ações por pessoa: conta no banco quantas linhas ela criou na janela de tempo. Vale para
// todos os servidores ao mesmo tempo (a Vercel roda várias cópias), sem tabela nova.
export async function overLimit(table: string, column: string, userId: string, max: number, seconds: number) {
  const since = new Date(Date.now() - seconds * 1000).toISOString();
  const { count, error } = await createAdminClient()
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, userId)
    .gte("created_at", since);
  // Se a contagem falhar, não bloqueia ninguém
  return !error && (count ?? 0) >= max;
}

// Para o que não grava nada no banco (tradução): conta por endereço IP na memória deste servidor.
// É aproximado (cada cópia do servidor conta a sua parte), mas segura abusos em sequência.
const hits = new Map<string, number[]>();

export async function overIpLimit(key: string, max: number, seconds: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((at) => now - at < seconds * 1000);
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) hits.clear(); // não deixa a memória crescer sem fim
  return recent.length > max;
}
