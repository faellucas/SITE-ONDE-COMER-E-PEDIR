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
import { HelpCircle, LogIn, Mail, UserPlus } from "lucide-react";

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
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-6 sm:py-10">
        <div className="mx-auto max-w-md">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="px-5 pb-8 pt-8 sm:px-8">
              <div className="mx-auto max-w-sm text-center">
                <h1 className="font-display text-3xl font-black leading-tight text-gray-900">
                  {mode === "login"
                    ? "Entre na sua conta e negocie com seguranca!"
                    : "Crie sua conta e comece a anunciar hoje"}
                </h1>
                <p className="mt-3 text-base leading-7 text-gray-500">
                  {mode === "login"
                    ? "Acesse e aproveite uma experiencia segura dentro do Norte Vivo."
                    : "Cadastre-se para publicar anuncios, gerenciar contatos e entrar no painel."}
                </p>
              </div>

              {mode === "login" && (
                <>
                  <div className="mt-8 flex items-center justify-center gap-5">
                    <button
                      type="button"
                      className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl font-bold text-gray-700 shadow-sm transition-transform hover:-translate-y-0.5"
                      aria-label="Entrar com Google em breve"
                    >
                      G
                    </button>
                    <button
                      type="button"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2] text-3xl font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                      aria-label="Entrar com Facebook em breve"
                    >
                      f
                    </button>
                  </div>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-sm font-medium text-gray-400">Ou conecte com</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                {mode === "login" && (
                  <div className="mt-2 text-right">
                    <Link
                      href="/redefinir-senha"
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-orange-500 py-6 text-base font-bold text-white hover:bg-orange-600"
                disabled={isPending}
              >
                {mode === "login" ? <LogIn className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />}
                {isPending ? "Processando..." : mode === "login" ? "Acessar" : "Criar conta"}
              </Button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-500">
                {mode === "login" ? "Nao tem uma conta?" : "Ja tem uma conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                >
                  {mode === "login" ? "Cadastre-se" : "Entrar"}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-center sm:px-8">
              <Link
                href="/redefinir-senha"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4" />
                Preciso de ajuda
              </Link>
            </div>

            <div className="border-t border-gray-200 px-5 py-4 text-center text-xs leading-5 text-gray-400 sm:px-8">
              Ao continuar, voce concorda com os Termos de Uso e a Politica de Privacidade do Norte Vivo.
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
