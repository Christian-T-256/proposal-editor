import { NextRequest, NextResponse } from "next/server";
import { getHistoryVersion, listHistory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const version = request.nextUrl.searchParams.get("version");
  if (version) {
    const content = await getHistoryVersion(params.slug, version);
    if (!content) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    return NextResponse.json({ content }, { headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json(
    { versions: await listHistory(params.slug) },
    { headers: { "cache-control": "no-store" } }
  );
}
