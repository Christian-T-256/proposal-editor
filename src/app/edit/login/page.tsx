import LoginForm from "@/components/LoginForm";

export default function EditorLogin() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Private workspace</p>
        <h1>Open the proposal editor</h1>
        <p>The public proposal is separate from this access-key protected editing surface.</p>
        <LoginForm />
      </section>
    </main>
  );
}
