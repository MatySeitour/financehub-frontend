import { NavLink, Outlet } from "react-router";
import { FaUser } from "react-icons/fa";
import { navItems } from "@renderer/utils";

export function ProtectedLayout() {
  return (
    <div className="flex h-screen w-screen bg-slate-100">
      <nav className="relative flex h-full flex-col gap-4 bg-white p-4 shadow-xl">
        <div className="flex flex-col items-center gap-1">
          <FaUser className="size-5 min-w-5" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-800">
              Nombre de usuario
            </p>
            <p className="text-xs text-slate-600">Administrador</p>
          </div>
        </div>
        <div className="h-[1px] w-full bg-slate-200"></div>
        <ul className="flex flex-col gap-6">
          {navItems.map((navItem) => (
            <li key={navItem.name} className="h-auto w-full px-2 py-1">
              <NavLink
                className={({ isActive }) =>
                  `${isActive ? `!border-green-500 text-green-600 hover:text-green-600` : `text-slate-600 hover:border-slate-400 hover:text-slate-800`} flex h-auto w-full items-center border-r border-transparent`
                }
                to={navItem.linkTo}
              >
                <navItem.icon className="size-5 min-w-5" />
                <p className="rounded-lg px-4 py-2 font-medium">
                  {navItem.name}
                </p>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="bg-gra flex w-2/3 flex-grow flex-col">
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
