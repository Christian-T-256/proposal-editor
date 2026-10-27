import { createClient } from "@supabase/supabase-js";
import demoFixture from "@/data/demo-proposal.json";
import { isDemoMode } from "./auth";
import { parseContent } from "./content";
import type { AcceptanceRecord, HistoryEntry, ProposalContent } from "./content";

type DemoState = {
  proposals: Map<string, ProposalContent>;
  history: Map<string, Map<string, ProposalContent>>;
  acceptances: Map<string, AcceptanceRecord>;
  receipts: Map<string, Uint8Array>;
  events: EngagementEvent[];
};

type EngagementEvent = {
  proposalSlug: string;
  sessionId: string;
  eventType: "view" | "engagement";
  activeSeconds: number;
  createdAt: string;
};

type GlobalWithDemo = typeof globalThis & { __proposalDemoState?: DemoState };

function demoState(): DemoState {
  const root = globalThis as GlobalWithDemo;
  if (!root.__proposalDemoState) {
    const proposal = parseContent(structuredClone(demoFixture));
    root.__proposalDemoState = {
      proposals: new Map([[proposal.slug, proposal]]),
      history: new Map(),
      acceptances: new Map(),
      receipts: new Map(),
      events: [],
    };
  }
  return root.__proposalDemoState;
}

const bucketName = () => process.env.SUPABASE_STORAGE_BUCKET || "proposal-content";
const historyPrefix = (slug: string) => `_history/${slug}`;

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function validSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug);
}

function historyId(iso: string): string {
  return iso.replace(/[-:.Z]/g, "");
}

function historyIso(id: string): string {
  const match = id.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${match[7]}Z` : "";
}

export async function getContent(slug: string): Promise<ProposalContent | null> {
  if (!validSlug(slug)) return null;
  if (isDemoMode()) return demoState().proposals.get(slug) || null;
  const { data, error } = await supabase().storage.from(bucketName()).download(`${slug}.json`);
  if (error || !data) return null;
  try {
    return parseContent(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

export async function listProposals(): Promise<ProposalContent[]> {
  if (isDemoMode()) return [...demoState().proposals.values()];
  const { data, error } = await supabase().storage.from(bucketName()).list("", { limit: 500 });
  if (error) throw error;
  const slugs = (data || [])
    .map((item) => item.name)
    .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
    .map((name) => name.slice(0, -5));
  const proposals = await Promise.all(slugs.map(getContent));
  return proposals.filter((proposal): proposal is ProposalContent => proposal !== null);
}

export async function putContent(slug: string, input: ProposalContent): Promise<ProposalContent> {
  if (!validSlug(slug)) throw new Error("Invalid proposal slug");
  const saved = parseContent({ ...input, slug, updatedAt: new Date().toISOString() });
  const id = historyId(saved.updatedAt);
  if (isDemoMode()) {
    const state = demoState();
    state.proposals.set(slug, structuredClone(saved));
    const versions = state.history.get(slug) || new Map<string, ProposalContent>();
    versions.set(id, structuredClone(saved));
    state.history.set(slug, versions);
    return saved;
  }

  const storage = supabase().storage.from(bucketName());
  const body = JSON.stringify(saved, null, 2);
  const { error } = await storage.upload(`${slug}.json`, body, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw error;

  try {
    await storage.upload(`${historyPrefix(slug)}/${id}.json`, body, {
      upsert: false,
      contentType: "application/json",
      cacheControl: "0",
    });
  } catch {
    // The live save succeeded. A history warning is less harmful than reporting
    // a failed save and inviting a duplicate overwrite.
  }
  return saved;
}

export async function listHistory(slug: string): Promise<HistoryEntry[]> {
  if (!validSlug(slug)) return [];
  if (isDemoMode()) {
    return [...(demoState().history.get(slug)?.keys() || [])]
      .sort()
      .reverse()
      .map((id) => ({ id, savedAt: historyIso(id) }));
  }
  const { data, error } = await supabase().storage.from(bucketName()).list(historyPrefix(slug), {
    limit: 500,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !data) return [];
  return data
    .filter((item) => item.name.endsWith(".json"))
    .map((item) => item.name.slice(0, -5))
    .filter((id) => /^\d{8}T\d{9}$/.test(id))
    .map((id) => ({ id, savedAt: historyIso(id) }));
}

export async function getHistoryVersion(slug: string, id: string): Promise<ProposalContent | null> {
  if (!validSlug(slug) || !/^\d{8}T\d{9}$/.test(id)) return null;
  if (isDemoMode()) return demoState().history.get(slug)?.get(id) || null;
  const { data, error } = await supabase().storage
    .from(bucketName())
    .download(`${historyPrefix(slug)}/${id}.json`);
  if (error || !data) return null;
  try {
    return parseContent(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

export async function getAcceptance(slug: string): Promise<AcceptanceRecord | null> {
  if (!validSlug(slug)) return null;
  if (isDemoMode()) return demoState().acceptances.get(slug) || null;
  const { data, error } = await supabase().storage.from(bucketName()).download(`_acceptance/${slug}.json`);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as AcceptanceRecord;
  } catch {
    return null;
  }
}

export async function putSignedPackage(record: AcceptanceRecord, pdf: Uint8Array): Promise<void> {
  if (isDemoMode()) {
    const state = demoState();
    state.receipts.set(record.receiptId, Uint8Array.from(pdf));
    state.acceptances.set(record.slug, record);
    return;
  }
  const storage = supabase().storage.from(bucketName());
  const pdfPath = `_receipts/${record.receiptId}.pdf`;
  const { error: pdfError } = await storage.upload(pdfPath, pdf, {
    upsert: false,
    contentType: "application/pdf",
    cacheControl: "0",
  });
  if (pdfError) throw pdfError;
  const { error: recordError } = await storage.upload(
    `_acceptance/${record.slug}.json`,
    JSON.stringify(record, null, 2),
    { upsert: false, contentType: "application/json", cacheControl: "0" }
  );
  if (recordError) {
    await storage.remove([pdfPath]);
    throw recordError;
  }
}

export async function getReceipt(id: string): Promise<Uint8Array | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  if (isDemoMode()) return demoState().receipts.get(id) || null;
  const { data, error } = await supabase().storage.from(bucketName()).download(`_receipts/${id}.pdf`);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export async function recordEvent(event: EngagementEvent): Promise<void> {
  const safe = {
    ...event,
    sessionId: event.sessionId.slice(0, 80),
    activeSeconds: Math.max(0, Math.min(Math.round(event.activeSeconds), 3600)),
  };
  if (isDemoMode()) {
    demoState().events.push(safe);
    return;
  }
  const { error } = await supabase().from("proposal_events").insert({
    proposal_slug: safe.proposalSlug,
    session_id: safe.sessionId,
    event_type: safe.eventType,
    active_seconds: safe.activeSeconds,
    created_at: safe.createdAt,
  });
  if (error) throw error;
}

export async function engagementFor(slug: string): Promise<{ views: number; activeSeconds: number }> {
  if (isDemoMode()) {
    const rows = demoState().events.filter((event) => event.proposalSlug === slug);
    return {
      views: new Set(rows.filter((event) => event.eventType === "view").map((event) => event.sessionId)).size,
      activeSeconds: rows.reduce((sum, event) => sum + event.activeSeconds, 0),
    };
  }
  const { data, error } = await supabase()
    .from("proposal_events")
    .select("session_id,event_type,active_seconds")
    .eq("proposal_slug", slug)
    .limit(10000);
  if (error || !data) return { views: 0, activeSeconds: 0 };
  return {
    views: new Set(data.filter((row) => row.event_type === "view").map((row) => row.session_id)).size,
    activeSeconds: data.reduce((sum, row) => sum + Number(row.active_seconds || 0), 0),
  };
}
