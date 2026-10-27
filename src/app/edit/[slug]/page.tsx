import { notFound } from "next/navigation";
import EditorClient from "@/components/EditorClient";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditProposal({ params }: { params: { slug: string } }) {
  const content = await getContent(params.slug);
  if (!content) notFound();
  return <EditorClient initial={content} />;
}
