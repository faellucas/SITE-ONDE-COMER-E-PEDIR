import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Ambulance,
  ArrowRight,
  Briefcase,
  HeartHandshake,
  MapPin,
  Shield,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const GUIDE_SECTIONS = [
  {
    title: "Saude",
    description: "Hospitais, clinicas, farmacias e atendimentos uteis.",
    href: "/busca?q=saude",
    icon: Stethoscope,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Educacao",
    description: "Escolas, cursos, reforco e oportunidades de aprendizagem.",
    href: "/busca?q=educacao",
    icon: Briefcase,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    title: "Seguranca",
    description: "Policia, apoio e servicos uteis para a cidade.",
    href: "/busca?q=seguranca",
    icon: Shield,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Emergencias",
    description: "Atalhos para urgencias e contatos importantes.",
    href: "/busca?q=emergencia",
    icon: Ambulance,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Oficinas",
    description: "Mecanicos, eletricistas, reparos e manutencoes.",
    href: "/busca?q=oficina",
    icon: Wrench,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Servicos Gerais",
    description: "Prestadores e negocios locais para o dia a dia.",
    href: "/busca?q=servicos",
    icon: HeartHandshake,
    tone: "bg-violet-50 text-violet-700",
  },
];

export default function GuidePage() {
  const { data: cities } = trpc.public.cities.useQuery();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#f8fafc_35%,#f8fafc_100%)]">
      <Header />
      <main className="container py-6">
        <section className="hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#0ea5e9_130%)] p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:block sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
            Guia local
          </p>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">
            Servicos e contatos uteis da sua cidade.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-blue-50/90">
            Um atalho rapido para encontrar saude, educacao, seguranca,
            emergencias e servicos do dia a dia no Norte Vivo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/busca?q=servicos">
              <Button className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                Explorar servicos
              </Button>
            </Link>
            <Link href="/">
              <Button className="rounded-2xl bg-white/10 text-white hover:bg-white/15">
                Voltar para Home
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="font-display text-3xl font-black text-slate-900">
              Acessos rapidos
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Entradas diretas para o que as pessoas mais procuram.
            </p>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-3">
            {GUIDE_SECTIONS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group min-w-[86%] snap-center rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 sm:min-w-0"
                >
                  <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    Acessar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-black text-slate-900">
              Cidades atendidas
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Explore hubs locais e anuncios publicados por cidade.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {cities?.map(city => (
              <Link key={city.id} href={`/cidade/${city.slug}`}>
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {city.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
