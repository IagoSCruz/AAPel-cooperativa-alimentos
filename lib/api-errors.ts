/**
 * Helpers for turning FastAPI error envelopes into user-friendly messages.
 *
 * The backend emits two flavours of error JSON:
 *  1. RFC 7807 Problem Details (most errors):
 *       { type, title, status, detail, instance }
 *  2. 422 validation errors (FastAPI/Pydantic):
 *       { type, title, status, detail, instance, errors: [{ loc, msg, type }] }
 *
 * `extractApiErrorMessage` returns the most specific human-readable string it
 * can find, falling back through the layers gracefully.
 */

type ValidationDetail = {
  loc?: (string | number)[];
  msg?: string;
};

type ApiErrorBody = {
  detail?: string;
  title?: string;
  errors?: ValidationDetail[];
};

const FIELD_LABELS: Record<string, string> = {
  email: "E-mail",
  password: "Senha",
  name: "Nome",
  phone: "Telefone",
  consent_terms: "Aceite dos termos",
  consent_privacy: "Aceite da privacidade",
  delivery_method: "Método de entrega",
  delivery_zone_id: "Zona de entrega",
  delivery_address: "Endereço",
  delivery_neighborhood: "Bairro",
  collection_point_id: "Ponto de coleta",
  payment_method: "Forma de pagamento",
  items: "Itens do pedido",
  quantity: "Quantidade",
};

function fieldLabel(loc: (string | number)[] | undefined): string | null {
  if (!loc || loc.length === 0) return null;
  // Skip the "body" prefix FastAPI prepends to validation errors
  const path = loc.filter((p) => p !== "body");
  if (path.length === 0) return null;
  const last = path[path.length - 1];
  if (typeof last !== "string") return String(last);
  return FIELD_LABELS[last] ?? last;
}

export function extractApiErrorMessage(
  body: unknown,
  fallback = "Erro desconhecido",
): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as ApiErrorBody;

  // Validation errors: surface the first specific field message.
  if (Array.isArray(b.errors) && b.errors.length > 0) {
    const first = b.errors[0];
    const label = fieldLabel(first.loc);
    const msg = first.msg ?? "valor inválido";
    return label ? `${label}: ${msg}` : msg;
  }

  return b.detail ?? b.title ?? fallback;
}
