"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Users, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { baskets } from "@/lib/data";

const frequencies = [
  { id: "semanal", name: "Semanal", discount: 0 },
  { id: "quinzenal", name: "Quinzenal", discount: 5 },
  { id: "mensal", name: "Mensal", discount: 10 },
];

const deliveryDays = [
  { id: "terca", name: "Terça-feira" },
  { id: "sexta", name: "Sexta-feira" },
];

export default function BasketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const basket = baskets.find((b) => b.id === id);

  const [frequency, setFrequency] = useState("semanal");
  const [deliveryDay, setDeliveryDay] = useState("terca");

  if (!basket) {
    notFound();
  }

  const selectedFrequency = frequencies.find((f) => f.id === frequency);
  const finalPrice =
    basket.price * (1 - (selectedFrequency?.discount || 0) / 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/cestas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as cestas
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          <img
            src={basket.image}
            alt={basket.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
            {basket.name}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {basket.description}
          </p>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>Serve {basket.serves}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-5 w-5" />
              <span>Frete grátis</span>
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <h3 className="font-medium text-foreground">
              O que vem na cesta:
            </h3>
            <ul className="mt-3 space-y-2">
              {basket.items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Frequency Selection */}
          <div className="mt-8">
            <h3 className="font-medium text-foreground">Frequência:</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {frequencies.map((freq) => (
                <label
                  key={freq.id}
                  className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${
                    frequency === freq.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={freq.id}
                    checked={frequency === freq.id}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="sr-only"
                  />
                  <span className="block font-medium text-foreground">
                    {freq.name}
                  </span>
                  {freq.discount > 0 && (
                    <span className="mt-1 block text-sm text-accent">
                      {freq.discount}% de desconto
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Day */}
          <div className="mt-6">
            <h3 className="font-medium text-foreground">Dia de entrega:</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {deliveryDays.map((day) => (
                <label
                  key={day.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    deliveryDay === day.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryDay"
                    value={day.id}
                    checked={deliveryDay === day.id}
                    onChange={(e) => setDeliveryDay(e.target.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {day.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mt-8 rounded-xl bg-muted p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  Valor por entrega
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  {selectedFrequency?.discount ? (
                    <>
                      <span className="text-3xl font-bold text-foreground">
                        {formatCurrency(finalPrice)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatCurrency(basket.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(basket.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full" size="lg">
              Assinar agora
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Cancele a qualquer momento. Sem fidelidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
