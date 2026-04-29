# ARCHITECTURE — AAPel Cooperativa de Alimentos

> Documento de arquitetura consolidada. Substitui e complementa o `SYSTEM_DESIGN.md`.
> Última atualização: 2026-04-28.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Modelo de Negócio](#2-modelo-de-negócio)
3. [Modelo de Domínio](#3-modelo-de-domínio)
4. [Arquitetura de Sistema](#4-arquitetura-de-sistema)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Auth, Sessão & LGPD](#6-auth-sessão--lgpd)
7. [Analytics / BI](#7-analytics--bi)
8. [Contratos de API](#8-contratos-de-api)
9. [Padrões Operacionais](#9-padrões-operacionais)
10. [Roadmap](#10-roadmap)
11. [Decisões e Trade-offs](#11-decisões-e-trade-offs)
12. [Operações (Deploy, Backup, Secrets, Monitoring)](#12-operações-deploy-backup-secrets-monitoring)

---

## 1. Visão Geral

**AAPel** (Associação de Agricultura Familiar de Pelotas) é uma plataforma de comercialização direta entre agricultores familiares de Pelotas/RS e consumidores. Modelo híbrido: **catálogo avulso + cestas customizáveis com curadoria semanal pelo admin**.

### 1.1 Princípios de design

- **Single-tenant.** Uma única cooperativa, sem multi-tenancy.
- **Admin centraliza gestão.** Produtores e produtos não têm login no MVP.
- **Pagamento offline.** PIX, dinheiro, cartão na entrega — sem gateway.
- **Histórico imutável.** Snapshots de preço, produto, endereço em cada pedido.
- **LGPD desde o dia 1.** Consentimento, anonimização, retenção.
- **Backend é cidadão de primeira classe.** O modelo de dados não é refém do front.

### 1.2 Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend + BFF | Next.js (App Router) | 15.x |
| Linguagem FE | TypeScript | 5.x |
| Backend API | FastAPI | 0.115+ |
| Linguagem BE | Python | 3.11+ |
| ORM Backend | SQLModel (SQLAlchemy 2.0 + Pydantic v2) | latest |
| Schema/Migrations | Drizzle Kit | latest |
| Banco | PostgreSQL | 16.x |
| Auth | NextAuth.js (JWT) + bcrypt no FastAPI | — |
| Cache | In-memory (FastAPI) + ISR (Next) | — |
| Containerização | Docker + Compose v2 | — |
| Reverse proxy / TLS | Caddy 2 (Let's Encrypt automático) | — |
| Deploy | Magalu Cloud VPS (Ubuntu 24.04 LTS) | — |
| Object Storage | Magalu Cloud Object Storage (S3-compatible, backups) | — |

### 1.3 Por que essa stack

| Pergunta | Resposta |
|---|---|
| Por que FastAPI? | Python alinhado com a experiência do dev, OpenAPI nativo, Pydantic v2, async, ecossistema Python para BI futuro |
| Por que SQLModel? | Pydantic + SQLAlchemy unificados — reuso de schemas entre validação HTTP e DB |
| Por que Drizzle Kit (e não Alembic)? | Schema TS-first compartilhado com o BFF — uma única fonte de verdade do shape de dados |
| Por que BFF? | Esconde Bearer do browser, cache server-side, CORS único, agregação SSR |
| Por que Magalu VPS (não Railway)? | Custo já incorrido, latência BR (Pelotas/RS), soberania de dados (LGPD §6), controle total |
| Por que Caddy (não Traefik/nginx)? | Auto-TLS via Let's Encrypt nativo, config trivial (Caddyfile), suporte HTTP/3, ~20MB RAM |
| Por que Docker Compose (não Kubernetes)? | 1 VPS + 4 containers; Compose é a granularidade certa, K8s é overkill |

---

## 2. Modelo de Negócio

### 2.1 Fluxos paralelos de compra

```
┌──────────────────────────────┬──────────────────────────────────┐
│  A) COMPRA AVULSA            │  B) CESTA CUSTOMIZADA            │
│  /produtos                   │  /cestas/[id]                    │
│                              │                                  │
│  Cliente escolhe produtos    │  Cliente escolhe template        │
│  individuais (food OU craft) │  ("Cesta Essencial R$ 59,90")    │
│  qualquer quantidade,        │  → preenche os slots (curados):  │
│  qualquer produtor.          │     "Frutas (3)" → [seletor]     │
│                              │     "Verduras (3)" → [seletor]   │
│  Total = soma das linhas.    │     "Legumes (2)" → [seletor]    │
│                              │  → preço base + upgrades opcio.  │
└──────────────┬───────────────┴───────────────┬──────────────────┘
               │                               │
               └─────────────┬─────────────────┘
                             ▼
                      MESMO CARRINHO
                  (A e B podem coexistir)
                             │
                             ▼
                      MESMO CHECKOUT
                  (uma entrega/retirada)
```

### 2.2 Tipos de produto

- **FOOD** — frutas, verduras, legumes, processados (pode entrar em cestas)
- **CRAFT** — artesanato, não-alimentos (apenas avulso, **nunca** em cestas)

A regra é garantida em camada de banco via `CHECK constraint`.

### 2.3 Cesta customizada — fluxo completo

1. **Catálogo (commercial).** Admin cadastra `BasketTemplate` ("Cesta Essencial — R$ 59,90") com `BasketSlots` ("3 frutas", "3 verduras", "2 legumes"). Raramente muda.

2. **Curadoria (operacional).** Toda semana, admin abre uma `BasketCuration` para cada template ativo:
   - Define `delivery_week` (data da entrega)
   - Define `customization_deadline` (ex: terça 18h para entrega quinta)
   - Para cada slot, lista os `BasketCurationSlotOption` — produtos elegíveis naquela semana, com `upgrade_fee` opcional para itens premium.

3. **Compra do cliente.**
   - Cliente abre a cesta na semana corrente, vê slots com produtos elegíveis curados pelo admin.
   - Escolhe um produto por "vaga" do slot (até `item_count`).
   - Pode escolher item premium (paga `upgrade_fee` extra).
   - Disclaimer informa: "Caso o produto falte, será substituído por outro equivalente da curadoria."
   - Adiciona ao carrinho. Pode misturar com produtos avulsos.

4. **Após o deadline.**
   - Customização trava.
   - Admin processa logística. Pode substituir produto faltante por outro do mesmo slot — registra em `basket_fulfillments.substituted_from_id`.

### 2.4 Preço

- **Cesta:** preço base do template (fixo) + soma de `upgrade_fee` dos itens premium escolhidos.
- **Avulso:** soma de `(unit_price × quantity)` por linha.
- **Frete:** depende da zona de entrega (admin cadastra).
- **Total do pedido:** subtotal + delivery_fee.

### 2.5 Estoque

Apenas o estoque do **produto individual** é limitado. Cestas "esgotam" indiretamente quando os produtos componentes esgotam — não há stock próprio de cesta.

Reserva de estoque acontece **na confirmação do pedido** (atomic decrement em transação `REPEATABLE READ` com `SELECT FOR UPDATE`).

### 2.6 Frete e entrega

- **PICKUP** (retirada em ponto de coleta): sem custo.
- **HOME_DELIVERY:** taxa por **zona de entrega**, cadastrada pelo admin em `delivery_zones`. Cada zona tem:
  - Lista de bairros que ela cobre
  - `delivery_fee`
  - `minimum_order_value` (opcional)
  - `estimated_minutes`

Cliente seleciona bairro no checkout → sistema resolve a zona → calcula frete.

### 2.7 Pagamento

100% offline no MVP. Status manual no admin: `PENDING → PAID`. Sem webhook, sem integração de gateway.

---

## 3. Modelo de Domínio

### 3.1 Bounded contexts

| Contexto | Entidades |
|---|---|
| **Catálogo** | Product, Category, Producer, BasketTemplate, BasketSlot |
| **Curadoria** | BasketCuration, BasketCurationSlotOption |
| **Pedido** | Order, OrderItem, BasketFulfillment |
| **Logística** | DeliveryZone, CollectionPoint |
| **Identidade** | User, ConsentHistory |
| **Auditoria** | AuditLog |
| **Analytics** | dim_*, fact_*, agg_* |

### 3.2 Vocabulário ubíquo

| Termo | Significado |
|---|---|
| **Product** | Item vendável individualmente. Pode ser FOOD ou CRAFT |
| **Producer** | Agricultor familiar — entidade de catálogo, **não autentica** |
| **BasketTemplate** | "Receita comercial" da cesta — preço base, número de slots |
| **BasketSlot** | Regra estrutural de um template ("3 frutas") |
| **BasketCuration** | Instância semanal de um template, com deadline |
| **BasketCurationSlotOption** | Produto elegível em um slot, em uma semana específica |
| **BasketFulfillment** | Escolha concreta do cliente (ou substituição admin) registrada em pedido |
| **DeliveryZone** | Bairro/região com taxa própria |
| **Avulso** | Compra de Product fora de cesta |
| **Curadoria** | Ato semanal do admin de definir produtos elegíveis |
| **Substituição** | Troca de produto: pelo cliente (antes do deadline) ou pelo admin (após) |

### 3.3 Camadas conceituais

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAMADA COMERCIAL (catálogo)                    │
│                   muda raramente, é vendável                     │
├─────────────────────────────────────────────────────────────────┤
│  Product, BasketTemplate, BasketSlot, Category, Producer        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ instanciada semanalmente
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CAMADA OPERACIONAL (curadoria)                 │
│                   curada toda semana pelo admin                  │
├─────────────────────────────────────────────────────────────────┤
│  BasketCuration, BasketCurationSlotOption                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ cliente compra
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA TRANSACIONAL (pedido)                  │
├─────────────────────────────────────────────────────────────────┤
│  Order, OrderItem, BasketFulfillment                             │
└─────────────────────────────────────────────────────────────────┘
```

**Por que essa separação importa:**

1. **Histórico íntegro:** mudar `BasketTemplate.base_price` em maio não afeta pedidos de abril (apontam para `BasketCuration` daquela semana, com snapshot).
2. **Curadoria não polui catálogo:** admin não cria/deleta cestas, só cura janelas semanais.
3. **Substituição rastreável:** `substituted_from_id` registra que admin trocou morango por uva quando faltou — útil para LGPD, dispute, e BI.

---

## 4. Arquitetura de Sistema

### 4.1 Topologia

```
Browser
  │
  ▼
Next.js (App Router + BFF)
  │  - SSR/ISR de catálogo (revalidate: 60s)
  │  - Route Handlers como proxy para FastAPI
  │  - NextAuth.js (sessão JWT em httpOnly cookie)
  │  - localStorage para carrinho (client-side)
  │
  ▼ HTTP/JSON (server-side, com Bearer token)
  │
FastAPI (Python 3.11+)
  │  - SQLModel + asyncpg
  │  - JWT issuance + bcrypt (passlib)
  │  - BackgroundTasks (email, refresh views)
  │  - Cache in-memory (fastapi-cache2) 30s
  │  - Pydantic v2 para validação/serialização
  │  - Routers organizados por bounded context
  │
  ▼ asyncpg (pool) + PgBouncer
  │
PostgreSQL 16
  ├── public.*       (OLTP)
  ├── analytics.*    (BI)
  └── audit.*        (audit_log particionada por mês)
```

### 4.2 Caching

| Camada | Tecnologia | TTL | Notas |
|---|---|---|---|
| Browser | `Cache-Control: public, max-age=300` | 5min | Assets, imagens |
| Next.js | ISR `revalidate: 60` | 60s | `/produtos`, `/produtores`, `/cestas` |
| FastAPI | `fastapi-cache2` InMemoryBackend | 30s | Listagens públicas |
| Postgres | shared_buffers padrão | — | Default Postgres tunado pelo Docker image |

**Sem Redis no MVP.** Gatilho para Redis: > 2 instâncias FastAPI (cache local desincroniza), volume de sessões alto, ou rate-limit distribuído.

### 4.3 Mensageria / Eventos

- **FastAPI `BackgroundTasks`** — email de confirmação, refresh de materialized view.
- **Postgres `LISTEN/NOTIFY`** — admin recebe nova ordem em tempo real.

**Sem broker externo no MVP.** Gatilho para RabbitMQ/NATS: integração com gateway de pagamento real (webhook idempotente), notificações WhatsApp/SMS em fan-out, reprocessamento de jobs falhos.

### 4.4 API Gateway

**Não usar Kong/Traefik.** O BFF do Next.js cumpre o papel:
- Rate limit (middleware Next.js)
- Auth header injection
- CORS (ponto único)
- Reescrita/agregação de response

Gatilho para Kong: API pública para terceiros, > 3 microsserviços, ou exposição direta sem BFF.

### 4.5 ACID e PACELC

- **Postgres single-primary** (container na VPS, volume nomeado `aapel_pgdata`). ACID nativo, isolation default `READ COMMITTED`.
- **Checkout usa `REPEATABLE READ` + `SELECT FOR UPDATE`** em `products.stock` para evitar race condition.
- **PACELC:** PA/EC hoje (sem réplicas). Quando adicionar read replica → PA/EL (réplicas eventually consistent para catálogo, escritas sempre no primary).
- **Connection pooling:** asyncpg pool no FastAPI. PgBouncer só quando >2 instâncias api.

---

## 5. Modelo de Dados

### 5.1 Schema overview

```
public/
├── users
├── consent_history
├── producers
├── categories
├── products
├── basket_templates
├── basket_slots
├── basket_curations
├── basket_curation_slot_options
├── delivery_zones
├── delivery_zone_neighborhoods
├── collection_points
├── orders
├── order_items
└── basket_fulfillments

analytics/
├── dim_date
├── dim_customer
├── dim_producer
├── dim_product_snapshot
├── fact_order_items
├── fact_basket_orders
├── fact_basket_fulfillment_items
└── agg_daily_metrics  (materialized view)

audit/
└── audit_log  (PARTITION BY RANGE (timestamp))
```

### 5.2 Tabelas (Drizzle TS — pseudocódigo simplificado)

#### `users`

```ts
users {
  id              uuid PK
  email           varchar(255) UQ
  name            varchar(255)
  password_hash   text
  role            enum('CUSTOMER','ADMIN') default 'CUSTOMER'
  phone           varchar(20)
  
  // LGPD
  consent_marketing      boolean default false
  consent_analytics      boolean default true
  data_retention_until   timestamp
  deleted_at             timestamp     // soft delete
  anonymized_at          timestamp     // direito ao esquecimento
  
  created_at, updated_at
}
```

#### `consent_history`

```ts
consent_history {
  id            uuid PK
  user_id       uuid FK -> users
  consent_type  enum('marketing','analytics','terms','privacy')
  granted       boolean
  source        varchar(50)         // 'registration' | 'account_settings' | 'api'
  ip            inet
  user_agent    text
  timestamp     timestamp default now()
}
```

#### `producers`

```ts
producers {
  id, name, description, story
  location, image_url, cover_image_url
  specialties     jsonb              // string[]
  since           integer            // ano de fundação
  active          boolean default true
  deleted_at      timestamp          // soft delete
  created_at, updated_at
}
// SEM user_id (admin gerencia)
```

#### `categories`

```ts
categories {
  id, name UQ, description, image_url
}
```

#### `products`

```ts
products {
  id              uuid PK
  name, description
  price           decimal(10,2)
  unit            varchar(50)        // kg, maço, unidade, bandeja
  image_url
  stock           integer default 0
  
  product_type    enum('FOOD','CRAFT') default 'FOOD'
  premium         boolean default false   // candidato a upgrade_fee em cestas
  organic         boolean default false
  available       boolean default true
  seasonal        boolean default false
  
  category_id     uuid FK -> categories
  producer_id     uuid FK -> producers
  
  deleted_at      timestamp           // soft delete (preserva histórico)
  created_at, updated_at
}
```

#### `basket_templates` + `basket_slots`

```ts
basket_templates {
  id, name, description
  base_price                decimal(10,2)
  image_url
  serves                    varchar(50)    // "2-3 pessoas"
  customization_window_hours integer default 24  // janela antes do deadline
  active                    boolean default true
  created_at, updated_at
}

basket_slots {
  id
  basket_template_id  uuid FK -> basket_templates [ON DELETE CASCADE]
  slot_label          varchar(100)         // "Frutas"
  position            integer              // ordem na UI
  item_count          integer              // 3
}
```

#### `basket_curations` + `basket_curation_slot_options`

```ts
basket_curations {
  id
  basket_template_id        uuid FK -> basket_templates
  delivery_week             date            // ex 2026-05-04
  customization_deadline    timestamp
  status                    enum('DRAFT','OPEN','CLOSED')
  created_at, updated_at
  
  UNIQUE (basket_template_id, delivery_week)
}

basket_curation_slot_options {
  id
  basket_curation_id  uuid FK -> basket_curations [ON DELETE CASCADE]
  basket_slot_id      uuid FK -> basket_slots
  product_id          uuid FK -> products
  upgrade_fee         decimal(10,2) default 0
  
  UNIQUE (basket_curation_id, basket_slot_id, product_id)
  
  // CHECK constraint: produto deve ser FOOD
}
```

#### `delivery_zones` + `delivery_zone_neighborhoods`

```ts
delivery_zones {
  id
  name                  varchar(100)        // "Centro", "Areal", "Três Vendas"
  description
  delivery_fee          decimal(10,2)
  minimum_order_value   decimal(10,2) default 0
  estimated_minutes     integer
  active                boolean default true
  deleted_at            timestamp
  created_at, updated_at
}

delivery_zone_neighborhoods {
  id
  delivery_zone_id      uuid FK -> delivery_zones [ON DELETE CASCADE]
  neighborhood          varchar(100)        // "Porto", "Centro Histórico"
  
  UNIQUE (neighborhood)   // bairro só pode estar em uma zona
}
```

#### `collection_points`

```ts
collection_points {
  id, name, address, city, state
  description, schedule
  active boolean default true
  deleted_at
  created_at, updated_at
}
```

#### `orders`

```ts
orders {
  id                  uuid PK
  public_id           varchar(20) UQ        // 'AAP-2026-00001'
  status              enum('PENDING','CONFIRMED','COLLECTED',
                            'OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
                      default 'PENDING'
  
  customer_id         uuid FK -> users
  
  delivery_method     enum('PICKUP','HOME_DELIVERY')
  delivery_date       timestamp
  
  // se HOME_DELIVERY (snapshots)
  delivery_zone_id    uuid FK -> delivery_zones
  delivery_address    text
  delivery_neighborhood varchar(100)
  delivery_zip_code   varchar(10)
  
  // se PICKUP
  collection_point_id uuid FK -> collection_points
  
  payment_method      enum('PIX','CASH','CARD')
  payment_status      enum('PENDING','PAID','REFUNDED') default 'PENDING'
  
  subtotal            decimal(10,2)
  delivery_fee        decimal(10,2) default 0
  total_amount        decimal(10,2)
  
  notes               text
  created_at, updated_at
}
```

#### `order_items` + `basket_fulfillments`

```ts
order_items {
  id
  order_id               uuid FK -> orders [ON DELETE CASCADE]
  line_type              enum('PRODUCT','BASKET')
  
  // se PRODUCT
  product_id             uuid FK -> products
  producer_id            uuid FK -> producers
  product_name_snapshot  varchar(255)         // nome no momento da compra
  
  // se BASKET
  basket_curation_id            uuid FK -> basket_curations
  basket_template_name_snapshot varchar(255)
  
  quantity              integer
  unit_price_snapshot   decimal(10,2)
  upgrade_total         decimal(10,2) default 0
  line_total            decimal(10,2)
  
  created_at
  
  // CHECK: line_type consistente com FKs preenchidas
}

basket_fulfillments {
  id
  order_item_id           uuid FK -> order_items [ON DELETE CASCADE]
  basket_slot_id          uuid FK -> basket_slots
  product_id              uuid FK -> products
  producer_id             uuid FK -> producers
  
  upgrade_fee_paid        decimal(10,2) default 0
  
  chosen_by               enum('CUSTOMER','ADMIN')
  substituted_from_id     uuid FK -> products NULL   // produto original substituído
  substitution_reason     text
  
  created_at
}
```

#### `audit.audit_log`

```sql
CREATE TABLE audit.audit_log (
  id          uuid,
  timestamp   timestamptz NOT NULL,
  actor_id    uuid,
  actor_type  varchar(20),         -- ADMIN | SYSTEM | TRIGGER
  action      varchar(100),        -- ORDER_STATUS_CHANGE | PRODUCT_PRICE_UPDATE | ...
  entity_type varchar(50),
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip          inet,
  user_agent  text,
  metadata    jsonb,
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- partições mensais criadas via cron
CREATE TABLE audit.audit_log_2026_04 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

### 5.3 Constraints críticas

```sql
-- 1. Não-alimentos não podem ir em cestas
ALTER TABLE basket_curation_slot_options
  ADD CONSTRAINT product_must_be_food
  CHECK (
    (SELECT product_type FROM products WHERE id = product_id) = 'FOOD'
  );

-- 2. order_items: line_type determina FKs
ALTER TABLE order_items
  ADD CONSTRAINT line_type_consistency
  CHECK (
    (line_type = 'PRODUCT' AND product_id IS NOT NULL AND basket_curation_id IS NULL)
    OR
    (line_type = 'BASKET' AND product_id IS NULL AND basket_curation_id IS NOT NULL)
  );

-- 3. orders: delivery_method determina FKs de logística
ALTER TABLE orders
  ADD CONSTRAINT delivery_method_consistency
  CHECK (
    (delivery_method = 'PICKUP' AND collection_point_id IS NOT NULL AND delivery_zone_id IS NULL)
    OR
    (delivery_method = 'HOME_DELIVERY' AND delivery_zone_id IS NOT NULL AND collection_point_id IS NULL)
  );
```

### 5.4 Índices (criação dia 1)

```sql
CREATE INDEX idx_products_category_available 
  ON products (category_id) 
  WHERE available AND deleted_at IS NULL;

CREATE INDEX idx_products_producer 
  ON products (producer_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_products_type 
  ON products (product_type, available);

CREATE UNIQUE INDEX idx_orders_public_id 
  ON orders (public_id);

CREATE INDEX idx_orders_customer_status 
  ON orders (customer_id, status);

CREATE INDEX idx_orders_delivery_date 
  ON orders (delivery_date) 
  WHERE status NOT IN ('CANCELLED');

CREATE INDEX idx_basket_curations_open 
  ON basket_curations (basket_template_id, delivery_week) 
  WHERE status = 'OPEN';

CREATE INDEX idx_audit_log_entity 
  ON audit.audit_log (entity_type, entity_id, timestamp DESC);

CREATE INDEX idx_neighborhoods_lookup
  ON delivery_zone_neighborhoods (neighborhood);
```

---

## 6. Auth, Sessão & LGPD

### 6.1 Fluxo de autenticação

```
Browser ──POST /api/auth/login──► NextAuth (Next.js)
                                      │
                                      ▼
                                   POST FastAPI /auth/login
                                      │  (email, password)
                                      ▼
                                   bcrypt.verify(password, password_hash)
                                      │
                                      ▼
                                   Emite JWT access (15min) + refresh (7d)
                                      │
                                      ▼
                                   NextAuth wrappa em sessão JWT
                                      │
                                      ▼
Browser  ◄──Set-Cookie──  httpOnly + Secure + SameSite=Lax
```

**Tokens:**
- **Access token:** JWT HS256, 15 min, claims `{sub, role, exp, iat}`.
- **Refresh token:** 7 dias, em httpOnly cookie. Endpoint `POST /auth/refresh`.
- **Storage stateless.** Sem tabela `sessions`. Logout = limpar cookie. Revogação imediata via Redis denylist (futuro).

### 6.2 Roles

- `CUSTOMER` — cliente padrão
- `ADMIN` — gerencia tudo (catálogo, curadoria, pedidos, zonas, produtores)

Validação em FastAPI via dependency `get_current_user(role: Role = Role.CUSTOMER)`.

### 6.3 LGPD

#### Consentimento
- No registro: aceite obrigatório de termos + privacidade.
- Marketing: opt-in.
- Analytics: opt-in (default true).
- Toda mudança escrita em `consent_history` (imutável).

#### Direito ao esquecimento
- Endpoint `DELETE /api/me` (auth required).
- Função `anonymize_user(user_id)`:
  - `email` → `anon_<sha256>@deleted.local`
  - Limpa `name`, `phone`
  - Em `orders`: limpa `delivery_address`, `delivery_neighborhood`, `delivery_zip_code`. Mantém `customer_id`, valores agregados, public_id.
  - Marca `anonymized_at`.

#### Retenção automática
Cron mensal: anonimiza usuários sem atividade > 5 anos AND sem `consent_analytics`.

#### Analytics privacidade-first
- `dim_customer.customer_hash` = `sha256(user_id || PEPPER)`.
- Pepper em variável de ambiente, **nunca** em DB.
- Nenhuma PII em `analytics.*`.

---

## 7. Analytics / BI

### 7.1 Estratégia

Schema `analytics` no **mesmo banco**. Star schema, atualizado por **triggers** (real-time) + **cron noturno** (agregações).

**Por que mesmo banco no MVP:**
- Custo (sem $ extra).
- Sem ETL pipeline para manter.
- Postgres aguenta < 100k pedidos/ano sem problema.

**Gatilho para DW separado** (ClickHouse, BigQuery): > 100k pedidos/ano OR queries de relatório > 1s OR demanda real-time dashboards.

### 7.2 Star schema

```
fact_order_items                    ← 1 linha por OrderItem PRODUCT
├── order_id, order_public_id
├── customer_hash      (FK dim_customer)
├── producer_id        (FK dim_producer)
├── product_snapshot_id (FK dim_product_snapshot)
├── date_id            (FK dim_date)
├── quantity, unit_price, line_total
├── delivery_method, payment_method
├── delivery_zone_name (denorm)
└── status_final

fact_basket_orders                  ← 1 linha por OrderItem BASKET
├── order_id, basket_template_name
├── customer_hash, date_id
├── base_price, upgrade_total, line_total
├── slot_count
└── substitution_count   -- quantos slots foram substituídos por admin

fact_basket_fulfillment_items       ← 1 linha por BasketFulfillment
├── order_item_id
├── product_snapshot_id
├── producer_id
├── chosen_by
├── was_substituted
├── upgrade_fee_paid
└── date_id

dim_date                  ← pré-populada 2024-2030
├── date, year, quarter, month, week, day_of_week
├── is_weekend
└── season               (verão/outono/...) — útil para sazonalidade

dim_customer              ← hash, sem PII
├── customer_hash (PK)
├── created_month
├── city (sem endereço)
└── consent_analytics

dim_producer              ← SCD Tipo 1 (overwrite)
└── id, name, location, since

dim_product_snapshot      ← SCD Tipo 2 (preserva histórico de preço/categoria)
├── snapshot_id (PK)
├── product_id, name, category, organic, premium
├── price_at_time
└── valid_from, valid_to

agg_daily_metrics         ← materialized view, refresh noturno
└── date, orders_count, revenue, customers_unique, avg_ticket,
    cancellation_rate, top_product_id, top_producer_id, ...
```

### 7.3 Trigger pattern

```sql
CREATE OR REPLACE FUNCTION analytics.populate_fact_order_items()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_hash text;
  v_snapshot_id   uuid;
BEGIN
  -- só popular se for PRODUCT
  IF NEW.line_type <> 'PRODUCT' THEN RETURN NEW; END IF;

  -- ... lógica de hash + snapshot ...

  INSERT INTO analytics.fact_order_items (...)
  VALUES (...);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fact_order_items
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION analytics.populate_fact_order_items();
```

### 7.4 Refresh agregações

```sql
-- via pg_cron (se disponível) OU systemd timer no host (ops/aapel-refresh-bi.timer)
0 3 * * *  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.agg_daily_metrics;
```

---

## 8. Contratos de API

### 8.1 Endpoints públicos

```
POST   /api/auth/register                     # cria User CUSTOMER
POST   /api/auth/login                        # retorna access + refresh
POST   /api/auth/refresh                      # rotaciona access
POST   /api/auth/logout                       # limpa cookie
DELETE /api/me                       [auth]   # anonimiza (LGPD)

GET    /api/produtos                          # ?categoria=&busca=&organico=&tipo=FOOD|CRAFT
GET    /api/produtos/{id}
GET    /api/categorias

GET    /api/produtores
GET    /api/produtores/{id}
GET    /api/produtores/{id}/produtos

GET    /api/cestas                            # lista templates ativos
GET    /api/cestas/{id}                       # template + slots
GET    /api/cestas/{id}/curadoria-atual       # curadoria semana corrente:
                                              #   slots + produtos elegíveis + upgrade_fees
                                              #   + customization_deadline

GET    /api/pontos-coleta
GET    /api/zonas-entrega                     # bairros agrupados por zona + frete

POST   /api/pedidos                  [auth]   # Idempotency-Key suportado
GET    /api/pedidos                  [auth]   # cursor pagination
GET    /api/pedidos/{public_id}      [auth]
```

### 8.2 Endpoints admin

```
# Catálogo
POST   /api/admin/produtores
PATCH  /api/admin/produtores/{id}
DELETE /api/admin/produtores/{id}             # soft delete

POST   /api/admin/produtos
PATCH  /api/admin/produtos/{id}
DELETE /api/admin/produtos/{id}               # soft delete

POST   /api/admin/cestas                       # cria BasketTemplate + slots
PATCH  /api/admin/cestas/{id}

# Curadoria semanal
POST   /api/admin/curadorias                   # abre BasketCuration
PATCH  /api/admin/curadorias/{id}/opcoes       # define produtos elegíveis
PATCH  /api/admin/curadorias/{id}/status       # OPEN | CLOSED

# Logística
POST   /api/admin/zonas-entrega
PATCH  /api/admin/zonas-entrega/{id}
POST   /api/admin/pontos-coleta
PATCH  /api/admin/pontos-coleta/{id}

# Pedidos
GET    /api/admin/pedidos                      # filtros: status, data, zona, ...
PATCH  /api/admin/pedidos/{id}/status          # transição de status
PATCH  /api/admin/pedidos/{id}/payment-status  # PENDING | PAID | REFUNDED
PATCH  /api/admin/pedidos/{id}/fulfillments    # substituições admin

# BI
GET    /api/admin/dashboard/daily              # agg_daily_metrics
GET    /api/admin/dashboard/producers          # performance por produtor
```

### 8.3 Convenções

- Response shape padrão: `{data, pagination?}` ou `{data}`
- Erros: RFC 7807 Problem Details (`application/problem+json`)
- Paginação:
  - **Catálogo:** `?page=1&limit=20` (offset)
  - **Histórico:** `?cursor=<id>&limit=20` (cursor-based)
- Datas: ISO 8601 UTC
- Decimais: string (`"18.90"`) para evitar precisão de float

---

## 9. Padrões Operacionais

### 9.1 Idempotência no checkout

`POST /api/pedidos` aceita header `Idempotency-Key`. Mesmo key + mesmo payload = mesmo resultado, evita pedido duplicado em retry.

Implementação: tabela `idempotency_keys (key, response_json, created_at)` com TTL de 24h.

### 9.2 Stock contention

```python
# pseudo
async with db.transaction(isolation='REPEATABLE_READ'):
    for item in items:
        product = await db.fetch_one(
            "SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
            item.product_id
        )
        if product.stock < item.quantity:
            raise InsufficientStock(product.name)
        await db.execute(
            "UPDATE products SET stock = stock - $1 WHERE id = $2",
            item.quantity, item.product_id
        )
    # cria order, order_items, basket_fulfillments
```

### 9.3 Public ID generation

```sql
CREATE SEQUENCE order_public_seq START 1;

-- na criação:
public_id = 'AAP-' 
         || EXTRACT(YEAR FROM now())::text 
         || '-' 
         || LPAD(nextval('order_public_seq')::text, 5, '0')
-- ex: AAP-2026-00042
```

Reset anual via cron 1º janeiro: `ALTER SEQUENCE order_public_seq RESTART WITH 1`.

### 9.4 Soft delete vs hard delete

| Entidade | Política |
|---|---|
| `products` | Soft (`deleted_at`) |
| `producers` | Soft |
| `delivery_zones` | Soft |
| `collection_points` | Soft |
| `basket_templates` | Soft |
| `categories` | Hard (raramente muda; uso de FK) |
| `orders` | **Nunca deletar.** Status `CANCELLED` é a baixa lógica |
| `users` | **Anonymize.** Não deletar (preserva FK) |

### 9.5 Audit pattern

- **Triggers Postgres** em `orders` (status change), `products` (price/stock change) — automático.
- **App-level** para ações com contexto (admin observação, motivo de cancelamento).
- Retenção: 2 anos online, depois export para storage frio.

### 9.6 Validações de negócio

| Regra | Onde |
|---|---|
| Estoque suficiente | DB (transação) |
| Quantidade 1-99 por linha | Pydantic |
| Data de entrega ≥ hoje + 2 dias úteis | Pydantic |
| Valor mínimo do pedido por zona | App (valida zona.minimum_order_value) |
| CEP/bairro válido | App (lookup em delivery_zone_neighborhoods) |
| Curadoria não fechada | App (status = OPEN AND deadline > now) |
| Produto FOOD em slot de cesta | DB (CHECK constraint) |
| line_type consistente | DB (CHECK constraint) |

---

## 10. Roadmap

### Fase 1 — Backend Foundation (2-3 semanas)
- [ ] Drizzle: schema completo + migrations + seed (3 produtores, 12 produtos, 3 cestas, 5 zonas)
- [ ] FastAPI: setup, config, deps, healthcheck
- [ ] Auth: register/login/refresh/logout, JWT, bcrypt
- [ ] Routers públicos: produtos, produtores, categorias, cestas, pontos-coleta, zonas-entrega
- [ ] Deploy Magalu VPS via Docker Compose + Caddy (db, api, web). Ver §12.

### Fase 2 — Curadoria + Admin Completo ✅
- [x] **2A** Endpoints admin CRUD (catálogo, zonas, cestas) — `/api/admin/*` (39 endpoints)
- [x] **2A** Endpoint `/cestas/{id}/curadoria-atual` (público)
- [x] **2B** Painel admin: auth + sidebar + curadoria semanal completa
- [x] **2C** CRUD UI de produtos, produtores, categorias, cestas (templates+slots), zonas (com bairros), pontos de coleta

**Notas:**
- Admin vive como route group `app/(admin)/` dentro do mesmo Next.js app (não em `apps/admin/` separado), simplificando deploy e auth.
- Auth bare httpOnly cookies (jose) — sem NextAuth ainda. NextAuth chega na Fase 3.
- Padrão estabelecido para CRUDs: `actions.ts` + `_form.tsx` + `page.tsx` (list) + `novo/page.tsx` + `[id]/page.tsx`.
- Server actions com `useActionState` para forms; `startTransition` para deletes.
- Soft delete preserva histórico em produtos, produtores, zonas, pontos de coleta, templates.
- Categorias têm apenas list/create/update (sem delete) por integridade FK.

### Fase 3 — Checkout + Integração FE (2-3 semanas)
- [ ] BFF Next.js: route handlers proxy
- [ ] NextAuth.js + integração FastAPI
- [ ] `lib/api.ts` substituindo `lib/data.ts`
- [ ] localStorage para carrinho (persistência client-side)
- [ ] POST /pedidos completo (avulso + cesta customizada)
- [ ] Tela de sucesso, histórico de pedidos

### Fase 4 — Analytics + LGPD + Audit (3+ semanas)
- [ ] Schema analytics + triggers + cron
- [ ] Dashboard admin com KPIs (revenue, top products, top producers)
- [ ] LGPD endpoints (consent, delete me)
- [ ] Audit log particionado + função de export

### Fase 5 — Subscription (futuro, fora do MVP)
- [ ] Cesta recorrente (semanal/quinzenal)
- [ ] Cobrança automática

---

## 11. Decisões e Trade-offs

| Decisão | Alternativa | Por que |
|---|---|---|
| FastAPI vs NestJS atual | NestJS | SYSTEM_DESIGN aponta FastAPI; Python alinhado com dev; OpenAPI nativo |
| SQLModel vs SQLAlchemy puro | SQLAlchemy | Reuso de schemas validação ↔ DB |
| Drizzle Kit para migrations | Alembic | Schema TS compartilhado com BFF |
| BasketTemplate + BasketCuration | Basket único com produtos fixos | Histórico íntegro, substituição rastreável, curadoria operacional separada |
| `product_type` FOOD/CRAFT | `basket_eligible` boolean | Mais semântico, melhor BI, regra clara |
| In-memory cache vs Redis | Redis | Custo, simplicidade no MVP; trigger claro para subir |
| BFF Next.js vs API direta | API direta | Esconde token, cache server-side, CORS único |
| `analytics` no mesmo DB | DW separado (ClickHouse) | Custo, simplicidade no MVP; trigger claro para evoluir |
| Audit log particionada | Audit única ou sem audit | Performance + retenção + LGPD |
| Soft delete | Hard delete | Histórico íntegro de pedidos |
| LGPD desde dia 1 | Adicionar depois | Custo de retrofit é alto (PII espalhada) |
| Pagamento offline | Stripe/MercadoPago | Decisão do MVP; reduz complexidade e fraude |
| Sem multi-tenancy | Tenant em todas tabelas | AAPel é single-tenant; não inflar schema sem necessidade |
| Sem login para Producer | Producer com role | Admin centraliza; reduz complexidade de auth |
| Cesta customizada (M2) + Avulso (M3) | Cesta surpresa (M1) | Decisão de produto; cliente quer escolher |
| Não-alimentos fora de cestas | Permitir tudo | Decisão de produto; CHECK constraint no DB garante |
| Magalu VPS vs Railway | Railway PaaS | Custo já incorrido, latência BR, soberania LGPD, controle |
| Caddy vs Traefik/Dokploy | Dokploy UI | Simplicidade, ~20MB RAM vs ~500MB, transparente |
| Docker Compose vs K8s | Kubernetes | Escala atual (1 VPS, 4 containers) não justifica K8s |
| systemd timers vs cron | cron | Logs via journalctl, retry semantics, modern padrão |
| Backups: pg_dump → Object Storage | Snapshots de volume | Portável, verificável, restore granular |
| Secrets: /etc/aapel/secrets/*.env | Vault/Doppler | Simplicidade single-VPS; chmod 640 + gitignore |

---

## 12. Operações (Deploy, Backup, Secrets, Monitoring)

Esta seção documenta o ciclo operacional completo do AAPel na VPS Magalu Cloud.

### 12.1 Topologia de produção

```
                     Internet
                        │
            HTTP/80 ────┴──── HTTPS/443
                        │
              ┌─────────▼─────────┐
              │  Caddy (host net) │  ← TLS Let's Encrypt automático
              │  ports 80/443     │     auto-renew 60d antes
              └────┬─────────┬────┘
                   │ :3000   │ :8000
              ┌────▼────┐ ┌──▼──────┐
              │  web    │ │  api    │
              │ Next.js │ │ FastAPI │
              └─────────┘ └────┬────┘
                               │ :5432
                          ┌────▼────┐
                          │   db    │  volume: aapel_pgdata
                          │ Postgres│  → /var/lib/aapel/pgdata
                          └─────────┘
                               │
            cron 03:00 UTC ────┘──→ pg_dump.gz
                                       │
                              ┌────────▼────────┐
                              │ Magalu Object   │
                              │ Storage         │
                              │ s3://aapel-     │
                              │   backups/      │
                              └─────────────────┘
```

Tudo containerizado, comunica via rede `aapel_default` do Compose. Apenas o Caddy expõe portas no host (80, 443).

### 12.2 Bootstrap inicial da VPS (uma vez)

```bash
# Como root no primeiro login da VPS
ssh root@<vps-ip>
git clone <repo-url> /tmp/aapel
sudo bash /tmp/aapel/scripts/bootstrap-vps.sh
```

`bootstrap-vps.sh` é idempotente e instala:
- apt updates + unattended-upgrades (security patches automáticos)
- Docker Engine + Compose plugin (repo upstream)
- usuário `deploy` (membro de `docker`)
- UFW: deny incoming, allow 22/80/443
- fail2ban (proteção SSH)
- estrutura `/etc/aapel/secrets` e `/var/lib/aapel`

Depois:
```bash
echo "<sua-chave-pública-ssh>" >> /home/deploy/.ssh/authorized_keys
ssh deploy@<vps-ip>
git clone <repo> /home/deploy/aapel
cd /home/deploy/aapel
sudo AAPEL_DOMAIN=<ip-com-tracos>.nip.io ACME_EMAIL=you@email.com \
    bash scripts/setup-secrets.sh
bash scripts/deploy.sh
```

### 12.3 Estrutura de secrets

```
/etc/aapel/secrets/        ← chmod 750, owner root:docker
├── db.env                 ← POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
├── api.env                ← DATABASE_URL, JWT_SECRET, ANALYTICS_PEPPER, ...
├── web.env                ← NEXT_PUBLIC_*, NEXTAUTH_*
├── caddy.env              ← AAPEL_DOMAIN, ACME_EMAIL
└── backup.env             ← BACKUP_S3_* credentials
```

Cada arquivo: chmod 640, owner root:docker. Sourced por `deploy.sh` antes do `docker compose up`. Nenhum secret em git, nenhum no diretório do projeto.

`setup-secrets.sh` gera valores aleatórios de 48 bytes para `JWT_SECRET`, `ANALYTICS_PEPPER` e senha do Postgres na primeira execução. Operações subsequentes preservam arquivos existentes.

### 12.4 Deploy

```bash
ssh deploy@<vps>
cd ~/aapel
make deploy        # OU: bash scripts/deploy.sh
```

`deploy.sh` executa:
1. `git pull --ff-only`
2. Source de `/etc/aapel/secrets/*.env`
3. `docker compose build` (rebuilds imagens locais)
4. `docker compose pull` (atualiza postgres, caddy)
5. `docker compose --profile migrate run --rm migrate` (Drizzle migrations)
6. `docker compose up -d --remove-orphans`
7. `docker image prune -f`

Tempo típico de deploy: 2-5 min. Downtime: ~30s (Compose rolling stop/start).

### 12.5 Persistência

| Volume / Host path | Conteúdo | Backup? |
|---|---|---|
| `aapel_pgdata` (named volume) | Dados Postgres | sim, via pg_dump |
| `aapel_caddy_data` (named volume) | Certificados Let's Encrypt | recomendado (recriar = renovar TLS, rate-limited!) |
| `aapel_caddy_config` (named volume) | Estado Caddy | opcional |
| `/var/lib/aapel/backups` (bind) | Cache local de backups | dispensável |
| `/etc/aapel/secrets` (bind) | Secrets | sim, separado, encriptado |

### 12.6 Backup

**Estratégia:** `pg_dump` plain SQL → gzip → upload S3 (Magalu Object Storage), diário às 03:00 UTC.

**Implementação:** systemd timer (`ops/aapel-backup.timer`) dispara `aapel-backup.service` que executa `scripts/backup.sh`.

**Retenção:**
- Local: 7 dias (`BACKUP_RETENTION_DAYS_LOCAL=7`)
- Remota: 30 dias (configurar lifecycle no bucket Magalu)

**Instalação dos timers:**
```bash
sudo cp ops/aapel-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aapel-backup.timer
sudo systemctl list-timers aapel*
```

**Backup manual:** `make backup` ou `sudo systemctl start aapel-backup.service`.

### 12.7 Restore

```bash
# Listar backups remotos
s3cmd ls s3://aapel-backups/ --access_key=... --secret_key=...

# Trazer um backup específico
s3cmd get s3://aapel-backups/aapel-20260428_030000.sql.gz /tmp/

# Restaurar (DESTRÓI a base atual)
make restore F=/tmp/aapel-20260428_030000.sql.gz
```

`restore.sh` para `api/web/caddy`, dropa o database, recria, faz `psql < restore`, sobe tudo. Tempo típico: <2 min para banco de MVP.

### 12.8 Persistência de boot (systemd)

Para o stack subir automaticamente após reboot da VPS:

```bash
sudo cp ops/aapel.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aapel.service       # auto-start no boot
sudo systemctl start aapel.service        # subir agora
journalctl -u aapel.service -f            # logs
```

A unit `aapel.service` faz source dos secrets e roda `docker compose up -d`. Em desligamento ordenado, faz `down`.

### 12.9 Monitoramento

**Para o MVP:** logs via `docker compose logs -f` ou `journalctl -u aapel.service`.

**Quando precisar mais:**
- **Uptime externo:** UptimeRobot ou Better Stack free tier monitora `https://<dominio>/health`. Alerta por email/Telegram.
- **Métricas:** Grafana + Prometheus em containers separados (~300MB RAM extra).
- **APM:** Sentry (free tier 5k events/month) para erros do FastAPI e Next.js.

### 12.10 Atualizações de SO

`unattended-upgrades` aplica patches de segurança automaticamente (configurado pelo `bootstrap-vps.sh`). Reboot automático desabilitado por padrão — programar manualmente em janela de manutenção:

```bash
sudo apt list --upgradable
sudo unattended-upgrade --dry-run -d
sudo reboot
```

A unit `aapel.service` faz o stack subir limpo após o reboot.

### 12.11 Runbook de incidentes

| Sintoma | Ação |
|---|---|
| `502 Bad Gateway` | `docker compose ps`; restart do serviço caído; ver `docker compose logs api` |
| TLS expirado | Caddy renova automaticamente. Se falhar: ver `docker compose logs caddy`; checar UFW na 80 |
| Banco lento | `docker exec aapel-db-1 psql -c "SELECT * FROM pg_stat_activity"` |
| Disco cheio | `du -sh /var/lib/aapel/* /var/lib/docker/*`; `docker system prune -af` |
| Restore de emergência | §12.7 |
| Comprometimento (suspeita) | Rotate `JWT_SECRET` + `ANALYTICS_PEPPER` em `/etc/aapel/secrets/api.env`; `make deploy`; força logout de todos |

### 12.12 Custos operacionais estimados

| Item | R$/mês | Notas |
|---|---|---|
| VPS Magalu (2vCPU, 2GB, 40GB SSD) | ~R$ 50 | Já contratada |
| Object Storage (backups, ~5GB) | ~R$ 1 | $0,02/GB/mês × 5GB |
| Domínio próprio (futuro) | ~R$ 4 | `.coop.br` ou `.org.br`, anual |
| **Total marginal AAPel** | **~R$ 51** | |

Comparado a Railway equivalente (~R$ 80/mês USD-pegged), economia anual ~R$ 350.

---

## Apêndice A — Estrutura de pastas alvo

```
aapel-cooperativa-alimentos/
├── ARCHITECTURE.md                # este documento (fonte de verdade)
├── SYSTEM_DESIGN.md               # documento histórico
├── README.md
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # root: minimal html/body
│   ├── globals.css
│   ├── (shop)/                    # route group: customer-facing
│   │   ├── layout.tsx             # Header + Footer + CartProvider
│   │   ├── page.tsx               # homepage
│   │   ├── produtos/, cestas/, produtores/
│   │   ├── carrinho/, checkout/, conta/, sobre/
│   └── (admin)/                   # route group: admin panel
│       └── admin/
│           ├── login/             # public, full-screen
│           │   ├── page.tsx
│           │   └── actions.ts     # server action: loginAction, logoutAction
│           └── (panel)/           # auth-guarded inner group
│               ├── layout.tsx     # requireAdmin + sidebar
│               ├── page.tsx       # → redirect /admin/curadorias
│               └── curadorias/
│                   ├── page.tsx, create-form.tsx, actions.ts
│                   └── [id]/page.tsx, editor.tsx
│
├── middleware.ts                  # JWT verify + role guard for /admin/*
├── lib/
│   ├── session.ts                 # getSession, requireAdmin
│   ├── api-server.ts              # apiFetch (FastAPI HTTP client)
│   ├── utils.ts, data.ts          # (data.ts: legacy mocks; substituídos na Fase 3)
│
├── backend/                       # FastAPI
│   ├── app/
│   │   ├── main.py, config.py, database.py, dependencies.py
│   │   ├── security.py, exceptions.py
│   │   ├── schemas/               # Pydantic v2
│   │   ├── models/                # SQLModel
│   │   └── routers/
│   │       ├── auth.py, produtos.py, produtores.py, ...
│   │       └── admin/             # CRUD admin (Fase 2)
│   ├── pyproject.toml, uv.lock
│   └── requirements.txt
│
├── database/                      # Drizzle (TS-first migrations)
│   ├── schema.ts, client.ts, seed.ts
│   └── migrations/
│       ├── 0000_*.sql (geradas por drizzle-kit)
│       └── _custom/0001_food_only_trigger.sql
│
├── components/, contexts/, lib/   # frontend compartilhado
├── packages/shared/               # tipos TS compartilhados (placeholder)
│
├── compose.yaml                   # IaC: serviços base (db, api, migrate)
├── compose.dev.yaml               # IaC: overrides dev (volumes, --reload)
├── compose.prod.yaml              # IaC: overrides prod (web, caddy)
├── docker/
│   ├── api.Dockerfile             # FastAPI multi-stage (uv → python-slim)
│   ├── web.Dockerfile             # Next.js standalone + migrate target
│   └── db/init.sql                # CREATE SCHEMA analytics, audit
├── caddy/
│   └── Caddyfile                  # reverse proxy + auto-TLS
├── scripts/
│   ├── bootstrap-vps.sh           # setup inicial Ubuntu 24.04
│   ├── setup-secrets.sh           # gera /etc/aapel/secrets/*.env
│   ├── deploy.sh                  # pull + build + migrate + up
│   ├── backup.sh                  # pg_dump → Magalu Object Storage
│   └── restore.sh                 # restore desde backup
├── ops/
│   ├── aapel.service              # systemd: stack at boot
│   ├── aapel-backup.service       # systemd: backup runner
│   ├── aapel-backup.timer         # systemd: schedule 03h UTC
│   └── crontab.example
├── Makefile                       # atalhos: dev, prod-up, logs, migrate, backup, deploy
├── .env.example                   # template para dev local
├── .dockerignore
├── drizzle.config.ts
├── next.config.ts                 # output: 'standalone' (Docker)
├── package.json, pnpm-lock.yaml, tsconfig.json, postcss.config.mjs
└── LICENSE
```

---

*Fim do documento.*
