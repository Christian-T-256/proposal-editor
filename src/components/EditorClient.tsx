"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HistoryEntry, ProposalContent } from "@/lib/content";
import { validateProposal } from "@/lib/content";
import { THEMES } from "@/lib/themes";

export default function EditorClient({ initial }: { initial: ProposalContent }) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(initial.updatedAt);
  const [status, setStatus] = useState("Ready");
  const [versions, setVersions] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const parsed = useMemo(() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, [text]);
  const validation = parsed ? validateProposal(parsed) : { success: false, errors: ["JSON is not valid"] };

  function chooseTheme(theme: string) {
    if (!parsed) return;
    setText(JSON.stringify({ ...parsed, meta: { ...parsed.meta, theme } }, null, 2));
  }

  async function save() {
    if (!validation.success) return;
    setStatus("Saving...");
    const response = await fetch(`/api/content/${encodeURIComponent(initial.slug)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ baseUpdatedAt, content: parsed }),
    });
    const payload = await response.json();
    if (response.status === 409) {
      setStatus("Save blocked: a newer version exists. Refresh before editing again.");
      return;
    }
    if (!response.ok) {
      setStatus(`Save failed: ${payload.error || "unknown error"}`);
      return;
    }
    setBaseUpdatedAt(payload.content.updatedAt);
    setText(JSON.stringify(payload.content, null, 2));
    setStatus(`Saved ${new Date(payload.content.updatedAt).toLocaleTimeString()}`);
  }

  async function openHistory() {
    setHistoryOpen(true);
    const response = await fetch(`/api/history/${encodeURIComponent(initial.slug)}`);
    const payload = await response.json();
    setVersions(payload.versions || []);
  }

  async function loadVersion(id: string) {
    const response = await fetch(`/api/history/${encodeURIComponent(initial.slug)}?version=${encodeURIComponent(id)}`);
    const payload = await response.json();
    if (!response.ok) return;
    setText(JSON.stringify(payload.content, null, 2));
    setHistoryOpen(false);
    setStatus("History version loaded. Review it, then save to restore it.");
  }

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <div><Link href="/edit" className="back-link">All proposals</Link><h1>{initial.meta.title}</h1></div>
        <div className="editor-actions">
          <a className="button secondary" href={`/p/${initial.slug}`} target="_blank" rel="noreferrer">Open live page</a>
          <button className="button secondary" onClick={openHistory}>History</button>
          <button className="button" onClick={save} disabled={!validation.success}>Save live</button>
        </div>
      </header>
      <div className="editor-layout">
        <aside className="editor-sidebar">
          <p className="eyebrow">Theme registry</p>
          {THEMES.map((theme) => (
            <button
              className={parsed?.meta?.theme === theme.id ? "theme-option selected" : "theme-option"}
              key={theme.id}
              onClick={() => chooseTheme(theme.id)}
            >
              <span className={`theme-dot ${theme.id}`} />
              <span><strong>{theme.label}</strong><small>{theme.description}</small></span>
            </button>
          ))}
          <div className="editor-note">
            <strong>Live on save</strong>
            <p>The public renderer reads this JSON at request time. No build or redeploy is needed.</p>
          </div>
        </aside>
        <section className="json-panel">
          <div className="json-status">
            <span>{status}</span>
            <span className={validation.success ? "valid" : "invalid"}>{validation.success ? "Schema valid" : `${validation.errors.length} schema issue(s)`}</span>
          </div>
          {!validation.success && <ul className="validation-list">{validation.errors.slice(0, 8).map((error: string) => <li key={error}>{error}</li>)}</ul>}
          <textarea aria-label="Proposal JSON" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} />
        </section>
      </div>
      {historyOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setHistoryOpen(false)}>
          <section className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading"><h2 id="history-title">Version history</h2><button onClick={() => setHistoryOpen(false)} aria-label="Close history">Close</button></div>
            {versions.length === 0 ? <p>No snapshots yet. Save once to create one.</p> : versions.map((version) => (
              <button className="history-row" key={version.id} onClick={() => loadVersion(version.id)}>
                <span>{new Date(version.savedAt).toLocaleString()}</span><span>Load</span>
              </button>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}
