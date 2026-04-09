import { baskets } from "@/lib/data";
import { BasketCard } from "@/components/baskets/basket-card";
import { Repeat, Truck, Leaf, Calendar } from "lucide-react";

const benefits = [
  {
    icon: Repeat,
    title: "Receba toda semana",
    description: "Produtos frescos entregues automaticamente no dia escolhido",
  },
  {
    icon: Leaf,
    title: "Variedade sazonal",
    description: "A cada semana, produtos diferentes de acordo com a estação",
  },
  {
    icon: Truck,
    title: "Frete grátis",
    description: "Assinantes não pagam taxa de entrega em nenhum pedido",
  },
  {
    icon: Calendar,
    title: "Flexibilidade total",
    description: "Pause, pule semanas ou cancele quando quiser",
  },
];

const steps = [
  {
    number: "1",
    title: "Escolha sua cesta",
    description: "Selecione o plano que melhor atende sua família",
  },
  {
    number: "2",
    title: "Defina a frequência",
    description: "Semanal, quinzenal ou mensal - você decide",
  },
  {
    number: "3",
    title: "Receba em casa",
    description: "Produtos frescos colhidos na véspera da entrega",
  },
];

export default function CestasPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-accent/10 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-serif text-4xl font-bold text-foreground lg:text-5xl">
              <span className="text-balance">Cestas Semanais</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-pretty">
              Assine e receba em casa uma seleção de produtos frescos da
              estação. Praticidade para você, apoio direto ao agricultor
              familiar.
            </p>
          </div>

          {/* How it works */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary font-serif text-xl font-bold text-primary-foreground">
                  {step.number}
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Baskets */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Escolha sua cesta
            </h2>
            <p className="mt-4 text-muted-foreground">
              Planos para todos os tamanhos de família
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {baskets.map((basket, index) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                featured={index === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Vantagens da assinatura
            </h2>
            <p className="mt-4 text-muted-foreground">
              Mais que conveniência, um compromisso com a alimentação saudável
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl bg-card p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                  <benefit.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Perguntas frequentes
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-foreground">
                Posso cancelar a qualquer momento?
                <span className="transition-transform group-open:rotate-180">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-muted-foreground">
                Sim! Não há fidelidade. Você pode pausar, pular semanas ou
                cancelar sua assinatura a qualquer momento pelo seu painel.
              </p>
            </details>

            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-foreground">
                Como escolho os produtos da minha cesta?
                <span className="transition-transform group-open:rotate-180">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-muted-foreground">
                Nossos agricultores selecionam os melhores produtos da semana
                com base na sazonalidade. Você sempre recebe o que há de mais
                fresco.
              </p>
            </details>

            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-foreground">
                Em quais dias ocorre a entrega?
                <span className="transition-transform group-open:rotate-180">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-muted-foreground">
                As entregas acontecem às terças e sextas-feiras. Você escolhe o
                dia mais conveniente no momento da assinatura.
              </p>
            </details>

            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-foreground">
                Posso adicionar produtos avulsos?
                <span className="transition-transform group-open:rotate-180">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-muted-foreground">
                Claro! Assinantes podem adicionar produtos extras do nosso
                catálogo à entrega da cesta, sem pagar frete adicional.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
