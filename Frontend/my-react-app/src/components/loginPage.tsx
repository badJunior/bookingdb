import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { httpClient } from "../utils";
import AuthLayout from "./authLayout";
import { useRole } from "./roleContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useRole();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await httpClient.post("/auth/login", { email, password });
      const { token, role, username, courierApproved } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);
      localStorage.setItem("courierApproved", String(Boolean(courierApproved)));

      refresh();

      if (role === "Courier") navigate("/courier");
      else if (role === "Admin") navigate("/admin/deliveries");
      else navigate("/booking/available-bikes");
    } catch (err: any) {
      setError(err.response?.data?.message || "Неверный email или пароль.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Вход в аккаунт"
      title="С возвращением"
      description="Войдите, чтобы бронировать мотоциклы, следить за доставкой или выйти на смену."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-forest underline-offset-4 hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="••••••••"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {isLoading ? "Проверяем..." : "Войти"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-6 border-t border-border/70 pt-5 text-center">
        <Link
          to="/register/courier"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-clay"
        >
          Я курьер · подать заявку
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
