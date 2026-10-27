import Link from "next/link";
import { isDemoMode } from "@/lib/auth";
import { engagementFor, getAcceptance, listProposals } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditorBoard() {
  const proposals = await listProposals();
  const cards = await Promise.all(proposals.map(async (proposal) => ({
    proposal,
    acceptance: await getAcceptance(proposal.slug),
    engagement: await engagementFor(proposal.slug),
  })));
  return (
    <main className="board-shell">
      <header className="board-header">
        <div><p className="eyebrow">Proposal operations</p><h1>Editor board</h1></div>
        <div className={isDemoMode() ? "mode-badge demo" : "mode-badge"}>{isDemoMode() ? "Local demo mode" : "Supabase mode"}</div>
      </header>
      <p className="board-intro">Content is stored as validated JSON and read at request time. Each save updates the public page immediately and records a full snapshot.</p>
      <section className="proposal-grid">
        {cards.map(({ proposal, acceptance, engagement }) => (
          <article className="proposal-card" key={proposal.slug}>
            <div className="card-top"><span className={`theme-dot ${proposal.meta.theme}`} /><span>{proposal.meta.theme}</span></div>
            <h2>{proposal.meta.title}</h2>
            <p>{proposal.hero.preparedFor}</p>
            <dl className="metrics">
              <div><dt>Views</dt><dd>{engagement.views}</dd></div>
              <div><dt>Active time</dt><dd>{engagement.activeSeconds}s</dd></div>
              <div><dt>Status</dt><dd>{acceptance ? "Signed" : "Open"}</dd></div>
            </dl>
            <div className="card-actions">
              <Link className="button" href={`/edit/${proposal.slug}`}>Edit JSON</Link>
              <Link className="button secondary" href={`/p/${proposal.slug}`}>View proposal</Link>
            </div>
          </article>
        ))}
      </section>
      {isDemoMode() && <p className="demo-note">Demo changes and signatures live in server memory and reset when the dev server restarts. The fixture file is never modified.</p>}
    </main>
  );
}
