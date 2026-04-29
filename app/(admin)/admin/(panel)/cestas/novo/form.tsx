"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { INITIAL, createTemplateAction } from "../actions";

type SlotDraft = { id: string; slot_label: string; item_count: number };

const newSlot = (): SlotDraft => ({
  id: crypto.randomUUID(),
  slot_label: "",
  item_count: 1,
});

export function CreateTemplateForm() {
  const [state, action, pending] = useActionState(createTemplateAction, INITIAL);
  const [slots, setSlots] = useState<SlotDraft[]>([
    { id: crypto.randomUUID(), slot_label: "Frutas", item_count: 3 },
    { id: crypto.randomUUID(), slot_label: "Verduras", item_count: 3 },
    { id: crypto.randomUUID(), slot_label: "Legumes", item_count: 2 },
  ]);

  function updateSlot(id: string, patch: Partial<SlotDraft>) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSlot() {
    setSlots((prev) => [...prev, newSlot()]);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
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

      <header>
        <h1 className="font-serif text-3xl font-bold">Nova cesta (template)</h1>
        <p className="text-muted-foreground mt-1">
          Defina o nome, preço e a estrutura de slots. Os produtos de cada slot são
          definidos depois, na curadoria semanal.
        </p>
      </header>

      <form action={action} className="rounded-xl bg-card border p-6 space-y-5">
        <Field label="Nome *" name="name" required placeholder="Cesta Essencial" />
        <FieldTextarea label="Descrição" name="description" rows={2} />

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Preço base (R$) *"
            name="base_price"
            type="number"
            step="0.01"
            min="0"
            required
          />
          <Field label="Serve" name="serves" placeholder="2-3 pessoas" />
          <Field
            label="Janela de customização (h)"
            name="customization_window_hours"
            type="number"
            min="1"
            defaultValue="24"
          />
        </div>

        <Field label="URL da imagem" name="image_url" type="url" />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="h-4 w-4 rounded"
          />
          Cesta ativa (aparece no catálogo)
        </label>

        {/* Slots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Slots</h3>
              <p className="text-xs text-muted-foreground">
                Regras estruturais — defina quantas opções o cliente escolhe por categoria.
              </p>
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar slot
            </button>
          </div>
          <ul className="space-y-2">
            {slots.map((s, idx) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-md border bg-background p-3"
              >
                <span className="text-xs text-muted-foreground w-6 text-center">
                  #{idx}
                </span>
                <input
                  name={`slots[${idx}][label]`}
                  value={s.slot_label}
                  onChange={(e) => updateSlot(s.id, { slot_label: e.target.value })}
                  placeholder="Frutas"
                  required
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    name={`slots[${idx}][count]`}
                    type="number"
                    min={1}
                    max={20}
                    value={s.item_count}
                    onChange={(e) =>
                      updateSlot(s.id, {
                        item_count: Number.parseInt(e.target.value, 10) || 1,
                      })
                    }
                    required
                    className="w-16 rounded-md border bg-background px-2 py-1.5 text-sm text-right"
                  />
                  <span className="text-xs text-muted-foreground">item(s)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {state.status === "error" && (
          <div role="alert" className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
            {state.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Criando..." : "Criar cesta"}
          </button>
          <Link
            href="/admin/cestas"
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
