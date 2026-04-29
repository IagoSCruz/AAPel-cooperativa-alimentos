/**
 * AAPel — Database Schema (Drizzle ORM)
 *
 * Source of truth for the PostgreSQL schema. Generated migrations live in
 * ./migrations/ and are produced via `pnpm db:generate`.
 *
 * Architecture reference: ARCHITECTURE.md §5 (Modelo de Dados)
 *
 * Cross-table CHECK constraints (e.g. "basket option product must be FOOD")
 * cannot be expressed in raw Postgres CHECK — they are enforced via triggers
 * added in a custom migration (see ./migrations/0001_food_only_trigger.sql,
 * generated separately after the initial drizzle-kit generate).
 */

import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  date,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "ADMIN"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "COLLECTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const deliveryMethodEnum = pgEnum("delivery_method", [
  "PICKUP",
  "HOME_DELIVERY",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "PIX",
  "CASH",
  "CARD",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "REFUNDED",
]);

export const productTypeEnum = pgEnum("product_type", ["FOOD", "CRAFT"]);

export const lineTypeEnum = pgEnum("line_type", ["PRODUCT", "BASKET"]);

export const curationStatusEnum = pgEnum("curation_status", [
  "DRAFT",
  "OPEN",
  "CLOSED",
]);

export const consentTypeEnum = pgEnum("consent_type", [
  "marketing",
  "analytics",
  "terms",
  "privacy",
]);

export const consentSourceEnum = pgEnum("consent_source", [
  "registration",
  "account_settings",
  "api",
]);

export const chosenByEnum = pgEnum("chosen_by", ["CUSTOMER", "ADMIN"]);

// ============================================================================
// IDENTITY — users + LGPD consent
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("CUSTOMER"),
    phone: varchar("phone", { length: 20 }),

    // LGPD
    consentMarketing: boolean("consent_marketing").notNull().default(false),
    consentAnalytics: boolean("consent_analytics").notNull().default(true),
    dataRetentionUntil: timestamp("data_retention_until", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idx_users_email").on(t.email)],
);

export const consentHistory = pgTable("consent_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  consentType: consentTypeEnum("consent_type").notNull(),
  granted: boolean("granted").notNull(),
  source: consentSourceEnum("source").notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================================================
// CATALOG — producers, categories, products
// ============================================================================

export const producers = pgTable("producers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  story: text("story"),
  location: varchar("location", { length: 255 }),
  imageUrl: varchar("image_url", { length: 500 }),
  coverImageUrl: varchar("cover_image_url", { length: 500 }),
  specialties: jsonb("specialties").$type<string[]>(),
  since: integer("since"),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    stock: integer("stock").notNull().default(0),

    productType: productTypeEnum("product_type").notNull().default("FOOD"),
    premium: boolean("premium").notNull().default(false),
    organic: boolean("organic").notNull().default(false),
    available: boolean("available").notNull().default(true),
    seasonal: boolean("seasonal").notNull().default(false),

    categoryId: uuid("category_id")
      .references(() => categories.id)
      .notNull(),
    producerId: uuid("producer_id")
      .references(() => producers.id)
      .notNull(),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_products_category_available").on(t.categoryId),
    index("idx_products_producer").on(t.producerId),
    index("idx_products_type").on(t.productType, t.available),
  ],
);

// ============================================================================
// BASKET — templates + slots (commercial layer)
// ============================================================================

export const basketTemplates = pgTable("basket_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  serves: varchar("serves", { length: 50 }),
  customizationWindowHours: integer("customization_window_hours")
    .notNull()
    .default(24),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const basketSlots = pgTable("basket_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  basketTemplateId: uuid("basket_template_id")
    .references(() => basketTemplates.id, { onDelete: "cascade" })
    .notNull(),
  slotLabel: varchar("slot_label", { length: 100 }).notNull(),
  position: integer("position").notNull(),
  itemCount: integer("item_count").notNull(),
});

// ============================================================================
// BASKET CURATION — weekly operational layer
// ============================================================================

export const basketCurations = pgTable(
  "basket_curations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    basketTemplateId: uuid("basket_template_id")
      .references(() => basketTemplates.id)
      .notNull(),
    deliveryWeek: date("delivery_week").notNull(),
    customizationDeadline: timestamp("customization_deadline", {
      withTimezone: true,
    }).notNull(),
    status: curationStatusEnum("status").notNull().default("DRAFT"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uq_curation_template_week").on(
      t.basketTemplateId,
      t.deliveryWeek,
    ),
    index("idx_basket_curations_open").on(
      t.basketTemplateId,
      t.deliveryWeek,
    ),
  ],
);

export const basketCurationSlotOptions = pgTable(
  "basket_curation_slot_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    basketCurationId: uuid("basket_curation_id")
      .references(() => basketCurations.id, { onDelete: "cascade" })
      .notNull(),
    basketSlotId: uuid("basket_slot_id")
      .references(() => basketSlots.id)
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    upgradeFee: numeric("upgrade_fee", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    // FOOD-only constraint enforced via trigger (custom migration)
  },
  (t) => [
    uniqueIndex("uq_curation_slot_product").on(
      t.basketCurationId,
      t.basketSlotId,
      t.productId,
    ),
  ],
);

// ============================================================================
// LOGISTICS — delivery zones + collection points
// ============================================================================

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  minimumOrderValue: numeric("minimum_order_value", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  estimatedMinutes: integer("estimated_minutes"),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliveryZoneNeighborhoods = pgTable(
  "delivery_zone_neighborhoods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryZoneId: uuid("delivery_zone_id")
      .references(() => deliveryZones.id, { onDelete: "cascade" })
      .notNull(),
    neighborhood: varchar("neighborhood", { length: 100 }).notNull().unique(),
  },
  (t) => [index("idx_neighborhoods_lookup").on(t.neighborhood)],
);

export const collectionPoints = pgTable("collection_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  description: text("description"),
  schedule: varchar("schedule", { length: 255 }),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// ORDERS — transactional layer
// ============================================================================

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: varchar("public_id", { length: 20 }).notNull().unique(),
    status: orderStatusEnum("status").notNull().default("PENDING"),

    customerId: uuid("customer_id")
      .references(() => users.id)
      .notNull(),

    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),

    // HOME_DELIVERY snapshots
    deliveryZoneId: uuid("delivery_zone_id").references(() => deliveryZones.id),
    deliveryAddress: text("delivery_address"),
    deliveryNeighborhood: varchar("delivery_neighborhood", { length: 100 }),
    deliveryZipCode: varchar("delivery_zip_code", { length: 10 }),

    // PICKUP
    collectionPointId: uuid("collection_point_id").references(
      () => collectionPoints.id,
    ),

    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),

    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),

    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_orders_customer_status").on(t.customerId, t.status),
    index("idx_orders_delivery_date").on(t.deliveryDate),
    check(
      "delivery_method_consistency",
      sql`(delivery_method = 'PICKUP' AND collection_point_id IS NOT NULL AND delivery_zone_id IS NULL)
          OR
          (delivery_method = 'HOME_DELIVERY' AND delivery_zone_id IS NOT NULL AND collection_point_id IS NULL)`,
    ),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    lineType: lineTypeEnum("line_type").notNull(),

    // se PRODUCT
    productId: uuid("product_id").references(() => products.id),
    producerId: uuid("producer_id").references(() => producers.id),
    productNameSnapshot: varchar("product_name_snapshot", { length: 255 }),

    // se BASKET
    basketCurationId: uuid("basket_curation_id").references(
      () => basketCurations.id,
    ),
    basketTemplateNameSnapshot: varchar("basket_template_name_snapshot", {
      length: 255,
    }),

    quantity: integer("quantity").notNull(),
    unitPriceSnapshot: numeric("unit_price_snapshot", {
      precision: 10,
      scale: 2,
    }).notNull(),
    upgradeTotal: numeric("upgrade_total", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check(
      "line_type_consistency",
      sql`(line_type = 'PRODUCT' AND product_id IS NOT NULL AND basket_curation_id IS NULL)
          OR
          (line_type = 'BASKET' AND product_id IS NULL AND basket_curation_id IS NOT NULL)`,
    ),
  ],
);

export const basketFulfillments = pgTable("basket_fulfillments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id")
    .references(() => orderItems.id, { onDelete: "cascade" })
    .notNull(),
  basketSlotId: uuid("basket_slot_id")
    .references(() => basketSlots.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  producerId: uuid("producer_id")
    .references(() => producers.id)
    .notNull(),

  upgradeFeePaid: numeric("upgrade_fee_paid", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),

  chosenBy: chosenByEnum("chosen_by").notNull(),
  substitutedFromId: uuid("substituted_from_id").references(() => products.id),
  substitutionReason: text("substitution_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  consentHistory: many(consentHistory),
}));

export const consentHistoryRelations = relations(consentHistory, ({ one }) => ({
  user: one(users, {
    fields: [consentHistory.userId],
    references: [users.id],
  }),
}));

export const producersRelations = relations(producers, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  producer: one(producers, {
    fields: [products.producerId],
    references: [producers.id],
  }),
}));

export const basketTemplatesRelations = relations(
  basketTemplates,
  ({ many }) => ({
    slots: many(basketSlots),
    curations: many(basketCurations),
  }),
);

export const basketSlotsRelations = relations(basketSlots, ({ one }) => ({
  template: one(basketTemplates, {
    fields: [basketSlots.basketTemplateId],
    references: [basketTemplates.id],
  }),
}));

export const basketCurationsRelations = relations(
  basketCurations,
  ({ one, many }) => ({
    template: one(basketTemplates, {
      fields: [basketCurations.basketTemplateId],
      references: [basketTemplates.id],
    }),
    options: many(basketCurationSlotOptions),
  }),
);

export const basketCurationSlotOptionsRelations = relations(
  basketCurationSlotOptions,
  ({ one }) => ({
    curation: one(basketCurations, {
      fields: [basketCurationSlotOptions.basketCurationId],
      references: [basketCurations.id],
    }),
    slot: one(basketSlots, {
      fields: [basketCurationSlotOptions.basketSlotId],
      references: [basketSlots.id],
    }),
    product: one(products, {
      fields: [basketCurationSlotOptions.productId],
      references: [products.id],
    }),
  }),
);

export const deliveryZonesRelations = relations(deliveryZones, ({ many }) => ({
  neighborhoods: many(deliveryZoneNeighborhoods),
}));

export const deliveryZoneNeighborhoodsRelations = relations(
  deliveryZoneNeighborhoods,
  ({ one }) => ({
    zone: one(deliveryZones, {
      fields: [deliveryZoneNeighborhoods.deliveryZoneId],
      references: [deliveryZones.id],
    }),
  }),
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  deliveryZone: one(deliveryZones, {
    fields: [orders.deliveryZoneId],
    references: [deliveryZones.id],
  }),
  collectionPoint: one(collectionPoints, {
    fields: [orders.collectionPointId],
    references: [collectionPoints.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  producer: one(producers, {
    fields: [orderItems.producerId],
    references: [producers.id],
  }),
  basketCuration: one(basketCurations, {
    fields: [orderItems.basketCurationId],
    references: [basketCurations.id],
  }),
  fulfillments: many(basketFulfillments),
}));

export const basketFulfillmentsRelations = relations(
  basketFulfillments,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [basketFulfillments.orderItemId],
      references: [orderItems.id],
    }),
    slot: one(basketSlots, {
      fields: [basketFulfillments.basketSlotId],
      references: [basketSlots.id],
    }),
    product: one(products, {
      fields: [basketFulfillments.productId],
      references: [products.id],
    }),
    producer: one(producers, {
      fields: [basketFulfillments.producerId],
      references: [producers.id],
    }),
    substitutedFrom: one(products, {
      fields: [basketFulfillments.substitutedFromId],
      references: [products.id],
    }),
  }),
);

// ============================================================================
// TYPE EXPORTS — for use in BFF / TypeScript code
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Producer = typeof producers.$inferSelect;
export type NewProducer = typeof producers.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type BasketTemplate = typeof basketTemplates.$inferSelect;
export type BasketSlot = typeof basketSlots.$inferSelect;
export type BasketCuration = typeof basketCurations.$inferSelect;
export type BasketCurationSlotOption = typeof basketCurationSlotOptions.$inferSelect;

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type DeliveryZoneNeighborhood = typeof deliveryZoneNeighborhoods.$inferSelect;
export type CollectionPoint = typeof collectionPoints.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type BasketFulfillment = typeof basketFulfillments.$inferSelect;
