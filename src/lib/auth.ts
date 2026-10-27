import { createHash, timingSafeEqual } from "crypto";

export const EDITOR_COOKIE = "proposal_editor_session";

export function isDemoMode(): boolean {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function sessionToken(): string {
  const key = process.env.EDITOR_ACCESS_KEY || "";
  return key ? createHash("sha256").update(key).digest("hex") : "";
}

export function accessKeyMatches(candidate: string): boolean {
  const expected = process.env.EDITOR_ACCESS_KEY || "";
  if (!expected || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
