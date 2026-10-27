import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProposalDocument from "@/components/ProposalDocument";
import { getAcceptance, getContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const content = await getContent(params.slug);
  if (!content) return { title: "Proposal not found" };
  return { title: content.meta.title, description: content.meta.description };
}

export default async function ProposalPage({ params }: { params: { slug: string } }) {
  const [content, acceptance] = await Promise.all([
    getContent(params.slug),
    getAcceptance(params.slug),
  ]);
  if (!content) notFound();
  return <ProposalDocument content={content} signed={Boolean(acceptance)} />;
}
