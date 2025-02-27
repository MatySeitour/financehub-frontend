import { AxiosError } from "axios";
import { IconType } from "react-icons";

export type ErrorResponse =
  | { code: "unauthorized"; data: null }
  | { code: "unprocess_fields"; data: Record<string, string[]> }
  | { code: "server-error"; data: null }
  | { code: "bad_request"; data: string }
  | { code: "connection-error"; data: null }
  | { code: "zod_validation"; data: string };

export type ServerError<T = any> = AxiosError<{
  code: string;
  data?: T | null;
}>;

export type User = {
  email: string;
  name: string;
  id: number;
  organization: {
    id: number;
    name: string;
  };
};

export type SessionResponse = {
  user?: User;
  error:
    | {
        status: number;
        message: string;
      }
    | undefined;
};

export type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  visible: boolean;
};

export type MenuOption = {
  name: string;
  icon: IconType;
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
  icon: IconType;
};
