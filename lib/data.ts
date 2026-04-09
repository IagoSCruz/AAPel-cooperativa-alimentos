export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: "frutas" | "verduras" | "legumes";
  image: string;
  producer: {
    id: string;
    name: string;
  };
  organic: boolean;
  available: boolean;
  seasonal: boolean;
}

export interface Producer {
  id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  coverImage: string;
  specialties: string[];
  story: string;
  since: number;
}

export interface Basket {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  items: string[];
  frequency: "semanal" | "quinzenal" | "mensal";
  serves: string;
}

export const producers: Producer[] = [
  {
    id: "1",
    name: "Sítio Boa Esperança",
    description: "Agricultura familiar orgânica há 3 gerações",
    location: "Pelotas, RS",
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop",
    specialties: ["Alface", "Rúcula", "Tomate"],
    story: "O Sítio Boa Esperança nasceu do sonho do meu avô, João, que chegou à região nos anos 50. Desde então, três gerações da nossa família cultivam a terra com respeito e dedicação. Acreditamos que alimentos saudáveis vêm de uma terra saudável, por isso praticamos agricultura orgânica certificada há mais de 15 anos.",
    since: 1958,
  },
  {
    id: "2",
    name: "Fazenda Verde Vale",
    description: "Especialistas em frutas da estação",
    location: "Canguçu, RS",
    image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=400&fit=crop",
    specialties: ["Morango", "Pêssego", "Uva"],
    story: "A Fazenda Verde Vale é conhecida pelas frutas mais doces da região. Nossa família se dedica ao cultivo de frutas há mais de 40 anos, sempre respeitando os ciclos naturais e priorizando a qualidade sobre a quantidade.",
    since: 1982,
  },
  {
    id: "3",
    name: "Horta da Dona Maria",
    description: "Verduras frescas colhidas diariamente",
    location: "São Lourenço do Sul, RS",
    image: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=400&fit=crop",
    specialties: ["Couve", "Espinafre", "Cebolinha"],
    story: "Comecei a horta no quintal de casa para alimentar minha família. Hoje, com ajuda dos meus filhos e netos, cultivamos uma variedade de verduras que chegam frescas às mesas de centenas de famílias da região.",
    since: 1995,
  },
];

export const products: Product[] = [
  // Frutas
  {
    id: "f1",
    name: "Morango Orgânico",
    description: "Morangos frescos e doces, cultivados sem agrotóxicos",
    price: 18.9,
    unit: "bandeja 300g",
    category: "frutas",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&h=600&fit=crop",
    producer: { id: "2", name: "Fazenda Verde Vale" },
    organic: true,
    available: true,
    seasonal: true,
  },
  {
    id: "f2",
    name: "Banana Prata",
    description: "Bananas maduras no ponto, ideais para consumo",
    price: 7.9,
    unit: "kg",
    category: "frutas",
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&h=600&fit=crop",
    producer: { id: "2", name: "Fazenda Verde Vale" },
    organic: false,
    available: true,
    seasonal: false,
  },
  {
    id: "f3",
    name: "Laranja Valência",
    description: "Laranjas suculentas, perfeitas para suco",
    price: 6.5,
    unit: "kg",
    category: "frutas",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&h=600&fit=crop",
    producer: { id: "2", name: "Fazenda Verde Vale" },
    organic: false,
    available: true,
    seasonal: true,
  },
  {
    id: "f4",
    name: "Maçã Fuji",
    description: "Maçãs crocantes e saborosas da serra gaúcha",
    price: 12.9,
    unit: "kg",
    category: "frutas",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop",
    producer: { id: "2", name: "Fazenda Verde Vale" },
    organic: false,
    available: true,
    seasonal: false,
  },
  // Verduras
  {
    id: "v1",
    name: "Alface Crespa Orgânica",
    description: "Alface fresca, crocante e cultivada sem agrotóxicos",
    price: 4.5,
    unit: "unidade",
    category: "verduras",
    image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&h=600&fit=crop",
    producer: { id: "1", name: "Sítio Boa Esperança" },
    organic: true,
    available: true,
    seasonal: false,
  },
  {
    id: "v2",
    name: "Rúcula Orgânica",
    description: "Rúcula fresca com sabor levemente picante",
    price: 5.0,
    unit: "maço",
    category: "verduras",
    image: "https://images.unsplash.com/photo-1506807803488-8eafc15316c7?w=600&h=600&fit=crop",
    producer: { id: "1", name: "Sítio Boa Esperança" },
    organic: true,
    available: true,
    seasonal: false,
  },
  {
    id: "v3",
    name: "Couve Manteiga",
    description: "Couve fresca, folhas macias e nutritivas",
    price: 4.0,
    unit: "maço",
    category: "verduras",
    image: "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=600&h=600&fit=crop",
    producer: { id: "3", name: "Horta da Dona Maria" },
    organic: false,
    available: true,
    seasonal: false,
  },
  {
    id: "v4",
    name: "Espinafre Orgânico",
    description: "Espinafre rico em ferro e vitaminas",
    price: 6.0,
    unit: "maço",
    category: "verduras",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&h=600&fit=crop",
    producer: { id: "3", name: "Horta da Dona Maria" },
    organic: true,
    available: true,
    seasonal: false,
  },
  // Legumes
  {
    id: "l1",
    name: "Tomate Italiano",
    description: "Tomates firmes, ideais para molhos e saladas",
    price: 9.9,
    unit: "kg",
    category: "legumes",
    image: "https://images.unsplash.com/photo-1546470427-227c7369a9b8?w=600&h=600&fit=crop",
    producer: { id: "1", name: "Sítio Boa Esperança" },
    organic: false,
    available: true,
    seasonal: true,
  },
  {
    id: "l2",
    name: "Cenoura Orgânica",
    description: "Cenouras doces e crocantes, ricas em betacaroteno",
    price: 8.5,
    unit: "kg",
    category: "legumes",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=600&fit=crop",
    producer: { id: "1", name: "Sítio Boa Esperança" },
    organic: true,
    available: true,
    seasonal: false,
  },
  {
    id: "l3",
    name: "Batata Inglesa",
    description: "Batatas versáteis para fritar, assar ou cozinhar",
    price: 6.9,
    unit: "kg",
    category: "legumes",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82ber-pz0?w=600&h=600&fit=crop",
    producer: { id: "3", name: "Horta da Dona Maria" },
    organic: false,
    available: true,
    seasonal: false,
  },
  {
    id: "l4",
    name: "Abobrinha Verde",
    description: "Abobrinhas frescas, ótimas para refogados",
    price: 7.5,
    unit: "kg",
    category: "legumes",
    image: "https://images.unsplash.com/photo-1563252722-6434563a985d?w=600&h=600&fit=crop",
    producer: { id: "1", name: "Sítio Boa Esperança" },
    organic: false,
    available: true,
    seasonal: true,
  },
];

export const baskets: Basket[] = [
  {
    id: "b1",
    name: "Cesta Essencial",
    description: "O básico para sua semana com frutas, verduras e legumes variados",
    price: 59.9,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",
    items: ["3 tipos de frutas", "3 tipos de verduras", "2 tipos de legumes"],
    frequency: "semanal",
    serves: "2-3 pessoas",
  },
  {
    id: "b2",
    name: "Cesta Família",
    description: "Variedade completa para alimentar toda a família",
    price: 99.9,
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop",
    items: ["5 tipos de frutas", "5 tipos de verduras", "4 tipos de legumes", "Temperos frescos"],
    frequency: "semanal",
    serves: "4-5 pessoas",
  },
  {
    id: "b3",
    name: "Cesta Orgânica",
    description: "100% produtos orgânicos certificados",
    price: 129.9,
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop",
    items: ["4 tipos de frutas orgânicas", "4 tipos de verduras orgânicas", "3 tipos de legumes orgânicos"],
    frequency: "semanal",
    serves: "3-4 pessoas",
  },
];

export function getProductsByCategory(category: string): Product[] {
  if (category === "todos") return products;
  return products.filter((p) => p.category === category);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProducerById(id: string): Producer | undefined {
  return producers.find((p) => p.id === id);
}

export function getProductsByProducer(producerId: string): Product[] {
  return products.filter((p) => p.producer.id === producerId);
}
