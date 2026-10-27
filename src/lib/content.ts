import { assertProposal, validateProposal } from "./schema";

export type ProposalSection = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  bullets: string[];
};

export type ProposalContent = {
  schemaVersion: 1;
  slug: string;
  updatedAt: string;
  meta: { title: string; description: string; theme: string };
  hero: { eyebrow: string; title: string; summary: string; preparedFor: string };
  sections: ProposalSection[];
  cta: { heading: string; body: string };
  acceptance: {
    enabled: boolean;
    heading: string;
    statement: string;
    checkboxLabel: string;
    buttonLabel: string;
  };
};

export type AcceptanceRecord = {
  slug: string;
  name: string;
  title: string;
  company: string;
  agreed: true;
  signedAt: string;
  proposalUpdatedAt: string;
  proposalSha256: string;
  pdfSha256: string;
  receiptId: string;
  submissionIdHash: string;
};

export type HistoryEntry = { id: string; savedAt: string };

export function parseContent(raw: unknown): ProposalContent {
  return assertProposal(raw) as ProposalContent;
}

export { validateProposal };
