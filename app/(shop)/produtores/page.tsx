import { ProducerCard } from "@/components/producers/producer-card";
import { publicFetch } from "@/lib/api-public";
import { Users, Heart, Sprout } from "lucide-react";
import type { ProducerFull } from "@/lib/types";

const stats = [
  { icon: Users, value: "15+", label: "Famílias produtoras" },
  { icon: Heart, value: "30+", label: "Anos de tradição" },
  { icon: Sprout, value: "100%", label: "Agricultura familiar" },
];

export default async function ProdutoresPage() {
  const producers = await publicFetch<ProducerFull[]>("/api/produtores", {
    revalidate: 3600,
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-serif text-4xl font-bold text-primary-foreground lg:text-5xl">
              <span className="text-balance">Nossos Produtores</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 text-pretty">
              Por trás de cada produto está uma família dedicada à agricultura.
              Conheça suas histórias e descubra como seu alimento é cultivado
              com carinho e respeito à terra.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-xl bg-primary-foreground/10 p-6 text-center"
              >
                <stat.icon className="h-8 w-8 text-primary-foreground" />
                <span className="mt-3 text-3xl font-bold text-primary-foreground">
                  {stat.value}
                </span>
                <span className="mt-1 text-sm text-primary-foreground/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Producers Grid */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {producers.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {producers.map((producer) => (
                <ProducerCard key={producer.id} producer={producer} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">
              Nenhum produtor cadastrado ainda.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Quer fazer parte da nossa cooperativa?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Se você é agricultor familiar e deseja vender seus produtos através
            da AAPel, entre em contato conosco.
          </p>
          <a
            href="mailto:produtores@aapel.coop.br"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar em contato
          </a>
        </div>
      </section>
    </div>
  );
}
