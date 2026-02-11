import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ContextMenuState, ErrorResponse, NavItem, ServerError } from "./types";
import axios from "@renderer/hooks/axios";
import { ZodError } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BanknoteArrowUpIcon,
  Building2,
  Building2Icon,
  CircleUserRoundIcon,
  CogIcon,
  CoinsIcon,
  DollarSignIcon,
  HandCoinsIcon,
  HouseIcon,
  IdCardIcon,
  KeyRoundIcon,
  LandmarkIcon,
  LucideIcon,
  ReceiptIcon,
  ShieldUserIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import { sessionSchema, TSession } from "@renderer/hooks/user";

export const errorAuth = [
  "not_organization",
  "org_step_1",
  "org_step_2",
  "org_step_3",
];

export const cn = (...args: ClassValue[]) => {
  return twMerge(clsx(...args));
};

export function strNormalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getErrorMessage(error: ServerError | null) {
  if (!error) return "";

  console.error("[getErrorMessage]", error);

  if (error.response?.data.message) return error.response?.data.message;
  if (error.code === "ERR_NETWORK") return "Sin conexión";
  return "Ocurrió un error inesperado";
}

export function errorsResponse(error: any) {
  console.error(error);
  if (error instanceof ZodError) {
    console.error(error?.errors);
    throw {
      code: "zod_validation",
      message: "Error: Solicitud mal formada",
    } as ErrorResponse;
  } else if (error.response) {
    const status = error.response.status;

    if (status === 401)
      throw { code: "unauthorized", message: null } as ErrorResponse;

    if (status === 400) {
      throw {
        code: "bad_request",
        message: error?.response?.data?.message,
      } as ErrorResponse;
    }

    if (status === 422) {
      throw {
        code: "unprocess_fields",
        message: error?.response?.data?.message,
      } as ErrorResponse;
    }

    throw { code: "server-error", message: error.message } as ErrorResponse;
  } else {
    throw {
      code: "connection-error",
      message: "Error de conexion",
    } as ErrorResponse;
  }
}

export async function getSession(
  cookie: string | undefined,
): Promise<TSession> {
  if (!cookie) {
    throw { status: 401, message: "invalid_token" };
  }
  try {
    const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
    const { data } = await AxiosFetch.get("/api/user");
    return sessionSchema.parse(data.data);
  } catch (e: any) {
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

      const tableRect = element[elementLength]?.getBoundingClientRect();

      const menuWidth = menuElement?.getBoundingClientRect()?.width;
      const menuHeight = menuElement?.getBoundingClientRect()?.height;

      if (tableRect && menuWidth) {
        setContextMenu({
          show: true,
          x:
            menuWidth + e.clientX > tableRect.width
              ? e.clientX - 150
              : e.clientX,
          y:
            menuHeight + e.clientY > tableRect.height
              ? e.clientY - 50
              : e.clientY,
          visible: true,
        });
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

export const getDaysRemaingStatusSyles = (days) => {
  if (days > 20) {
    return {
      circleClass: "bg-primary shadow-primary text-primary",
      tooltipClass: "text-primary",
    };
  } else if (days > 5 && days < 19) {
    return {
      circleClass: "bg-warning shadow-warning ext-warning",
      tooltipClass: "text-warning",
    };
  } else if (days > 0 && days < 5) {
    return {
      circleClass: "bg-danger shadow-danger text-danger",
      tooltipClass: "text-danger",
    };
  }
  return {
    circleClass: "bg-purple-500 shadow-purple-500 text-purple-500",
    tooltipClass: "text-purple-500",
  };
};

export const getInstallmentStatusSyles = (
  currentInstallment: number,
  numberOfInstallments: number,
) => {
  const quarterInstallment = numberOfInstallments / 4;

  if (currentInstallment > quarterInstallment * 3) return "text-warning";

  if (currentInstallment > quarterInstallment) return "text-orange-500";
  return "text-danger";
};

/* Sections navigate */
export const navItems: NavItem[] = [
  {
    name: "Inicio",
    linkTo: "/home",
    icon: HouseIcon,
    disabled: false,
  },
  {
    name: "Clientes",
    linkTo: "/clients",
    icon: UsersIcon,
    disabled: false,
  },
  {
    name: "Vendedores",
    linkTo: "/sellers",
    icon: HandCoinsIcon,
    disabled: false,
  },
  {
    name: "Operaciones",
    linkTo: "/operations",
    icon: BanknoteArrowUpIcon,
    disabled: false,
  },
  {
    name: "Cajas",
    linkTo: "/boxes",
    icon: DollarSignIcon,
    disabled: false,
  },
  {
    name: "Prestamos",
    linkTo: "/loans",
    icon: LandmarkIcon,
    disabled: false,
  },
  {
    name: "Cuentas corrientes",
    linkTo: "/checking-accounts",
    icon: IdCardIcon,
    disabled: false,
  },
  {
    name: "Comisiones",
    linkTo: "/commissions",
    icon: CoinsIcon,
    disabled: false,
  },
  {
    name: "Configuraciones",
    linkTo: "/settings",
    icon: CogIcon,
    disabled: true,
  },
];

type AccountNavItem = {
  name: string;
  linkTo: string;
  icon: LucideIcon;
  disabled: boolean;
};
export const accountNavItems = (orgID: number): AccountNavItem[] => [
  {
    name: "Mi organización",
    linkTo: `/${orgID}/organization`,
    icon: Building2Icon,
    disabled: true,
  },
  {
    name: "Mi cuenta",
    linkTo: `/${orgID}/account`,
    icon: CircleUserRoundIcon,
    disabled: true,
  },
];

// parse date on badges
export const formatFullDateEs = (date: string) =>
  format(date, "dd 'de' MMMM 'a las' hh:mm:ss", {
    locale: es,
  });

export const withCbk = <S, E>(options: {
  queryFn: () => Promise<S>;
  onSuccess?: (d: S) => void;
  onError?: (e: E) => void;
}) => {
  return async () => {
    try {
      const data = await options.queryFn();
      options.onSuccess?.(data);
      return data;
    } catch (e) {
      options.onError?.(e as E);
      throw e;
    }
  };
};

export type TabMovimentsNames =
  | "operations"
  | "loans"
  | "installments"
  | "moviments"
  | "commissions";

export const tabsMoviments: {
  label: string;
  icon: LucideIcon;
  name: TabMovimentsNames;
}[] = [
  {
    label: "Operaciones",
    icon: BanknoteArrowUpIcon,
    name: "operations",
  },
  {
    label: "Préstamos",
    icon: LandmarkIcon,
    name: "loans",
  },
  {
    label: "Cuotas",
    icon: WalletCardsIcon,
    name: "installments",
  },
  {
    label: "Commisiones",
    icon: HandCoinsIcon,
    name: "commissions",
  },
  {
    label: "Otros",
    icon: ReceiptIcon,
    name: "moviments",
  },
] as const;

export const settingSectionsTabs: {
  label: string;
  icon: LucideIcon;
  name: string;
}[] = [
  {
    label: "Organización",
    icon: Building2,
    name: "organization",
  },
  {
    label: "Mi perfil",
    icon: ShieldUserIcon,
    name: "profile",
  },
  {
    label: "Permisos",
    icon: KeyRoundIcon,
    name: "rols",
  },
] as const;
