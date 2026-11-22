import { Outlet } from "react-router-dom";
import AppMenu from "./appMenu";
import Footer from "./footer";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppMenu />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
