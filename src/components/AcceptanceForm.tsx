"use client";

import { FormEvent, useState } from "react";
import type { ProposalContent } from "@/lib/content";

type SignedResponse = { signedAt: string; receiptUrl?: string };

export default function AcceptanceForm({
  slug,
  copy,
  initial,
}: {
  slug: string;
  copy: ProposalContent["acceptance"];
  initial: boolean;
}) {
  const [signed, setSigned] = useState<SignedResponse | null>(
    initial ? { signedAt: "" } : null
  );
  const [submissionId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (signed) {
    return (
      <section className="acceptance signed" aria-labelledby="signed-heading">
        <p className="eyebrow">Accepted</p>
        <h2 id="signed-heading">This proposal has been signed</h2>
        {signed.signedAt && <p className="fineprint">Recorded {new Date(signed.signedAt).toLocaleString()}</p>}
        {signed.receiptUrl && <a className="button" href={signed.receiptUrl}>Download signed PDF receipt</a>}
      </section>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/accept/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        title: form.get("title"),
        company: form.get("company"),
        agreed: form.get("agreed") === "yes",
        submissionId,
      }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Could not record the signature.");
      return;
    }
    setSigned(payload.signed);
  }

  return (
    <section className="acceptance" aria-labelledby="acceptance-heading">
      <p className="eyebrow">Acceptance</p>
      <h2 id="acceptance-heading">{copy.heading}</h2>
      <p>{copy.statement}</p>
      <form onSubmit={submit}>
        <div className="signer-grid">
          <label>Full name<input name="name" autoComplete="name" maxLength={120} required /></label>
          <label>Title<input name="title" autoComplete="organization-title" maxLength={120} required /></label>
          <label>Company<input name="company" autoComplete="organization" maxLength={120} required /></label>
        </div>
        <label className="check"><input type="checkbox" name="agreed" value="yes" required /> {copy.checkboxLabel}</label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button" disabled={busy}>{busy ? "Recording..." : copy.buttonLabel}</button>
      </form>
    </section>
  );
}
