import type { ProposalContent } from "@/lib/content";
import { isTheme } from "@/lib/themes";
import AcceptanceForm from "./AcceptanceForm";
import EngagementTracker from "./EngagementTracker";

export default function ProposalDocument({
  content,
  signed,
}: {
  content: ProposalContent;
  signed: boolean;
}) {
  const theme = isTheme(content.meta.theme) ? content.meta.theme : "cedar";
  return (
    <main className="proposal" data-theme={theme}>
      <EngagementTracker slug={content.slug} />
      <header className="proposal-hero">
        <div className="proposal-nav"><span>Proposal</span><span>{content.hero.preparedFor}</span></div>
        <div className="hero-copy">
          <p className="eyebrow">{content.hero.eyebrow}</p>
          <h1>{content.hero.title}</h1>
          <p className="hero-summary">{content.hero.summary}</p>
        </div>
      </header>

      <div className="proposal-body">
        {content.sections.map((section, index) => (
          <section className="proposal-section" id={section.id} key={section.id}>
            <div className="section-index">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.heading}</h2>
              {section.body.split(/\n\n+/).map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
              {section.bullets.length > 0 && (
                <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              )}
            </div>
          </section>
        ))}

        <section className="proposal-cta">
          <p className="eyebrow">Next step</p>
          <h2>{content.cta.heading}</h2>
          <p>{content.cta.body}</p>
        </section>

        {content.acceptance.enabled && (
          <AcceptanceForm slug={content.slug} copy={content.acceptance} initial={signed} />
        )}
      </div>
      <footer className="proposal-footer">
        <span>Proposal version</span><span>{content.updatedAt || "demo fixture"}</span>
      </footer>
    </main>
  );
}
