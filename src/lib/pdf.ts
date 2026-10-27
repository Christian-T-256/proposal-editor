import type { AcceptanceRecord, ProposalContent } from "./content";

function ascii(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
}

function pdfText(value: string): string {
  return ascii(value).replace(/([\\()])/g, "\\$1");
}

export function buildReceiptPdf(content: ProposalContent, record: AcceptanceRecord): Uint8Array {
  const lines = [
    "SIGNED PROPOSAL RECEIPT",
    "",
    `Proposal: ${content.meta.title}`,
    `Proposal slug: ${record.slug}`,
    `Signed by: ${record.name}`,
    `Title: ${record.title}`,
    `Company: ${record.company}`,
    `Signed at: ${record.signedAt}`,
    `Proposal version: ${record.proposalUpdatedAt || "initial fixture"}`,
    `Proposal SHA-256: ${record.proposalSha256}`,
    `Receipt ID: ${record.receiptId}`,
    "",
    "The signer checked the proposal acceptance statement and submitted",
    "their name, title, and company. This receipt identifies the exact",
    "JSON proposal snapshot accepted at the time shown above.",
  ];

  const commands = ["BT", "/F1 11 Tf", "54 744 Td", "15 TL"];
  lines.forEach((line, index) => {
    if (index > 0) commands.push("T*");
    commands.push(`(${pdfText(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
