import { Link, NavLink } from "react-router-dom";
import { useRole } from "./roleContext";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { username, role } = useRole();
  const isLoggedIn = username !== "Гость" && username !== "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2 gap-4 max-w-7xl mx-auto">
        <span className="font-bold text-2xl shrink-0 text-emerald-600">
          Bikesbooking
        </span>

        <div className="flex flex-row gap-2 justify-center flex-1">
          <NavLink
            to="/models"
            className={({ isActive }) =>
              `rounded-sm p-1 text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 ${isActive ? "bg-emerald-100" : ""}`
            }
          >
            Каталог моделей
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `rounded-sm p-1 text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 ${isActive ? "bg-emerald-100" : ""}`
            }
          >
            Категории
          </NavLink>
          <NavLink
            to="/booking/available-bikes"
            className={({ isActive }) =>
              `rounded-sm p-1 text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 ${isActive ? "bg-emerald-100" : ""}`
            }
          >
            Букинг мотоциклов
          </NavLink>
          <NavLink
            to="/bikes"
            className={({ isActive }) =>
              `rounded-sm p-1 text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 ${isActive ? "bg-emerald-100" : ""}`
            }
          >
            Мотоциклы
          </NavLink>
          <NavLink
            to="/ide"
            className={({ isActive }) =>
              `rounded-sm p-1 text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 ${isActive ? "bg-emerald-100" : ""}`
            }
          >
            IDE
          </NavLink>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn && (
            <span className="text-sm font-medium text-slate-700">
              {username}
            </span>
          )}
          {role === "Admin" && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              Admin
            </span>
          )}

          {isLoggedIn ? (
            <Button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("username");
                window.location.href = "/login";
              }}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg border-0"
            >
              Выйти
            </Button>
          ) : (
            <Link to="/login">
              <Button className="text-xs bg-black text-white px-3 py-2 rounded-lg border-0 hover:bg-slate-800">
                Войти
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
