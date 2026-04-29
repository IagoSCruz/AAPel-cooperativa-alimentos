"use client";

import { useActionState, useEffect, useRef } from "react";

import { createCategoryAction, INITIAL } from "./actions";

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on success
  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 md:grid-cols-3">
      <input
        name="name"
        type="text"
        required
        placeholder="Nome (ex: Frutas)"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        name="description"
        type="text"
        placeholder="Descrição (opcional)"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        name="image_url"
        type="url"
        placeholder="URL da imagem (opcional)"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {state.status === "error" && (
        <div className="md:col-span-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
      {state.status === "ok" && (
        <div className="md:col-span-3 text-sm text-green-700">
          {state.message}
        </div>
      )}
      <div className="md:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
