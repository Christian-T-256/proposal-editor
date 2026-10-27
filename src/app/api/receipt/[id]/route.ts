import { NextRequest, NextResponse } from "next/server";
import { getReceipt } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const pdf = await getReceipt(params.id);
  if (!pdf) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  const copy = Uint8Array.from(pdf);
  return new NextResponse(copy.buffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="signed-proposal-receipt-${params.id}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
