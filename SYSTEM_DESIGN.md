# System Design - AAPel Cooperativa de Alimentos

## 1. Visão Geral

### 1.1 Nome do Projeto
**AAPel** - Associação de Agricultura Familiar de Pelotas

### 1.2 Objetivo
Plataforma web que conecta agricultores familiares a consumidores conscientes, possibilitando a comercialização de produtos frescos (frutas, verduras, legumes) diretamente do campo para a mesa do consumidor, eliminando intermediários e garantindo preço justo para ambos os lados.

### 1.3 Escopo do MVP
- Catálogo de produtos organizados por categoria
- Perfil dos produtores com história e localização
- Carrinho de compras com gestão de quantities
- Checkout com pagamento offline (PIX, Dinheiro, Cartão na entrega)
- Duas opções de entrega: retirada em ponto de coleta OU entrega em domicílio
- Sistema de cestas/subscriptions (visual apenas no MVP)

### 1.4 Stack Tecnológica

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Frontend | Next.js | 15.x |
| Linguagem | TypeScript | 5.x |
| Backend API | FastAPI | 0.115.x |
| linguagem Backend | Python | 3.11+ |
| ORM | Drizzle ORM | 0.x |
| Autenticação | NextAuth.js | 5.x |
| Banco de Dados | PostgreSQL | 16.x |
| Deploy | Railway | - |

---

## 2. Arquitetura do Sistema

### 2.1 Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    RAILWAY                                          │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐       │
│  │                              NEXT.JS (Port 3000)                         │       │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │       │
│  │  │   Frontend     │    │   BFF Layer     │    │  NextAuth.js   │    │       │
│  │  │  (App Router)  │    │ (API Routes)    │    │   (Auth)       │    │       │
│  │  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    │       │
│  │           │                      │                      │              │       │
│  │           │    Server Actions   │                      │              │       │
│  │           └──────────────────┬───┴──────────────────────┘              │       │
│  │                              │                                           │       │
│  │                              ▼                                           │       │
│  │                    ┌─────────────────┐                                 │       │
│  │                    │ Internal Proxy  │                                 │       │
│  │                    │  /api → :8000   │                                 │       │
│  │                    └────────┬────────┘                                 │       │
│  └─────────────────────────���───┼───────────────────────────────────────────┘       │
│                                │                                                    │
│                                │ HTTP/REST                                          │
│                                ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐       │
│  │                           FASTAPI (Port 8000)                            │       │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │       │
│  │  │                         Routers                                 │    │       │
│  │  │  /produtos    /produtores    /pedidos    /cestas    /usuarios   │    │       │
│  │  └─────────────────────────────────────────────────────────────────┘    │       │
│  │                              │                                            │       │
│  │                              ▼                                            │       │
│  │                    ┌─────────────────┐                                    │       │
│  │                    │   Drizzle ORM  │                                    │       │
│  │                    └────────┬────────┘                                    │       │
│  │                             │                                             │       │
│  └─────────────────────────────┼─────────────────────────────────────────────┘       │
│                                │                                                   │
│                                ▼                                                   │
│                    ┌─────────────────────┐                                       │
│                    │    PostgreSQL       │                                       │
│                    │   (Supabase/RS)     │                                       │
│                    └─────────────────────┘                                       │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Comunicação entre Serviços

| Origem | Destino | Protocolo | Descrição |
|--------|---------|------------|------------|
| Browser | Next.js | HTTP/HTTPS | Requisições do frontend |
| Next.js (BFF) | FastAPI | HTTP (internal) | Proxy para endpoints de negócio |
| FastAPI | PostgreSQL | TCP (pg) | Queries e transações |
| Browser | NextAuth | HTTP/Session | Autenticação |

### 2.3 Fluxo de Dados - Checkout

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Cliente │     │ Carrinho ���     │ Checkout │     │  FastAPI │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │               │               │               │               │
     │ Seleciona    │               │               │               │
     ├─────────────>│               │               │               │
     │               │               │               │               │
     │               │ Finaliza     │               │               │
     │               ├─────────────>│               │               │
     │               │               │ Valida dados │               │
     │               │               ├─────────────>│               │
     │               │               │               │ Insere        │
     │               │               │               ├─────────────>│
     │               │               │               │               │
     │               │               │ Retorna ID    │               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │  Confirmação  │               │               │               │
     │<──────────────┴───────────────┴───────────────┘               │
     │               │               │               │               │
```

---

## 3. Modelo de Dados

### 3.1 Diagrama Entidade-Relacionamento

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      User        │       │    Producer      │       │     Category     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ email (UQ)       │       │ name             │       │ name             │
│ name             │       │ description      │       └────────┬─────────┘
│ password_hash    │       │ story            │                │
│ role             │◄──────│ location         │                │
│ created_at       │ 1:N   │ image_url        │       ┌───────┴────────┐
│ updated_at       │       │ cover_image_url  │       │                │
└────────┬─────────┘       │ since            │       │                │
         │                │ active           │       ▼                ▼
         │                │ created_at       │  ┌──────────────────────────┐
         │                │ updated_at       │  │        Product           │
         │                └──────────────────┘  ├──────────────────────────┤
         │                                         │ id (PK)                │
         │              1:N                        │ name                   │
         │                                        │ description            │
         │                                        │ price                  │
         │           ┌──────────────────┐          │ image_url              │
         │           │      Order      │          │ stock                  │
         │           ├──────────────────┤          │ unit                   │
         │   1:N     │ id (PK)          │    N:1  │ organic                │
         │───────────│ status           │◄────────│ available              │
         │           │ delivery_method │          │ seasonal               │
         │           │ delivery_date    │          │ producer_id (FK)       │
         │           │ delivery_address │         │ category_id (FK)       │
         │           │ collection_point │          │ created_at             │
         │           │ total_amount     │          │ updated_at             │
         │ 1:N       │ payment_method   │          └───────────┬──────────┘
         │───────────│ payment_status   │                      │
         │           │ customer_id (FK) │           ┌─────────┴────────┐
         │           │ created_at       │           │                  │
         │           │ updated_at       │           │        N:N        │
         │           └────────┬─────────┘           │                  │
         │                    │                     ▼                  ▼
         │                    │          ┌──────────────────┐ ┌─────────────┐
         │           ┌────────┴─────────┐│   OrderItem      │ │CollectionPt │
         │           │                  │├──────────────────┤ ├─────────────┤
         │           ▼                  ││ id (PK)         │ │ id (PK)    │
         │ ┌──────────────────┐        ││ order_id (FK)   │ │ name       │
         │ │    Basket        │        ││ product_id (FK) │ │ address    │
         │ ├──────────────────┤        ││ quantity        │ │ city       │
         │ │ id (PK)          │        ││ price_at_time   │ │ state      │
         │ │ name             │        ││ producer_id     │ │ active     │
         │ │ description      │        │└──────────────────┘ └─────────────┘
         │ │ price            │        │
         │ │ image_url       │        │
         │ │ frequency       │        │
         │ │ serves         │        │
         │ │ active         │        │
         │ └──────────────────┘        │
         │           │                 │
         │           │ 1:N             │
         │           │                 │
         │           ▼                 │
         │ ┌──────────────────┐         │
         │ │  BasketItem      │         │
         │ ├──────────────────┤         │
         │ │ basket_id (FK)   │         │
         │ │ product_id (FK) │         │
         │ │ quantity        │         │
         │ │ category_type   │         │
         │ └──────────────────┘         │
         │                              │
         └─��─��──────────────────────────┘
```

### 3.2 Schema Drizzle (database/schema.ts)

```typescript
// Usuários (clientes, produtores, admins)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('CUSTOMER'), // CUSTOMER, PRODUCER, ADMIN
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Produtores (agricultores familiares)
export const producers = pgTable('producers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // Usuário autenticado do produtor
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  story: text('story'),
  location: varchar('location', { length: 255 }), // "Pelotas, RS"
  imageUrl: varchar('image_url', { length: 500 }),
  coverImageUrl: varchar('cover_image_url', { length: 500 }),
  specialties: json('specialties').$type<string[]>(),
  since: integer('since'), // Ano de fundação
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categorias de produtos
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // frutas, verduras, legumes
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
});

// Produtos
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  stock: integer('stock').default(0),
  unit: varchar('unit', { length: 50 }).notNull(), // kg, maço, unidade, bandeja
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  producerId: uuid('producer_id').references(() => producers.id).notNull(),
  organic: boolean('organic').default(false),
  available: boolean('available').default(true),
  seasonal: boolean('seasonal').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Points de coleta para retirada
export const collectionPoints = pgTable('collection_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  description: text('description'),
  schedule: varchar('schedule', { length: 255 }), // "Terças e sextas, 8h-18h"
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pedidos
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Identificador público (ex: AAP-2024-00001)
  publicId: varchar('public_id', { length: 20 }).notNull().unique(),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'), 
    // PENDING, CONFIRMED, COLLECTED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  deliveryMethod: varchar('delivery_method', { length: 30 }).notNull(), 
    // PICKUP, HOME_DELIVERY
  deliveryDate: timestamp('delivery_date').notNull(),
  
  // Para entrega em domicílio
  deliveryAddress: text('delivery_address'),
  deliveryCity: varchar('delivery_city', { length: 100 }),
  deliveryState: varchar('delivery_state', { length: 2 }),
  deliveryZipCode: varchar('delivery_zip_code', { length: 10 }),
  
  // Para retirada em ponto de coleta
  collectionPointId: uuid('collection_point_id').references(() => collectionPoints.id),
  
  // Pagamento (offline)
  paymentMethod: varchar('payment_method', { length: 30 }).notNull(), // PIX, CASH, CARD
  paymentStatus: varchar('payment_status', { length: 30 }).default('PENDING'), 
    // PENDING, PAID, REFUNDED
  
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0'),
  
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Itens do pedido
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  producerId: uuid('producer_id').references(() => producers.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cestas (para assinaturas - visualização no MVP)
export const baskets = pgTable('baskets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  frequency: varchar('frequency', { length: 20 }).notNull(), // WEEKLY, BIWEEKLY, MONTHLY
  serves: varchar('serves', { length: 50 }), // "2-3 pessoas"
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Itens que compõe uma cesta
export const basketItems = pgTable('basket_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  basketId: uuid('basket_id').references(() => baskets.id, { onDelete: 'cascade' }).notNull(),
  categoryType: varchar('category_type', { length: 20 }).notNull(), // FRUTAS, VERDURAS, LEGUMES
  itemCount: integer('item_count').notNull(), // Quantos itens dessa categoria
  description: varchar('description', { length: 255 }), // "3 tipos de frutas"
});

// Assinaturas de cestas (futuro)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  basketId: uuid('basket_id').references(() => baskets.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE, PAUSED, CANCELLED
  frequency: varchar('frequency', { length: 20 }).notNull(),
  nextDeliveryDate: timestamp('next_delivery_date').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 30 }).notNull(),
  collectionPointId: uuid('collection_point_id').references(() => collectionPoints.id),
  deliveryAddress: text('delivery_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3.3 Glossário de Entidades

| Entidade | Descrição | Relaciones |
|----------|-----------|------------|
| **User** | Usuário do sistema (cliente, produtor, admin) | 1:N com Orders |
| **Producer** | Produtor agrícola familiar | 1:N com Products |
| **Category** | Categoria de produto (frutas, verduras, legumes) | 1:N com Products |
| **Product** | Produto agrícola individual | Pertence a Producer e Category |
| **CollectionPoint** | Local físico para retirada | 1:N com Orders |
| **Order** | Pedido realizado por cliente | N:1 com User, 1:N com OrderItems |
| **OrderItem** | Item específico dentro de um pedido | N:1 com Product |
| **Basket** | Configuração de cesta semanal | 1:N com BasketItems |
| **Subscription** | Assinatura ativa de cesta (futuro) | N:1 com User e Basket |

---

## 4. Especificação da API (FastAPI)

### 4.1 Estrutura de Endpoints

```
/api
├── /produtos
│   ├── GET    /                     → Listar produtos (com filtros)
│   ├── GET    /{id}                 → Detalhar produto
│   │                                     
├── /produtores
│   ├── GET    /                     → Listar produtores
│   ├── GET    /{id}                 → Detalhar produtor
│   ├── GET    /{id}/produtos        → Produtos de um produtor
│   │                                     
├── /categorias
│   ├── GET    /                     → Listar categorias
│   │                                     
├── /cestas
│   ├── GET    /                     → Listar cestas disponíveis
│   ├── GET    /{id}                 → Detalhar cesta
│   │                                     
├── /pontos-coleta
│   ├── GET    /                     → Listar pontos de coleta
│   │                                     
├── /pedidos
│   ├── GET    /                     → Listar pedidos (requer auth)
│   ├── GET    /{id}                → Detalhar pedido (requer auth)
│   ├── POST   /                     → Criar novo pedido
│   │                                     
└── /auth
    ├── POST   /register             → Criar conta
    └── POST   /login                → Login (retorna token)
```

### 4.2 Detalhamento dos Endpoints

#### 4.2.1 Produtos

**GET /api/produtos**
```http
GET /api/produtos?categoria=frutas&disponiveis=true&produtor_id=xxx
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|----------|
| categoria | string | Não | Filtrar por categoria |
| disponiveis | boolean | Não | Filtrar apenas produtos com stock |
| produtor_id | uuid | Não | Filtrar por produtor |
| busca | string | Não | Busca por nome |
| organico | boolean | Não | Filtrar apenas orgânicos |

```json
{
  "data": [
    {
      "id": " uuid",
      "name": "Morango Orgânico",
      "description": "Morangos frescos...",
      "price": "18.90",
      "unit": "bandeja 300g",
      "imageUrl": "https://...",
      "stock": 50,
      "organic": true,
      "available": true,
      "seasonal": true,
      "category": { "id": "...", "name": "frutas" },
      "producer": {
        "id": "...",
        "name": "Fazenda Verde Vale",
        "location": "Canguçu, RS"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

#### 4.2.2 Criar Pedido

**POST /api/pedidos**

```http
POST /api/pedidos
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "deliveryMethod": "HOME_DELIVERY",  // ou "PICKUP"
  "deliveryDate": "2024-01-15T00:00:00Z",
  
  // Se HOME_DELIVERY:
  "deliveryAddress": "Rua das Flores, 123",
  "deliveryCity": "Pelotas",
  "deliveryState": "RS",
  "deliveryZipCode": "96020-000",
  
  // Se PICKUP:
  "collectionPointId": "uuid-do-ponto",
  
  "paymentMethod": "PIX",  // PIX, CASH, CARD
  "items": [
    { "productId": "uuid-produto-1", "quantity": 2 },
    { "productId": "uuid-produto-2", "quantity": 1 }
  ],
  "notes": "Por favor, deixar na portaria"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid-novo-pedido",
    "publicId": "AAP-2024-00001",
    "status": "PENDING",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryDate": "2024-01-15T00:00:00Z",
    "totalAmount": "45.80",
    "deliveryFee": "12.00",
    "paymentMethod": "PIX",
    "paymentStatus": "PENDING",
    "items": [...],
    "createdAt": "2024-01-10T14:30:00Z"
  }
}
```

### 4.3 Validações de Negócio

| Regra | Descrição |
|-------|----------|
| **Estoque** | Não permitir pedido se produto sem stock |
| **Quantidade mín/max** | Limitar quantity por produto (1-99) |
| **Data de entrega** | Apenas datas futuras, min 2 dias úteis |
| **Valor mín. pedido** | Valor mínimo de R$ 30,00 para entrega em casa |
| **CEP válido** | Validar formato do CEP para entrega |
| **Pagamento** | Apenas offline (sem processamento real) |

---

## 5. Fluxos Principais

### 5.1 Fluxo de Compra (Checkout)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               FLUXO DE COMPRA                                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. CATÁLOGO
   ├── Usuário acessa /produtos
   ├── Lista produtos via API GET /api/produtos
   ├── Filtros: categoria, busca, orgânico
   └── Ordenação: preço, nome, recent

2. CARRINHO
   ├── Usuário adiciona produto (front-end)
   ├── Carrinho persiste em localStorage/session
   └── Pode editar quantities ou remover

3. CHECKOUT
   ├── Usuário acessa /checkout
   ├── Preenche dados contato (se não logado, cria conta)
   ├── Escolhe método entrega:
   │   ├── PICKUP → seleciona ponto de coleta
   │   └── HOME → preenche endereço
   ├── Escolhe forma pagamento (PIX/Dinheiro/Cartão)
   ├── Revisa pedido
   └── Confirma → POST /api/pedidos

4. CONFIRMAÇÃO
   ├── API cria pedido com status PENDING
   ├── Retorna publicId (AAP-XXXX)
   ├── Frontend exibe tela de sucesso
   └── Pedido aparece no histórico do cliente
```

### 5.2 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            FLUXO DE AUTENTICAÇÃO                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. REGISTRO (POST /api/auth/register)
   ├── Usuário preenche: nome, email, senha
   ├── API valida email único
   ├── Criptografa senha com BCrypt
   ├── Cria User com role CUSTOMER
   └── Retorna token JWT

2. LOGIN (POST /api/auth/login)
   ├── Usuário fornece email + senha
   ├── API busca User por email
   ├── Compara senha com BCrypt
   └── Gera token JWT (NextAuth)

3. PROTEÇÃO DE ROTAS
   ├── /carrinho → público
   ├── /checkout → público (ou require auth)
   ├── /conta → requer auth
   ├── /pedidos → requer auth
   └── /api/pedidos → requer auth (Bearer token)
```

### 5.3 Fluxo de Entrega

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO DE ENTREGA                                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

                    PEDIDO
                      │
          ┌───────────┴───────────┐
          │                       │
      PICKUP                HOME_DELIVERY
          │                       │
          ▼                       ▼
   escolhe ponto          preenche endereço
   de coleta              completo
          │                       │
          │        ┌──────────────┴──────────────┐
          │        │                               │
          ▼        ▼                               ▼
    ┌──────────┐                    ┌──────────────────────┐
    │ PENDING  │                    │     PENDING          │
    └────┬─────┘                    └──────────┬─────────────┘
         │                                     │
         │ (confirmação)                       │ (confirmação)
         ▼                                     ▼
    ┌──────────┐                    ┌──────────────────────┐
    │CONFIRMED │───────────────────▶│    CONFIRMED         │
    └────┬─────┘                    └──────────┬─────────────┘
         │                                     │
         │                                     │ (dia entrega)
         │                                     ▼
         │                           ┌──────────────────────┐
         │                           │   OUT_FOR_DELIVERY   │
         │                           └──────────┬─────────────┘
         │                                      │
         │                             ┌────────┴────────┐
         │                             │                 │
         │                             ▼                 ▼
         │                        ┌─────────┐      ┌───────────┐
         │                        │DELIVERED │      │ COLLECTED │
         │                        └────┬─────┘      └─────┬─────┘
         │                             │                 │
         │                             └────────┬────────┘
         │                                      │
         │                                      ▼
         │                            ┌──────────────────┐
         └───────────────────────────▶│   COMPLETED      │
                                       └──────────────────┘

STATUS: PENDING → CONFIRMED → (OUT_FOR_DELIVERY | COLLECTED) → COMPLETED | CANCELLED
```

---

## 6. Infraestrutura

### 6.1 Railway Configuration

#### Services

| Service | Type | Spec | Cost |
|---------|------|------|------|
| **aapel-web** | Web | 256MB RAM, 0.5 vCPU | ~$5/mês |
| **aapel-api** | Web | 256MB RAM, 0.5 vCPU | ~$5/mês |
| **aapel-db** | Database | PostgreSQL 128MB | ~$5/mês |

**Total estimado:** ~$15/mês

#### Variáveis de Ambiente

**Frontend (.env)**
```env
# App
NEXT_PUBLIC_API_URL=http://aapel-api.railway.internal:8000
NEXT_PUBLIC_APP_URL=http://aapel-web.railway.internal:3000

# Auth (NextAuth)
NEXTAUTH_SECRET=sua-key-secreta-aqui-min-32-caracteres
NEXTAUTH_URL=http://aapel-web.railway.internal:3000
```

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:password@aapel-db.railway.internal:5432/aapel

# App
APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=false

# Auth
SECRET_KEY=sua-key-secreta-python
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60*24*7  # 7 dias
```

### 6.2 Estrutura de Pastas

```
aapel-cooperativa-alimentos/
├── app/                          # Next.js App Router (Frontend + BFF)
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── (shop)/                   # rotas de compras
│   │   ├── produtos/
│   │   ├── cestas/
│   │   ├── produtores/
│   │   ├── carrinho/
│   │   └── checkout/
│   ├── conta/                    # Área do cliente (requer auth)
│   │   ├── pedidos/
│   │   └──/
│   ├── api/                      # BFF - Next.js API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── produtos/            # Proxy para FastAPI
│   │   ├── pedidos/              # Proxy para FastAPI
│   │   └──/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py               # Entry point
│   │   ├── config.py             # Configurações
│   │   ├── router.py             # Router principal
│   │   ├── dependencies.py       # Dependencies FastAPI
│   │   │
│   │   ├── schemas/              # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   └──/
│   │   │
│   │   ├── models/               # Models SQLAlchemy (não usado, usando Drizzle)
│   │   │
│   │   └── routers/              # Endpoints
│   │       ├── auth.py
│   │       ├── produtos.py
│   │       ├── produtores.py
│   │       ├── pedidos.py
│   │       └──/
│   │
│   ├── db/
│   │   ├── connection.py         # Conexão Drizzle
│   │   ├── schema.ts             # Schema Drizzle
│   │   └── migrations/           # Alembic/drizzle migrations
│   │
│   ├── .env
│   ├── requirements.txt
│   ├── alembic.ini               # Config Alembic
│   └── pyproject.toml
│
├── packages/
│   └── shared/                   # Tipos compartilhados
│       ├── src/
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
│
├── components/                   # Componentes React compartilhados
│   ├── ui/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── layout/
│
├── contexts/                    # React Contexts
│   └── cart-context.tsx
│
├── lib/                         # Utilitários
│   ├── utils.ts
│   ├── api.ts                   # Fetch wrapper para API
│   └── constants.ts
│
├── prisma/                      # Schema Prisma (referência, manter?)
│   └── schema.prisma
│
├── .env.example
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
└── SYSTEM_DESIGN.md              # Este documento
```

---

## 7. Roadmap de Implementação

### Fase 1: Backend Fundamental ⚡
**Estimativa:** 2-3 semanas

| Task | Descrição | Prioridade |
|------|----------|------------|
| 1.1 | Setup projeto FastAPI + Drizzle | 🔴 Alta |
| 1.2 | Configurar PostgreSQL no Railway | 🔴 Alta |
| 1.3 | Criar schema do banco | 🔴 Alta |
| 1.4 | Seed dados iniciais (produtores, categorias, productos) | 🔴 Alta |
| 1.5 | Implementar endpoints /produtos e /produtores | 🔴 Alta |
| 1.6 | Implementar endpoints /categorias | 🟡 Média |
| 1.7 | Implementar endpoints /cestas | 🟡 Média |
| 1.8 | Implementar endpoints /pontos-coleta | 🟡 Média |
| 1.9 | Deploy backend no Railway | 🔴 Alta |
| 1.10 | Testes de integração básicos | 🟡 Média |

### Fase 2: Integração Frontend ⚡
**Estimativa:** 2 semanas

| Task | Descrição | Prioridade |
|------|----------|------------|
| 2.1 | Substituir dados mock por chamadas API | 🔴 Alta |
| 2.2 | Criar lib/api.ts wrapper | 🔴 Alta |
| 2.3 | Implementar listagem de produtos com filtros | 🔴 Alta |
| 2.4 | Implementar detail de produto | 🟡 Média |
| 2.5 | Implementar listagem de produtores | 🟡 Média |
| 2.6 | Implementar detail de produtor | 🟡 Média |
| 2.7 | Listagem de cestas (dados mock ou API) | 🟢 Baixa |
| 2.8 | Deploy frontend no Railway | 🔴 Alta |

### Fase 3: Checkout Real ⚡
**Estimativa:** 2-3 semanas

| Task | Descrição | Prioridade |
|------|----------|------------|
| 3.1 | Implementar autenticação (NextAuth.js) | 🔴 Alta |
| 3.2 | Endpoint POST /api/pedidos (FastAPI) | 🔴 Alta |
| 3.3 | Fluxo checkout completo com dados reais | 🔴 Alta |
| 3.4 | Validações de negócio (estoque, mínimo) | 🔴 Alta |
| 3.5 | Tela de sucesso com ID do pedido | 🔴 Alta |
| 3.6 | Persistir carrinho | 🟡 Média |
| 3.7 |的历史órico de pedidos do cliente | 🟡 Média |

### Fase 4: Admin e Extras 🛠️
**Estimativa:** 3-4 semanas

| Task | Descrição | Prioridade |
|------|----------|------------|
| 4.1 | Dashboard admin básico | 🟡 Média |
| 4.2 | Gestão de pedidos (listar, alterar status) | 🟡 Média |
| 4.3 | Gestão de produtos (CRUD) | 🟡 Média |
| 4.4 | Notificações (email/webhook) | 🟢 Baixa |
| 4.5 | Subscription de cestas (MVP) | 🟢 Baixa |

### Cronograma Visual

```
Semana:    1   2   3   4   5   6   7   8   9  10  11  12
            │   │   │   │   │   │   │   │   │   │   │   │
Fase 1  ████████████████
Fase 2              ████████████
Fase 3                      ███████████████
Fase 4                                  ████████████████
```

---

## 8. Decisões de Design e Trade-offs

### 8.1 Por que FastAPI ao invés de NestJS?

| Aspecto | FastAPI | NestJS |
|---------|---------|--------|
| Curva de aprendizado | Baixa (Python) | Média (TypeScript) |
| Performance | Excelente | Excelente |
| Documentação automática | ✅ OpenAPI built-in |，需要 libs extras |
| Validação | Pydantic nativo | Class-validator |
| Seu background | Backend dev Python ✅ | TypeScript |

**Decisão:** FastAPI - alinhado com sua experiência como dev backend Python.

### 8.2 Por que Next.js API Routes como BFF?

| Aspecto | BFF (Next.js) | Chamada direta (Browser→FastAPI) |
|---------|--------------|-----------------------------------|
| CORS | Não necessário | Precisa configurar CORS |
| Segurança | Token fica no server | Exposição maior |
| Cache | Server-side caching | Limitado |
| Consistência | Uma origem | Múltiplas origins |

**Decisão:** BFF - encapsula comunicação, facilita cache e reduz exposição da API.

### 8.3 Por que Drizzle ao invés de Prisma (Python)?

| Aspecto | Drizzle | Prisma (prisma-python) | SQLAlchemy |
|---------|---------|------------------------|------------|
| Type-safety | ✅ Total | ⚠️ Limitado | ⚠️ Manual |
| Performance | Excelente | Boa | Excelente |
|undle size | ~30kb | ~200kb | - |
| Similar ao Prisma (JS) | ✅ | ❌ | ❌ |

**Decisão:** Drizzle - mantém consistência mental entre frontend e backend, leve, type-safe.

### 8.4 Por que NextAuth.js para auth?

| Aspecto | NextAuth.js | Supabase Auth | Clerk |
|---------|------------|---------------|-------|
| Custo | Grátis (self-hosted) | Grátis até 50k MAU | Grátis até 10k MAU |
| Flexibilidade | Total | Média | Baixa |
| Integração | Nativa Next.js | Extra | Extra |
| Controle | Você tudo | Partial | Poco |

**Decisão:** NextAuth.js - máximo controle, gratuito 100%, você não depende de provider externo.

### 8.5 Trade-off: Checkout Offline

| Aspecto | Offline (atual) | Pagamento real (Stripe/MercadoPago) |
|---------|--------------|--------------------------------------|
| Complexidade | Baixa | Alta (webhooks, conciliação) |
| Custo | Zero | Taxas por transação |
| Risco | Zero | Chargebacks, fraude |
| MVP validado | Sim, mas sem pagamento real | Sim, pagamento completo |

**Decisão:** MVP com pagamento offline, adicionar pagamento real depois se necessário.

### 8.6 Por que não Tenant (Schema original)?

O schema original tinha `Tenant` para suportar múltiplas cooperativas. Para AAPel:

| Aspecto | Com Tenant | Sem Tenant |
|---------|-----------|------------|
| Complexidade DB | Alta (relacionamentos) | Baixa |
| Schema inicial | Grande | Simples |
| Flexibilidade futura | Permite multi-cooperativa | Limitado |
| MVP time | Maior | Menor |

**Decisão:** Simplificar - manter `Producer` diretamente, não `Tenant`. Mais simples para começar.

---

## 9. Riscos e Mitigações

### 9.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|----------|------------|
| **Performance DB** | Alta | Alto | Indexar consultas, cache Redis (futuro) |
| **Conexão BFF→API** | Média | Alto | Timeout configurado, retry logic |
| **Migrations em produção** | Média | Alto | Blue-green deploy, backup antes |
| **Auth token expira** | Média | Médio | Refresh token automático |
| **Stock race condition** | Baixa | Médio | Transações DB, lock |

### 9.2 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|----------|------------|
| **Baixa adoção** | Alta | Alto | MVP focado em UX, marketing |
| **Produtores não atualizam estoque** | Alta | Médio | Admin simples para produtores |
| **Pedidos fraudados** | Baixa | Médio | Pagamento offline reduz risco |
| **Entregas problemáticas** | Média | Médio | Pontos de coleta organizados |

### 9.3 Riscos Operacionais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|----------|------------|
| **Custo Railway aumentar** | Média | Médio | Monitorar uso, otimizar queries |
| **Downtime** | Baixa | Alto | Health checks, alertas |
| **Perda de dados** | Baixa | Alto | Backups automáticos PostgreSQL |

---

## 10. Próximos Passos Imediatos

1. **Configurar Railway** - criar os 3 serviços (web, api, db)
2. **Fork/clonar projeto base** - você já tem o código
3. **Criar pasta `backend/`** - migrar de apps/api
4. **Setup FastAPI com Drizzle** - schema inicial
5. **Primeiro deploy** - verificar se compila

---

## Referências e Links Úteis

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [NextAuth.js](https://next-auth.js.org/)
- [Railway docs](https://docs.railway.app/)
- [Next.js 15](https://nextjs.org/docs)

---

*Documento gerado em: 2024*
*Versão: 1.0*