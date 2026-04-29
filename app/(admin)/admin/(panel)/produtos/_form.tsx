"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { ActionState, INITIAL, deleteProductAction } from "./actions";

export type ProductInitial = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  image_url: string | null;
  stock: number;
  product_type: "FOOD" | "CRAFT";
  organic: boolean;
  premium: boolean;
  available: boolean;
  seasonal: boolean;
  category: { id: string; name: string };
  producer: { id: string; name: string };
};

export type CategoryOption = { id: string; name: string };
export type ProducerOption = { id: string; name: string };

type Props = {
  initial?: ProductInitial;
  categories: CategoryOption[];
  producers: ProducerOption[];
  onSubmit: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function ProductForm({
  initial,
  categories,
  producers,
  onSubmit,
  submitLabel,
}: Props) {
  const [state, action, pending] = useActionState(onSubmit, INITIAL);
  const [deletePending, startDelete] = useTransition();

  function handleDelete() {
    if (!initial) return;
    if (!confirm(`Remover "${initial.name}"? (soft delete)`)) return;
    startDelete(() => deleteProductAction(initial.id));
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold">
          {initial ? `Editar: ${initial.name}` : "Novo produto"}
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
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome *" name="name" defaultValue={initial?.name} required />
          <Select
            label="Tipo *"
            name="product_type"
            defaultValue={initial?.product_type ?? "FOOD"}
            options={[
              { value: "FOOD", label: "Alimento (FOOD) — entra em cestas" },
              { value: "CRAFT", label: "Artesanato (CRAFT) — apenas avulso" },
            ]}
          />
        </div>

        <FieldTextarea
          label="Descrição"
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Preço (R$) *"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.price}
            required
          />
          <Field
            label="Unidade *"
            name="unit"
            defaultValue={initial?.unit}
            placeholder="kg, maço, unidade, bandeja 300g"
            required
          />
          <Field
            label="Estoque"
            name="stock"
            type="number"
            min="0"
            defaultValue={initial?.stock?.toString() ?? "0"}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Categoria *"
            name="category_id"
            defaultValue={initial?.category.id}
            required
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Produtor *"
            name="producer_id"
            defaultValue={initial?.producer.id}
            required
            options={producers.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>

        <Field
          label="URL da imagem"
          name="image_url"
          type="url"
          defaultValue={initial?.image_url ?? ""}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Checkbox
            label="Disponível"
            hint="Aparece no catálogo público"
            name="available"
            defaultChecked={initial?.available ?? true}
          />
          <Checkbox
            label="Orgânico"
            name="organic"
            defaultChecked={initial?.organic ?? false}
          />
          <Checkbox
            label="Premium"
            hint="Candidato a upgrade_fee em cestas"
            name="premium"
            defaultChecked={initial?.premium ?? false}
          />
          <Checkbox
            label="Sazonal"
            name="seasonal"
            defaultChecked={initial?.seasonal ?? false}
          />
        </div>

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
            href="/admin/produtos"
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
// Field primitives
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
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">{label}</label>
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
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">{label}</label>
      <textarea
        id={name}
        name={name}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  ...rest
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">{label}</label>
      <select
        id={name}
        name={name}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        {...rest}
      >
        {!rest.required && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({
  label,
  hint,
  ...rest
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded" {...rest} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
