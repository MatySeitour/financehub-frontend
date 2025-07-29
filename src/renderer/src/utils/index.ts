import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ContextMenuState,
  ErrorResponse,
  MenuOption,
  NavItem,
  SessionResponse,
} from "./types";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import axios from "@renderer/hooks/axios";
import { ZodError } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BanknoteArrowUpIcon,
  CogIcon,
  DollarSignIcon,
  HandCoinsIcon,
  HouseIcon,
  LandmarkIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";

export const errorAuth = [
  "not_organization",
  "org_step_1",
  "org_step_2",
  "org_step_3",
];

export const cn = (...args: ClassValue[]) => {
  return twMerge(clsx(...args));
};

export function errorsResponse(error: any) {
  console.error(error);
  if (error instanceof ZodError) {
    console.error(error?.errors);
    throw {
      code: "zod_validation",
      data: "Error: Solicitud mal formada",
    } as ErrorResponse;
  } else if (error.response) {
    const status = error.response.status;

    if (status === 401)
      throw { code: "unauthorized", data: null } as ErrorResponse;

    if (status === 400) {
      throw {
        code: "bad_request",
        data: error?.response?.data?.message,
      } as ErrorResponse;
    }

    if (status === 422) {
      const errorsChecked = Object.fromEntries(
        Object.entries(
          error?.response?.data?.errors as Record<string, string[]>,
        ).map(([key, val]) => {
          if (val[0].includes("has already been taken")) {
            return [key, ["Esté valor ya está en uso."]];
          } else {
            return [key, val];
          }
        }),
      );
      throw {
        code: "unprocess_fields",
        data: errorsChecked,
      } as ErrorResponse;
    }

    throw { code: "server-error", data: null } as ErrorResponse;
  } else {
    throw { code: "connection-error", data: null } as ErrorResponse;
  }
}

export async function getSession(
  cookie: string | undefined,
): Promise<SessionResponse> {
  if (!cookie) {
    throw { status: 401, message: "invalid_token" };
  }
  try {
    const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
    const rawSession = await AxiosFetch.get("/api/user");
    return { ...rawSession.data, error: undefined };
  } catch (e: any) {
    console.log("Error de intento de sesión: \n", e);
    const errorMessage =
      e?.response?.data?.error ?? e?.response?.data?.message ?? "unknown_error";
    throw { status: e?.response?.status || 500, message: errorMessage };
  }
}

export const openContextMenuHandler = (
  e: any,
  setContextMenu: (contextMenu: ContextMenuState) => void,
) => {
  const isInsideTableHeadRow = (e?.target as HTMLElement).closest(
    '[role="gridcell"]',
  );
  if (isInsideTableHeadRow) {
    const element = document.querySelectorAll("#table-container");

    const elementLength = element.length - 1;

    setContextMenu({ show: true, x: 0, y: 0, visible: false });
    e?.preventDefault();

    setTimeout(() => {
      const menuElement = document.getElementById("menuOptions");
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      const tableRect = element[elementLength]?.getBoundingClientRect();

      const offsetX = e.clientX + scrollX;
      const offsetY = e.clientY + scrollY;
      if (tableRect) {
        let menuX = offsetX - tableRect?.left;
        let menuY = offsetY - tableRect?.top;

        const menuWidth = menuElement?.getBoundingClientRect()?.width;
        const menuHeight = menuElement?.getBoundingClientRect()?.height;

        const containerRect = element[elementLength]
          ?.closest("#table-container")
          ?.getBoundingClientRect();

        if (containerRect && menuWidth && menuHeight) {
          menuX + menuWidth > containerRect.width
            ? (menuX = containerRect.width - menuWidth)
            : (menuX = menuX + 40);

          menuY + menuHeight > containerRect?.height
            ? (menuY = containerRect.height - menuHeight)
            : (menuY = menuY - 50);
        }
        setContextMenu({ show: true, x: menuX, y: menuY, visible: true });
      }
    }, 0);
  } else {
    setContextMenu({ show: false, x: 0, y: 0, visible: false });
  }
};

export const closeContextMenuHandler = (
  setContextMenu: (contextMenu: ContextMenuState) => void,
) => {
  setContextMenu({ show: false, x: 0, y: 0, visible: false });
};

export function dynamicSort(array: any[], key: string, order: "asc" | "desc") {
  const [baseKey, subKey] = key.split(".");

  return array.sort((a, b) => {
    const valueA = subKey ? a[baseKey]?.[subKey] : a[baseKey];
    const valueB = subKey ? b[baseKey]?.[subKey] : b[baseKey];

    if (valueA == null || valueB == null) return 0;

    const result =
      typeof valueA === "string"
        ? valueA.localeCompare(valueB)
        : valueA - valueB;

    return order === "asc" ? result : -result;
  });
}

export const useTableTheme = () =>
  useTheme([
    getTheme(),
    {
      HeaderRow: `
        color: #687387;
        font-size: 12px;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        border-top: 1px solid red;
      `,
      Table: `
      `,
      Header: `
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
      `,
      Row: `
        border-right: 1px solid #dddc;
      `,
      Cell: `
        padding: 6px;
        color: #8b94a5;
        font-weight: 500;
      `,
      HeaderCell: `
        font-weight: 500;
      `,
    },
  ]);

export const navItems: NavItem[] = [
  {
    name: "Inicio",
    linkTo: "/home",
    icon: HouseIcon,
  },
  {
    name: "Clientes",
    linkTo: "/clientes",
    icon: UsersIcon,
  },
  {
    name: "Vendedores",
    linkTo: "/vendedores",
    icon: HandCoinsIcon,
  },
  {
    name: "Operaciones",
    linkTo: "/operaciones",
    icon: BanknoteArrowUpIcon,
  },
  {
    name: "Cajas",
    linkTo: "/cajas",
    icon: DollarSignIcon,
  },
  {
    name: "Prestamos",
    linkTo: "/prestamos",
    icon: LandmarkIcon,
  },
  {
    name: "Configuraciones",
    linkTo: "/configuracion",
    icon: CogIcon,
  },
];

export const contextMenuBasicOptions: Array<MenuOption> = [
  {
    name: "Editar",
    icon: PencilIcon,
    route: undefined,
  },
  {
    name: "Eliminar",
    icon: Trash2Icon,
    route: undefined,
  },
];

// parse date on badges
export const formatFullDateEs = (date: string) =>
  format(date, "dd 'de' MMMM 'a las' hh:mm:ss", {
    locale: es,
  });
