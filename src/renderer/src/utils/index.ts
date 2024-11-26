import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TiHome } from "react-icons/ti";
import { IoPeople } from "react-icons/io5";
import { FaGear, FaPeopleGroup } from "react-icons/fa6";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { IoLogoUsd } from "react-icons/io";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { IconType } from "react-icons";

type NavItem = {
  name: string;
  linkTo: string;
  icon: IconType;
};

export const cn = (...args: ClassValue[]) => {
  return twMerge(clsx(...args));
};

export const navItems: NavItem[] = [
  {
    name: "Inicio",
    linkTo: "/inicio",
    icon: TiHome,
  },
  {
    name: "Clientes",
    linkTo: "/clientes",
    icon: IoPeople,
  },
  {
    name: "Vendedores",
    linkTo: "/vendedores",
    icon: FaPeopleGroup,
  },
  {
    name: "Operaciones",
    linkTo: "/operaciones",
    icon: FaMoneyBillTransfer,
  },
  {
    name: "Cajas",
    linkTo: "/cajas",
    icon: IoLogoUsd,
  },
  {
    name: "Prestamos",
    linkTo: "/prestamos",
    icon: FaMoneyCheckDollar,
  },
  {
    name: "Configuraciones",
    linkTo: "/configuracion",
    icon: FaGear,
  },
];
