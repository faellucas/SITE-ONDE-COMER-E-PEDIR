import { Link } from "wouter";
import { Facebook, Instagram, MapPin, MessageCircle, Zap } from "lucide-react";

const footerCategories = [
  { label: "Delivery", slug: "delivery" },
  { label: "Veículos", slug: "veiculos" },
  { label: "Imóveis", slug: "imoveis" },
  { label: "Serviços Gerais", slug: "servicos-gerais" },
  { label: "Moda e Acessórios", slug: "moda-acessorios" },
  { label: "Agro e Rural", slug: "agro-rural" },
  { label: "Empregos", slug: "empregos" },
];

const footerCities = [
  { label: "Ibaiti", slug: "ibaiti" },
  { label: "Japira", slug: "japira" },
  { label: "Pinhalão", slug: "pinhalao" },
  { label: "Jaboti", slug: "jaboti" },
  { label: "Tomazina", slug: "tomazina" },
  { label: "Wenceslau Braz", slug: "wenceslau-braz" },
  { label: "Siqueira Campos", slug: "siqueira-campos" },
  { label: "Jacarezinho", slug: "jacarezinho" },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-300">
      <div className="bg-brand-gradient px-4 py-10">
        <div className="container text-center">
          <h2 className="mb-3 font-display text-2xl font-black text-white md:text-3xl">
            Comece a anunciar agora: é grátis
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-blue-100">
            Teste o Norte Vivo, publique seus anúncios e alcance a região com um
            fluxo simples.
          </p>
          <Link href="/anunciar">
            <button className="rounded-xl bg-white px-8 py-3 font-bold text-blue-700 shadow-lg transition-colors hover:bg-blue-50">
              Anunciar grátis
            </button>
          </Link>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-black text-white">
                Norte
                <span style={{ color: "oklch(0.68 0.19 45)" }}>Vivo</span>
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              O portal local do Norte Pioneiro do Paraná para encontrar lojas,
              serviços, produtos e oportunidades da região em um só lugar.
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span>Ibaiti e região, PR</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display font-bold text-white">
              Categorias
            </h4>
            <ul className="space-y-2 text-sm">
              {footerCategories.map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display font-bold text-white">Cidades</h4>
            <ul className="space-y-2 text-sm">
              {footerCities.map(city => (
                <li key={city.slug}>
                  <Link
                    href={`/cidade/${city.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {city.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display font-bold text-white">
              Norte Vivo
            </h4>
            <ul className="mb-6 space-y-2 text-sm">
              <li>
                <Link
                  href="/planos"
                  className="transition-colors hover:text-white"
                >
                  Planos e preços
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="transition-colors hover:text-white"
                >
                  Como funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/entrar"
                  className="transition-colors hover:text-white"
                >
                  Entrar ou cadastrar
                </Link>
              </li>
              <li>
                <Link
                  href="/anunciante"
                  className="transition-colors hover:text-white"
                >
                  Painel do anunciante
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="transition-colors hover:text-white"
                >
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="transition-colors hover:text-white"
                >
                  Privacidade
                </Link>
              </li>
            </ul>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 transition-colors hover:bg-blue-600"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 transition-colors hover:bg-pink-600"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-6 text-xs text-gray-500 md:flex-row">
          <p>
            © {new Date().getFullYear()} Norte Vivo. Todos os direitos
            reservados.
          </p>
          <p>Feito para o Norte Pioneiro do Paraná.</p>
        </div>
      </div>
    </footer>
  );
}
