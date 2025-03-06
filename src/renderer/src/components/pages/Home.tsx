import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import { useState } from "react";

type OperationsExample = {
  id: number;
  amount: number;
  price: number;
  seller: string;
  client: string;
  profit: number;
  currency: string;
  state: string;
};

const COLUMNS = [
  {
    label: "Comprador",
    key: "client",
    render: (item: OperationsExample) => item.client,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Vendedor",
    key: "seller",
    render: (item: OperationsExample) => item.seller,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Cantidad",
    key: "amount",
    render: (item: OperationsExample) => item.amount,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Precio",
    key: "price",
    render: (item: OperationsExample) => <>${item.price}</>,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Diferencia ganada",
    key: "profit",
    render: (item: OperationsExample) => item.profit,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Divisa",
    key: "currency",
    render: (item: OperationsExample) => item.currency,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Estado",
    key: "state",
    render: (item: OperationsExample) => item.state,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];

export function Home() {
  const [rowID, setRowID] = useState<number>();

  const data: OperationsExample[] = [
    {
      id: 1,
      amount: 10,
      price: 50.5,
      seller: "Juan Pérez",
      client: "María López",
      profit: 120.75,
      currency: "USD",
      state: "completed",
    },
    {
      id: 2,
      amount: 5,
      price: 30.0,
      seller: "Carlos Gómez",
      client: "Ana Torres",
      profit: 45.0,
      currency: "EUR",
      state: "pending",
    },
    {
      id: 3,
      amount: 20,
      price: 15.25,
      seller: "Laura Fernández",
      client: "Pedro Sánchez",
      profit: 85.5,
      currency: "USD",
      state: "canceled",
    },
    {
      id: 4,
      amount: 8,
      price: 75.0,
      seller: "Ricardo Díaz",
      client: "Elena Ríos",
      profit: 200.0,
      currency: "GBP",
      state: "completed",
    },
    {
      id: 5,
      amount: 12,
      price: 40.0,
      seller: "Sofía Méndez",
      client: "David Castillo",
      profit: 95.0,
      currency: "USD",
      state: "pending",
    },
    {
      id: 6,
      amount: 30,
      price: 20.5,
      seller: "Miguel Herrera",
      client: "Lucía Gómez",
      profit: 150.25,
      currency: "EUR",
      state: "completed",
    },
    {
      id: 7,
      amount: 25,
      price: 10.0,
      seller: "Verónica Ruiz",
      client: "Andrés Benítez",
      profit: 70.0,
      currency: "USD",
      state: "canceled",
    },
    {
      id: 8,
      amount: 18,
      price: 32.5,
      seller: "Fernando Castro",
      client: "Gabriela Morales",
      profit: 110.8,
      currency: "GBP",
      state: "pending",
    },
    {
      id: 9,
      amount: 9,
      price: 55.0,
      seller: "Patricia Rojas",
      client: "Carlos Núñez",
      profit: 180.0,
      currency: "USD",
      state: "completed",
    },
    {
      id: 10,
      amount: 15,
      price: 60.75,
      seller: "Javier Ortega",
      client: "Rocío Vega",
      profit: 210.5,
      currency: "EUR",
      state: "pending",
    },
    {
      id: 11,
      amount: 22,
      price: 25.5,
      seller: "Camila Fernández",
      client: "Roberto Fuentes",
      profit: 95.75,
      currency: "USD",
      state: "completed",
    },
    {
      id: 12,
      amount: 6,
      price: 90.0,
      seller: "Gustavo Mendoza",
      client: "Clara Suárez",
      profit: 250.0,
      currency: "GBP",
      state: "canceled",
    },
    {
      id: 13,
      amount: 14,
      price: 42.0,
      seller: "Daniela Pineda",
      client: "Esteban Vargas",
      profit: 130.0,
      currency: "USD",
      state: "pending",
    },
    {
      id: 14,
      amount: 17,
      price: 37.5,
      seller: "Héctor López",
      client: "Julieta Navarro",
      profit: 145.5,
      currency: "EUR",
      state: "completed",
    },
    {
      id: 15,
      amount: 11,
      price: 47.25,
      seller: "Alejandro Silva",
      client: "Mónica Álvarez",
      profit: 175.0,
      currency: "USD",
      state: "pending",
    },
  ];

  return (
    <section className="relative flex h-full w-full flex-col bg-white pb-4">
      <div className="h-1/3 w-full bg-red-200"></div>
      <div className="relative flex-grow overflow-hidden px-6 py-4">
        <TableWork
          columns={COLUMNS}
          loading={false}
          error={false}
          searchInput={""}
          data={data}
          openModal={() => console.log()}
          optionsMenu={contextMenuBasicOptions}
          selectRowID={setRowID}
        />
      </div>
    </section>
  );
}
