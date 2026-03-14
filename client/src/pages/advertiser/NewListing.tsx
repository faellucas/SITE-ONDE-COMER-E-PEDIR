import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Image, X } from "lucide-react";

type ListingImageDraft = {
  url: string;
  file?: File;
  persisted?: boolean;
};

const TYPE_CATEGORY_MATCHERS: Record<string, (slug: string) => boolean> = {
  service: slug => slug === "servicos-gerais",
  vehicle: slug => ["veiculos", "motos", "carros", "autopecas"].includes(slug),
  property: slug => slug === "imoveis",
  food: slug => slug === "delivery",
  job: slug => slug === "empregos",
  product: slug =>
    !["servicos-gerais", "veiculos", "motos", "carros", "autopecas", "imoveis", "delivery", "empregos"].includes(slug),
};

function formatCurrencyFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return formatCurrencyFromCents(Number(digits));
}

function parseCurrencyInput(value: string) {
  if (!value.trim()) return undefined;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function NewListing() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [isEditRoute, params] = useRoute("/anunciante/editar/:id");
  const editId = isEditRoute ? Number(params?.id) : null;
  const isEditing = typeof editId === "number" && Number.isFinite(editId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("fixed");
  const [type, setType] = useState("product");
  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [images, setImages] = useState<ListingImageDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [didHydrateForm, setDidHydrateForm] = useState(false);

  const { data: categories } = trpc.public.categories.useQuery();
  const { data: cities } = trpc.public.cities.useQuery();
  const listingForEditQuery = trpc.advertiser.listingForEdit.useQuery(
    { id: editId as number },
    { enabled: Boolean(isAuthenticated && isEditing && editId) }
  );

  useEffect(() => {
    if (!isEditing || !listingForEditQuery.data || didHydrateForm) return;

    const listing = listingForEditQuery.data;
    setTitle(listing.title ?? "");
    setDescription(listing.description ?? "");
    setPrice(listing.price ? formatCurrencyInput(String(listing.price)) : "");
    setPriceType(listing.priceType ?? "fixed");
    setType(listing.type ?? "product");
    setCategoryId(String(listing.categoryId ?? ""));
    setCityId(listing.cityId ? String(listing.cityId) : "");
    setNeighborhood(listing.neighborhood ?? "");
    setWhatsapp(listing.whatsapp ?? "");
    setImages(
      (listing.images ?? []).map(image => ({
        url: image.url,
        persisted: true,
      }))
    );
    setDidHydrateForm(true);
  }, [didHydrateForm, isEditing, listingForEditQuery.data]);

  const filteredCategories = (categories ?? []).filter(category => {
    const matcher = TYPE_CATEGORY_MATCHERS[type];
    return matcher ? matcher(category.slug) : true;
  });

  const isFoodListing = type === "food";

  useEffect(() => {
    if (!filteredCategories.length) {
      setCategoryId("");
      return;
    }

    const hasCurrentCategory = filteredCategories.some(category => String(category.id) === categoryId);
    if (hasCurrentCategory) return;

    setCategoryId(String(filteredCategories[0].id));
  }, [categoryId, filteredCategories]);

  const createMutation = trpc.advertiser.createListing.useMutation();

  const updateMutation = trpc.advertiser.updateListing.useMutation();

  const uploadMutation = trpc.advertiser.uploadImage.useMutation();
  const addImageMutation = trpc.advertiser.addImage.useMutation();

  const handleImageAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = readerEvent => {
        setImages(prev => [...prev, { url: readerEvent.target?.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadPendingImages = async (listingId: number) => {
    if (!Number.isFinite(listingId) || listingId <= 0) {
      throw new Error("Nao foi possivel identificar o anuncio criado para enviar as imagens.");
    }

    const pendingImages = images.filter(image => image.file);
    if (pendingImages.length === 0) return;

    setUploading(true);
    try {
      for (let index = 0; index < pendingImages.length; index += 1) {
        const image = pendingImages[index];
        if (!image.file) continue;

        const { url } = await uploadMutation.mutateAsync({
          listingId,
          base64: image.url,
          mimeType: image.file.type,
        });

        await addImageMutation.mutateAsync({
          listingId,
          url,
          isPrimary: images.findIndex(item => item.url === image.url) === 0,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Titulo e obrigatorio");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      price: parseCurrencyInput(price),
      priceType: priceType as any,
      type: type as any,
      categoryId: Number(categoryId),
      cityId: cityId ? Number(cityId) : undefined,
      neighborhood: neighborhood || undefined,
      whatsapp: whatsapp || undefined,
    };

    if (isEditing && editId) {
      try {
        await updateMutation.mutateAsync({
          id: editId,
          ...payload,
        });
        await uploadPendingImages(editId);
        await utils.advertiser.stats.invalidate();
        await listingForEditQuery.refetch();
        toast.success("Anuncio atualizado com sucesso!");
        navigate("/anunciante");
      } catch (error: any) {
        toast.error("Erro ao atualizar anuncio: " + (error?.message ?? "Tente novamente"));
      }
      return;
    }

    try {
      const data = await createMutation.mutateAsync(payload);
      if (!data?.id) {
        throw new Error("O anuncio foi criado sem retornar um identificador valido.");
      }

      await uploadPendingImages(data.id);
      await utils.advertiser.stats.invalidate();
      toast.success("Anuncio criado com sucesso!");
      navigate("/anunciante");
    } catch (error: any) {
      toast.error("Erro ao criar anuncio: " + (error?.message ?? "Tente novamente"));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="font-display text-2xl font-bold text-gray-700 mb-4">Faca login para anunciar</h2>
          <Link href={LOGIN_ROUTE}>
            <Button className="bg-brand-gradient text-white rounded-xl px-8">Entrar</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-6 max-w-2xl">
        <Link href="/anunciante" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </Link>

        {isEditing && listingForEditQuery.isLoading && (
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">
            Carregando dados do anuncio...
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-hero-gradient p-6 text-white">
            <h1 className="font-display text-2xl font-bold mb-1">
              {isFoodListing
                ? isEditing
                  ? "Editar Item do Cardapio"
                  : "Cadastrar Item do Cardapio"
                : isEditing
                  ? "Editar Anuncio"
                  : "Criar Novo Anuncio"}
            </h1>
            <p className="text-blue-100 text-sm">
              {isFoodListing
                ? "Cadastre cada lanche, bebida, combo ou promocao como um item separado da sua loja."
                : isEditing
                  ? "Atualize as informacoes do seu produto ou servico"
                  : "Preencha as informacoes do seu produto ou servico"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
                Informacoes Basicas
              </h2>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  {isFoodListing ? "Nome do item *" : "Titulo do anuncio *"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder={
                    isFoodListing
                      ? "Ex: X-Salada especial, Combo casal, Marmita executiva..."
                      : "Ex: Nome claro e direto do que voce esta anunciando..."
                  }
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">{title.length}/200 caracteres</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  {isFoodListing ? "Descricao do item" : "Descricao"}
                </label>
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder={
                    isFoodListing
                      ? "Ingredientes, tamanho, acompanhamentos, observacoes e diferenciais..."
                      : "Descreva seu produto ou servico com detalhes..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipo de anuncio *</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="service">Servico</SelectItem>
                      <SelectItem value="vehicle">Veiculo</SelectItem>
                      <SelectItem value="property">Imovel</SelectItem>
                      <SelectItem value="food">Comida/Delivery</SelectItem>
                      <SelectItem value="job">Emprego</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Categoria *</label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(category => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-gray-400">
                    {isFoodListing
                      ? "Para alimentacao, cada item do cardapio e cadastrado separadamente dentro de Delivery."
                      : "As categorias mudam conforme o tipo de anuncio escolhido."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
                Preco
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipo de preco</label>
                  <Select value={priceType} onValueChange={setPriceType}>
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Preco fixo</SelectItem>
                      <SelectItem value="negotiable">Negociavel</SelectItem>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="on_request">Sob consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {priceType !== "free" && priceType !== "on_request" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      {isFoodListing ? "Preco do item (R$)" : "Valor (R$)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={price}
                      onChange={event => setPrice(formatCurrencyInput(event.target.value))}
                      placeholder="0,00"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
                Localizacao
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Cidade</label>
                  <Select value={cityId} onValueChange={setCityId}>
                    <SelectTrigger className="rounded-xl bg-gray-50">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map(city => (
                        <SelectItem key={city.id} value={String(city.id)}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={event => setNeighborhood(event.target.value)}
                    placeholder="Centro, Vila Nova..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">WhatsApp para contato</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={event => setWhatsapp(event.target.value)}
                  placeholder="(43) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">4</span>
                Fotos (opcional)
              </h2>

              <div className="grid grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={`${img.url}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== index))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                        Principal
                      </span>
                    )}
                    {img.persisted && (
                      <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Salva
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <Image className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Adicionar</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Maximo de 10 fotos. A primeira foto sera a capa do anuncio.
                {isEditing ? " As fotos novas serao enviadas quando voce salvar as alteracoes." : ""}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
                className="w-full bg-brand-gradient text-white font-bold rounded-xl py-4 text-base hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending || uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditing ? "Salvando..." : "Publicando..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isEditing ? "Salvar alteracoes" : "Publicar Anuncio Gratis"}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Ao publicar, voce concorda com os{" "}
                <Link href="/termos" className="text-blue-600 hover:underline">
                  Termos de Uso
                </Link>{" "}
                do Norte Vivo.
              </p>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
