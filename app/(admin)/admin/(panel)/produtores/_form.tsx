"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { ActionState, INITIAL, deleteProducerAction } from "./actions";

export type ProducerInitial = {
  id: string;
  name: string;
  description: string | null;
  story: string | null;
  location: string | null;
  image_url: string | null;
  cover_image_url: string | null;
  specialties: string[] | null;
  since: number | null;
  active: boolean;
};

type Props = {
  initial?: ProducerInitial;
  onSubmit: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function ProducerForm({ initial, onSubmit, submitLabel }: Props) {
  const [state, action, pending] = useActionState(onSubmit, INITIAL);
  const [deletePending, startDelete] = useTransition();

  function handleDelete() {
    if (!initial) return;
    if (
      !confirm(
        `Remover o produtor "${initial.name}"? (soft delete — preserva histórico)`,
      )
    )
      return;
    startDelete(() => deleteProducerAction(initial.id));
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/produtores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold">
          {initial ? `Editar: ${initial.name}` : "Novo produtor"}
        </h1>
        {initial && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deletePending ? "Removendo..." : "Remover"}
          </button>
        )}
      </header>

      <form action={action} className="rounded-xl bg-card border p-6 space-y-5">
        <Field label="Nome *" name="name" defaultValue={initial?.name} required />
        <Field
          label="Descrição"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Resumo curto (1 linha)"
        />
        <FieldTextarea
          label="História"
          name="story"
          defaultValue={initial?.story ?? ""}
          placeholder="Texto longo sobre o produtor (opcional)"
          rows={4}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Localização"
            name="location"
            defaultValue={initial?.location ?? ""}
            placeholder="ex: Pelotas, RS"
          />
          <Field
            label="Ano de fundação"
            name="since"
            type="number"
            min={1900}
            max={2100}
            defaultValue={initial?.since?.toString() ?? ""}
          />
        </div>
        <Field
          label="Especialidades"
          name="specialties"
          defaultValue={initial?.specialties?.join(", ") ?? ""}
          placeholder="Separadas por vírgula. Ex: Morango, Pêssego, Uva"
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="URL da foto (avatar)"
            name="image_url"
            type="url"
            defaultValue={initial?.image_url ?? ""}
          />
          <Field
            label="URL da capa"
            name="cover_image_url"
            type="url"
            defaultValue={initial?.cover_image_url ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial?.active ?? true}
            className="h-4 w-4 rounded"
          />
          Produtor ativo (aparece no catálogo público)
        </label>

        {state.status === "error" && (
          <div role="alert" className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
            {state.message}
          </div>
        )}
        {state.status === "ok" && (
          <div className="rounded-md bg-green-50 text-green-900 text-sm px-3 py-2">
            {state.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Salvando..." : submitLabel}
          </button>
          <Link
            href="/admin/produtores"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------------
// shared field primitives
// ----------------------------------------------------------------------------

function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}

function FieldTextarea({
  label,
  name,
  ...rest
}: {
  label: string;
  name: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}
