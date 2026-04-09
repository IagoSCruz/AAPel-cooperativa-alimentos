import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

const footerLinks = {
  navegacao: [
    { name: "Produtos", href: "/produtos" },
    { name: "Produtores", href: "/produtores" },
    { name: "Cestas Semanais", href: "/cestas" },
    { name: "Sobre Nós", href: "/sobre" },
  ],
  ajuda: [
    { name: "Como Funciona", href: "/como-funciona" },
    { name: "Entregas", href: "/entregas" },
    { name: "Dúvidas Frequentes", href: "/faq" },
    { name: "Contato", href: "/contato" },
  ],
  legal: [
    { name: "Termos de Uso", href: "/termos" },
    { name: "Política de Privacidade", href: "/privacidade" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-semibold">AAPel</span>
                <span className="text-xs text-primary-foreground/70">
                  Cooperativa de Alimentos
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/80">
              Conectando agricultores familiares a consumidores conscientes.
              Alimentos frescos, saudáveis e sustentáveis direto do campo para
              sua mesa.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary-foreground/10 p-2 transition-colors hover:bg-primary-foreground/20"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold">Navegação</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.navegacao.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold">Ajuda</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.ajuda.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold">Contato</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Rua das Hortaliças, 123 - Centro, Pelotas - RS</span>
              </li>
              <li>
                <a
                  href="tel:+555332221234"
                  className="flex items-center gap-3 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  <Phone className="h-4 w-4" />
                  (53) 3222-1234
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@aapel.coop.br"
                  className="flex items-center gap-3 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  <Mail className="h-4 w-4" />
                  contato@aapel.coop.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} AAPel Cooperativa de Alimentos. Todos
            os direitos reservados.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
