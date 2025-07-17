/* IMPORTS */
import { ModalState } from "@renderer/utils/types";

/* DATA TYPES */
//Modals to open
export type ModalStateSeller = ModalState | "detalles" | "eliminar" | "editar";
//Data type of what i will recieve from the API (seller)
export type SellerExample = {
  id: number;
  name: string;
  phoneNumber: number;
  description: string;
  clients: ClientExample[];
  operations: OperationsExample[];
  loans: LoanExample[];
};
//Data type of what i will recieve from the API (clients)
export type ClientExample = {
  id: number;
  name: string;
  phoneNumber: number; //no lo necesito
};
//Data type of what i will recieve from the API (operations)
export type OperationsExample = {
  id: number;
  clientName: string;
  date: Date;
  operationType: "Compra" | "Venta";
  currency: "dolares" | "reales" | "euros";
  amount: number;
  price: number;
  total: number;
  marketPrice: number;
  netProfit: number;
  commission: number;
};
//Data type of what i will recieve from the API (loan)
export type LoanExample = {
  id: number;
  clientName: string;
  principal: number;
  currency: string;
  installmentValue: number;
  numberOfInstallments: number; //no la necesito
  paymentFrecuency: string; //no la necesito
  firstDueDate: Date; //no la necesito
  totalPaid: number | null;
  commission: number;
  installments: Installment[];
};
//Data type of what i will recieve from the API (installments of loans)
export type Installment = {
  id: number;
  number: number; //no lo necesito
  value: number; //no lo necesito
  dueDate: string;
  pay: number | null; //no lo necesito
  paymentDate?: string; //no lo necesito
};
