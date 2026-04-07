import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { productionRateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/privacy", "/terms"]);

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const ip = getIP(request);

  // ── Server-side rate limiting ──
  // Auth routes (POST only — GET loads the page, POST submits the form)
  if (request.method === "POST") {
    let action: string | null = null;

    if (pathname === "/login") action = "login";
    else if (pathname === "/signup") action = "signup";

    if (action) {
      const { limited, retryAfter } = await productionRateLimit(ip, action);
      if (limited) {
        return NextResponse.json(
          { error: `Too many requests. Try again in ${retryAfter} seconds.` },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }
  }

  // Refresh session — use getUser() for server-side token validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Unauthenticated users ---
  if (!user) {
    if (PUBLIC_PATHS.has(pathname)) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // --- Authenticated users ---

  // Redirect away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding enforcement
  if (pathname !== "/onboarding" && pathname !== "/" && !PUBLIC_PATHS.has(pathname)) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
