import { NextRequest, NextResponse } from "next/server";
import { accessKeyMatches, EDITOR_COOKIE, isDemoMode, sessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (isDemoMode()) return NextResponse.json({ ok: true });
  const body = await request.json().catch(() => ({}));
  if (!accessKeyMatches(String(body.accessKey || ""))) {
    return NextResponse.json({ error: "Invalid access key" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(EDITOR_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(EDITOR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
