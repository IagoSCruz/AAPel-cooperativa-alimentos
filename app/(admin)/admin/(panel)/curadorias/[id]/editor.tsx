"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Save,
  Trash2,
  Unlock,
} from "lucide-react";

import {
  changeStatusAction,
  deleteCurationAction,
  setOptionsAction,
  type CurationStatus,
  type OptionInput,
} from "../actions";

type ProductLite = {
  id: string;
  name: string;
  unit: string;
  organic: boolean;
  premium: boolean;
  category: { name: string };
  producer: { name: string };
};

type Slot = {
  slot: {
    id: string;
    slot_label: string;
    position: number;
    item_count: number;
  };
  options: { product: ProductLite & { id: string }; upgrade_fee: string }[];
};

type Curation = {
  id: string;
  template_name: string;
  base_price: string;
  delivery_week: string;
  customization_deadline: string;
  status: CurationStatus;
  slots: Slot[];
};

type Selected = {
  // slotId -> Map<productId, upgradeFee>
  [slotId: string]: Map<string, string>;
};

export function CurationEditor({
  curation,
  foodProducts,
}: {
  curation: Curation;
  foodProducts: ProductLite[];
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    message: string;
  } | null>(null);

  // initialize from curation.slots
  const [selected, setSelected] = useState<Selected>(() => {
    const init: Selected = {};
    for (const s of curation.slots) {
      init[s.slot.id] = new Map(
        s.options.map((o) => [o.product.id, o.upgrade_fee]),
      );
    }
    return init;
  });

  const isReadOnly = curation.status === "CLOSED";

  const totalSelected = useMemo(
    () =>
      Object.values(selected).reduce(
        (sum, slotMap) => sum + slotMap.size,
        0,
      ),
    [selected],
  );

  function toggleProduct(slotId: string, productId: string) {
    if (isReadOnly) return;
    setSelected((prev) => {
      const next = { ...prev };
      const map = new Map(next[slotId]);
      if (map.has(productId)) map.delete(productId);
      else map.set(productId, "0.00");
      next[slotId] = map;
      return next;
    });
  }

  function setUpgrade(slotId: string, productId: string, fee: string) {
    if (isReadOnly) return;
    setSelected((prev) => {
      const next = { ...prev };
      const map = new Map(next[slotId]);
      map.set(productId, fee);
      next[slotId] = map;
      return next;
    });
  }

  function handleSave() {
    setFeedback(null);
    const options: OptionInput[] = [];
    for (const [slotId, map] of Object.entries(selected)) {
      for (const [productId, fee] of map.entries()) {
        options.push({
          basket_slot_id: slotId,
          product_id: productId,
          upgrade_fee: fee,
        });
      }
    }
    startTransition(async () => {
      const result = await setOptionsAction(curation.id, options);
      if (result.status === "error") {
        setFeedback({ kind: "error", message: result.message });
      } else if (result.status === "ok") {
        setFeedback({
          kind: "ok",
          message: result.message ?? "Opções salvas.",
        });
      }
    });
  }

  function handleStatus(next: CurationStatus) {
    setFeedback(null);
    startTransition(async () => {
      const result = await changeStatusAction(curation.id, next);
      if (result.status === "error") {
        setFeedback({ kind: "error", message: result.message });
      } else if (result.status === "ok") {
        setFeedback({
          kind: "ok",
          message: result.message ?? `Status alterado para ${next}.`,
        });
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Remover esta curadoria? Apenas curadorias DRAFT podem ser excluídas.",
      )
    )
      return;
    startTransition(() => { void deleteCurationAction(curation.id); });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/curadorias"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">
            {curation.template_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Entrega:{" "}
            <strong>
              {new Date(curation.delivery_week).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </strong>{" "}
            · Limite:{" "}
            <strong>
              {new Date(curation.customization_deadline).toLocaleString(
                "pt-BR",
                { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
              )}
            </strong>
          </p>
        </div>
        <StatusActions
          status={curation.status}
          onChange={handleStatus}
          onDelete={handleDelete}
          pending={pending}
        />
      </header>

      {feedback && (
        <div
          role="alert"
          className={`rounded-md text-sm px-3 py-2 ${
            feedback.kind === "ok"
              ? "bg-green-50 text-green-900"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Slots */}
      <div className="space-y-6">
        {curation.slots.map((s) => (
          <SlotCard
            key={s.slot.id}
            slot={s.slot}
            products={foodProducts}
            selected={selected[s.slot.id] ?? new Map()}
            onToggle={(pid) => toggleProduct(s.slot.id, pid)}
            onFeeChange={(pid, fee) => setUpgrade(s.slot.id, pid, fee)}
            readOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Save bar */}
      {!isReadOnly && (
        <div className="sticky bottom-0 -mx-6 lg:-mx-10 px-6 lg:px-10 py-4 bg-card border-t shadow-md flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <strong>{totalSelected}</strong> opções selecionadas no total
          </p>
          <button
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Salvando..." : "Salvar opções"}
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Slot card
// ----------------------------------------------------------------------------

function SlotCard({
  slot,
  products,
  selected,
  onToggle,
  onFeeChange,
  readOnly,
}: {
  slot: { id: string; slot_label: string; position: number; item_count: number };
  products: ProductLite[];
  selected: Map<string, string>;
  onToggle: (productId: string) => void;
  onFeeChange: (productId: string, fee: string) => void;
  readOnly: boolean;
}) {
  return (
    <section className="rounded-xl bg-card border overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
        <div>
          <h3 className="font-semibold">{slot.slot_label}</h3>
          <p className="text-xs text-muted-foreground">
            Cliente escolhe {slot.item_count} item(s) deste slot
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>{selected.size}</strong> elegíveis
        </p>
      </header>

      <ul className="divide-y">
        {products.map((p) => {
          const checked = selected.has(p.id);
          const fee = selected.get(p.id) ?? "0.00";
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(p.id)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-input"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {p.name}
                    {p.organic && (
                      <span className="inline-flex rounded-full bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5">
                        orgânico
                      </span>
                    )}
                    {p.premium && (
                      <span className="inline-flex rounded-full bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5">
                        premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.category.name} · {p.producer.name} · {p.unit}
                  </p>
                </div>
              </label>

              {checked && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">+R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fee}
                    onChange={(e) => onFeeChange(p.id, e.target.value)}
                    disabled={readOnly}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                    aria-label={`Upgrade fee para ${p.name}`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Status actions
// ----------------------------------------------------------------------------

function StatusActions({
  status,
  onChange,
  onDelete,
  pending,
}: {
  status: CurationStatus;
  onChange: (s: CurationStatus) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <StatusBadge status={status} />
      <div className="flex gap-2">
        {status === "DRAFT" && (
          <>
            <button
              onClick={() => onChange("OPEN")}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" />
              Abrir
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          </>
        )}
        {status === "OPEN" && (
          <button
            onClick={() => onChange("CLOSED")}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <Lock className="h-3.5 w-3.5" />
            Fechar
          </button>
        )}
        {status === "CLOSED" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Curadoria finalizada
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CurationStatus }) {
  const variants: Record<CurationStatus, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status]}`}
    >
      {status}
    </span>
  );
}
