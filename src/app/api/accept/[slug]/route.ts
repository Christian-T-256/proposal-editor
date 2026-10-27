import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { AcceptanceRecord } from "@/lib/content";
import { buildReceiptPdf } from "@/lib/pdf";
import { getAcceptance, getContent, putSignedPackage } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicRecord(record: AcceptanceRecord | null, includeReceipt = false) {
  if (!record) return null;
  return {
    signedAt: record.signedAt,
    ...(includeReceipt ? { receiptUrl: `/api/receipt/${record.receiptId}` } : {}),
  };
}

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  return NextResponse.json(
    { signed: Boolean(await getAcceptance(params.slug)) },
    { headers: { "cache-control": "private, no-store" } }
  );
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const title = String(body.title || "").trim();
    const company = String(body.company || "").trim();
    const submissionId = String(body.submissionId || "");
    if (!body.agreed) throw new Error("Check the approval box before signing.");
    if (!name || !title || !company) throw new Error("Name, title, and company are required.");
    if ([name, title, company].some((value) => value.length > 120)) throw new Error("Signer fields are too long.");
    if (!/^[0-9a-f-]{36}$/.test(submissionId)) throw new Error("Invalid signature submission.");

    const [content, existing] = await Promise.all([
      getContent(params.slug),
      getAcceptance(params.slug),
    ]);
    if (!content) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (!content.acceptance.enabled) {
      return NextResponse.json({ error: "Acceptance is disabled" }, { status: 400 });
    }
    const submissionIdHash = createHash("sha256").update(submissionId).digest("hex");
    if (existing) {
      const sameSubmission = existing.submissionIdHash === submissionIdHash;
      return NextResponse.json({ ok: true, signed: publicRecord(existing, sameSubmission) });
    }

    const proposalSha256 = createHash("sha256").update(JSON.stringify(content)).digest("hex");
    const record: AcceptanceRecord = {
      slug: params.slug,
      name,
      title,
      company,
      agreed: true,
      signedAt: new Date().toISOString(),
      proposalUpdatedAt: content.updatedAt,
      proposalSha256,
      pdfSha256: "",
      receiptId: randomUUID(),
      submissionIdHash,
    };
    const pdf = buildReceiptPdf(content, record);
    record.pdfSha256 = createHash("sha256").update(pdf).digest("hex");
    await putSignedPackage(record, pdf);
    return NextResponse.json({ ok: true, signed: publicRecord(record, true) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign proposal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
