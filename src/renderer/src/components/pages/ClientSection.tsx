/* IMPORTS */
import { Button } from "@heroui/react";
import { useRef, useState, useEffect } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import { MenuOption, ModalState } from "@renderer/utils/types";
import { GoPaperclip } from "react-icons/go";
import { IoPeople } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { addDays, addMonths, addWeeks, format } from "date-fns";

/* DATA TYPES */
//Modals to open
type ModalStateClients = ModalState | "detalles";
//Loan example of what i will recieve from the API
type ClientExample = {
  id: number;
  name: string;
  address: string;
  phoneNumber: number;
  referredBy: string;
  description: string;
  operations: OperationsExample[];
  loans: LoanExample[];
};
type OperationsExample = {
  id: number;
  date: Date;
  operationType: "Compra" | "Venta";
  currency: "dolares" | "reales" | "euros";
  amount: number;
  price: number;
  total: number;
  marketPrice: number; // nuevo campo obligatorio
  netProfit: number; // se calcula automáticamente
};
//Loan example of what i will recieve from the API
type LoanExample = {
  id: number;
  seller: string;
  principal: number;
  currency: string;
  installment: number;
  numberOfInstallments: number;
  paymentFrecuency: string;
  firstDueDate: Date;
  totalPaid: number | null;
  commission: number;
  installments: Installment[];
};
//Installment example of what i will recieve from the API
type Installment = {
  id: number;
  number: number;
  value: number;
  dueDate: string;
  pay: number | null;
  paymentDate?: string;
};

/* UTILS*/
//Clients table's columns
const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: ClientExample) => item.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Direccion",
    key: "address",
    render: (item: ClientExample) => item.address,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Numero de telefono",
    key: "phoneNumber",
    render: (item: ClientExample) => item.phoneNumber,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Referido por",
    key: "referredBy",
    render: (item: ClientExample) => item.referredBy,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Informacion adicional",
    key: "description",
    render: (item: ClientExample) => item.description,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
// Operations table's columns
const OPERATIONS_COLUMNS = [
  {
    label: "Fecha",
    key: "date",
    render: (item: OperationsExample) => item.date.toLocaleDateString("es-AR"),
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
//Loans table's columns
const LOANS_COLUMNS = [
  {
    label: "Vendedor",
    key: "seller",
    render: (item: LoanExample) => item.seller,
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
      `$${item.installment.toLocaleString("es-ES")}`,
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

//Custom menu options
const contextMenuOption: MenuOption[] = [
  {
    name: "Detalles",
    icon: GoPaperclip,
    route: undefined,
  },
] as const;
//Array de clientes con préstamos asociados
const originalClients = [
  {
    id: 1,
    name: "Gisela",
    address: "Sulivan y Centenario",
    phoneNumber: 1145259875,
    referredBy: "Alejandro",
    description: "Locales en libertad, Av. Eva Peron en frente de el pinito.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-06-22"),
        operationType: "Compra",
        currency: "dolares",
        amount: 2500,
        price: 1220,
        total: 2500 * 1220,
        marketPrice: 1240,
      },
      {
        id: 2,
        date: new Date("2024-07-15"),
        operationType: "Venta",
        currency: "dolares",
        amount: 1800,
        price: 1280,
        total: 1800 * 1280,
        marketPrice: 1260,
      },
      {
        id: 3,
        date: new Date("2024-08-03"),
        operationType: "Compra",
        currency: "euros",
        amount: 1200,
        price: 1340,
        total: 1200 * 1340,
        marketPrice: 1355,
      },
      {
        id: 4,
        date: new Date("2024-08-20"),
        operationType: "Venta",
        currency: "euros",
        amount: 800,
        price: 1390,
        total: 800 * 1390,
        marketPrice: 1375,
      },
      {
        id: 5,
        date: new Date("2024-09-12"),
        operationType: "Compra",
        currency: "reales",
        amount: 5000,
        price: 230,
        total: 5000 * 230,
        marketPrice: 235,
      },
      {
        id: 6,
        date: new Date("2024-09-28"),
        operationType: "Venta",
        currency: "reales",
        amount: 3200,
        price: 245,
        total: 3200 * 245,
        marketPrice: 240,
      },
      {
        id: 7,
        date: new Date("2024-10-10"),
        operationType: "Compra",
        currency: "dolares",
        amount: 3500,
        price: 1180,
        total: 3500 * 1180,
        marketPrice: 1195,
      },
      {
        id: 8,
        date: new Date("2024-11-05"),
        operationType: "Venta",
        currency: "dolares",
        amount: 2200,
        price: 1250,
        total: 2200 * 1250,
        marketPrice: 1230,
      },
      {
        id: 9,
        date: new Date("2024-11-22"),
        operationType: "Compra",
        currency: "euros",
        amount: 1500,
        price: 1420,
        total: 1500 * 1420,
        marketPrice: 1435,
      },
      {
        id: 10,
        date: new Date("2024-12-08"),
        operationType: "Venta",
        currency: "euros",
        amount: 900,
        price: 1480,
        total: 900 * 1480,
        marketPrice: 1465,
      },
    ]),
    loans: [
      {
        id: 1,
        seller: "Alejandro",
        principal: 1000000,
        currency: "pesos",
        installment: 160000,
        numberOfInstallments: 8,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-06-05"),
        totalPaid: null,
        installments: [],
        commission: 92400,
      },
      {
        id: 11,
        seller: "Alejandro",
        principal: 100000,
        currency: "dolares",
        installment: 20000,
        numberOfInstallments: 6,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-06-25"),
        totalPaid: null,
        installments: [],
        commission: 50000,
      },
      {
        id: 12,
        seller: "Alejandro",
        principal: 750000,
        currency: "pesos",
        installment: 200000,
        numberOfInstallments: 5,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-06-05"),
        totalPaid: null,
        installments: [],
        commission: 100000,
      },
    ],
  },
  {
    id: 2,
    name: "Carlos",
    address: "Av. Rivadavia 8400",
    phoneNumber: 1134567890,
    referredBy: "Karina",
    description: "Dueño de local de ropa deportiva, a media cuadra del Coto.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-05-10"),
        operationType: "Compra",
        currency: "dolares",
        amount: 5000,
        price: 1150,
        total: 5000 * 1150,
        marketPrice: 1165,
      },
      {
        id: 2,
        date: new Date("2024-05-25"),
        operationType: "Venta",
        currency: "dolares",
        amount: 3000,
        price: 1200,
        total: 3000 * 1200,
        marketPrice: 1185,
      },
      {
        id: 3,
        date: new Date("2024-06-18"),
        operationType: "Compra",
        currency: "euros",
        amount: 2500,
        price: 1290,
        total: 2500 * 1290,
        marketPrice: 1305,
      },
      {
        id: 4,
        date: new Date("2024-07-02"),
        operationType: "Venta",
        currency: "euros",
        amount: 1800,
        price: 1350,
        total: 1800 * 1350,
        marketPrice: 1335,
      },
      {
        id: 5,
        date: new Date("2024-07-20"),
        operationType: "Compra",
        currency: "reales",
        amount: 8000,
        price: 210,
        total: 8000 * 210,
        marketPrice: 218,
      },
      {
        id: 6,
        date: new Date("2024-08-15"),
        operationType: "Venta",
        currency: "reales",
        amount: 6000,
        price: 225,
        total: 6000 * 225,
        marketPrice: 220,
      },
      {
        id: 7,
        date: new Date("2024-09-08"),
        operationType: "Compra",
        currency: "dolares",
        amount: 4200,
        price: 1170,
        total: 4200 * 1170,
        marketPrice: 1185,
      },
      {
        id: 8,
        date: new Date("2024-10-12"),
        operationType: "Venta",
        currency: "dolares",
        amount: 2800,
        price: 1220,
        total: 2800 * 1220,
        marketPrice: 1205,
      },
      {
        id: 9,
        date: new Date("2024-11-01"),
        operationType: "Compra",
        currency: "euros",
        amount: 1200,
        price: 1380,
        total: 1200 * 1380,
        marketPrice: 1395,
      },
      {
        id: 10,
        date: new Date("2024-12-15"),
        operationType: "Venta",
        currency: "euros",
        amount: 800,
        price: 1450,
        total: 800 * 1450,
        marketPrice: 1435,
      },
    ]),
    loans: [
      {
        id: 2,
        seller: "Alejandro",
        principal: 2000000,
        currency: "pesos",
        installment: 300000,
        numberOfInstallments: 9,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-07-06"),
        totalPaid: null,
        installments: [],
        commission: 200000,
      },
      {
        id: 4,
        seller: "Martín",
        principal: 12000,
        currency: "dolares",
        installment: 2300,
        numberOfInstallments: 6,
        paymentFrecuency: "quincenal",
        firstDueDate: new Date("2025-08-01"),
        totalPaid: null,
        installments: [],
        commission: 500,
      },
    ],
  },
  {
    id: 3,
    name: "Romina",
    address: "Mitre y Las Heras",
    phoneNumber: 1167894321,
    referredBy: "Facundo",
    description: "Local de regalería y bazar, frente a la farmacia.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-04-15"),
        operationType: "Compra",
        currency: "dolares",
        amount: 1500,
        price: 1120,
        total: 1500 * 1120,
        marketPrice: 1135,
      },
      {
        id: 2,
        date: new Date("2024-05-08"),
        operationType: "Venta",
        currency: "dolares",
        amount: 1200,
        price: 1180,
        total: 1200 * 1180,
        marketPrice: 1165,
      },
      {
        id: 3,
        date: new Date("2024-06-12"),
        operationType: "Compra",
        currency: "reales",
        amount: 3500,
        price: 205,
        total: 3500 * 205,
        marketPrice: 212,
      },
      {
        id: 4,
        date: new Date("2024-07-05"),
        operationType: "Venta",
        currency: "reales",
        amount: 2800,
        price: 220,
        total: 2800 * 220,
        marketPrice: 215,
      },
      {
        id: 5,
        date: new Date("2024-08-18"),
        operationType: "Compra",
        currency: "euros",
        amount: 800,
        price: 1310,
        total: 800 * 1310,
        marketPrice: 1325,
      },
      {
        id: 6,
        date: new Date("2024-09-22"),
        operationType: "Venta",
        currency: "euros",
        amount: 600,
        price: 1370,
        total: 600 * 1370,
        marketPrice: 1355,
      },
      {
        id: 7,
        date: new Date("2024-10-15"),
        operationType: "Compra",
        currency: "dolares",
        amount: 2200,
        price: 1195,
        total: 2200 * 1195,
        marketPrice: 1210,
      },
      {
        id: 8,
        date: new Date("2024-11-08"),
        operationType: "Venta",
        currency: "dolares",
        amount: 1800,
        price: 1255,
        total: 1800 * 1255,
        marketPrice: 1240,
      },
      {
        id: 9,
        date: new Date("2024-11-28"),
        operationType: "Compra",
        currency: "reales",
        amount: 4000,
        price: 238,
        total: 4000 * 238,
        marketPrice: 245,
      },
      {
        id: 10,
        date: new Date("2024-12-20"),
        operationType: "Venta",
        currency: "reales",
        amount: 3200,
        price: 248,
        total: 3200 * 248,
        marketPrice: 243,
      },
    ]),
    loans: [
      {
        id: 3,
        seller: "Lucía",
        principal: 1500,
        currency: "euros",
        installment: 250,
        numberOfInstallments: 8,
        paymentFrecuency: "quincenal",
        firstDueDate: new Date("2025-07-15"),
        totalPaid: null,
        installments: [],
        commission: 150,
      },
      {
        id: 5,
        seller: "Alejandro",
        principal: 180000,
        currency: "pesos",
        installment: 7000,
        numberOfInstallments: 30,
        paymentFrecuency: "diario",
        firstDueDate: new Date("2025-08-10"),
        totalPaid: null,
        installments: [],
        commission: 10000,
      },
    ],
  },
  {
    id: 4,
    name: "Luciano",
    address: "Calle 12 Nº 234",
    phoneNumber: 1154321987,
    referredBy: "Patricio",
    description: "Repartidor que también presta a conocidos del barrio.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-03-20"),
        operationType: "Compra",
        currency: "dolares",
        amount: 800,
        price: 1090,
        total: 800 * 1090,
        marketPrice: 1105,
      },
      {
        id: 2,
        date: new Date("2024-04-10"),
        operationType: "Venta",
        currency: "dolares",
        amount: 600,
        price: 1140,
        total: 600 * 1140,
        marketPrice: 1125,
      },
      {
        id: 3,
        date: new Date("2024-05-15"),
        operationType: "Compra",
        currency: "reales",
        amount: 2000,
        price: 198,
        total: 2000 * 198,
        marketPrice: 205,
      },
      {
        id: 4,
        date: new Date("2024-06-08"),
        operationType: "Venta",
        currency: "reales",
        amount: 1500,
        price: 215,
        total: 1500 * 215,
        marketPrice: 210,
      },
      {
        id: 5,
        date: new Date("2024-07-12"),
        operationType: "Compra",
        currency: "euros",
        amount: 500,
        price: 1280,
        total: 500 * 1280,
        marketPrice: 1295,
      },
      {
        id: 6,
        date: new Date("2024-08-25"),
        operationType: "Venta",
        currency: "euros",
        amount: 400,
        price: 1340,
        total: 400 * 1340,
        marketPrice: 1325,
      },
      {
        id: 7,
        date: new Date("2024-09-18"),
        operationType: "Compra",
        currency: "dolares",
        amount: 1200,
        price: 1175,
        total: 1200 * 1175,
        marketPrice: 1190,
      },
      {
        id: 8,
        date: new Date("2024-10-22"),
        operationType: "Venta",
        currency: "dolares",
        amount: 900,
        price: 1235,
        total: 900 * 1235,
        marketPrice: 1220,
      },
      {
        id: 9,
        date: new Date("2024-11-15"),
        operationType: "Compra",
        currency: "reales",
        amount: 2500,
        price: 240,
        total: 2500 * 240,
        marketPrice: 247,
      },
      {
        id: 10,
        date: new Date("2024-12-05"),
        operationType: "Venta",
        currency: "reales",
        amount: 2000,
        price: 252,
        total: 2000 * 252,
        marketPrice: 247,
      },
    ]),
    loans: [],
  },
  {
    id: 5,
    name: "Soledad",
    address: "Juan B. Justo 675",
    phoneNumber: 1144982211,
    referredBy: "Nacho",
    description: "Vive en PH, trabaja vendiendo productos de limpieza.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-02-28"),
        operationType: "Compra",
        currency: "dolares",
        amount: 1000,
        price: 1050,
        total: 1000 * 1050,
        marketPrice: 1065,
      },
      {
        id: 2,
        date: new Date("2024-03-15"),
        operationType: "Venta",
        currency: "dolares",
        amount: 800,
        price: 1110,
        total: 800 * 1110,
        marketPrice: 1095,
      },
      {
        id: 3,
        date: new Date("2024-04-22"),
        operationType: "Compra",
        currency: "euros",
        amount: 600,
        price: 1220,
        total: 600 * 1220,
        marketPrice: 1235,
      },
      {
        id: 4,
        date: new Date("2024-05-30"),
        operationType: "Venta",
        currency: "euros",
        amount: 450,
        price: 1285,
        total: 450 * 1285,
        marketPrice: 1270,
      },
      {
        id: 5,
        date: new Date("2024-06-25"),
        operationType: "Compra",
        currency: "reales",
        amount: 1800,
        price: 208,
        total: 1800 * 208,
        marketPrice: 215,
      },
      {
        id: 6,
        date: new Date("2024-08-02"),
        operationType: "Venta",
        currency: "reales",
        amount: 1400,
        price: 228,
        total: 1400 * 228,
        marketPrice: 223,
      },
      {
        id: 7,
        date: new Date("2024-09-10"),
        operationType: "Compra",
        currency: "dolares",
        amount: 1500,
        price: 1185,
        total: 1500 * 1185,
        marketPrice: 1200,
      },
      {
        id: 8,
        date: new Date("2024-10-18"),
        operationType: "Venta",
        currency: "dolares",
        amount: 1200,
        price: 1245,
        total: 1200 * 1245,
        marketPrice: 1230,
      },
      {
        id: 9,
        date: new Date("2024-11-25"),
        operationType: "Compra",
        currency: "euros",
        amount: 700,
        price: 1395,
        total: 700 * 1395,
        marketPrice: 1410,
      },
      {
        id: 10,
        date: new Date("2024-12-18"),
        operationType: "Venta",
        currency: "euros",
        amount: 550,
        price: 1465,
        total: 550 * 1465,
        marketPrice: 1450,
      },
    ]),
    loans: [
      {
        id: 9,
        seller: "Lucía",
        principal: 1800000,
        currency: "pesos",
        installment: 350000,
        numberOfInstallments: 6,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-09-30"),
        totalPaid: null,
        installments: [],
        commission: 100000,
      },
    ],
  },
  {
    id: 6,
    name: "Bruno",
    address: "Eva Perón y Cañada de Gómez",
    phoneNumber: 1178945632,
    referredBy: "Tiago",
    description: "Tiene un maxikiosco frente al club San Martín.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-01-18"),
        operationType: "Compra",
        currency: "dolares",
        amount: 3000,
        price: 1020,
        total: 3000 * 1020,
        marketPrice: 1035,
      },
      {
        id: 2,
        date: new Date("2024-02-12"),
        operationType: "Venta",
        currency: "dolares",
        amount: 2500,
        price: 1080,
        total: 2500 * 1080,
        marketPrice: 1065,
      },
      {
        id: 3,
        date: new Date("2024-03-28"),
        operationType: "Compra",
        currency: "reales",
        amount: 5500,
        price: 185,
        total: 5500 * 185,
        marketPrice: 192,
      },
      {
        id: 4,
        date: new Date("2024-04-18"),
        operationType: "Venta",
        currency: "reales",
        amount: 4200,
        price: 202,
        total: 4200 * 202,
        marketPrice: 197,
      },
      {
        id: 5,
        date: new Date("2024-05-25"),
        operationType: "Compra",
        currency: "euros",
        amount: 1800,
        price: 1250,
        total: 1800 * 1250,
        marketPrice: 1265,
      },
      {
        id: 6,
        date: new Date("2024-07-08"),
        operationType: "Venta",
        currency: "euros",
        amount: 1400,
        price: 1320,
        total: 1400 * 1320,
        marketPrice: 1305,
      },
      {
        id: 7,
        date: new Date("2024-08-22"),
        operationType: "Compra",
        currency: "dolares",
        amount: 3500,
        price: 1160,
        total: 3500 * 1160,
        marketPrice: 1175,
      },
      {
        id: 8,
        date: new Date("2024-09-30"),
        operationType: "Venta",
        currency: "dolares",
        amount: 2800,
        price: 1210,
        total: 2800 * 1210,
        marketPrice: 1195,
      },
      {
        id: 9,
        date: new Date("2024-11-12"),
        operationType: "Compra",
        currency: "reales",
        amount: 4800,
        price: 242,
        total: 4800 * 242,
        marketPrice: 249,
      },
      {
        id: 10,
        date: new Date("2024-12-22"),
        operationType: "Venta",
        currency: "reales",
        amount: 3800,
        price: 255,
        total: 3800 * 255,
        marketPrice: 250,
      },
    ]),
    loans: [
      {
        id: 6,
        seller: "Lucía",
        principal: 2000000,
        currency: "pesos",
        installment: 300000,
        numberOfInstallments: 8,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-08-22"),
        totalPaid: null,
        installments: [],
        commission: 100000,
      },
      {
        id: 7,
        seller: "Martín",
        principal: 800000,
        currency: "pesos",
        installment: 125000,
        numberOfInstallments: 8,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-08-02"),
        totalPaid: null,
        installments: [],
        commission: 50000,
      },
    ],
  },
  {
    id: 7,
    name: "Laura",
    address: "Ruta 21 km 24",
    phoneNumber: 1141123344,
    referredBy: "Fernando",
    description: "Hace venta ambulante en la feria los fines de semana.",
    operations: enrichOperations([
      {
        id: 1,
        date: new Date("2024-01-05"),
        operationType: "Compra",
        currency: "dolares",
        amount: 600,
        price: 1000,
        total: 600 * 1000,
        marketPrice: 1015,
      },
      {
        id: 2,
        date: new Date("2024-02-20"),
        operationType: "Venta",
        currency: "dolares",
        amount: 500,
        price: 1055,
        total: 500 * 1055,
        marketPrice: 1040,
      },
      {
        id: 3,
        date: new Date("2024-03-18"),
        operationType: "Compra",
        currency: "reales",
        amount: 1200,
        price: 180,
        total: 1200 * 180,
        marketPrice: 187,
      },
      {
        id: 4,
        date: new Date("2024-04-25"),
        operationType: "Venta",
        currency: "reales",
        amount: 900,
        price: 195,
        total: 900 * 195,
        marketPrice: 190,
      },
      {
        id: 5,
        date: new Date("2024-06-10"),
        operationType: "Compra",
        currency: "euros",
        amount: 400,
        price: 1270,
        total: 400 * 1270,
        marketPrice: 1285,
      },
      {
        id: 6,
        date: new Date("2024-07-28"),
        operationType: "Venta",
        currency: "euros",
        amount: 300,
        price: 1335,
        total: 300 * 1335,
        marketPrice: 1320,
      },
      {
        id: 7,
        date: new Date("2024-08-15"),
        operationType: "Compra",
        currency: "dolares",
        amount: 800,
        price: 1155,
        total: 800 * 1155,
        marketPrice: 1170,
      },
      {
        id: 8,
        date: new Date("2024-10-05"),
        operationType: "Venta",
        currency: "dolares",
        amount: 650,
        price: 1215,
        total: 650 * 1215,
        marketPrice: 1200,
      },
      {
        id: 9,
        date: new Date("2024-11-18"),
        operationType: "Compra",
        currency: "reales",
        amount: 1500,
        price: 235,
        total: 1500 * 235,
        marketPrice: 242,
      },
      {
        id: 10,
        date: new Date("2024-12-10"),
        operationType: "Venta",
        currency: "reales",
        amount: 1200,
        price: 250,
        total: 1200 * 250,
        marketPrice: 245,
      },
    ]),
    loans: [
      {
        id: 8,
        seller: "Alejandro",
        principal: 900000,
        currency: "pesos",
        installment: 100000,
        numberOfInstallments: 12,
        paymentFrecuency: "mensual",
        firstDueDate: new Date("2025-09-14"),
        totalPaid: null,
        installments: [],
        commission: 200000,
      },
    ],
  },
].map(addInstallmentsToLoans);

/* FUNCTIONS */
function enrichOperations(
  operations: Omit<OperationsExample, "netProfit">[],
): OperationsExample[] {
  return operations.map((op) => {
    const marketTotal = op.marketPrice * op.amount;
    const grossProfit =
      op.operationType === "Venta"
        ? op.total - marketTotal
        : marketTotal - op.total;

    const commission = grossProfit / 2;
    const netProfit = grossProfit - commission;

    return {
      ...op,
      netProfit,
    };
  });
}
//
const calculateNetProfitForLoans = (loans: LoanExample[]): number => {
  return loans.reduce((total, loan) => {
    const fullPayments = loan.installments.filter(
      (inst) => inst.pay === inst.value
    ).length;

    const grossProfit = (loan.installment * loan.numberOfInstallments) - loan.principal;
    const commission = loan.commission ?? 0;
    const adjustedProfit = grossProfit - commission;

    const profitPerInstallment = adjustedProfit / loan.numberOfInstallments;
    const netProfit = profitPerInstallment * fullPayments;

    return total + netProfit;
  }, 0);
};
//Simulate installments for loans
function generateInstallments(loan: LoanExample): Installment[] {
  const installments: Installment[] = [];
  for (let i = 0; i < loan.numberOfInstallments; i++) {
    let dueDate: Date;

    if (loan.paymentFrecuency === "mensual") {
      dueDate = addMonths(loan.firstDueDate, i);
    } else if (loan.paymentFrecuency === "semanal") {
      dueDate = addWeeks(loan.firstDueDate, i);
    } else if (loan.paymentFrecuency === "quincenal") {
      dueDate = addWeeks(loan.firstDueDate, i * 2);
    } else if (loan.paymentFrecuency === "diario") {
      dueDate = addDays(loan.firstDueDate, i);
    } else {
      dueDate = loan.firstDueDate;
    }

    installments.push({
      id: i + 1,
      number: i + 1,
      value: loan.installment,
      dueDate: format(dueDate, "dd/MM/yyyy"),
      pay: null,
    });
  }
  return installments;
}
//
function addInstallmentsToLoans(client: ClientExample): ClientExample {
  return {
    ...client,
    loans: client.loans.map((loan) => ({
      ...loan,
      installments: generateInstallments(loan),
    })),
  };
}
//Get the next due date for loans table
function getNextDueDate(loan: LoanExample): {
  date: Date | null;
  dateString: string;
} {
  const nextInstallment = loan.installments.find(
    (installment) => !installment.pay || installment.pay < installment.value,
  );

  if (!nextInstallment) {
    return { date: null, dateString: "Totalmente pagado" };
  }

  // Convertir string "dd/MM/yyyy" a Date
  const [day, month, year] = nextInstallment.dueDate.split("/");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return { date, dateString: nextInstallment.dueDate };
}

//Component starts here
export function ClientSection() {
  /* STATES */
  // Para préstamos (loans)
  const [loanCurrencyFilter, setLoanCurrencyFilter] = useState<string>("");
  const [loanStartDate, setLoanStartDate] = useState<string>("");
  const [loanEndDate, setLoanEndDate] = useState<string>("");

  const [startDate, setStartDate] = useState<string>(""); // Fecha desde (inicio)
  const [endDate, setEndDate] = useState<string>(""); // Fecha hasta (fin)
  //Manipulate the filter that search for client or seller
  const [searchText, setSearchText] = useState("");
  //Save the id of the selected row
  const [rowID, setRowID] = useState<number>();
  //Save the total of the operation's profits
  const [netProfitTotal, setNetProfitTotal] = useState<number>(0);
  //Filters the total amount of each currency to the clients detail modal
  const [selectedCurrency, setSelectedCurrency] = useState("");
  //Open or close the details client modal
  const [modalState, setModalState] = useState<ModalStateClients>("");
  //Control what type of data to show in details modal (operations/loans)
  const [detailsTableType, setDetailsTableType] = useState<
    "operations" | "loans"
  >("operations");
  //Store operations data for selected client
  const [clientOperations, setClientOperations] = useState<OperationsExample[]>(
    [],
  );
  //
  const [clientLoans, setClientLoans] = useState<LoanExample[]>([]);

  /* REFs */
  //add loans container ref
  const dialogAddClient = useRef<HTMLDialogElement>(null);
  //clients details container ref
  const dialogClientDetail = useRef<HTMLDialogElement>(null);

  /* FUNCTIONS */
  const calculateTotalByCurrency = (currency: string): number => {
    if (!selectedRow?.operations) return 0;

    return selectedRow.operations
      .filter((op) => op.currency.toLowerCase() === currency.toLowerCase())
      .reduce((acc, op) => acc + op.total, 0);
  };
  const calculateNetProfitTotal = (operations: OperationsExample[]) => {
    const total = operations.reduce((acc, op) => acc + (op.netProfit ?? 0), 0);
    return total;
  };

  const filteredOperationsByCurrency = clientOperations.filter((op) => {
    const currencyMatch =
      selectedCurrency === "" ||
      op.currency.toLowerCase() === selectedCurrency.toLowerCase();

    const startMatch = startDate === "" || op.date >= new Date(startDate);

    const endMatch = endDate === "" || op.date <= new Date(endDate);

    return currencyMatch && startMatch && endMatch;
  });

  //Recieves all filters and returns the filtered data
  const filteredData = originalClients.filter((item) => {
    // Si no hay texto de búsqueda, mostrar todos los clientes
    if (!searchText.trim()) {
      return true;
    }

    // Filtrar por nombre (case insensitive)
    return item.name.toLowerCase().includes(searchText.toLowerCase().trim());
  });

  const selectedRow = filteredData.find((row) => row.id === rowID);

  const availableCurrencies = Array.from(
    new Set(selectedRow?.operations.map((op) => op.currency.toLowerCase())),
  );
  //
  const filteredLoans = (selectedRow?.loans ?? []).filter((loan) => {
    // Filtro por divisa
    const matchesCurrency =
      loanCurrencyFilter === "" ||
      loan.currency.toLowerCase() === loanCurrencyFilter.toLowerCase();

    // Filtro por próximo vencimiento
    const { date: nextDueDate } = getNextDueDate(loan);
    const dueDateStr = nextDueDate
      ? nextDueDate.toISOString().split("T")[0] // "yyyy-mm-dd"
      : null;

    const matchesStart =
      loanStartDate === "" || (dueDateStr && dueDateStr >= loanStartDate);
    const matchesEnd =
      loanEndDate === "" || (dueDateStr && dueDateStr <= loanEndDate);

    return matchesCurrency && matchesStart && matchesEnd;
  });
  //
  const availableLoanCurrencies = Array.from(
    new Set(selectedRow?.loans?.map((loan) => loan.currency.toLowerCase())),
  );

  /* USE EFFECT */
  //Opens the client details modal
  useEffect(() => {
    if (modalState === "detalles") {
      const selectedClient = originalClients.find((c) => c.id === rowID);
      if (selectedClient) {
        setClientOperations(selectedClient.operations || []);
        setClientLoans(selectedRow?.loans ?? []); // <-- si lo guardás como "loans"
      }
      openDialog(dialogClientDetail);
    }
  }, [modalState]);

  useEffect(() => {
    setSelectedCurrency("");
    setStartDate("");
    setEndDate("");
  }, [rowID]);

  useEffect(() => {
    setNetProfitTotal(calculateNetProfitTotal(filteredOperationsByCurrency));
  }, [filteredOperationsByCurrency]);

  /* EVENT HANDLERS */
  //Handle how every dialog is opened
  function openDialog(dialog) {
    if (dialog.current) {
      dialog.current.showModal(); // Open the dialog
    }
  }
  //Handle how every dialog is closed
  function closeDialog(dialog) {
    if (dialog.current) {
      dialog.current.close(); // Close the dialog
    }
  }
  //
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  /* UTILS */

  return (
    <>
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <div className="flex gap-4 text-slate-500">
          <IoPeople className="size-7" />

          <h2 className="text-2xl font-bold">CLIENTES</h2>
        </div>
        <Button
          onPress={() => openDialog(dialogAddClient)}
          color="success"
          className="rounded-md text-white"
        >
          Nuevo cliente
        </Button>
      </div>
      {/* CLIENTS'S SECTION CONTAINER */}
      <section className="h-full w-full">
        {/* FILTERS'S CONTAINER */}
        <div className="flex h-fit w-full flex-col gap-4 px-6 py-4 text-sm text-slate-400">
          {/* SEARCH FILTER CONTAINER */}
          <div className="flex w-full gap-16">
            <label className="flex w-full basis-1/3 flex-col gap-1 text-slate-500 focus-within:text-green-600">
              Buscar por nombre
              <input
                value={searchText}
                onChange={handleSearchTextChange}
                list="clientsList"
                placeholder="Nombre del cliente.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
        </div>
        {/* TABLE'S CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={COLUMNS}
            loading={false}
            error={false}
            searchInput={""}
            data={filteredData}
            openModal={setModalState}
            optionsMenu={[...contextMenuOption, ...contextMenuBasicOptions]}
            selectRowID={setRowID}
          />
        </div>
      </section>
      {/* ADD CLIENT MODAL */}
      <dialog
        ref={dialogAddClient}
        className="h-fit w-1/2 rounded-lg shadow-lg"
      >
        {/* FORM'S CONTAINER */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex h-full w-full flex-col px-8 py-4 text-slate-500"
        >
          {/* TITLE'S CONTAINER */}
          <div className="flex gap-4 border-b pb-4">
            <IoPeople className="size-7" />
            <h3 className="w-full text-xl font-semibold">
              Crear un nuevo cliente
            </h3>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Nombre
              <input
                required
                placeholder="Ej: Eduardo Perez"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Direccion
              <input
                placeholder="Ej: Juncal 262"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
                type="number"
                placeholder="Ej: 1134865214"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Referido
              <input
                list="sellersList"
                placeholder="Nombre del vendedor.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <label className="flex w-full flex-col gap-1 pt-4 text-sm focus-within:text-green-600">
            Informacion adicional
            <textarea
              placeholder="Por ejemplo: Casa de rejas verdes"
              className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
            <Button
              type="submit"
              onPress={() => closeDialog(dialogAddClient)}
              color="success"
              className="w-full rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => closeDialog(dialogAddClient)}
              color="danger"
              className="w-full rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
      {/* CLIENTS DETAIL MODAL */}
      <dialog
        ref={dialogClientDetail}
        className="h-full w-2/3 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex gap-4 border-b pb-3">
          <IoPeople className="size-7" />
          <p className="w-full text-xl font-semibold">
            Detalles de {selectedRow?.name}
          </p>
          <button
            onClick={() => {
              setModalState("");
              closeDialog(dialogClientDetail);
            }}
            className="text-slate-500 transition-colors hover:text-red-500"
            aria-label="Cerrar"
          >
            <IoClose className="size-6" />
          </button>
        </div>
        {/* INFO CONTAINER */}
        <div className="flex w-full items-center gap-8 pt-4 text-sm">
          <div className="w-full rounded-md border px-4 py-2 shadow-sm">
            <p>Direccion: {selectedRow?.address}</p>
            <p>Telefono: {selectedRow?.phoneNumber}</p>
            <p>Referido por: {selectedRow?.referredBy}</p>
            <p>Informacion adicional: {selectedRow?.description}</p>
            <div className="mt-1 border-t pt-1">
              <span className="text-lg font-semibold text-slate-500">
                Ganancia neta: $
                {detailsTableType === "operations"
                  ? netProfitTotal.toLocaleString("es-AR")
                  : calculateNetProfitForLoans(filteredLoans).toLocaleString(
                      "es-AR",
                    )}
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL TABLE CONTAINER */}
        <div className="flex flex-row gap-4 pt-4 text-sm text-slate-500">
          {/* Select de tipo de movimiento (siempre visible) */}
          <label className="flex w-1/4 flex-col gap-1 focus-within:text-green-600">
            <span className="flex items-center gap-2">
              Filtrar por movimiento:
            </span>
            <select
              value={detailsTableType}
              onChange={(e) =>
                setDetailsTableType(e.target.value as "operations" | "loans")
              }
              className="rounded-lg border p-3 text-slate-400 shadow-sm outline-none focus:border-green-400"
            >
              <option value="operations">Operaciones</option>
              <option value="loans">Préstamos</option>
            </select>
          </label>

          {/* Filtros de operaciones */}
          {detailsTableType === "operations" && (
            <>
              <label className="flex w-1/4 flex-col gap-1 focus-within:text-green-600">
                <span className="flex items-center gap-2">
                  Filtrar por divisa:
                </span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="rounded-lg border p-3 text-slate-400 shadow-sm outline-none focus:border-green-400"
                >
                  <option value="">Todas las divisas</option>
                  {availableCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency.charAt(0).toUpperCase() + currency.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex w-1/2 flex-col gap-1">
                <p>Filtrar por fechas:</p>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1">
                    Desde:
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Hasta:
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Filtros de préstamos */}
          {detailsTableType === "loans" && (
            <>
              <label className="flex w-1/4 flex-col gap-1 focus-within:text-green-600">
                <span className="flex items-center gap-2">
                  Filtrar por divisa:
                </span>
                <select
                  value={loanCurrencyFilter}
                  onChange={(e) => setLoanCurrencyFilter(e.target.value)}
                  className="rounded-lg border p-3 text-slate-400 shadow-sm outline-none focus:border-green-400"
                >
                  <option value="">Todas las divisas</option>
                  {availableLoanCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency.charAt(0).toUpperCase() + currency.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex w-1/2 flex-col gap-1">
                <p>Filtrar por fechas de próximo vencimiento:</p>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1">
                    Desde:
                    <input
                      type="date"
                      value={loanStartDate}
                      onChange={(e) => setLoanStartDate(e.target.value)}
                      className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Hasta:
                    <input
                      type="date"
                      value={loanEndDate}
                      onChange={(e) => setLoanEndDate(e.target.value)}
                      className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative flex-grow overflow-hidden py-8">
          {detailsTableType === "operations" && (
            <TableWork
              columns={OPERATIONS_COLUMNS}
              loading={false}
              error={false}
              searchInput={""}
              data={filteredOperationsByCurrency}
              openModal={null}
              optionsMenu={[]}
            />
          )}

          {detailsTableType === "loans" && (
            <TableWork
              columns={LOANS_COLUMNS}
              data={filteredLoans}
              loading={false}
              error={false}
              searchInput={""}
              openModal={null}
              optionsMenu={[]}
            />
          )}
        </div>
      </dialog>
      {/* DATALIST FOR SEARCH SELLERS INPUT */}
      <datalist id="sellersList">
        <option value="Alejandro"></option>
        <option value="Karina"></option>
        <option value="Patricio"></option>
        <option value="Fernando"></option>
        <option value="Facundo"></option>
        <option value="Nacho"></option>
        <option value="Tiago"></option>
        <option value="Cesar"></option>
      </datalist>
    </>
  );
}
