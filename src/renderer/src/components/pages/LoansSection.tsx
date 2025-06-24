/* IMPORTS */
import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import { MenuOption, ModalState } from "@renderer/utils/types";
import { GoPaperclip } from "react-icons/go";
import { addDays, addMonths, addWeeks, format } from "date-fns";

/* DATA TYPES */
type ModalStateLoan = ModalState | "detalles";
type LoanExample = {
  id: number;
  client: string;
  seller: string;
  principal: number;
  currency: string;
  installment: number;
  numberOfInstallments: number;
  paymentFrecuency: string;
  firstDueDate: Date;
};
type Installment = {
  id: number;
  number: number;
  value: number;
  dueDate: string;
  pay: number | null;
};

/* UTILS*/
const COLUMNS = [
  {
    label: "Cliente",
    key: "client",
    render: (item: LoanExample) => item.client,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Vendedor",
    key: "seller",
    render: (item: LoanExample) => item.seller,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Capital",
    key: "principal",
    render: (item: LoanExample) => <>${item.principal}</>,
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
    render: (item: LoanExample) => <>${item.installment}</>,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Primer vencimiento",
    key: "firstDueDate",
    render: (item: LoanExample) => item.firstDueDate.toLocaleDateString(),
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
const LOAN_DETAIL_COLUMNS = [
  { label: "Cuota", key: "number", render: (item) => item.number },
  { label: "Valor", key: "value", render: (item) => `$${item.value}` },
  { label: "Vencimiento", key: "dueDate", render: (item) => item.dueDate },
  { label: "Pago", key: "pay", render: (item) => item.pay },
];
const contextMenuOption: MenuOption[] = [
  {
    name: "Detalles",
    icon: GoPaperclip,
    route: undefined,
  },
] as const;

export function LoansSection() {
  /* STATES */
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalState, setModalState] = useState<ModalStateLoan>("");
  const [rowID, setRowID] = useState<number>();
  const [installments, setInstallments] = useState<Installment[]>([]);

  /* REFs */
  const loansSection = useRef(null); //loans section container ref
  const dialogLoanDetail = useRef<HTMLDialogElement>(null); //loans details container ref
  const dialogAddLoan = useRef<HTMLDialogElement>(null); //add loans container ref
  const dialogPayLoan = useRef<HTMLDialogElement>(null); //add pay to loan container ref

  /* USE EFFECT */
  useEffect(() => {
    if (modalState === "detalles") {
      openDialog(dialogLoanDetail);
      calculateDetails();
    }
  }, [modalState]);

  /* EVENT HANDLERS */
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  function openDialog(dialog) {
    if (dialog.current) {
      dialog.current.showModal(); // Open the dialog
    }
  }

  function closeDialog(dialog) {
    if (dialog.current) {
      dialog.current.close(); // Close the dialog
    }
  }

  /* UTILS */
  function formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /* TABLE DATA HANDLER*/
  const data: LoanExample[] = [
    {
      id: 1,
      client: "Gisela",
      seller: "Alejandro",
      principal: 1000000,
      currency: "pesos",
      installment: 160000,
      numberOfInstallments: 8,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-06-05"),
    },
    {
      id: 2,
      client: "Poncha",
      seller: "Alejandro",
      principal: 2000000,
      currency: "pesos",
      installment: 300000,
      numberOfInstallments: 9,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-07-06"),
    },
    {
      id: 3,
      client: "Mariana",
      seller: "Lucía",
      principal: 1500,
      currency: "euros",
      installment: 250,
      numberOfInstallments: 8,
      paymentFrecuency: "quincenal",
      firstDueDate: new Date("2025-07-15"),
    },
    {
      id: 4,
      client: "Carlos",
      seller: "Martín",
      principal: 12000,
      currency: "dolares",
      installment: 2300,
      numberOfInstallments: 6,
      paymentFrecuency: "quincenal",
      firstDueDate: new Date("2025-08-01"),
    },
    {
      id: 5,
      client: "Romina",
      seller: "Alejandro",
      principal: 180000,
      currency: "pesos",
      installment: 3000,
      numberOfInstallments: 30,
      paymentFrecuency: "diario",
      firstDueDate: new Date("2025-08-10"),
    },
    {
      id: 6,
      client: "Federico",
      seller: "Lucía",
      principal: 2400000,
      currency: "pesos",
      installment: 300000,
      numberOfInstallments: 8,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-08-22"),
    },
    {
      id: 7,
      client: "Bruno",
      seller: "Martín",
      principal: 1000000,
      currency: "pesos",
      installment: 125000,
      numberOfInstallments: 8,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-08-02"),
    },
    {
      id: 8,
      client: "Laura",
      seller: "Alejandro",
      principal: 900000,
      currency: "pesos",
      installment: 150000,
      numberOfInstallments: 6,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-09-14"),
    },
    {
      id: 9,
      client: "Sofía",
      seller: "Lucía",
      principal: 2100000,
      currency: "pesos",
      installment: 350000,
      numberOfInstallments: 6,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-09-30"),
    },
    {
      id: 10,
      client: "Matías",
      seller: "Martín",
      principal: 1600000,
      currency: "pesos",
      installment: 200000,
      numberOfInstallments: 8,
      paymentFrecuency: "mensual",
      firstDueDate: new Date("2025-10-10"),
    },
  ];

  const filteredData = data.filter((item) => {
    const dueDateStr = formatDateToInput(item.firstDueDate);

    const isAfterStart = startDate === "" || dueDateStr >= startDate;
    const isBeforeEnd = endDate === "" || dueDateStr <= endDate;

    const matchesDate = isAfterStart && isBeforeEnd;

    const matchesText =
      searchText === "" ||
      item.client.toLowerCase().includes(searchText.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchText.toLowerCase());

    return matchesDate && matchesText;
  });

  const selectedRow = filteredData.find((row) => row.id === rowID);

  function calculateDetails() {
    const loan = selectedRow;

    if (!loan) return;

    const newInstallments: Installment[] = [];

    for (let i = 0; i < loan?.numberOfInstallments; i++) {
      let dueDate;

      if (loan.paymentFrecuency === "mensual") {
        dueDate = addMonths(loan.firstDueDate, i);
      } else if (loan.paymentFrecuency === "diario") {
        dueDate = addDays(loan.firstDueDate, i);
      } else if (loan.paymentFrecuency === "semanal") {
        dueDate = addWeeks(loan.firstDueDate, i);
      } else if (loan.paymentFrecuency === "quincenal") {
        dueDate = addWeeks(loan.firstDueDate, i * 2);
      } else {
        dueDate = loan.firstDueDate;
      }

      newInstallments.push({
        id: i + 1,
        number: i + 1,
        value: loan.installment,
        dueDate: format(dueDate, "dd/MM/yyyy"),
        pay: 2500,
      });
    }
    setInstallments(newInstallments);
  }

  return (
    <>
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <h2 className="text-2xl font-bold text-slate-500">Prestamos</h2>
        <Button
          onPress={() => openDialog(dialogAddLoan)}
          color="success"
          className="rounded-md text-white"
        >
          Nuevo prestamo
        </Button>
      </div>
      {/* LOAN'S CONTAINER */}
      <section className="h-full w-full" ref={loansSection}>
        {/* FILTERS'S CONTAINER */}
        <div className="flex h-fit w-full items-center gap-20 p-6 text-sm text-slate-400">
          <label className="flex flex-col gap-1 text-sm text-slate-500 focus-within:text-green-600">
            Buscar por cliente
            <input
              value={searchText}
              onChange={handleSearchTextChange}
              list="clientsList"
              placeholder="Nombre del cliente.."
              className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          <div className="flex flex-col gap-1 focus-within:text-green-600">
            <p className="text-slate-500">
              Buscar por fecha de proximo vencimiento
            </p>
            <div className="flex flex-row gap-4">
              <label className="flex flex-row items-center gap-4 text-sm">
                Desde
                <input
                  value={startDate}
                  onChange={handleStartDateChange}
                  type="date"
                  placeholder="Nombre del cliente.."
                  className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                />
              </label>
              <label className="flex flex-row items-center gap-4 text-sm">
                Hasta
                <input
                  value={endDate}
                  onChange={handleEndDateChange}
                  type="date"
                  placeholder="Nombre del cliente.."
                  className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                />
              </label>
            </div>
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
      {/* ADD LOAN MODAL */}
      <dialog ref={dialogAddLoan} className="h-fit w-1/2 rounded-lg">
        {/* FORM'S CONTAINER */}
        <form className="flex h-full w-full flex-col items-center justify-evenly px-8 py-4 text-slate-500">
          {/* TITLE'S CONTAINER */}
          <h3 className="w-full border-b pb-4 text-center text-xl font-semibold">
            Crear una nuevo prestamo
          </h3>
          <div className="flex w-full flex-row items-center justify-center gap-8 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Cliente
              <input
                list="clientsList"
                placeholder="Nombre del cliente.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Vendedor
              <input
                list="sellersList"
                placeholder="Nombre del vendedor.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-8 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Capital
              <input
                type="number"
                placeholder="Ej: 150000"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Divisa
              <select className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400">
                <option className="text-slate-500" value="peso">
                  Pesos
                </option>
                <option className="text-slate-500" value="dolar">
                  Dolares
                </option>
                <option className="text-slate-500" value="real">
                  Real
                </option>
                <option className="text-slate-500" value="euro">
                  Euro
                </option>
                <option className="text-slate-500" value="libra">
                  Libra
                </option>
              </select>
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-8 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Cantidad de cuotas
              <input
                type="number"
                placeholder="Ej: 12"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Cuota
              <input
                type="number"
                placeholder="Ej: 20000"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-8 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Frecuencia de cobro
              <select className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400">
                <option className="text-slate-500" value="daily">
                  Diario
                </option>
                <option className="text-slate-500" value="weekly">
                  Semanal
                </option>
                <option className="text-slate-500" value="biweekly">
                  Quincenal
                </option>
                <option className="text-slate-500" value="monthly">
                  Mensual
                </option>
              </select>
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Primer vencimiento
              <input
                type="date"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly pt-4 text-center">
            <Button
              type="submit"
              onPress={() => closeDialog(dialogAddLoan)}
              color="success"
              className="rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => closeDialog(dialogAddLoan)}
              color="danger"
              className="rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
      {/* LOAN DETAIL MODAL */}
      <dialog
        ref={dialogLoanDetail}
        className="h-fit w-1/2 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex h-full w-full flex-col items-center justify-evenly">
          <p className="w-full border-b pb-4 text-center text-xl font-semibold">
            Detalles del prestamo
          </p>
        </div>
        {/* INFO CONTAINER */}
        <div className="flex flex-row justify-evenly p-4">
          <p>Cliente: {selectedRow?.client}</p>
          <p>Vendedor: {selectedRow?.seller}</p>
          <p>Divisa: {selectedRow?.currency}</p>
        </div>
        <div className="flex flex-row justify-evenly pb-4">
          <p>Capital: {selectedRow?.principal}</p>
          <p>Frecuencia de pago: {selectedRow?.paymentFrecuency}</p>
        </div>
        {/* DETAIL TABLE CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={LOAN_DETAIL_COLUMNS}
            loading={false}
            error={false}
            searchInput={""}
            data={installments}
            openModal={null}
            optionsMenu={[]}
          />
        </div>
        {/* BUTTONS CONTAINER */}
        <div className="flex justify-evenly">
          <Button
            onPress={() => {
              openDialog(dialogPayLoan);
              setModalState("");
            }}
            color="success"
            className="rounded-md text-white"
          >
            Cargar pago
          </Button>
          <Button
            type="reset"
            onPress={() => {
              closeDialog(dialogLoanDetail);
              setModalState("");
            }}
            color="danger"
            className="rounded-md text-white"
          >
            Cerrar
          </Button>
        </div>
      </dialog>

      {/* DIALOG ADD PAY TO LOAN */}
      <dialog ref={dialogPayLoan}
        className="h-fit w-1/3 rounded-lg px-8 py-4 text-slate-600">
        <div className="flex h-full w-full flex-col items-center justify-evenly">
          a
        </div>
      </dialog>

      {/* DATALIST FOR SEARCH CLIENTS INPUT */}
      <datalist id="clientsList">
        <option value="Poncha"></option>
        <option value="Gisela"></option>
        <option value="Texido"></option>
        <option value="Victor"></option>
        <option value="Andres futbol"></option>
        <option value="Tiago"></option>
      </datalist>
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
