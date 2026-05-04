CREATE TYPE "public"."chosen_by" AS ENUM('CUSTOMER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."consent_source" AS ENUM('registration', 'account_settings', 'api');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('marketing', 'analytics', 'terms', 'privacy');--> statement-breakpoint
CREATE TYPE "public"."curation_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('PICKUP', 'HOME_DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."line_type" AS ENUM('PRODUCT', 'BASKET');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'CONFIRMED', 'COLLECTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('PIX', 'CASH', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('FOOD', 'CRAFT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "basket_curation_slot_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"basket_curation_id" uuid NOT NULL,
	"basket_slot_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"upgrade_fee" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basket_curations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"basket_template_id" uuid NOT NULL,
	"delivery_week" date NOT NULL,
	"customization_deadline" timestamp with time zone NOT NULL,
	"status" "curation_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basket_fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"basket_slot_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"producer_id" uuid NOT NULL,
	"upgrade_fee_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"chosen_by" "chosen_by" NOT NULL,
	"substituted_from_id" uuid,
	"substitution_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basket_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"basket_template_id" uuid NOT NULL,
	"slot_label" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"item_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basket_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) NOT NULL,
	"image_url" varchar(500),
	"serves" varchar(50),
	"customization_window_hours" integer DEFAULT 24 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "collection_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"description" text,
	"schedule" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"source" "consent_source" NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_zone_neighborhoods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_zone_id" uuid NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	CONSTRAINT "delivery_zone_neighborhoods_neighborhood_unique" UNIQUE("neighborhood")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"delivery_fee" numeric(10, 2) NOT NULL,
	"minimum_order_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"estimated_minutes" integer,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"line_type" "line_type" NOT NULL,
	"product_id" uuid,
	"producer_id" uuid,
	"product_name_snapshot" varchar(255),
	"basket_curation_id" uuid,
	"basket_template_name_snapshot" varchar(255),
	"quantity" integer NOT NULL,
	"unit_price_snapshot" numeric(10, 2) NOT NULL,
	"upgrade_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "line_type_consistency" CHECK ((line_type = 'PRODUCT' AND product_id IS NOT NULL AND basket_curation_id IS NULL)
          OR
          (line_type = 'BASKET' AND product_id IS NULL AND basket_curation_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(20) NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"customer_id" uuid NOT NULL,
	"delivery_method" "delivery_method" NOT NULL,
	"delivery_date" timestamp with time zone NOT NULL,
	"delivery_zone_id" uuid,
	"delivery_address" text,
	"delivery_neighborhood" varchar(100),
	"delivery_zip_code" varchar(10),
	"collection_point_id" uuid,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "delivery_method_consistency" CHECK ((delivery_method = 'PICKUP' AND collection_point_id IS NOT NULL AND delivery_zone_id IS NULL)
          OR
          (delivery_method = 'HOME_DELIVERY' AND delivery_zone_id IS NOT NULL AND collection_point_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE "producers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"story" text,
	"location" varchar(255),
	"image_url" varchar(500),
	"cover_image_url" varchar(500),
	"specialties" jsonb,
	"since" integer,
	"active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"image_url" varchar(500),
	"stock" integer DEFAULT 0 NOT NULL,
	"product_type" "product_type" DEFAULT 'FOOD' NOT NULL,
	"premium" boolean DEFAULT false NOT NULL,
	"organic" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"seasonal" boolean DEFAULT false NOT NULL,
	"category_id" uuid NOT NULL,
	"producer_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"phone" varchar(20),
	"consent_marketing" boolean DEFAULT false NOT NULL,
	"consent_analytics" boolean DEFAULT true NOT NULL,
	"data_retention_until" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "basket_curation_slot_options" ADD CONSTRAINT "basket_curation_slot_options_basket_curation_id_basket_curations_id_fk" FOREIGN KEY ("basket_curation_id") REFERENCES "public"."basket_curations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_curation_slot_options" ADD CONSTRAINT "basket_curation_slot_options_basket_slot_id_basket_slots_id_fk" FOREIGN KEY ("basket_slot_id") REFERENCES "public"."basket_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_curation_slot_options" ADD CONSTRAINT "basket_curation_slot_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_curations" ADD CONSTRAINT "basket_curations_basket_template_id_basket_templates_id_fk" FOREIGN KEY ("basket_template_id") REFERENCES "public"."basket_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_fulfillments" ADD CONSTRAINT "basket_fulfillments_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_fulfillments" ADD CONSTRAINT "basket_fulfillments_basket_slot_id_basket_slots_id_fk" FOREIGN KEY ("basket_slot_id") REFERENCES "public"."basket_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_fulfillments" ADD CONSTRAINT "basket_fulfillments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_fulfillments" ADD CONSTRAINT "basket_fulfillments_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_fulfillments" ADD CONSTRAINT "basket_fulfillments_substituted_from_id_products_id_fk" FOREIGN KEY ("substituted_from_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basket_slots" ADD CONSTRAINT "basket_slots_basket_template_id_basket_templates_id_fk" FOREIGN KEY ("basket_template_id") REFERENCES "public"."basket_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_history" ADD CONSTRAINT "consent_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zone_neighborhoods" ADD CONSTRAINT "delivery_zone_neighborhoods_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_basket_curation_id_basket_curations_id_fk" FOREIGN KEY ("basket_curation_id") REFERENCES "public"."basket_curations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_collection_point_id_collection_points_id_fk" FOREIGN KEY ("collection_point_id") REFERENCES "public"."collection_points"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_curation_slot_product" ON "basket_curation_slot_options" USING btree ("basket_curation_id","basket_slot_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_curation_template_week" ON "basket_curations" USING btree ("basket_template_id","delivery_week");--> statement-breakpoint
CREATE INDEX "idx_basket_curations_open" ON "basket_curations" USING btree ("basket_template_id","delivery_week");--> statement-breakpoint
CREATE INDEX "idx_neighborhoods_lookup" ON "delivery_zone_neighborhoods" USING btree ("neighborhood");--> statement-breakpoint
CREATE INDEX "idx_orders_customer_status" ON "orders" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_delivery_date" ON "orders" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "idx_products_category_available" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_producer" ON "products" USING btree ("producer_id");--> statement-breakpoint
CREATE INDEX "idx_products_type" ON "products" USING btree ("product_type","available");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");