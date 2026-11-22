import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Phone, Truck, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { httpClient } from "../utils";
import AuthLayout from "./authLayout";

export default function RegisterCourierPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await httpClient.post("/auth/register/courier", form);
      setDone(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Не удалось отправить заявку.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout
        eyebrow="Заявка отправлена"
        title="Осталось дождаться одобрения"
        description="Администратор проверит заявку и включит доступ к заказам. Пока можно войти и посмотреть статус."
        footer={
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Перейти ко входу
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/30 text-forest">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Аккаунт курьера создан. После одобрения вы сможете выйти на линию,
            передавать геолокацию и получать заказы.
          </p>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-5 text-sm font-semibold text-paper transition hover:bg-ink/80"
          >
            Войти <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Регистрация курьера"
      title="Стать курьером"
      description="Заполните данные — администратор подтвердит заявку, и вы сможете брать заказы на доставку мотоциклов."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Имя" icon={<UserRound className="h-4 w-4" />}>
          <Input
            placeholder="Имя и фамилия"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={form.username}
            onChange={(event) => update("username", event.target.value)}
            required
          />
        </Field>

        <Field label="Email" icon={<Mail className="h-4 w-4" />}>
          <Input
            type="email"
            placeholder="courier@mail.com"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </Field>

        <Field label="Телефон" icon={<Phone className="h-4 w-4" />}>
          <Input
            type="tel"
            placeholder="+7 900 000-00-00"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
          />
        </Field>

        <Field label="Пароль" icon={<LockKeyhole className="h-4 w-4" />}>
          <Input
            type="password"
            placeholder="Минимум 6 символов"
            className="h-12 rounded-2xl border-border bg-paper/60 pl-11 text-sm"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            minLength={6}
            required
          />
        </Field>

        <div className="flex items-start gap-3 rounded-2xl border border-lime-deep/30 bg-lime/15 p-3.5 text-xs text-forest">
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Во время смены браузер будет передавать вашу геолокацию, чтобы система
            назначала ближайшие заказы. Данные видны только администратору.
          </p>
        </div>

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
          {isLoading ? "Отправляем..." : "Отправить заявку"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
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
