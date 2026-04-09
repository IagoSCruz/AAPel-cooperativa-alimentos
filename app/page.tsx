import Link from "next/link";
import { ArrowRight, Truck, Leaf, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Leaf,
    title: "Produtos Frescos",
    description:
      "Colhidos no dia ou na véspera da entrega, garantindo máximo frescor e sabor.",
  },
  {
    icon: Users,
    title: "Apoio ao Produtor",
    description:
      "Sua compra fortalece diretamente as famílias de agricultores da região.",
  },
  {
    icon: Truck,
    title: "Entrega Semanal",
    description:
      "Receba em casa ou retire em pontos de coleta próximos a você.",
  },
  {
    icon: Calendar,
    title: "Cestas Semanais",
    description:
      "Assine e receba uma seleção variada de produtos da estação toda semana.",
  },
];

const categories = [
  {
    name: "Frutas",
    description: "Doçura natural da estação",
    image:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop",
    href: "/produtos?categoria=frutas",
  },
  {
    name: "Verduras",
    description: "Folhas frescas e nutritivas",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop",
    href: "/produtos?categoria=verduras",
  },
  {
    name: "Legumes",
    description: "Base para suas receitas",
    image:
      "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&h=400&fit=crop",
    href: "/produtos?categoria=legumes",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              <span className="text-balance">Do campo à sua mesa, com carinho e respeito</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80 text-pretty">
              Conectamos você diretamente aos agricultores familiares da nossa
              região. Alimentos frescos, saudáveis e cultivados com práticas
              sustentáveis, entregues na sua casa ou disponíveis para retirada.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/produtos">
                  Ver Produtos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/cestas">Conhecer as Cestas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Explore Nossos Produtos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tudo cultivado com cuidado por agricultores locais
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden rounded-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Por que escolher a AAPel?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Mais que uma compra, uma conexão com quem produz seu alimento
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-accent/10">
            <div className="flex flex-col items-center gap-8 p-8 lg:flex-row lg:p-12">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="font-serif text-3xl font-bold text-foreground">
                  Conheça Nossos Produtores
                </h2>
                <p className="mt-4 text-muted-foreground text-pretty">
                  Por trás de cada produto está uma família que dedica sua vida
                  à agricultura. Descubra suas histórias, conheça suas
                  propriedades e entenda como seu alimento é cultivado.
                </p>
              </div>
              <div className="shrink-0">
                <Button size="lg" asChild>
                  <Link href="/produtores">
                    Conhecer Produtores
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
