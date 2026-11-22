import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";

const navLinks = [
  { to: "/booking/available-bikes", label: "Аренда" },
  { to: "/my-deliveries", label: "Мои доставки" },
  { to: "/bikes", label: "Мотоциклы" },
];

const catalogLinks = [
  { to: "/models", label: "Модели" },
  { to: "/categories", label: "Категории" },
  { to: "/register/courier", label: "Стать курьером" },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 bg-forest text-paper">
      <div className="h-1 w-full bg-lime" />

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
                <Motorcycle className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.3em]">
                  Bikebooking
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                  Омск · прокат мотоциклов
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/50">
              Аренда мотоциклов с доставкой к двери и забором после поездки.
              Автоназначение курьера, прозрачные статусы и понятная цена.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-paper/35">
              Сервис
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-paper/65 transition-colors hover:text-lime"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-paper/35">
              Каталог
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {catalogLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-paper/65 transition-colors hover:text-lime"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-paper/35">
              Контакты
            </p>
            <ul className="mt-4 space-y-3 text-sm text-paper/65">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <span>Волочаевская 17, Омск</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <span>Ежедневно, 09:00–21:00</span>
              </li>
              <li>
                <a
                  href="tel:+73812551717"
                  className="flex items-center gap-3 transition-colors hover:text-lime"
                >
                  <Phone className="h-4 w-4 shrink-0 text-lime" />
                  +7 (3812) 55-17-17
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@bikebooking.ru"
                  className="flex items-center gap-3 transition-colors hover:text-lime"
                >
                  <Mail className="h-4 w-4 shrink-0 text-lime" />
                  hello@bikebooking.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Bikebooking</span>
          <span>Омск · Волочаевская 17</span>
          <span>Доставка мотоциклов</span>
        </div>
      </div>
    </footer>
  );
}
