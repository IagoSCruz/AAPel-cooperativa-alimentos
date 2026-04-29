-- =============================================================================
-- Trigger: enforce that products curated for basket slots are FOOD only.
--
-- Postgres CHECK constraints cannot reference other tables, so this rule is
-- enforced via BEFORE INSERT/UPDATE trigger on basket_curation_slot_options.
--
-- Apply order: AFTER drizzle-kit migrations create the base tables.
-- Run manually: psql $DATABASE_URL -f database/migrations/_custom/0001_food_only_trigger.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_basket_option_food_only()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type product_type;
BEGIN
  SELECT product_type INTO v_product_type
  FROM products
  WHERE id = NEW.product_id;

  IF v_product_type IS DISTINCT FROM 'FOOD' THEN
    RAISE EXCEPTION 'Product % is not FOOD and cannot be added to a basket curation slot (got: %)',
      NEW.product_id, v_product_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_basket_option_food_only
  ON basket_curation_slot_options;

CREATE TRIGGER trg_basket_option_food_only
  BEFORE INSERT OR UPDATE ON basket_curation_slot_options
  FOR EACH ROW
  EXECUTE FUNCTION enforce_basket_option_food_only();

-- =============================================================================
-- Trigger: enforce that products in basket_fulfillments are FOOD only.
-- Same rule as above but on the transactional side (defense in depth).
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_basket_fulfillment_food_only()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type product_type;
BEGIN
  SELECT product_type INTO v_product_type
  FROM products
  WHERE id = NEW.product_id;

  IF v_product_type IS DISTINCT FROM 'FOOD' THEN
    RAISE EXCEPTION 'Product % is not FOOD and cannot fulfill a basket slot (got: %)',
      NEW.product_id, v_product_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_basket_fulfillment_food_only
  ON basket_fulfillments;

CREATE TRIGGER trg_basket_fulfillment_food_only
  BEFORE INSERT OR UPDATE ON basket_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION enforce_basket_fulfillment_food_only();
