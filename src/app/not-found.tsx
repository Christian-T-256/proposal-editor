import Link from "next/link";

export default function NotFound() {
  return <main className="login-shell"><section className="login-card"><p className="eyebrow">404</p><h1>Proposal not found</h1><p>The requested proposal does not exist or is not available.</p><Link className="button" href="/edit">Open editor board</Link></section></main>;
}
