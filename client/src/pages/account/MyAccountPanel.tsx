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
  BadgePercent,
  BriefcaseBusiness,
  ChevronDown,
  CircleCheck,
  CreditCard,
  HandCoins,
  LayoutGrid,
  Lock,
  LogIn,
  MapPin,
  Menu,
  MessageSquare,
  ReceiptText,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Tag,
  User,
} from "lucide-react";

type SidebarChild = {
  key: string;
  label: string;
  href?: string;
};

type SidebarSection = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: SidebarChild[];
};

type ProfileCard = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  visible?: boolean;
  status?: "ok" | "default";
};

function buildSidebarSections(
  isAdvertiser: boolean,
  isStoreOwner: boolean
): SidebarSection[] {
  return [
    {
      key: "compras",
      label: "Compras",
      icon: ShoppingBag,
      children: [
        { key: "pedidos", label: "Pedidos" },
        { key: "favoritos", label: "Favoritos", href: "/favoritos" },
      ],
    },
    {
      key: "vendas",
      label: "Vendas",
      icon: Tag,
      children: isAdvertiser
        ? [
            { key: "ativos", label: "Anuncios ativos", href: "/anunciante" },
            { key: "pausados", label: "Anuncios pausados", href: "/anunciante" },
            { key: "novo", label: "Criar anuncio", href: "/anunciante/novo" },
          ]
        : [{ key: "comecar", label: "Comecar a vender", href: "/anunciar" }],
    },
    {
      key: "marketing",
      label: "Marketing",
      icon: BadgePercent,
      children: [
        { key: "booster", label: "Booster", href: "/booster" },
        { key: "planos", label: "Planos", href: "/planos" },
      ],
    },
    {
      key: "emprestimos",
      label: "Emprestimos",
      icon: HandCoins,
      children: [{ key: "credito", label: "Em breve" }],
    },
    {
      key: "assinaturas",
      label: "Assinaturas",
      icon: Star,
      children: [{ key: "nv-plus", label: "NorteVivo+", href: "/planos" }],
    },
    {
      key: "faturamento",
      label: "Faturamento",
      icon: ReceiptText,
      children: [
        { key: "extrato", label: "Extrato" },
        { key: "pagamentos", label: "Pagamentos" },
      ],
    },
    {
      key: "meu-perfil",
      label: "Meu perfil",
      icon: User,
      children: [
        { key: "perfil", label: "Informacoes do perfil", href: "/anunciante/meus-dados" },
        { key: "seguranca", label: "Seguranca" },
        { key: "cartoes", label: "Cartoes" },
        { key: "enderecos", label: "Enderecos" },
        { key: "privacidade", label: "Privacidade" },
        { key: "comunicacoes", label: "Comunicacoes" },
        ...(isStoreOwner
          ? [{ key: "minha-loja", label: "Minha loja", href: "/anunciante/meus-dados" }]
          : []),
      ],
    },
    {
      key: "configuracoes",
      label: "Configuracoes",
      icon: Settings,
      children: [
        { key: "preferencias", label: "Preferencias" },
        { key: "ajuda", label: "Ajuda" },
      ],
    },
  ];
}

function buildProfileCards(
  isAdvertiser: boolean,
  isStoreOwner: boolean,
  planActive: boolean
): ProfileCard[] {
  const cards: ProfileCard[] = [
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
      icon: MessageSquare,
      href: "/planos",
      visible: planActive,
    },
    {
      key: "cartoes",
      title: "Cartoes",
      description: "Cartoes salvos na sua conta.",
      icon: CreditCard,
    },
    {
      key: "enderecos",
      title: "Enderecos",
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
      description: "Escolha que tipo de informacao voce quer receber.",
      icon: MessageSquare,
    },
    {
      key: "anuncios",
      title: "Meus anuncios",
      description: "Gerencie seus anuncios ativos e pausados.",
      icon: LayoutGrid,
      href: "/anunciante",
      visible: isAdvertiser,
    },
    {
      key: "loja",
      title: "Minha loja",
      description: "Gerencie sua vitrine e produtos.",
      icon: BriefcaseBusiness,
      href: "/anunciante/meus-dados",
      visible: isStoreOwner,
    },
  ];

  return cards.filter(card => card.visible !== false);
}

export default function MyAccountPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("meu-perfil");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    compras: false,
    vendas: false,
    marketing: false,
    emprestimos: false,
    assinaturas: false,
    faturamento: false,
    "meu-perfil": true,
    configuracoes: false,
  });

  const { data: advertiserStats } = trpc.advertiser.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ededed]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ededed] p-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <LogIn className="h-8 w-8 text-slate-700" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Entre na sua conta</h1>
          <p className="mt-3 text-base text-slate-500">
            Acesse compras, vendas, faturamento e o seu perfil no Norte Vivo.
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
  const sections = useMemo(
    () => buildSidebarSections(isAdvertiser, isStoreOwner),
    [isAdvertiser, isStoreOwner]
  );
  const cards = useMemo(
    () => buildProfileCards(isAdvertiser, isStoreOwner, Boolean(user.trialStartedAt)),
    [isAdvertiser, isStoreOwner, user.trialStartedAt]
  );
  const displayName = user.personType === "pj" ? user.companyName || user.name : user.name;
  const avatarSrc = typeof user.avatar === "string" ? user.avatar : undefined;
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || "N";

  const renderSidebar = () => (
    <div className="flex h-full flex-col bg-[#f7f7f7]">
      <div className="flex items-center gap-4 px-6 py-12">
        <button
          type="button"
          className="rounded-full p-1 text-slate-500 transition-colors hover:text-slate-900"
        >
          <Menu className="h-7 w-7" />
        </button>
        <span className="text-[18px] font-semibold text-slate-900">Minha conta</span>
      </div>

      <div className="space-y-2 px-2">
        {sections.map(section => {
          const Icon = section.icon;
          const isActive = section.key === activeSection;
          const isOpen = openSections[section.key];

          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => {
                  setActiveSection(section.key);
                  setOpenSections(current => ({
                    ...current,
                    [section.key]: !current[section.key],
                  }));
                }}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left ${
                  isActive ? "text-blue-600" : "text-slate-600"
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {isActive ? (
                    <span className="absolute left-1/2 top-full mt-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-500" />
                  ) : null}
                </div>
                <span className={`flex-1 text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {section.label}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen ? (
                <div className="pb-1 pl-16 pr-4">
                  {section.children.map(child =>
                    child.href ? (
                      <Link
                        key={child.key}
                        href={child.href}
                        className="block py-2 text-sm text-slate-500 hover:text-slate-900"
                      >
                        {child.label}
                      </Link>
                    ) : (
                      <div key={child.key} className="py-2 text-sm text-slate-500">
                        {child.label}
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#ededed]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[304px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-[#f7f7f7] lg:block">
          {renderSidebar()}
        </aside>

        <main className="min-w-0">
          <div className="px-5 pt-5 lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="rounded-full bg-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="mr-2 h-4 w-4" />
              Minha conta
            </Button>
          </div>

          <div className="px-5 pb-24 pt-8 sm:px-8 lg:px-16 lg:pt-8">
            <section className="mb-14 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarSrc} alt={displayName || "Perfil"} />
                <AvatarFallback className="bg-white text-2xl font-semibold text-slate-700">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="truncate text-[24px] font-semibold leading-none text-slate-900">
                  {displayName}
                </h1>
                <p className="mt-3 truncate text-[18px] text-slate-800">{user.email}</p>
              </div>
            </section>

            <section className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {cards.map(card => {
                const Icon = card.icon;
                const content = (
                  <article className="relative min-h-[172px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <Icon className="h-7 w-7 text-slate-900" />
                      {card.status === "ok" ? (
                        <CircleCheck className="h-6 w-6 text-emerald-500" />
                      ) : null}
                    </div>
                    <h2 className="mt-12 text-[19px] font-medium text-slate-900">
                      {card.title}
                    </h2>
                    <p className="mt-2 max-w-[290px] text-[16px] leading-8 text-slate-500">
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
            </section>
          </div>
        </main>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm border-r-0 bg-[#f7f7f7] p-0">
          <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left">
            <SheetTitle className="text-xl font-semibold text-slate-900">
              Minha conta
            </SheetTitle>
            <SheetDescription>Navegue pelas areas da conta.</SheetDescription>
          </SheetHeader>
          <div className="h-full overflow-y-auto">{renderSidebar()}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
