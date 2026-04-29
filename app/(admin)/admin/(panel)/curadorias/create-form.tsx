"use client";

import { useActionState } from "react";

import { createCurationAction, INITIAL } from "./actions";

type Template = {
  id: string;
  name: string;
  base_price: string;
  customization_window_hours: number;
};

export function CreateCurationForm({ templates }: { templates: Template[] }) {
  const [state, formAction, pending] = useActionState(
    createCurationAction,
    INITIAL,
  );

  // Default deadline: 2 days from now at 18:00 local time
  const defaultDeadline = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16); // <input type="datetime-local"> format
  })();

  // Default delivery week: 4 days from now (week of)
  const defaultWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="template_id"
            className="block text-sm font-medium mb-1.5"
          >
            Cesta
          </label>
          <select
            id="template_id"
            name="template_id"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (R$ {t.base_price})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="delivery_week"
            className="block text-sm font-medium mb-1.5"
          >
            Semana de entrega
          </label>
          <input
            id="delivery_week"
            name="delivery_week"
            type="date"
            required
            defaultValue={defaultWeek}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="customization_deadline"
            className="block text-sm font-medium mb-1.5"
          >
            Limite de customização
          </label>
          <input
            id="customization_deadline"
            name="customization_deadline"
            type="datetime-local"
            required
            defaultValue={defaultDeadline}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="md:col-span-3 rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2"
        >
          {state.message}
        </div>
      )}

      <div className="md:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Criando..." : "Criar curadoria"}
        </button>
      </div>
    </form>
  );
}
