/**
 * Canonical API types — mirror the FastAPI Pydantic response schemas.
 *
 * Rule: no field transformations here. Names match the JSON keys exactly as
 * returned by the backend (snake_case). Components and pages import from here
 * instead of from lib/data.ts (which will be deprecated in Phase 3).
 */

// ---------------------------------------------------------------------------
// Generic pagination envelope
// ---------------------------------------------------------------------------

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
}

export interface Page<T> {
  data: T[];
  pagination: PageMeta;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export interface ProducerSummary {
  id: string;
  name: string;
  location: string | null;
}

export interface ProducerFull {
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
  created_at: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  /** Serialized as string "19.90" by backend field_serializer */
  price: string;
  unit: string;
  image_url: string | null;
  stock: number;
  product_type: "FOOD" | "CRAFT";
  organic: boolean;
  premium: boolean;
  available: boolean;
  seasonal: boolean;
  category: CategoryItem;
  producer: ProducerSummary;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Baskets
// ---------------------------------------------------------------------------

export interface BasketSlot {
  id: string;
  slot_label: string;
  position: number;
  item_count: number;
}

export interface BasketTemplate {
  id: string;
  name: string;
  description: string | null;
  /** Serialized as "89.90" */
  base_price: string;
  image_url: string | null;
  serves: string | null;
  customization_window_hours: number;
  active: boolean;
  slots: BasketSlot[];
}

export interface BasketSlotOption {
  product: ProductItem;
  /** Serialized as "0.00" */
  upgrade_fee: string;
}

export interface CuratedSlot {
  slot: BasketSlot;
  options: BasketSlotOption[];
}

export interface BasketCuration {
  id: string;
  template_id: string;
  template_name: string;
  /** Serialized as "89.90" */
  base_price: string;
  delivery_week: string; // ISO date "2026-01-14"
  customization_deadline: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  slots: CuratedSlot[];
}

// ---------------------------------------------------------------------------
// Logistics
// ---------------------------------------------------------------------------

export interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  /** Serialized as "12.00" */
  delivery_fee: string;
  /** Serialized as "0.00" */
  minimum_order_value: string;
  estimated_minutes: number | null;
  active: boolean;
  neighborhoods: string[];
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  description: string | null;
  schedule: string | null;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type DeliveryMethod = "PICKUP" | "HOME_DELIVERY";
export type PaymentMethod = "PIX" | "CASH" | "CARD";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COLLECTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemResponse {
  id: string;
  product_id: string | null;
  product_name_snapshot: string | null;
  quantity: number;
  unit_price_snapshot: string;
  line_total: string;
}

export interface OrderResponse {
  id: string;
  public_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  delivery_neighborhood: string | null;
  payment_method: PaymentMethod;
  subtotal: string;
  delivery_fee: string;
  total_amount: string;
  delivery_date: string;
  notes: string | null;
  items: OrderItemResponse[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Cart (frontend-only — not stored in backend)
// ---------------------------------------------------------------------------

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Basket order (Phase 4)
// ---------------------------------------------------------------------------

export interface SlotChoiceInput {
  slot_id: string;
  product_id: string;
}

export interface BasketFulfillmentItem {
  slot_id: string;
  slot_label: string;
  product_id: string;
  product_name: string;
  /** Serialized as 0.00 */
  upgrade_fee_paid: string;
}

export interface BasketOrderResponse {
  order_id: string;
  public_id: string;
  status: OrderStatus;
  /** ISO date 2026-01-14 */
  delivery_week: string;
  /** Serialized as 89.90 */
  base_price: string;
  upgrade_total: string;
  delivery_fee: string;
  total_amount: string;
  fulfillments: BasketFulfillmentItem[];
}
