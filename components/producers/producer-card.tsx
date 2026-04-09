import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { Producer } from "@/lib/data";

interface ProducerCardProps {
  producer: Producer;
}

export function ProducerCard({ producer }: ProducerCardProps) {
  return (
    <Link
      href={`/produtores/${producer.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Cover Image */}
      <div className="relative h-32 overflow-hidden bg-muted">
        <img
          src={producer.coverImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-10 mb-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-card bg-muted">
            <img
              src={producer.image}
              alt={producer.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary">
          {producer.name}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {producer.location}
        </p>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {producer.description}
        </p>

        {/* Specialties */}
        <div className="mt-4 flex flex-wrap gap-2">
          {producer.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
          Conhecer produtor
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
