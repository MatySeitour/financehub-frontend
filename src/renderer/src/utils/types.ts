import { AxiosError } from "axios";
import { LucideIcon } from "lucide-react";

export type ErrorResponse =
  | { code: "unauthorized"; message: null }
  | { code: "unprocess_fields"; message: Record<string, string[]> }
  | { code: "server-error"; message: string }
  | { code: "bad_request"; message: string }
  | { code: "connection-error"; message: string }
  | { code: "zod_validation"; message: string };

export type Roles = "admin" | "empleado";

export type ServerError = AxiosError<{
  success: boolean;
  status: number;
  message: string;
}>;

export type BaseResponseServer = {
  status: number;
  message: string;
};

export type User = {
  email: string;
  name: string;
  id: number;
  organization: {
    id: number;
    name: string;
  };
  role: {
    id: number;
    name: Roles;
  };
};

export type SessionResponse = {
  user?: User;
  error?: BaseResponseServer;
};

export type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  visible: boolean;
};

export type MenuOption = {
  name: string;
  icon: LucideIcon;
  route: undefined | string;
  queryData?: number | string;
};

export type ModalState =
  | ""
  | "agregar"
  | "editar"
  | "eliminar"
  | "refetchDatos"
  | "completado";

export type NavItem = {
  name: string;
  linkTo: string;
  icon: LucideIcon;
};

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
