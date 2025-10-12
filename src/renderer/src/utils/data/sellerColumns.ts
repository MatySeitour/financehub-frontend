/* UTILS*/

import { Seller } from "@renderer/hooks/seller";
import { getNextDueDate } from "../functions/loanUtils";
import { LoanExample, OperationsExample, SellerExample } from "../types/seller.types";

//Columns of the sellers table
export const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: Seller) => item.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Numero de telefono",
    key: "phone",
    render: (item: Seller) => item.phone,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Informacion adicional",
    key: "info",
    render: (item: Seller) => item.info,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
// Columns of the operations table
export const OPERATIONS_COLUMNS = [
  {
    label: "Fecha",
    key: "date",
    render: (item: OperationsExample) => item.date.toLocaleDateString("es-AR"),
  },
  {
    label: "Cliente",
    key: "clientName",
    render: (item: OperationsExample) => item.clientName,
  },
  {
    label: "Tipo de operación",
    key: "operationType",
    render: (item: OperationsExample) => item.operationType,
  },
  {
    label: "Moneda",
    key: "currency",
    render: (item: OperationsExample) => item.currency,
  },
  {
    label: "Cantidad",
    key: "amount",
    render: (item: OperationsExample) => item.amount.toLocaleString(),
  },
  {
    label: "Precio",
    key: "price",
    render: (item: OperationsExample) => `$${item.price.toLocaleString()}`,
  },
  {
    label: "Total",
    key: "total",
    render: (item: OperationsExample) => `$${item.total.toLocaleString()}`,
  },
  {
    label: "Precio mercado",
    key: "marketPrice",
    render: (item: OperationsExample) =>
      `$${item.marketPrice.toLocaleString()}`,
  },
  {
    label: "Ganancia neta",
    key: "netProfit",
    render: (item: OperationsExample) => `$${item.netProfit.toLocaleString()}`,
  },
];
//Columns of the loans table
export const LOANS_COLUMNS = [
  //AGREGAR CLIENTE
  {
    label: "Cliente",
    key: "clientName",
    render: (item: LoanExample) => item.clientName,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Capital",
    key: "principal",
    render: (item: LoanExample) => `$${item.principal.toLocaleString("es-ES")}`,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Divisa",
    key: "currency",
    render: (item: LoanExample) => item.currency,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Valor de la cuota",
    key: "installment",
    render: (item: LoanExample) =>
      `$${item.installmentValue.toLocaleString("es-ES")}`,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Número de cuota",
    key: "installmentProgress",
    render: (item: LoanExample) => {
      const paid = item.installments.filter(
        (inst) => inst.pay === inst.value,
      ).length;
      const total = item.numberOfInstallments;

      if (paid >= total) return "Completado";
      return `${paid + 1}/${total}`;
    },
  },
  {
    label: "Proximo vencimiento",
    key: "nextDueDate",
    render: (item: LoanExample) => {
      const { dateString } = getNextDueDate(item);
      return dateString;
    },
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
