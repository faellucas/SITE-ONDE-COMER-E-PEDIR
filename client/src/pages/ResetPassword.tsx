import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: result => {
      setMessage(result.message);
    },
    onError: error => {
      setMessage(error.message);
    },
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setMessage("Senha atualizada com sucesso. Agora voce ja pode entrar.");
      setTimeout(() => navigate("/entrar"), 1200);
    },
    onError: error => {
      setMessage(error.message);
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Link de recuperacao invalido.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas nao coincidem.");
      return;
    }

    await resetMutation.mutateAsync({ token, password });
  };

  const handleRequestReset = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setMessage("");
    await requestResetMutation.mutateAsync({ email });
  };

  const isTokenFlow = Boolean(token);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-10">
        <div className="mx-auto max-w-xl rounded-[28px] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
            {isTokenFlow ? (
              <ShieldCheck className="h-7 w-7" />
            ) : (
              <Mail className="h-7 w-7" />
            )}
          </div>
          <h1 className="font-display text-3xl font-black text-gray-900">
            {isTokenFlow ? "Redefinir senha" : "Recuperar senha"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isTokenFlow
              ? "Escolha uma nova senha para voltar a acessar sua conta com seguranca."
              : "Informe seu email para receber a recuperacao de acesso e continuar entrando no painel certo."}
          </p>

          {isTokenFlow ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nova senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Minimo de 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirmar senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={6}
                  required
                />
              </div>

              {message && (
                <div className={`rounded-2xl p-4 text-sm ${resetMutation.isError ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-brand-gradient py-6 text-base font-bold text-white hover:opacity-90"
                disabled={resetMutation.isPending}
              >
                <KeyRound className="mr-2 h-5 w-5" />
                {resetMutation.isPending ? "Atualizando..." : "Salvar nova senha"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="mt-6 space-y-4">
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

              {message && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-2xl bg-brand-gradient py-6 text-base font-bold text-white hover:opacity-90"
                disabled={requestResetMutation.isPending}
              >
                <Mail className="mr-2 h-5 w-5" />
                {requestResetMutation.isPending
                  ? "Enviando..."
                  : "Receber recuperacao por email"}
              </Button>
            </form>
          )}

          <Link href="/entrar">
            <Button variant="ghost" className="mt-4 w-full rounded-2xl">
              Voltar para login
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
