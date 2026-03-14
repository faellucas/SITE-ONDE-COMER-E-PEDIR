import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Zap, Star, Crown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "yearly";

type PlanVariant = {
  price: number;
  period: string;
  note?: string;
  savings?: string;
  featureOverrides?: string[];
};

type PlanDefinition = {
  id: string;
  name: string;
  icon: typeof Zap;
  color: string;
  btnClass: string;
  badges: Partial<Record<BillingCycle, string>>;
  description: string;
  variants: Record<BillingCycle, PlanVariant>;
  features: string[];
  notIncluded: string[];
};

const PLANS: PlanDefinition[] = [
  {
    id: "gratis",
    name: "Gratis",
    icon: Zap,
    color: "border-gray-200",
    btnClass: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    badges: {},
    description: "Plano de entrada para anunciar e validar a plataforma.",
    variants: {
      monthly: { price: 0, period: "30 dias" },
      yearly: { price: 0, period: "30 dias" },
    },
    features: [
      "5 anuncios ativos",
      "3 fotos por anuncio",
      "Validade de 30 dias",
      "Busca padrao",
      "Suporte basico",
    ],
    notIncluded: ["Booster de destaque", "Destaque na home", "Selo verificado"],
  },
  {
    id: "profissional",
    name: "Profissional",
    icon: Star,
    color: "border-blue-500 ring-2 ring-blue-100",
    btnClass: "bg-brand-gradient text-white hover:opacity-90",
    badges: {
      monthly: "MAIS ACESSIVEL",
      yearly: "PROMOCAO DE LANCAMENTO",
    },
    description: "Para quem quer manter anuncios ativos o ano inteiro sem pesar.",
    variants: {
      monthly: { price: 9.9, period: "/mes" },
      yearly: {
        price: 99.9,
        period: "/ano",
        note: "equivale a R$ 8,33/mes",
        savings: "economize R$ 18,90",
      },
    },
    features: [
      "15 anuncios ativos",
      "8 fotos por anuncio",
      "Validade de 30 dias por anuncio",
      "Booster disponivel",
      "Prioridade na busca",
      "Suporte prioritario",
    ],
    notIncluded: ["Destaque garantido na home", "Selo verificado"],
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    color: "border-amber-400 ring-2 ring-amber-100",
    btnClass: "bg-orange-gradient text-white hover:opacity-90",
    badges: {
      monthly: "MELHOR CUSTO-BENEFICIO",
      yearly: "MAIS VANTAJOSO",
    },
    description: "O plano para quem quer crescer rapido e aparecer mais.",
    variants: {
      monthly: { price: 14.9, period: "/mes" },
      yearly: {
        price: 129.9,
        period: "/ano",
        note: "equivale a R$ 10,83/mes",
        savings: "economize R$ 48,90",
        featureOverrides: [
          "Anuncios ilimitados",
          "20 fotos por anuncio",
          "Validade de 30 dias por anuncio",
          "24 boosters de 24h por ano",
          "Acumula e usa quando quiser",
          "Destaque garantido na home",
          "Selo de verificado",
          "Suporte VIP",
          "Relatorios avancados",
        ],
      },
    },
    features: [
      "Anuncios ilimitados",
      "20 fotos por anuncio",
      "Validade de 30 dias por anuncio",
      "2 boosters de 24h por mes",
      "Destaque garantido na home",
      "Selo de verificado",
      "Suporte VIP",
      "Relatorios avancados",
    ],
    notIncluded: [],
  },
];

const BOOSTERS = [
  {
    name: "Destaque Basico",
    price: 12.9,
    days: 7,
    desc: "Aparece no topo da categoria por 7 dias",
  },
  {
    name: "Destaque Plus",
    price: 24.9,
    days: 15,
    desc: "Destaque na home + topo da categoria por 15 dias",
  },
  {
    name: "Destaque Premium",
    price: 49.9,
    days: 30,
    desc: "Banner na home + destaque maximo por 30 dias",
  },
];

function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function PlansPage() {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-hero-gradient py-16 text-center text-white">
        <div className="container">
          <h1 className="mb-3 font-display text-4xl font-black">
            Planos e Precos
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-blue-100">
            Comece com valores promocionais de lancamento. No anual, o custo por
            mes fica menor e voce trava o preco por 12 meses.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="mx-auto mb-10 flex max-w-sm rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              billingCycle === "yearly"
                ? "bg-brand-gradient text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Anual
          </button>
        </div>

        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            {billingCycle === "yearly"
              ? "Melhor conversao para o lancamento"
              : "Entrada facil para testar"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-black text-gray-900">
            {billingCycle === "yearly"
              ? "Pague menos no ano e aumente o ticket medio"
              : "Mensal para entrar, anual para escalar"}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map(plan => {
            const IconComp = plan.icon;
            const variant = plan.variants[billingCycle];
            const badge = plan.badges[billingCycle];
            const isPremium = plan.id === "premium";
            const visibleFeatures = variant.featureOverrides ?? plan.features;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm ${plan.color}`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black ${
                        isPremium
                          ? "bg-amber-400 text-gray-900"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {badge}
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isPremium
                        ? "bg-orange-gradient"
                        : plan.id === "profissional"
                          ? "bg-brand-gradient"
                          : "bg-gray-100"
                    }`}
                  >
                    <IconComp
                      className={`h-5 w-5 ${
                        plan.id !== "gratis" ? "text-white" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                </div>

                <p className="mb-5 text-sm text-gray-500">{plan.description}</p>

                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    {variant.price === 0 ? "Gratis" : formatPrice(variant.price)}
                  </span>
                  {variant.price > 0 && (
                    <span className="text-sm text-gray-500">{variant.period}</span>
                  )}
                </div>

                {variant.note && (
                  <p className="text-sm font-medium text-gray-500">{variant.note}</p>
                )}
                {variant.savings && (
                  <p className="mt-1 text-sm font-bold text-green-600">
                    {variant.savings}
                  </p>
                )}

                <ul className="mb-6 mt-6 space-y-3">
                  {visibleFeatures.map(feature => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                  {plan.notIncluded.map(feature => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-400 line-through"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={isAuthenticated ? "/anunciante" : LOGIN_ROUTE}>
                  <Button
                    className={`w-full rounded-xl py-5 text-base font-bold ${plan.btnClass}`}
                  >
                    {variant.price === 0 ? "Comecar Gratis" : "Assinar Agora"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white py-14">
        <div className="container">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
              <Zap className="h-4 w-4" /> BOOSTER - Turbine seu anuncio
            </div>
            <h2 className="mb-3 font-display text-3xl font-black text-gray-900">
              Destaque seu anuncio e venda mais rapido
            </h2>
            <p className="mx-auto max-w-xl text-gray-500">
              Mesmo com plano acessivel, voce ainda pode impulsionar anuncios
              especificos quando quiser mais alcance.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {BOOSTERS.map(booster => (
              <div
                key={booster.name}
                className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-gradient">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1 font-display text-lg font-bold text-gray-900">
                  {booster.name}
                </h3>
                <p className="mb-4 text-sm text-gray-600">{booster.desc}</p>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">
                    {formatPrice(booster.price)}
                  </span>
                  <span className="text-sm text-gray-500">/{booster.days} dias</span>
                </div>
                <Link href={isAuthenticated ? "/anunciante" : LOGIN_ROUTE}>
                  <Button className="w-full rounded-xl bg-orange-gradient font-bold text-white hover:opacity-90">
                    Ativar Booster
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
