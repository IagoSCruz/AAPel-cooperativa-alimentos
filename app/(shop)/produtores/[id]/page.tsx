import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { getProducerById, getProductsByProducer } from "@/lib/data";
import { ProductCard } from "@/components/products/product-card";

export default function ProducerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const producer = getProducerById(id);

  if (!producer) {
    notFound();
  }

  const products = getProductsByProducer(producer.id);

  return (
    <div className="flex flex-col">
      {/* Cover */}
      <div className="relative h-64 bg-muted lg:h-80">
        <img
          src={producer.coverImage}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-20 pb-8">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end">
            {/* Avatar */}
            <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-lg lg:h-40 lg:w-40">
              <img
                src={producer.image}
                alt={producer.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <Link
                href="/produtores"
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Todos os produtores
              </Link>
              <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                {producer.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {producer.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Desde {producer.since}
                </span>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="mt-6 flex flex-wrap gap-2">
            {producer.specialties.map((specialty) => (
              <span
                key={specialty}
                className="rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* Story */}
        <section className="border-t border-border py-12">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Nossa História
          </h2>
          <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">
            {producer.story}
          </p>
        </section>

        {/* Products */}
        <section className="border-t border-border py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Produtos
            </h2>
            <span className="text-sm text-muted-foreground">
              {products.length}{" "}
              {products.length === 1 ? "produto" : "produtos"}
            </span>
          </div>

          {products.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border-2 border-dashed border-border bg-muted/50 py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum produto disponível no momento
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
