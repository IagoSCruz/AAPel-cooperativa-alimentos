"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import {
  INITIAL,
  addSlotAction,
  deleteSlotAction,
  deleteTemplateAction,
  updateSlotAction,
  updateTemplateAction,
} from "../actions";

type Slot = {
  id: string;
  slot_label: string;
  position: number;
  item_count: number;
};

export type TemplateInitial = {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  image_url: string | null;
  serves: string | null;
  customization_window_hours: number;
  active: boolean;
  slots: Slot[];
};

export function TemplateEditor({ template }: { template: TemplateInitial }) {
  const [state, action, pending] = useActionState(
    updateTemplateAction.bind(null, template.id),
    INITIAL,
  );
  const [deletePending, startDelete] = useTransition();

  function handleDeleteTemplate() {
    if (!confirm(`Remover "${template.name}"? Soft-delete preserva pedidos passados.`)) return;
    startDelete(() => deleteTemplateAction(template.id));
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/cestas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold">Editar: {template.name}</h1>
        <button
          type="button"
          onClick={handleDeleteTemplate}
          disabled={deletePending}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deletePending ? "Removendo..." : "Remover cesta"}
        </button>
      </header>

      {/* Template fields */}
      <form action={action} className="rounded-xl bg-card border p-6 space-y-5">
        <h2 className="font-semibold">Dados do template</h2>
        <Field label="Nome *" name="name" defaultValue={template.name} required />
        <FieldTextarea
          label="Descrição"
          name="description"
          defaultValue={template.description ?? ""}
          rows={2}
        />
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Preço base (R$) *"
            name="base_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={template.base_price}
            required
          />
          <Field label="Serve" name="serves" defaultValue={template.serves ?? ""} />
          <Field
            label="Janela (h)"
            name="customization_window_hours"
            type="number"
            min="1"
            defaultValue={template.customization_window_hours.toString()}
          />
        </div>
        <Field
          label="URL da imagem"
          name="image_url"
          type="url"
          defaultValue={template.image_url ?? ""}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={template.active}
            className="h-4 w-4 rounded"
          />
          Cesta ativa
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

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar template"}
        </button>
      </form>

      {/* Slots — managed individually */}
      <SlotsManager templateId={template.id} initialSlots={template.slots} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Slots manager (individual CRUD per slot)
// ----------------------------------------------------------------------------

function SlotsManager({
  templateId,
  initialSlots,
}: {
  templateId: string;
  initialSlots: Slot[];
}) {
  const [slots, setSlots] = useState(initialSlots);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function refresh(list: Slot[]) {
    setSlots([...list].sort((a, b) => a.position - b.position));
  }

  function handleAdd() {
    const label = prompt("Nome do slot (ex: Frutas):");
    if (!label) return;
    const countStr = prompt("Quantos itens o cliente escolhe?", "3");
    const count = Number.parseInt(countStr ?? "", 10);
    if (!count || count < 1) return;

    const nextPos = (slots.at(-1)?.position ?? -1) + 1;
    setFeedback(null);
    startTransition(async () => {
      const res = await addSlotAction(templateId, {
        slot_label: label.trim(),
        position: nextPos,
        item_count: count,
      });
      if (res.status === "error") {
        setFeedback(res.message);
        return;
      }
      // Optimistic add — server will revalidate page
      refresh([
        ...slots,
        { id: crypto.randomUUID(), slot_label: label.trim(), position: nextPos, item_count: count },
      ]);
    });
  }

  function handleUpdate(slot: Slot, patch: Partial<Slot>) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSlotAction(templateId, slot.id, patch);
      if (res.status === "error") {
        setFeedback(res.message);
        return;
      }
      refresh(slots.map((s) => (s.id === slot.id ? { ...s, ...patch } : s)));
    });
  }

  function handleDelete(slot: Slot) {
    if (
      !confirm(
        `Remover o slot "${slot.slot_label}"? Bloqueado se houver curadorias com opções neste slot.`,
      )
    )
      return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteSlotAction(templateId, slot.id);
      if (res.status === "error") {
        setFeedback(res.message);
        return;
      }
      refresh(slots.filter((s) => s.id !== slot.id));
    });
  }

  return (
    <section className="rounded-xl bg-card border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Slots</h2>
          <p className="text-xs text-muted-foreground">
            Estrutura da cesta. Atualizações refletem em curadorias futuras.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar slot
        </button>
      </div>

      {feedback && (
        <div role="alert" className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
          {feedback}
        </div>
      )}

      <ul className="space-y-2">
        {slots.length === 0 ? (
          <li className="text-sm text-muted-foreground">Nenhum slot.</li>
        ) : (
          slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center gap-3 rounded-md border bg-background p-3"
            >
              <span className="text-xs text-muted-foreground w-8 text-center">
                #{slot.position}
              </span>
              <input
                defaultValue={slot.slot_label}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== slot.slot_label) handleUpdate(slot, { slot_label: v });
                }}
                disabled={pending}
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={slot.item_count}
                  onBlur={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    if (v >= 1 && v !== slot.item_count) handleUpdate(slot, { item_count: v });
                  }}
                  disabled={pending}
                  className="w-16 rounded-md border bg-background px-2 py-1.5 text-sm text-right"
                />
                <span className="text-xs text-muted-foreground">item(s)</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(slot)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                aria-label="Remover slot"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
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

function FieldTextarea({
  label,
  name,
  ...rest
}: { label: string; name: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
