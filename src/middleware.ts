import { NextRequest, NextResponse } from "next/server";

const COOKIE = "proposal_editor_session";

async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const demo = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (demo || pathname === "/edit/login" || pathname === "/api/session") {
    return NextResponse.next();
  }

  const key = process.env.EDITOR_ACCESS_KEY || "";
  const token = request.cookies.get(COOKIE)?.value || "";
  if (key && token === (await hash(key))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = request.nextUrl.clone();
  login.pathname = "/edit/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/edit/:path*", "/api/content/:path*", "/api/history/:path*", "/api/session"],
};
