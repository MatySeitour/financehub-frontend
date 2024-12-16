import { IconType } from "react-icons";

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
