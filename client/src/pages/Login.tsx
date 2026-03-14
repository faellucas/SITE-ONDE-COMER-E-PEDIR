import { useState } from "react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle, LogIn, Shield, UserPlus, Zap } from "lucide-react";

const BENEFITS = [
  "Publique seus anuncios em poucos minutos",
  "Gerencie favoritos, contatos e painel do anunciante",
  "Acompanhe desempenho e destaque com Booster",
];

type Mode = "login" | "register";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/anunciante");
    },
    onError: error => {
      setErrorMessage(error.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/anunciante");
    },
    onError: error => {
      setErrorMessage(error.message);
    },
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: result => {
      setResetMessage(result.message);
    },
    onError: error => {
      setResetMessage(error.message);
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (mode === "register") {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        personType,
        whatsapp: whatsapp || undefined,
        cpfCnpj: cpfCnpj || undefined,
        companyName: personType === "pj" ? companyName || undefined : undefined,
      });
      return;
    }

    await loginMutation.mutateAsync({
      email,
      password,
    });
  };

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetMessage("");
    await requestResetMutation.mutateAsync({ email: resetEmail });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-6 sm:py-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="hidden rounded-[28px] bg-hero-gradient p-8 text-white shadow-xl lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              Acesso seguro
            </div>
            <h1 className="font-display text-4xl font-black leading-tight">
              Entre no Norte Vivo
            </h1>
            <p className="mt-4 max-w-2xl text-blue-100">
              Use sua conta para anunciar, favoritar, acompanhar resultados e acessar os recursos da plataforma.
            </p>

            <div className="mt-8 space-y-3">
              {BENEFITS.map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              {mode === "login" ? <LogIn className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              {mode === "login" ? "Login com email" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {mode === "login"
                ? "Entre com seu email e senha para acessar o painel."
                : "Cadastre sua conta e comece a anunciar no mesmo instante."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Tipo de cadastro
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
                      {personType === "pj" ? "Nome da empresa" : "Nome"}
                    </label>
                    <Input
                      value={name}
                      onChange={event => setName(event.target.value)}
                      placeholder={
                        personType === "pj" ? "Nome do responsavel" : "Seu nome completo"
                      }
                      required
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
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      {personType === "pj" ? "CNPJ" : "CPF"}
                    </label>
                    <Input
                      value={cpfCnpj}
                      onChange={event => setCpfCnpj(event.target.value)}
                      placeholder={personType === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Minimo de 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-brand-gradient py-6 text-base font-bold text-white hover:opacity-90"
                disabled={isPending}
              >
                {mode === "login" ? <LogIn className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />}
                {isPending ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Esqueceu sua senha?</p>
              <p className="mt-1 text-xs text-gray-500">
                Informe seu email para gerar uma recuperacao segura. Neste momento, o link e processado com apoio da equipe.
              </p>
              <form onSubmit={handleResetRequest} className="mt-3 space-y-3">
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={event => setResetEmail(event.target.value)}
                  placeholder="seu-email@exemplo.com"
                  required
                />
                {resetMessage && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                    {resetMessage}
                  </div>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-2xl"
                  disabled={requestResetMutation.isPending}
                >
                  {requestResetMutation.isPending ? "Gerando..." : "Recuperar senha"}
                </Button>
              </form>
            </div>

            <div className="mt-4">
              <Link href="/anunciar">
                <Button variant="outline" className="w-full rounded-2xl py-6 text-base font-semibold">
                  <Zap className="mr-2 h-5 w-5" />
                  Quero anunciar
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
