import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, LockKeyhole, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { httpClient } from "../utils";
import AuthLayout from "./authLayout";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await httpClient.post("/auth/register", { username, email, password });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Не удалось создать аккаунт.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Новый аккаунт"
      title="Создать аккаунт"
      description="Пара минут — и можно выбирать мотоцикл, оформлять доставку и управлять арендой."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-forest underline-offset-4 hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Имя" icon={<UserRound className="h-4 w-4" />}>
          <Input
            placeholder="Как к вам обращаться"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </Field>

        <Field label="Email" icon={<Mail className="h-4 w-4" />}>
          <Input
            type="email"
            placeholder="example@mail.com"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Пароль" icon={<LockKeyhole className="h-4 w-4" />}>
          <Input
            type="password"
            placeholder="Минимум 6 символов"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </Field>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-semibold text-paper transition-all hover:bg-ink/80 active:scale-[0.99] disabled:opacity-60"
        >
          {isLoading ? "Создаём..." : "Зарегистрироваться"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-6 border-t border-border/70 pt-5 text-center">
        <Link
          to="/register/courier"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-clay"
        >
          Хочу стать курьером
        </Link>
      </div>
    </AuthLayout>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
