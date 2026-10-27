import { NextRequest, NextResponse } from "next/server";
import { getContent, recordEvent } from "@/lib/store";

const EVENTS = new Set(["view", "engagement"]);

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const eventType = String(body.eventType || "");
    const sessionId = String(body.sessionId || "");
    if (!EVENTS.has(eventType) || !/^[a-zA-Z0-9-]{1,80}$/.test(sessionId)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    if (!(await getContent(params.slug))) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    await recordEvent({
      proposalSlug: params.slug,
      sessionId,
      eventType: eventType as "view" | "engagement",
      activeSeconds: Number(body.activeSeconds || 0),
      createdAt: new Date().toISOString(),
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Event was not recorded" }, { status: 400 });
  }
}
