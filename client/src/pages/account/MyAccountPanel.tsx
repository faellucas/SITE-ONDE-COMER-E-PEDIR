import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  CreditCard,
  LayoutGrid,
  Lock,
  LogIn,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Receipt,
  Rocket,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  User,
  Wallet,
  BadgeCheck,
} from "lucide-react";

type MainSection = {
  key: string;
  label: string;
  children: {
    key: string;
    label: string;
    href?: string;
  }[];
};

type DashboardCard = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  visible?: boolean;
  status?: "ok" | "default";
};

function buildSections(isAdvertiser: boolean, isStoreOwner: boolean): MainSection[] {
  return [
    {
      key: "conta",
      label: "Minha Conta",
      children: [
        { key: "perfil", label: "Informacoes do Perfil", href: "/anunciante/meus-dados" },
        { key: "seguranca", label: "Seguranca" },
        { key: "enderecos", label: "Enderecos" },
        { key: "cartoes", label: "Cartoes" },
        { key: "comunicacoes", label: "Comunicacoes" },
        { key: "privacidade", label: "Privacidade" },
      ],
    },
    {
      key: "compras",
      label: "Minhas Compras",
      children: [
        { key: "pedidos", label: "Pedidos" },
        { key: "favoritos", label: "Favoritos", href: "/favoritos" },
        { key: "cashback", label: "Cashback" },
      ],
    },
    ...(isAdvertiser
      ? [
          {
            key: "anuncios",
            label: "Meus Anuncios",
            children: [
              { key: "ativos", label: "Anuncios Ativos", href: "/anunciante" },
              { key: "pausados", label: "Anuncios Pausados", href: "/anunciante" },
              { key: "novo", label: "Criar Novo Anuncio", href: "/anunciante/novo" },
              { key: "booster", label: "Booster", href: "/booster" },
            ],
          },
        ]
      : []),
    ...(isStoreOwner
      ? [
          {
            key: "lojas",
            label: "Minhas Lojas",
            children: [
              { key: "vitrine", label: "Minha Vitrine", href: "/lojas" },
              { key: "produtos-loja", label: "Produtos da Loja", href: "/anunciante" },
              { key: "pedidos-loja", label: "Pedidos da Loja" },
              { key: "config-loja", label: "Configuracoes da Loja", href: "/anunciante/meus-dados" },
            ],
          },
        ]
      : []),
    {
      key: "faturamento",
      label: "Faturamento",
      children: [
        { key: "extrato", label: "Extrato" },
        { key: "pagamentos", label: "Pagamentos" },
        { key: "planos", label: "Planos e Assinaturas", href: "/planos" },
      ],
    },
    {
      key: "configuracoes",
      label: "Configuracoes",
      children: [
        { key: "notificacoes", label: "Notificacoes" },
        { key: "preferencias", label: "Preferencias" },
        { key: "ajuda", label: "Ajuda" },
      ],
    },
  ];
}

function buildCards(
  isAdvertiser: boolean,
  isStoreOwner: boolean,
  planActive: boolean
): DashboardCard[] {
  const cards: DashboardCard[] = [
    {
      key: "perfil",
      title: "Informacoes do seu perfil",
      description: "Dados pessoais e da conta.",
      icon: User,
      href: "/anunciante/meus-dados",
    },
    {
      key: "seguranca",
      title: "Seguranca",
      description: "Voce configurou a seguranca da sua conta.",
      icon: Lock,
      status: "ok",
    },
    {
      key: "plus",
      title: "NorteVivo+",
      description: "Assinatura com beneficios exclusivos.",
      icon: Star,
      href: "/planos",
      visible: planActive,
    },
    {
      key: "cartoes",
      title: "Meus Cartoes",
      description: "Cartoes salvos na sua conta.",
      icon: CreditCard,
    },
    {
      key: "enderecos",
      title: "Meus Enderecos",
      description: "Enderecos salvos na sua conta.",
      icon: MapPin,
    },
    {
      key: "privacidade",
      title: "Privacidade",
      description: "Preferencias e controle do uso dos seus dados.",
      icon: Shield,
    },
    {
      key: "comunicacoes",
      title: "Comunicacoes",
      description: "Escolha que tipo de informacao quer receber.",
      icon: MessageSquare,
    },
    {
      key: "pedidos",
      title: "Meus Pedidos",
      description: "Acompanhe suas compras e vendas.",
      icon: ShoppingBag,
    },
    {
      key: "anuncios",
      title: "Meus Anuncios",
      description: "Gerencie seus anuncios ativos e pausados.",
      icon: LayoutGrid,
      href: "/anunciante",
      visible: isAdvertiser,
    },
    {
      key: "loja",
      title: "Minha Loja",
      description: "Gerencie sua vitrine e produtos.",
      icon: Store,
      href: "/anunciante/meus-dados",
      visible: isStoreOwner,
    },
    {
      key: "booster",
      title: "Booster",
      description: "Impulsione seus anuncios e alcance mais clientes.",
      icon: Rocket,
      href: "/booster",
      visible: isAdvertiser,
    },
    {
      key: "faturamento",
      title: "Faturamento",
      description: "Visualize seu extrato e pagamentos.",
      icon: Wallet,
      href: "/planos",
    },
  ];

  return cards.filter(card => card.visible !== false);
}

export default function MyAccountPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("conta");

  const { data: advertiserStats } = trpc.advertiser.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-6">
        <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <LogIn className="h-8 w-8 text-slate-700" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Entre na sua conta</h1>
          <p className="mt-3 text-base text-slate-500">
            Acesse compras, anuncios, faturamento e o seu perfil no Norte Vivo.
          </p>
          <Link href={LOGIN_ROUTE}>
            <Button className="mt-6 w-full rounded-full bg-orange-500 py-6 text-white hover:bg-orange-600">
              Entrar / Cadastrar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isStoreOwner = user.personType === "pj";
  const isAdvertiser = isStoreOwner || (advertiserStats?.totalListings ?? 0) > 0;
  const hasBuyerSignals = Boolean((advertiserStats?.totalContacts ?? 0) > 0);
  const accountType = isStoreOwner
    ? hasBuyerSignals
      ? "Ambos"
      : "Anunciante PJ"
    : isAdvertiser
      ? hasBuyerSignals
        ? "Ambos"
        : "Anunciante PF"
      : "Comprador";
  const sections = useMemo(
    () => buildSections(isAdvertiser, isStoreOwner),
    [isAdvertiser, isStoreOwner]
  );
  const cards = useMemo(
    () => buildCards(isAdvertiser, isStoreOwner, Boolean(user.trialStartedAt)),
    [isAdvertiser, isStoreOwner, user.trialStartedAt]
  );
  const currentSection = sections.find(section => section.key === activeSection) ?? sections[0];
  const displayName = user.personType === "pj" ? user.companyName || user.name : user.name;
  const avatarSrc = typeof user.avatar === "string" ? user.avatar : undefined;
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || "N";

  const renderNav = () => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {sections.map(section => (
        <button
          key={section.key}
          type="button"
          onClick={() => setActiveSection(section.key)}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
            section.key === activeSection
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  );

  const visibleCards = cards.filter(card => {
    if (activeSection === "conta") {
      return [
        "perfil",
        "seguranca",
        "plus",
        "cartoes",
        "enderecos",
        "privacidade",
        "comunicacoes",
      ].includes(card.key);
    }
    if (activeSection === "compras") {
      return ["pedidos", "enderecos", "cartoes"].includes(card.key);
    }
    if (activeSection === "anuncios") {
      return ["anuncios", "booster"].includes(card.key);
    }
    if (activeSection === "lojas") {
      return ["loja", "anuncios"].includes(card.key);
    }
    if (activeSection === "faturamento") {
      return ["faturamento", "plus"].includes(card.key);
    }
    if (activeSection === "configuracoes") {
      return ["privacidade", "comunicacoes", "seguranca"].includes(card.key);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="mx-auto max-w-[1680px] px-4 py-3 sm:px-6">
        <header className="rounded-[24px] border border-slate-200 bg-[#fffddf] px-4 py-6 sm:px-8">
          <div className="flex items-center justify-between gap-4 sm:hidden">
            <h1 className="text-lg font-semibold text-slate-900">Painel Minha Conta</h1>
            <Button
              type="button"
              variant="outline"
              className="rounded-full bg-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </div>

          <div className="hidden sm:block">
            <h1 className="text-center text-[32px] font-semibold text-slate-900">
              Painel "Minha Conta" - Norte Vivo
            </h1>
            <div className="mx-auto mt-8 max-w-6xl rounded-[18px] border border-slate-200 bg-[#f2f2f2] px-6 py-6">
              <p className="mb-4 text-center text-[15px] text-slate-600">
                Menu de Navegacao Principal
              </p>
              {renderNav()}
            </div>
          </div>
        </header>

        <main className="mt-6 rounded-[24px] border border-slate-200 bg-[#f2f2f2] p-5 sm:p-8">
          <div className="mb-6 sm:hidden">
            <h2 className="mb-4 text-center text-base text-slate-600">Menu de Navegacao Principal</h2>
            {renderNav()}
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
            <section className="rounded-[18px] border border-[#c9bc48] bg-[#fffddf] p-5">
              <p className="mb-5 text-center text-[15px] text-slate-700">Resumo do Perfil</p>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-16 w-16 border border-slate-200">
                  <AvatarImage src={avatarSrc} alt={displayName || "Perfil"} />
                  <AvatarFallback className="bg-white text-lg font-semibold text-slate-700">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  {displayName}
                </div>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  {accountType}
                </div>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  {user.email}
                </div>

                <Link href="/anunciante/meus-dados" className="block">
                  <Button variant="outline" className="rounded-xl bg-white">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                </Link>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-800">{currentSection.label}</p>
                <div className="mt-3 space-y-2">
                  {currentSection.children.map(item =>
                    item.href ? (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        {item.label}
                        <span className="text-slate-400">{">"}</span>
                      </Link>
                    ) : (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600"
                      >
                        {item.label}
                        <span className="text-slate-400">{">"}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#c9bc48] bg-[#fffddf] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[15px] text-slate-700">Conteudo Principal</p>
                <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
                  Cards de Acao
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleCards.map(card => {
                  const Icon = card.icon;
                  const content = (
                    <article className="rounded-[16px] border border-slate-300 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <Icon className="h-6 w-6 text-slate-700" />
                        {card.status === "ok" ? (
                          <BadgeCheck className="h-5 w-5 text-emerald-500" />
                        ) : null}
                      </div>
                      <h2 className="mt-6 text-[17px] font-medium text-slate-900">
                        {card.title}
                      </h2>
                      <p className="mt-2 text-[15px] leading-7 text-slate-600">
                        {card.description}
                      </p>
                    </article>
                  );

                  return card.href ? (
                    <Link key={card.key} href={card.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={card.key}>{content}</div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm border-r-0 bg-white p-0">
          <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left">
            <SheetTitle className="text-xl font-semibold text-slate-900">
              Minha Conta
            </SheetTitle>
            <SheetDescription>Navegue pelas areas do painel.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-5">
            {sections.map(section => (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  setActiveSection(section.key);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                  section.key === activeSection
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {section.label}
                <Receipt className="h-4 w-4 opacity-40" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
