/**
 * AAPel — Seed script
 *
 * Wipes the database (TRUNCATE ... CASCADE) and re-populates with realistic
 * data for development. Idempotent in the sense that re-running yields the
 * same final state, but DESTRUCTIVE — never run against production.
 *
 * Usage: pnpm db:seed
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./client";
import * as s from "./schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@aapel.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin AAPel";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function clean() {
  console.log("🧹 Truncating tables...");
  await db.execute(sql`
    TRUNCATE TABLE
      basket_fulfillments,
      order_items,
      orders,
      basket_curation_slot_options,
      basket_curations,
      basket_slots,
      basket_templates,
      products,
      categories,
      producers,
      delivery_zone_neighborhoods,
      delivery_zones,
      collection_points,
      consent_history,
      users
    RESTART IDENTITY CASCADE
  `);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns next Saturday at 08:00 local. */
function nextSaturday(): Date {
  const today = new Date();
  const daysUntilSaturday = ((6 - today.getDay() + 7) % 7) || 7;
  const delivery = new Date(today);
  delivery.setDate(today.getDate() + daysUntilSaturday);
  delivery.setHours(8, 0, 0, 0);
  return delivery;
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoFor(d: Date): string {
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Catalog seeders
// ---------------------------------------------------------------------------

async function seedCategories() {
  console.log("📦 Categories...");
  const rows = await db
    .insert(s.categories)
    .values([
      { name: "frutas", description: "Frutas frescas da estação" },
      { name: "verduras", description: "Folhas e ervas frescas" },
      { name: "legumes", description: "Raízes, tubérculos e frutos vegetais" },
      { name: "artesanato", description: "Produtos artesanais e não-alimentos" },
    ])
    .returning();
  return Object.fromEntries(rows.map((r) => [r.name, r.id])) as Record<
    "frutas" | "verduras" | "legumes" | "artesanato",
    string
  >;
}

async function seedProducers() {
  console.log("👨‍🌾 Producers...");
  const rows = await db
    .insert(s.producers)
    .values([
      {
        name: "Sítio Boa Esperança",
        description: "Agricultura familiar orgânica há 3 gerações",
        story:
          "O Sítio Boa Esperança nasceu do sonho do meu avô, João, que chegou à região nos anos 50. Desde então, três gerações da nossa família cultivam a terra com respeito e dedicação. Acreditamos que alimentos saudáveis vêm de uma terra saudável, por isso praticamos agricultura orgânica certificada há mais de 15 anos.",
        location: "Pelotas, RS",
        imageUrl:
          "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=400&fit=crop",
        coverImageUrl:
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop",
        specialties: ["Alface", "Rúcula", "Tomate"],
        since: 1958,
      },
      {
        name: "Fazenda Verde Vale",
        description: "Especialistas em frutas da estação",
        story:
          "A Fazenda Verde Vale é conhecida pelas frutas mais doces da região. Nossa família se dedica ao cultivo de frutas há mais de 40 anos, sempre respeitando os ciclos naturais e priorizando a qualidade sobre a quantidade.",
        location: "Canguçu, RS",
        imageUrl:
          "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&h=400&fit=crop",
        coverImageUrl:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=400&fit=crop",
        specialties: ["Morango", "Pêssego", "Uva"],
        since: 1982,
      },
      {
        name: "Horta da Dona Maria",
        description: "Verduras frescas colhidas diariamente",
        story:
          "Comecei a horta no quintal de casa para alimentar minha família. Hoje, com ajuda dos meus filhos e netos, cultivamos uma variedade de verduras que chegam frescas às mesas de centenas de famílias da região.",
        location: "São Lourenço do Sul, RS",
        imageUrl:
          "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=400&h=400&fit=crop",
        coverImageUrl:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=400&fit=crop",
        specialties: ["Couve", "Espinafre", "Cebolinha"],
        since: 1995,
      },
    ])
    .returning();
  return Object.fromEntries(rows.map((r) => [r.name, r.id])) as Record<string, string>;
}

async function seedProducts(
  cat: Record<string, string>,
  prod: Record<string, string>,
) {
  console.log("🥬 Products...");
  return await db
    .insert(s.products)
    .values([
      // Frutas — Fazenda Verde Vale
      {
        name: "Morango Orgânico",
        description: "Morangos frescos e doces, cultivados sem agrotóxicos",
        price: "18.90",
        unit: "bandeja 300g",
        imageUrl:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&h=600&fit=crop",
        stock: 50,
        categoryId: cat.frutas,
        producerId: prod["Fazenda Verde Vale"],
        productType: "FOOD",
        organic: true,
        premium: true,
        seasonal: true,
      },
      {
        name: "Banana Prata",
        description: "Bananas maduras no ponto, ideais para consumo",
        price: "7.90",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&h=600&fit=crop",
        stock: 80,
        categoryId: cat.frutas,
        producerId: prod["Fazenda Verde Vale"],
      },
      {
        name: "Laranja Valência",
        description: "Laranjas suculentas, perfeitas para suco",
        price: "6.50",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&h=600&fit=crop",
        stock: 120,
        categoryId: cat.frutas,
        producerId: prod["Fazenda Verde Vale"],
        seasonal: true,
      },
      {
        name: "Maçã Fuji",
        description: "Maçãs crocantes e saborosas da serra gaúcha",
        price: "12.90",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop",
        stock: 60,
        categoryId: cat.frutas,
        producerId: prod["Fazenda Verde Vale"],
      },
      // Verduras — Sítio Boa Esperança & Horta da Dona Maria
      {
        name: "Alface Crespa Orgânica",
        description: "Alface fresca, crocante e cultivada sem agrotóxicos",
        price: "4.50",
        unit: "unidade",
        imageUrl:
          "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&h=600&fit=crop",
        stock: 100,
        categoryId: cat.verduras,
        producerId: prod["Sítio Boa Esperança"],
        organic: true,
      },
      {
        name: "Rúcula Orgânica",
        description: "Rúcula fresca com sabor levemente picante",
        price: "5.00",
        unit: "maço",
        imageUrl:
          "https://images.unsplash.com/photo-1506807803488-8eafc15316c7?w=600&h=600&fit=crop",
        stock: 70,
        categoryId: cat.verduras,
        producerId: prod["Sítio Boa Esperança"],
        organic: true,
        premium: true,
      },
      {
        name: "Couve Manteiga",
        description: "Couve fresca, folhas macias e nutritivas",
        price: "4.00",
        unit: "maço",
        imageUrl:
          "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=600&h=600&fit=crop",
        stock: 90,
        categoryId: cat.verduras,
        producerId: prod["Horta da Dona Maria"],
      },
      {
        name: "Espinafre Orgânico",
        description: "Espinafre rico em ferro e vitaminas",
        price: "6.00",
        unit: "maço",
        imageUrl:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&h=600&fit=crop",
        stock: 50,
        categoryId: cat.verduras,
        producerId: prod["Horta da Dona Maria"],
        organic: true,
        premium: true,
      },
      // Legumes — mistura de produtores
      {
        name: "Tomate Italiano",
        description: "Tomates firmes, ideais para molhos e saladas",
        price: "9.90",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1546470427-227c7369a9b8?w=600&h=600&fit=crop",
        stock: 80,
        categoryId: cat.legumes,
        producerId: prod["Sítio Boa Esperança"],
        seasonal: true,
      },
      {
        name: "Cenoura Orgânica",
        description: "Cenouras doces e crocantes, ricas em betacaroteno",
        price: "8.50",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=600&fit=crop",
        stock: 70,
        categoryId: cat.legumes,
        producerId: prod["Sítio Boa Esperança"],
        organic: true,
        premium: true,
      },
      {
        name: "Batata Inglesa",
        description: "Batatas versáteis para fritar, assar ou cozinhar",
        price: "6.90",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1518977676601-b53f82eba7c2?w=600&h=600&fit=crop",
        stock: 100,
        categoryId: cat.legumes,
        producerId: prod["Horta da Dona Maria"],
      },
      {
        name: "Abobrinha Verde",
        description: "Abobrinhas frescas, ótimas para refogados",
        price: "7.50",
        unit: "kg",
        imageUrl:
          "https://images.unsplash.com/photo-1563252722-6434563a985d?w=600&h=600&fit=crop",
        stock: 60,
        categoryId: cat.legumes,
        producerId: prod["Sítio Boa Esperança"],
        seasonal: true,
      },
      // Artesanato (CRAFT) — não pode entrar em cestas
      {
        name: "Sabonete Artesanal de Lavanda",
        description: "Sabonete feito à mão com óleo essencial de lavanda local",
        price: "14.90",
        unit: "unidade",
        imageUrl:
          "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&h=600&fit=crop",
        stock: 30,
        categoryId: cat.artesanato,
        producerId: prod["Sítio Boa Esperança"],
        productType: "CRAFT",
      },
      {
        name: "Geleia Caseira de Pêssego",
        description: "Geleia artesanal com frutas da fazenda, sem conservantes",
        price: "22.00",
        unit: "pote 250g",
        imageUrl:
          "https://images.unsplash.com/photo-1597528380403-3beae5da4b71?w=600&h=600&fit=crop",
        stock: 25,
        categoryId: cat.artesanato,
        producerId: prod["Fazenda Verde Vale"],
        productType: "CRAFT",
      },
    ])
    .returning();
}

// ---------------------------------------------------------------------------
// Logistics seeders
// ---------------------------------------------------------------------------

async function seedDeliveryZones() {
  console.log("🚚 Delivery zones...");
  const zones = await db
    .insert(s.deliveryZones)
    .values([
      {
        name: "Centro",
        description: "Centro histórico e bairros próximos",
        deliveryFee: "8.00",
        minimumOrderValue: "0.00",
        estimatedMinutes: 30,
      },
      {
        name: "Fragata",
        description: "Bairro Fragata e adjacências",
        deliveryFee: "12.00",
        minimumOrderValue: "30.00",
        estimatedMinutes: 45,
      },
      {
        name: "Três Vendas",
        description: "Bairro Três Vendas",
        deliveryFee: "12.00",
        minimumOrderValue: "30.00",
        estimatedMinutes: 45,
      },
      {
        name: "Areal",
        description: "Bairro Areal",
        deliveryFee: "15.00",
        minimumOrderValue: "40.00",
        estimatedMinutes: 50,
      },
      {
        name: "Laranjal",
        description: "Balneário do Laranjal e Z3",
        deliveryFee: "20.00",
        minimumOrderValue: "50.00",
        estimatedMinutes: 60,
      },
    ])
    .returning();

  const byName = Object.fromEntries(zones.map((z) => [z.name, z.id]));

  await db.insert(s.deliveryZoneNeighborhoods).values([
    { deliveryZoneId: byName["Centro"], neighborhood: "Centro" },
    { deliveryZoneId: byName["Centro"], neighborhood: "Porto" },
    { deliveryZoneId: byName["Centro"], neighborhood: "Centro Histórico" },
    { deliveryZoneId: byName["Fragata"], neighborhood: "Fragata" },
    { deliveryZoneId: byName["Fragata"], neighborhood: "Cohab Tablada" },
    { deliveryZoneId: byName["Três Vendas"], neighborhood: "Três Vendas" },
    { deliveryZoneId: byName["Três Vendas"], neighborhood: "Cohab Tres Vendas" },
    { deliveryZoneId: byName["Areal"], neighborhood: "Areal" },
    { deliveryZoneId: byName["Areal"], neighborhood: "Areal Sul" },
    { deliveryZoneId: byName["Laranjal"], neighborhood: "Laranjal" },
    { deliveryZoneId: byName["Laranjal"], neighborhood: "Z3" },
    { deliveryZoneId: byName["Laranjal"], neighborhood: "Balneário dos Prazeres" },
  ]);

  return zones;
}

async function seedCollectionPoints() {
  console.log("📍 Collection points...");
  return await db
    .insert(s.collectionPoints)
    .values([
      {
        name: "Mercado Público de Pelotas",
        address: "Praça 7 de Julho, s/n",
        city: "Pelotas",
        state: "RS",
        description: "Banca da AAPel no mercado público",
        schedule: "Terças e Sextas, 8h às 18h",
      },
      {
        name: "Sede AAPel",
        address: "Rua Marechal Deodoro, 1234",
        city: "Pelotas",
        state: "RS",
        description: "Retirada na sede da cooperativa",
        schedule: "Quartas e Sábados, 9h às 17h",
      },
    ])
    .returning();
}

// ---------------------------------------------------------------------------
// Baskets — templates, slots, and current-week curation
// ---------------------------------------------------------------------------

async function seedBaskets(productsRows: { id: string; name: string; categoryId: string }[]) {
  console.log("🧺 Basket templates + slots...");

  const templates = await db
    .insert(s.basketTemplates)
    .values([
      {
        name: "Cesta Essencial",
        description: "O básico para sua semana com frutas, verduras e legumes variados",
        basePrice: "59.90",
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",
        serves: "2-3 pessoas",
        customizationWindowHours: 24,
      },
      {
        name: "Cesta Família",
        description: "Variedade completa para alimentar toda a família",
        basePrice: "99.90",
        imageUrl:
          "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop",
        serves: "4-5 pessoas",
        customizationWindowHours: 24,
      },
      {
        name: "Cesta Orgânica",
        description: "100% produtos orgânicos certificados",
        basePrice: "129.90",
        imageUrl:
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop",
        serves: "3-4 pessoas",
        customizationWindowHours: 24,
      },
    ])
    .returning();

  const tplByName = Object.fromEntries(templates.map((t) => [t.name, t.id]));

  // Slots per template — same shape (3 frutas, 3 verduras, 2 legumes) for simplicity
  const slotSpecs = [
    ["Cesta Essencial", [
      { label: "Frutas", count: 3, position: 1 },
      { label: "Verduras", count: 3, position: 2 },
      { label: "Legumes", count: 2, position: 3 },
    ]],
    ["Cesta Família", [
      { label: "Frutas", count: 5, position: 1 },
      { label: "Verduras", count: 5, position: 2 },
      { label: "Legumes", count: 4, position: 3 },
    ]],
    ["Cesta Orgânica", [
      { label: "Frutas", count: 4, position: 1 },
      { label: "Verduras", count: 4, position: 2 },
      { label: "Legumes", count: 3, position: 3 },
    ]],
  ] as const;

  const slotsToInsert = slotSpecs.flatMap(([tplName, slots]) =>
    slots.map((slot) => ({
      basketTemplateId: tplByName[tplName as string],
      slotLabel: slot.label,
      itemCount: slot.count,
      position: slot.position,
    })),
  );

  const slots = await db.insert(s.basketSlots).values(slotsToInsert).returning();

  return { templates, slots };
}

async function seedCurrentCuration(
  templates: { id: string; name: string }[],
  slots: { id: string; basketTemplateId: string; slotLabel: string }[],
  productsRows: { id: string; name: string; categoryId: string; productType: "FOOD" | "CRAFT"; organic: boolean }[],
  catIds: Record<string, string>,
) {
  console.log("📅 Current week curation...");

  const delivery = nextSaturday();
  const deadline = new Date(delivery);
  deadline.setHours(delivery.getHours() - 24);

  const foodProducts = productsRows.filter((p) => p.productType === "FOOD");
  const productsByCategory = {
    frutas: foodProducts.filter((p) => p.categoryId === catIds.frutas),
    verduras: foodProducts.filter((p) => p.categoryId === catIds.verduras),
    legumes: foodProducts.filter((p) => p.categoryId === catIds.legumes),
  };

  for (const tpl of templates) {
    const [curation] = await db
      .insert(s.basketCurations)
      .values({
        basketTemplateId: tpl.id,
        deliveryWeek: dateOnly(delivery),
        customizationDeadline: deadline,
        status: "OPEN",
      })
      .returning();

    const tplSlots = slots.filter((sl) => sl.basketTemplateId === tpl.id);
    const onlyOrganic = tpl.name === "Cesta Orgânica";

    const optionRows: (typeof s.basketCurationSlotOptions.$inferInsert)[] = [];

    for (const slot of tplSlots) {
      const slotKey = slot.slotLabel.toLowerCase() as "frutas" | "verduras" | "legumes";
      const eligible = productsByCategory[slotKey].filter(
        (p) => !onlyOrganic || p.organic,
      );
      for (const product of eligible) {
        const productRow = productsRows.find((pp) => pp.id === product.id);
        const isPremium = productsRows.find((p) => p.id === product.id) as
          | (typeof productsRows)[0] & { premium?: boolean }
          | undefined;
        optionRows.push({
          basketCurationId: curation.id,
          basketSlotId: slot.id,
          productId: product.id,
          // Apply a 5.00 upgrade fee for premium items in non-organic baskets
          upgradeFee:
            onlyOrganic
              ? "0"
              : (isPremium as { premium?: boolean } | undefined)?.premium
                ? "5.00"
                : "0",
        });
      }
    }

    if (optionRows.length > 0) {
      await db.insert(s.basketCurationSlotOptions).values(optionRows);
    }
  }
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

async function seedAdmin() {
  console.log("🔑 Admin user...");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await db.insert(s.users).values({
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    passwordHash,
    role: "ADMIN",
    consentMarketing: false,
    consentAnalytics: false,
  });
  console.log(`   → admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 AAPel seed starting...\n");

  await clean();

  const cats = await seedCategories();
  const producers = await seedProducers();
  const productsRows = await seedProducts(cats, producers);
  await seedDeliveryZones();
  await seedCollectionPoints();
  const { templates, slots } = await seedBaskets(productsRows);
  await seedCurrentCuration(templates, slots, productsRows, cats);
  await seedAdmin();

  console.log("\n✅ Seed completed.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
