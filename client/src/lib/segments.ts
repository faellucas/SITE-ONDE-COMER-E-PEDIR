export type BusinessSegment =
  | "generic"
  | "food"
  | "vehicles"
  | "fashion"
  | "electronics";

type SegmentModule = {
  title: string;
  description: string;
  accent: string;
};

type SegmentMetric = {
  label: string;
  helper: string;
};

export function getSegmentFromCategorySlug(slug?: string | null): BusinessSegment {
  if (!slug) return "generic";

  if (["delivery", "restaurantes", "lanchonetes", "pizzarias"].includes(slug)) {
    return "food";
  }

  if (["veiculos", "autopecas", "motos", "carros"].includes(slug)) {
    return "vehicles";
  }

  if (["moda-acessorios", "roupas", "calcados"].includes(slug)) {
    return "fashion";
  }

  if (["eletronicos", "informatica", "celulares"].includes(slug)) {
    return "electronics";
  }

  return "generic";
}

export const SEGMENT_CONTENT: Record<
  BusinessSegment,
  {
    badge: string;
    title: string;
    description: string;
    highlights: string[];
    dashboardTitle: string;
    dashboardSubtitle: string;
    quickLabel: string;
    modules: SegmentModule[];
    metrics: SegmentMetric[];
  }
> = {
  generic: {
    badge: "Painel padrao",
    title: "Painel de operacao do anunciante",
    description: "Ideal para quem anuncia produtos, servicos e oportunidades em geral.",
    dashboardTitle: "Seu painel de anuncios",
    dashboardSubtitle: "Gerencie anuncios, plano e desempenho em um painel simples e direto.",
    quickLabel: "Fluxo padrao",
    highlights: [
      "Gerencie anuncios, plano e performance",
      "Use booster para ganhar visibilidade",
      "Acompanhe favoritos, contatos e alcance",
    ],
    modules: [
      {
        title: "Catalogo publicado",
        description: "Controle seus anuncios ativos, pausados e em revisao sem complicacao.",
        accent: "bg-blue-50 text-blue-700",
      },
      {
        title: "Visibilidade e booster",
        description: "Suba anuncios estrategicos quando quiser mais alcance e contatos.",
        accent: "bg-amber-50 text-amber-700",
      },
      {
        title: "Atendimento rapido",
        description: "Centralize favoritos, contatos e status para responder mais rapido.",
        accent: "bg-emerald-50 text-emerald-700",
      },
    ],
    metrics: [
      { label: "Anuncios no ar", helper: "operacao geral" },
      { label: "Visualizacoes", helper: "interesse total" },
      { label: "Contatos", helper: "leads recebidos" },
      { label: "Boosters ativos", helper: "anuncios impulsionados" },
    ],
  },
  food: {
    badge: "Segmento alimentacao",
    title: "Painel de loja e cardapio",
    description: "Para lanchonetes, delivery e restaurantes, o painel evolui para uma operacao mais completa.",
    dashboardTitle: "Painel da sua loja de delivery",
    dashboardSubtitle: "Organize vitrine, ofertas e operacao do delivery com foco em recorrencia e recompra.",
    quickLabel: "Modo alimentacao",
    highlights: [
      "Cardapio, combos e adicionais",
      "Horarios, entrega e retirada",
      "Promocoes e cashback para recompra",
    ],
    modules: [
      {
        title: "Cardapio e combos",
        description: "Organize lanches, bebidas, adicionais e destaques do dia de forma mais clara.",
        accent: "bg-orange-50 text-orange-700",
      },
      {
        title: "Entrega e horarios",
        description: "Mostre se esta aberto, retirada no local e zonas de entrega com mais visibilidade.",
        accent: "bg-blue-50 text-blue-700",
      },
      {
        title: "Promocoes e cashback",
        description: "Use ofertas, combos e retorno em saldo para trazer o cliente de volta.",
        accent: "bg-emerald-50 text-emerald-700",
      },
    ],
    metrics: [
      { label: "Itens no cardapio", helper: "produtos ativos" },
      { label: "Visualizacoes da loja", helper: "alcance local" },
      { label: "Cliques no WhatsApp", helper: "pedidos iniciados" },
      { label: "Campanhas ativas", helper: "boosters e promocoes" },
    ],
  },
  vehicles: {
    badge: "Segmento veiculos",
    title: "Painel de estoque automotivo",
    description: "Para loja de carros e motos, com foco em estoque e conversao.",
    dashboardTitle: "Painel da sua loja de veiculos",
    dashboardSubtitle: "Mantenha o estoque visivel, destaque os melhores modelos e acelere os atendimentos.",
    quickLabel: "Modo veiculos",
    highlights: [
      "Estoque com destaque por modelo",
      "Ano, km e ficha do veiculo",
      "Atendimento e visibilidade dos anuncios",
    ],
    modules: [
      {
        title: "Estoque em destaque",
        description: "Separe modelos premium, seminovos e oportunidades com leitura rapida.",
        accent: "bg-blue-50 text-blue-700",
      },
      {
        title: "Ficha tecnica clara",
        description: "Valorize ano, km, cambio e combustivel para reduzir perguntas repetidas.",
        accent: "bg-slate-100 text-slate-700",
      },
      {
        title: "Atendimento comercial",
        description: "Use boosters nos veiculos certos e acompanhe quais modelos atraem mais interessados.",
        accent: "bg-amber-50 text-amber-700",
      },
    ],
    metrics: [
      { label: "Veiculos anunciados", helper: "estoque online" },
      { label: "Visualizacoes", helper: "interesse por modelo" },
      { label: "Contatos", helper: "leads gerados" },
      { label: "Veiculos em destaque", helper: "impulsionados" },
    ],
  },
  fashion: {
    badge: "Segmento moda",
    title: "Painel de catalogo e colecoes",
    description: "Para lojas de roupas e acessorios com foco em variedade e recompra.",
    dashboardTitle: "Painel da sua loja de moda",
    dashboardSubtitle: "Destaque colecoes, novidades e ofertas para girar estoque com mais frequencia.",
    quickLabel: "Modo moda",
    highlights: [
      "Colecoes, tamanhos e cores",
      "Promocoes e vitrines sazonais",
      "Cashback para fidelizar clientes",
    ],
    modules: [
      {
        title: "Colecoes e vitrines",
        description: "Monte vitrines por estacao, promocao ou lancamento para vender mais conjunto.",
        accent: "bg-pink-50 text-pink-700",
      },
      {
        title: "Tamanhos e variacoes",
        description: "Facilite a leitura de cores, tamanhos e disponibilidade das pecas anunciadas.",
        accent: "bg-violet-50 text-violet-700",
      },
      {
        title: "Recompra e fidelizacao",
        description: "Use cashback e campanhas sazonais para fazer o cliente voltar para a loja.",
        accent: "bg-emerald-50 text-emerald-700",
      },
    ],
    metrics: [
      { label: "Pecas anunciadas", helper: "catalogo atual" },
      { label: "Visualizacoes", helper: "vitrine digital" },
      { label: "Favoritos", helper: "itens desejados" },
      { label: "Ofertas ativas", helper: "campanhas no ar" },
    ],
  },
  electronics: {
    badge: "Segmento eletronicos",
    title: "Painel de vitrine tecnica",
    description: "Para eletronicos e tecnologia, com foco em especificacao e oferta.",
    dashboardTitle: "Painel da sua loja de eletronicos",
    dashboardSubtitle: "Exiba melhor os produtos tecnicos, promocoes e diferenciais de cada item.",
    quickLabel: "Modo eletronicos",
    highlights: [
      "Catalogo com detalhes tecnicos",
      "Promocoes e bundles",
      "Comparacao de itens e destaque rapido",
    ],
    modules: [
      {
        title: "Catalogo tecnico",
        description: "Organize modelos, memoria, voltagem e especificacoes que ajudam na decisao.",
        accent: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Ofertas e bundles",
        description: "Destaque kits, combos e oportunidades relampago para aumentar o ticket medio.",
        accent: "bg-amber-50 text-amber-700",
      },
      {
        title: "Comparacao rapida",
        description: "Ajude o cliente a entender diferencas entre modelos e converta com mais seguranca.",
        accent: "bg-slate-100 text-slate-700",
      },
    ],
    metrics: [
      { label: "Itens no catalogo", helper: "estoque online" },
      { label: "Visualizacoes", helper: "busca por modelos" },
      { label: "Contatos", helper: "interesse tecnico" },
      { label: "Ofertas em destaque", helper: "impulsionados" },
    ],
  },
};
