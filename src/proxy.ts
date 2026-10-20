import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_PATHS = ["/settings", "/import", "/movie/new", "/reset-password", "/notifications"];
const DEVICE_COOKIE = "orbi-device";

// "Chrome no Windows", "Safari no iPhone"...: navegador + sistema pelo user-agent.
function describeDevice(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";
  const os = /iPhone|iPad/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "outro sistema";
  return { key: `${browser}-${os}`.toLowerCase().replace(/\s+/g, "-"), label: `${browser} · ${os}` };
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Renova a sessão se necessário. Não colocar código entre a criação do client e esta chamada.
  const { data } = await supabase.auth.getClaims();

  // Aparelho/navegador novo: registra uma vez por navegador (cookie) para a notificação de "novo acesso".
  if (data?.claims?.sub && !request.cookies.get(DEVICE_COOKIE)) {
    const device = describeDevice(request.headers.get("user-agent") ?? "");
    const { error } = await supabase
      .from("user_devices")
      .upsert({ user_id: data.claims.sub, device_key: device.key, label: device.label }, { onConflict: "user_id,device_key", ignoreDuplicates: true });
    // Sem a tabela ainda (migração não aplicada), tenta de novo na próxima visita.
    if (!error) response.cookies.set(DEVICE_COOKIE, device.key, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  const path = request.nextUrl.pathname;
  if (!data?.claims && PRIVATE_PATHS.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
