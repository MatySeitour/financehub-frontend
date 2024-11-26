import { Link, NavLink, Outlet } from "react-router"
import { FaUser } from "react-icons/fa";
import { navItems } from "@renderer/utils";



export function ProtectedLayout() {


    return (
        <div className="bg-red-600 w-screen h-screen flex">
            <nav className="relative flex flex-col p-4 h-full shadow-xl bg-white gap-4">
                <div className="flex gap-1 items-center flex-col">
                    <FaUser className="size-5 min-w-5" />
                    <div className="text-center">
                        <p className="text-sm text-slate-800 font-medium">Nombre de usuario</p>
                        <p className="text-xs text-slate-600">Administrador</p>
                    </div>
                </div>
                <div className="h-[1px] w-full bg-slate-200"></div>
                <ul className="flex flex-col gap-6">
                    {navItems.map((navItem) => (
                        <li key={navItem.name} className="w-full h-auto px-2 py-1">
                            <NavLink className={({ isActive }) => `${isActive ? `!border-green-500 text-green-600 hover:text-green-600` : `hover:text-slate-800 text-slate-600 hover:border-slate-400`} w-full h-auto flex items-center border-r border-transparent`} to={navItem.linkTo}>
                                <navItem.icon className="size-5 min-w-5" />
                                <p className="py-2 px-4 rounded-lg font-medium">{navItem.name}</p>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <section className="w-full h-full flex flex-col">
                <Outlet />
            </section>
        </div>
    )
}