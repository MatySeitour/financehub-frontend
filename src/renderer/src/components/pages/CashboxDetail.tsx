import { useState } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";

type OperationsExample = {
  id: number;
  date: string;
  openingTime: string;
  closingTime: string;
  openingAmount: string;
  lastValue: string;
  profit: string;
};

const COLUMNS = [
  {
    label: "Fecha",
    key: "date",
    render: (item: OperationsExample) => item.date,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Hora de apertura",
    key: "openingTime",
    render: (item: OperationsExample) => item.openingTime,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Hora de cierre",
    key: "closingTime",
    render: (item: OperationsExample) => item.closingTime,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Valor de apertura",
    key: "openingAmount",
    render: (item: OperationsExample) => <>${item.openingAmount}</>,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Ultimo valor",
    key: "lastValue",
    render: (item: OperationsExample) => item.lastValue,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Rendimiento",
    key: "profit",
    render: (item: OperationsExample) => item.profit,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];

export function CashboxDetail() {
  const [rowID, setRowID] = useState<number>();

  const data: OperationsExample[] = [
    {
      id: 1,
      date: "10/05/2021",
      openingTime: "09:02",
      closingTime: "17:45",
      openingAmount: "5.450.000",
      lastValue: "$9.250.000",
      profit: "%50",
    },
    {
      id: 2,
      date: "11/05/2021",
      openingTime: "08:45",
      closingTime: "18:00",
      openingAmount: "3.200.000",
      lastValue: "$6.500.000",
      profit: "%103",
    },
    {
      id: 3,
      date: "12/05/2021",
      openingTime: "09:15",
      closingTime: "17:30",
      openingAmount: "7.800.000",
      lastValue: "$8.950.000",
      profit: "%15",
    },
    {
      id: 4,
      date: "13/05/2021",
      openingTime: "10:00",
      closingTime: "19:00",
      openingAmount: "6.000.000",
      lastValue: "$12.500.000",
      profit: "%108",
    },
    {
      id: 5,
      date: "14/05/2021",
      openingTime: "07:50",
      closingTime: "16:45",
      openingAmount: "4.000.000",
      lastValue: "$5.800.000",
      profit: "%45",
    },
    {
      id: 6,
      date: "15/05/2021",
      openingTime: "09:30",
      closingTime: "18:15",
      openingAmount: "5.500.000",
      lastValue: "$7.900.000",
      profit: "%43",
    },
    {
      id: 7,
      date: "16/05/2021",
      openingTime: "08:00",
      closingTime: "17:00",
      openingAmount: "2.750.000",
      lastValue: "$4.200.000",
      profit: "%53",
    },
  ];

  return (
    <>
      <div className="flex w-full items-center justify-between border-b px-4 py-3">
        <h2 className="text-2xl font-bold text-slate-500">Caja de pesos</h2>
      </div>
      <section className="h-full w-full rounded-tl-lg bg-white p-4">
        <div className="h-[200px] w-full rounded-lg border bg-red-400"></div>
        <div className="flex h-fit w-full flex-row items-center gap-2 pb-4 pt-12 text-sm">
          <label htmlFor="desde" className="text-slate-500">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            className="rounded-md border p-1 text-slate-500 outline-none"
          />
          <label htmlFor="desde" className="text-slate-500">
            Hasta
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            className="rounded-md border p-1 text-slate-500 outline-none"
          />
        </div>
        <div className="relative flex-grow overflow-hidden">
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
    </>
  );
}
