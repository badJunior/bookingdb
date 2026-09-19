import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { httpClient } from "../utils";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await httpClient.post("/auth/register", { username, email, password });
      localStorage.setItem("username", username);
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка регистрации.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50/60 overflow-hidden p-4">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/30 to-lime-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-200/20 to-emerald-100/30 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/40 rounded-3xl">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="inline-block text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-400 bg-clip-text text-transparent mb-1">
            BikeBooking
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
            Создать аккаунт
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Заполните данные для регистрации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Имя
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Иван Иванов"
                className="h-11 rounded-xl border-slate-200 bg-white/60 px-3.5 text-sm text-slate-900"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                className="h-11 rounded-xl border-slate-200 bg-white/60 px-3.5 text-sm text-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-xl border-slate-200 bg-white/60 px-3.5 text-sm text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 border-0"
              disabled={isLoading}
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
            Уже есть аккаунт?{" "}
            <a
              href="/login"
              className="font-semibold text-emerald-600 hover:underline"
            >
              Войти
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
