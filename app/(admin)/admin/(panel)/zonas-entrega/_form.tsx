"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { ActionState, INITIAL, deleteZoneAction } from "./actions";

export type ZoneInitial = {
  id: string;
  name: string;
  description: string | null;
  delivery_fee: string;
  minimum_order_value: string;
  estimated_minutes: number | null;
  active: boolean;
  neighborhoods: string[];
};

type Props = {
  initial?: ZoneInitial;
  onSubmit: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function ZoneForm({ initial, onSubmit, submitLabel }: Props) {
  const [state, action, pending] = useActionState(onSubmit, INITIAL);
  const [deletePending, startDelete] = useTransition();

  function handleDelete() {
    if (!initial) return;
    if (
      !confirm(
        `Remover a zona "${initial.name}"? Os bairros voltam a ficar disponíveis para outra zona.`,
      )
    )
      return;
    startDelete(() => deleteZoneAction(initial.id));
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/zonas-entrega"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold">
          {initial ? `Editar: ${initial.name}` : "Nova zona de entrega"}
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
        <Field label="Nome *" name="name" defaultValue={initial?.name} required placeholder="Centro, Areal, Três Vendas..." />
        <Field
          label="Descrição"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Observações sobre a região (opcional)"
        />
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Taxa de entrega (R$) *"
            name="delivery_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.delivery_fee}
            required
          />
          <Field
            label="Valor mínimo do pedido (R$)"
            name="minimum_order_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.minimum_order_value ?? "0"}
          />
          <Field
            label="Tempo estimado (min)"
            name="estimated_minutes"
            type="number"
            min="0"
            defaultValue={initial?.estimated_minutes?.toString() ?? ""}
          />
        </div>

        <div>
          <label htmlFor="neighborhoods" className="block text-sm font-medium mb-1.5">
            Bairros desta zona
          </label>
          <textarea
            id="neighborhoods"
            name="neighborhoods"
            rows={5}
            defaultValue={initial?.neighborhoods.join("\n") ?? ""}
            placeholder={"Um bairro por linha (ou separados por vírgula)\nCentro\nPorto\nFragata"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Cada bairro é único no sistema — se já estiver vinculado a outra zona, será reportado como conflito.
            <strong className="ml-1">Salvar substitui a lista anterior.</strong>
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial?.active ?? true}
            className="h-4 w-4 rounded"
          />
          Zona ativa (disponível no checkout)
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
            href="/admin/zonas-entrega"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
