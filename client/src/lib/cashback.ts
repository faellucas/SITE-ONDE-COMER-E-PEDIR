export type CashbackRule = {
  slug: string;
  label: string;
  rate: number;
  description: string;
};

export const CASHBACK_RULES: CashbackRule[] = [
  {
    slug: "delivery",
    label: "Delivery",
    rate: 5,
    description: "Funciona bem para pedidos recorrentes e ticket medio menor.",
  },
  {
    slug: "mercados",
    label: "Mercados",
    rate: 3,
    description: "Ajuda a trazer o cliente de volta com frequencia.",
  },
  {
    slug: "farmacia",
    label: "Farmacia",
    rate: 3,
    description: "Boa categoria para retorno recorrente e compras de reposicao.",
  },
  {
    slug: "moda-acessorios",
    label: "Moda e Acessorios",
    rate: 4,
    description: "Bom incentivo para compras sazonais e novas colecoes.",
  },
  {
    slug: "pets",
    label: "Pets",
    rate: 4,
    description: "Excelente para recompra de produtos e servicos frequentes.",
  },
  {
    slug: "saude-beleza",
    label: "Saude e Beleza",
    rate: 4,
    description: "Ajuda a fidelizar clientes em servicos recorrentes.",
  },
];

export const CASHBACK_CATEGORY_SLUGS = new Set(
  CASHBACK_RULES.map(rule => rule.slug)
);

export function getCashbackRuleBySlug(slug?: string | null) {
  if (!slug) return null;
  return CASHBACK_RULES.find(rule => rule.slug === slug) ?? null;
}
