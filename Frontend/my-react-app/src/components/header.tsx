export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className=" size-full grid grid-cols-[auto_1fr_auto] ">
        <span className="font-bold text-2xl">Bikesbooking</span>
        <div className="flex flex-row gap-2 justify-center">
          <button className="text-xl hover:underline cursor-pointer">
            Каталог моделей
          </button>
          <button className="text-xl hover:underline cursor-pointer">
            Категории
          </button>
        </div>
        <button className="text-xs font-light bg-black text-white px-3 py-2">
          Войти
        </button>
      </div>
    </header>
  );
}
