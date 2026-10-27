import { NextRequest, NextResponse } from "next/server";
import { parseContent } from "@/lib/content";
import { getContent, putContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const content = await getContent(params.slug);
  if (!content) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  return NextResponse.json(content, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const baseUpdatedAt = String(body.baseUpdatedAt ?? "");
    const current = await getContent(params.slug);
    if (current && current.updatedAt !== baseUpdatedAt) {
      return NextResponse.json(
        { error: "This proposal changed after you loaded it.", current },
        { status: 409 }
      );
    }
    const parsed = parseContent({ ...body.content, slug: params.slug });
    const saved = await putContent(params.slug, parsed);
    return NextResponse.json({ ok: true, content: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid proposal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
