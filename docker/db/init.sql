-- ============================================================================
-- AAPel — PostgreSQL initialization
-- ============================================================================
-- Runs ONCE on first DB initialization (when /var/lib/postgresql/data is
-- empty). Drizzle migrations later create the actual tables and types.
--
-- This file only sets up extensions and the schemas that Drizzle/SQL custom
-- migrations expect to exist before they run.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram index for ILIKE
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- composite indexes

-- Schemas (separation of OLTP / analytics / audit per ARCHITECTURE §5.1)
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA analytics IS
    'OLAP/BI star schema. Populated by triggers + nightly cron.';
COMMENT ON SCHEMA audit IS
    'Append-only audit log, partitioned by month.';
