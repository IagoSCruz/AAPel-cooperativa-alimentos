"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import { INITIAL, updateCategoryAction } from "./actions";

type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    updateCategoryAction.bind(null, category.id),
    INITIAL,
  );

  if (editing) {
    return (
      <tr className="border-t bg-muted/20">
        <td colSpan={3} className="px-4 py-3">
          <form action={action} className="grid gap-2 md:grid-cols-3">
            <input
              name="name"
              defaultValue={category.name}
              required
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="description"
              defaultValue={category.description ?? ""}
              placeholder="Descrição"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="image_url"
              defaultValue={category.image_url ?? ""}
              placeholder="URL da imagem"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            {state.status === "error" && (
              <div className="md:col-span-3 text-xs text-destructive">
                {state.message}
              </div>
            )}
            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                <X className="h-3 w-3" />
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium">{category.name}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {category.description ?? "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      </td>
    </tr>
  );
}
