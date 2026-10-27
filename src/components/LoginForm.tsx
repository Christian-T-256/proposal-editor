"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessKey: form.get("accessKey") }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("That access key is not valid.");
      return;
    }
    router.push("/edit");
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>Editor access key<input name="accessKey" type="password" autoComplete="current-password" required autoFocus /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? "Checking..." : "Open editor"}</button>
    </form>
  );
}
