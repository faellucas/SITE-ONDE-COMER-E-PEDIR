import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_ROUTE } from "@/const";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Camera, LogIn, Save, Store } from "lucide-react";
import { toast } from "sonner";

type OpeningHoursDay = {
  enabled: boolean;
  open: string;
  close: string;
};

type OpeningHoursMap = Record<
  "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
  OpeningHoursDay
>;

const DEFAULT_OPENING_HOURS: OpeningHoursMap = {
  sun: { enabled: false, open: "08:00", close: "18:00" },
  mon: { enabled: true, open: "08:00", close: "18:00" },
  tue: { enabled: true, open: "08:00", close: "18:00" },
  wed: { enabled: true, open: "08:00", close: "18:00" },
  thu: { enabled: true, open: "08:00", close: "18:00" },
  fri: { enabled: true, open: "08:00", close: "18:00" },
  sat: { enabled: true, open: "08:00", close: "14:00" },
};

const DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terca" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sabado" },
  { key: "sun", label: "Domingo" },
] as const;

function parseOpeningHours(value?: string | null): OpeningHoursMap {
  if (!value) return DEFAULT_OPENING_HOURS;

  try {
    const parsed = JSON.parse(value) as Partial<OpeningHoursMap>;
    return {
      sun: parsed.sun ?? DEFAULT_OPENING_HOURS.sun,
      mon: parsed.mon ?? DEFAULT_OPENING_HOURS.mon,
      tue: parsed.tue ?? DEFAULT_OPENING_HOURS.tue,
      wed: parsed.wed ?? DEFAULT_OPENING_HOURS.wed,
      thu: parsed.thu ?? DEFAULT_OPENING_HOURS.thu,
      fri: parsed.fri ?? DEFAULT_OPENING_HOURS.fri,
      sat: parsed.sat ?? DEFAULT_OPENING_HOURS.sat,
    };
  } catch {
    return DEFAULT_OPENING_HOURS;
  }
}

export default function AdvertiserProfile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [companyName, setCompanyName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cityId, setCityId] = useState<string>("none");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [openingHours, setOpeningHours] = useState<OpeningHoursMap>(DEFAULT_OPENING_HOURS);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils();
  const { data: cities } = trpc.public.cities.useQuery();

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name ?? "");
    setPersonType((user.personType as "pf" | "pj") ?? "pf");
    setCompanyName(user.companyName ?? "");
    setCpfCnpj(user.cpfCnpj ?? "");
    setWhatsapp(user.whatsapp ?? "");
    setCityId(user.cityId ? String(user.cityId) : "none");
    setNeighborhood(user.neighborhood ?? "");
    setBio(user.bio ?? "");
    setOpeningHours(parseOpeningHours((user as { openingHoursJson?: string | null }).openingHoursJson));
    setAvatarPreview(user.avatar ?? null);
  }, [user]);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await Promise.all([
        utils.public.featuredListings.invalidate(),
        utils.public.recentListings.invalidate(),
        user?.id
          ? utils.public.sellerProfile.invalidate({ sellerId: user.id })
          : Promise.resolve(),
      ]);
      toast.success("Perfil atualizado.");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const uploadAvatarMutation = trpc.auth.uploadAvatar.useMutation({
    onSuccess: async ({ url }) => {
      setAvatarPreview(url);
      utils.auth.me.setData(undefined, currentUser =>
        currentUser ? { ...currentUser, avatar: url } : currentUser
      );
      await Promise.all([
        utils.public.featuredListings.invalidate(),
        utils.public.recentListings.invalidate(),
        utils.public.listingById.invalidate(),
        user?.id
          ? utils.public.sellerProfile.invalidate({ sellerId: user.id })
          : Promise.resolve(),
      ]);
      toast.success("Foto de perfil atualizada.");
    },
    onError: error => {
      toast.error(error.message);
    },
  });


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100">
            <LogIn className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-800">
            Acesse seus dados
          </h2>
          <p className="mt-3 text-gray-500">
            Entre para visualizar e editar suas informacoes.
          </p>
          <Link href={LOGIN_ROUTE}>
            <Button className="mt-6 rounded-xl bg-brand-gradient px-8 py-3 text-white">
              Entrar / Cadastrar
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName =
    personType === "pj"
      ? companyName || user?.companyName || user?.name
      : profileName || user?.name;
  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    const reader = new FileReader();
    reader.onload = async readerEvent => {
      const result = readerEvent.target?.result;
      if (typeof result !== "string") return;

      setAvatarUploading(true);
      try {
        await uploadAvatarMutation.mutateAsync({
          base64: result,
          mimeType: file.type || "image/jpeg",
        });
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container max-w-4xl py-4 sm:py-6">
        <Link
          href="/anunciante"
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">
                  Meus dados
                </h1>
                <p className="text-sm text-gray-500">
                  Gerencie foto, tipo de conta e informacoes publicas do seu
                  perfil.
                </p>
              </div>
            </div>
            <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              {personType === "pj" ? "Pessoa juridica" : "Pessoa fisica"}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-[24px] bg-gray-50 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-brand-gradient text-3xl font-black text-white">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName || "Perfil"}
                  className="h-full w-full object-cover"
                />
              ) : (
                displayInitial
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Foto de perfil</p>
              <p className="mt-1 text-sm text-gray-500">
                Essa imagem aparece no painel, no menu da conta e na
                apresentacao do anunciante.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Ao tocar no botao abaixo, voce escolhe uma imagem da galeria ou
                biblioteca do aparelho.
              </p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl sm:w-auto"
                disabled={avatarUploading || uploadAvatarMutation.isPending}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {avatarUploading || uploadAvatarMutation.isPending
                  ? "Enviando..."
                  : "Escolher foto"}
              </Button>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              updateProfileMutation.mutate({
                name: profileName || undefined,
                personType,
                companyName:
                  personType === "pj" ? companyName || undefined : undefined,
                cpfCnpj: cpfCnpj || undefined,
                whatsapp: whatsapp || undefined,
                bio: bio || undefined,
                openingHoursJson: JSON.stringify(openingHours),
                cityId: cityId !== "none" ? Number(cityId) : undefined,
                neighborhood: neighborhood || undefined,
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Tipo de conta
                </label>
                <Select
                  value={personType}
                  onValueChange={value => setPersonType(value as "pf" | "pj")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa fisica</SelectItem>
                    <SelectItem value="pj">Pessoa juridica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  WhatsApp
                </label>
                <Input
                  value={whatsapp}
                  onChange={event => setWhatsapp(event.target.value)}
                  placeholder="(43) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                {personType === "pj" ? "Nome do responsavel" : "Nome"}
              </label>
              <Input
                value={profileName}
                onChange={event => setProfileName(event.target.value)}
                placeholder="Seu nome"
              />
            </div>

            {personType === "pj" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Empresa
                </label>
                <Input
                  value={companyName}
                  onChange={event => setCompanyName(event.target.value)}
                  placeholder="Nome fantasia ou razao social"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {personType === "pj" ? "CNPJ" : "CPF"}
                </label>
                <Input
                  value={cpfCnpj}
                  onChange={event => setCpfCnpj(event.target.value)}
                  placeholder={
                    personType === "pj"
                      ? "00.000.000/0000-00"
                      : "000.000.000-00"
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Cidade
                </label>
                <Select value={cityId} onValueChange={setCityId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nao informar</SelectItem>
                    {cities?.map(city => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Bairro
              </label>
              <Input
                value={neighborhood}
                onChange={event => setNeighborhood(event.target.value)}
                placeholder="Centro, Vila Nova..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Descricao da loja
              </label>
              <Textarea
                value={bio}
                onChange={event => setBio(event.target.value)}
                placeholder="Conte o que sua loja faz, o que vende e por que as pessoas devem comprar de voce."
                className="min-h-28 rounded-xl"
              />
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="mb-4">
                <p className="font-semibold text-gray-900">Horario de funcionamento</p>
                <p className="mt-1 text-sm text-gray-500">
                  Essas informacoes serao usadas para marcar sua loja como aberta agora no site.
                </p>
              </div>
              <div className="space-y-3">
                {DAYS.map(day => {
                  const config = openingHours[day.key];
                  return (
                    <div
                      key={day.key}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-white p-3"
                    >
                      <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={event =>
                            setOpeningHours(current => ({
                              ...current,
                              [day.key]: {
                                ...current[day.key],
                                enabled: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        {day.label}
                      </label>
                      <Input
                        type="time"
                        value={config.open}
                        disabled={!config.enabled}
                        onChange={event =>
                          setOpeningHours(current => ({
                            ...current,
                            [day.key]: {
                              ...current[day.key],
                              open: event.target.value,
                            },
                          }))
                        }
                        className="w-[108px] rounded-xl"
                      />
                      <Input
                        type="time"
                        value={config.close}
                        disabled={!config.enabled}
                        onChange={event =>
                          setOpeningHours(current => ({
                            ...current,
                            [day.key]: {
                              ...current[day.key],
                              close: event.target.value,
                            },
                          }))
                        }
                        className="w-[108px] rounded-xl"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full rounded-2xl bg-brand-gradient font-bold text-white hover:opacity-90"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProfileMutation.isPending ? "Salvando..." : "Salvar dados"}
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
