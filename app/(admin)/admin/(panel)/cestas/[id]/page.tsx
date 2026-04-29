import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api-server";
import { TemplateEditor, TemplateInitial } from "./editor";

export default async function EditCestaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let template: TemplateInitial;
  try {
    template = await apiFetch<TemplateInitial>(`/api/admin/cestas/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return <TemplateEditor template={template} />;
}
