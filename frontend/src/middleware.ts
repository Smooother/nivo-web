import { createServerClient } from "@/lib/supabaseServer";

export interface MiddlewareRequest {
  nextUrl: { pathname: string };
  url: string;
}

export interface MiddlewareResult {
  redirect?: string;
}

export async function middleware(req: MiddlewareRequest): Promise<MiddlewareResult | undefined> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (req.nextUrl.pathname.startsWith("/admin") && (user?.user_metadata as { role?: string } | undefined)?.role !== "admin") {
    return { redirect: "/" };
  }

  return undefined;
}

export const config = {
  matcher: ["/admin/:path*"],
};

