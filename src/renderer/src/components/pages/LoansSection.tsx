/* IMPORTS */
import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { TableWork } from "../Table";
import {
  BaseResponseServer,
  MenuOption,
  ModalState,
  ServerError,
  User,
} from "@renderer/utils/types";
import { addDays, addMonths, addWeeks, format } from "date-fns";
import { useQuery } from "react-query";
import { getLoans, Loan } from "@renderer/hooks/loan";
import { useDialog } from "@renderer/hooks/useDialog";
import { CreateLoanModal } from "../modals/loans";
import { useNavigate, useOutletContext } from "react-router";
import { PaperclipIcon } from "lucide-react";

/* DATA TYPES */
//Modals to open
type ModalStateLoan = ModalState | "detalles";
//Loan example of what i will recieve from the API
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
//Loans table's columns
const COLUMNS = [
  {
    label: "Cliente",
    key: "client",
    render: (item: Loan) => item.client.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Vendedor",
    key: "seller",
    render: (item: Loan) => item.seller.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Capital",
    key: "principal",
    render: (item: Loan) => `$${item.principal.toLocaleString("es-ES")}`,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Valor de la cuota",
    key: "installment",
    render: (item: Loan) =>
      `$${item.installment_value.toLocaleString("es-ES")}`,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  // {
  //   label: "Proximo vencimiento",
  //   key: "nextDueDate",
  //   render: (item: Loan) => item.next_due_date,
  //   // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  // },
];
//Loans details table's columns
const LOAN_DETAIL_COLUMNS = [
  { label: "Cuota", key: "number", render: (item) => item.number },
  {
    label: "Valor",
    key: "value",
    render: (item) => `$${item.value.toLocaleString("es-ES")}`,
  },
  { label: "Vencimiento", key: "dueDate", render: (item) => item.dueDate },
  {
    label: "Pago",
    key: "pay",
    render: (item) =>
      item.pay === null ? "-" : `$${item.pay.toLocaleString("es-ES")}`,
  },
  {
    label: "Fecha de pago",
    key: "paymentDate",
    render: (item) => item.paymentDate ?? "-",
  },
];
//Custom menu options

//Original simulation of what y will recieve from the API
const originalLoans: LoanExample[] = [
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
    totalPaid: null,
    installments: [],
    commission: 92400,
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
    totalPaid: null,
    installments: [],
    commission: 200000,
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
    totalPaid: null,
    installments: [],
    commission: 150,
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
    totalPaid: null,
    installments: [],
    commission: 500,
  },
  {
    id: 5,
    client: "Romina",
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
  {
    id: 6,
    client: "Federico",
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
    client: "Bruno",
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
  {
    id: 8,
    client: "Laura",
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
  {
    id: 9,
    client: "Sofía",
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
  {
    id: 10,
    client: "Matías",
    seller: "Martín",
    principal: 1300000,
    currency: "pesos",
    installment: 200000,
    numberOfInstallments: 8,
    paymentFrecuency: "mensual",
    firstDueDate: new Date("2025-10-10"),
    totalPaid: null,
    installments: [],
    commission: 80000,
  },
  {
    id: 11,
    client: "Gisela",
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
    client: "Gisela",
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
];

/* FUNCTIONS */
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
//Get the total capital that is in debt by each currency
function getTotalUnpaidCapitalByCurrency(
  loans: LoanExample[],
): Record<string, number> {
  return loans.reduce(
    (totals, loan) => {
      const { date } = getNextDueDate(loan);
      // Solo préstamos que no están completamente pagados
      if (date !== null) {
        const currency = loan.currency;
        const totalPaid = loan.totalPaid || 0; // Lo que ya se pagó
        const remainingCapital = loan.principal - totalPaid; // Capital pendiente

        totals[currency] = (totals[currency] || 0) + remainingCapital;
      }
      return totals;
    },
    {} as Record<string, number>,
  );
}
//Get which currencies are being used in the loans section
function getAvailableCurrencies(loans: LoanExample[]): string[] {
  const currencies = loans
    .filter((loan) => {
      const { date } = getNextDueDate(loan);
      return date !== null; // Solo préstamos no pagados completamente
    })
    .map((loan) => loan.currency);

  return [...new Set(currencies)]; // Eliminar duplicados
}
//Get the total capital to be collected (sum of all installments) by each currency
function getTotalReceivableCapitalByCurrency(
  loans: LoanExample[],
): Record<string, number> {
  return loans.reduce(
    (totals, loan) => {
      const { date } = getNextDueDate(loan);
      // Solo préstamos que no están completamente pagados
      if (date !== null) {
        const currency = loan.currency;
        const totalInstallmentsValue =
          loan.installment * loan.numberOfInstallments; // Total a cobrar
        const totalPaid = loan.totalPaid || 0; // Lo que ya se cobró
        const remainingToCollect = totalInstallmentsValue - totalPaid; // Pendiente por cobrar

        totals[currency] = (totals[currency] || 0) + remainingToCollect;
      }
      return totals;
    },
    {} as Record<string, number>,
  );
}

//Component starts here
export function LoansSection() {
  const navigate = useNavigate();

  /* STATES */
  //Manipulate the filter that search for client or seller
  const [searchText, setSearchText] = useState("");
  //Manipulate the filter that search for start date
  const [startDate, setStartDate] = useState("");
  //Manipulate the filter that search for end date
  const [endDate, setEndDate] = useState("");
  //Open or close the details loan modal
  const [modalState, setModalState] = useState<ModalStateLoan>("");
  //Save the id of the selected row
  const [rowID, setRowID] = useState<number>();
  //Manipulate the input that register an installment's pay
  const [paymentInput, setPaymentInput] = useState<number>(0);
  //Manipulate the input that register an installment's pay date
  const [paymentDate, setPaymentDate] = useState("");
  //Manipulate the select that shows the total capital of each currency
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  //Manipulate the select that shows the total receivable capital of each currency
  const [selectedCurrencyReceivable, setSelectedCurrencyReceivable] =
    useState<string>("");
  //Save every change of the loan's data
  const [loanData, setLoanData] = useState<LoanExample[]>(() => {
    const loansWithInstallments: LoanExample[] = [];

    for (let i = 0; i < originalLoans.length; i++) {
      const loan = originalLoans[i];
      const installments = generateInstallments(loan);

      loansWithInstallments.push({
        ...loan,
        installments,
      });
    }

    return loansWithInstallments;
  });
  // States del formulario de creación de préstamo
  const [newLoanData, setNewLoanData] = useState({
    principal: 0,
    currency: "",
    installmentValue: 0,
    numberOfInstallments: 0,
    paymentFrequency: "monthly", // valor inicial por defecto
    firstDueDate: "",
    commission: 0,
    clientId: 0,
    sellerId: 0,
    total_paid: 0,
  });
  const [loans, setLoans] = useState<Loan[]>([]);

  /* HOOKS */
  //
  const createLoanDialog = useDialog();

  /* QUERIES */
  //
  const loansQuery = useQuery<
    Awaited<ReturnType<typeof getLoans>>,
    ServerError
  >({
    queryFn: () => getLoans(),
    queryKey: ["loans", "all"],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
        setLoans(data);

        console.log("PRESTAMOS: ", data);
      }
    },
  });

  /* REFs */
  //loans section container ref
  const loansSection = useRef(null);
  //loans details container ref
  const dialogLoanDetail = useRef<HTMLDialogElement>(null);
  //add pay to loan container ref
  const dialogPayLoan = useRef<HTMLDialogElement>(null);

  /* USE EFFECT */
  //Opens the loan details modal
  useEffect(() => {
    if (modalState === "detalles") {
      openDialog(dialogLoanDetail);
    }
  }, [modalState]);

  /* EVENT HANDLERS */
  //
  function handleInputChange(
    field: keyof typeof newLoanData,
    value: string | number,
  ) {
    setNewLoanData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === "number" ? Number(value) : value,
    }));
  }
  //Handle the filter of search for client or seller
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  //Handle the filter of search for start date
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  //Handle the filter of search for end date
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  //Handle the input that saves the installments pay date
  const handlePaymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentDate(e.target.value);
  };
  //Handle a lot of operations about loans and installments
  function handleRegisterPayment() {
    if (!selectedRow) return;

    let remaining = paymentInput;

    // 1. Actualizar cuotas del préstamo seleccionado
    const updatedInstallments = selectedRow.installments.map((installment) => {
      if (remaining === 0) return installment;

      const installmentValue = installment.value;
      let paymentForThis = 0;

      if (installment.pay != null) {
        const remainingInstallment = installmentValue - installment.pay;
        if (remaining >= remainingInstallment) {
          paymentForThis = installment.pay + remainingInstallment;
          remaining -= remainingInstallment;
        } else {
          paymentForThis = installment.pay + remaining;
          remaining = 0;
        }
      } else {
        if (remaining >= installmentValue) {
          paymentForThis = installmentValue;
          remaining -= installmentValue;
        } else {
          paymentForThis = remaining;
          remaining = 0;
        }
      }

      const wasCompleted = paymentForThis === installmentValue;

      return {
        ...installment,
        pay: paymentForThis,
        paymentDate:
          wasCompleted && !installment.paymentDate
            ? paymentDate
            : installment.paymentDate,
      };
    });

    // 2. Calcular total pagado
    const totalPaidNow = updatedInstallments.reduce(
      (acc, inst) => acc + (inst.pay ?? 0),
      0,
    );

    // 3. Actualizar loanData con el préstamo modificado
    const updatedLoans = loanData.map((loan) => {
      if (loan.id === selectedRow.id) {
        return {
          ...loan,
          installments: updatedInstallments,
          totalPaid: totalPaidNow,
        };
      }
      return loan;
    });

    // 4. Aplicar los cambios
    setLoanData(updatedLoans);
    setPaymentInput(0);
    setPaymentDate("");
  }
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

  /* UTILS */
  //Formats a Date to a string
  function formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /* FUNCTIONS */
  //Recieves all filters and returns the filtered data
  const filteredData = loanData.filter((item) => {
    const { date: nextDueDate } = getNextDueDate(item);

    let matchesDate = true;
    if (nextDueDate && (startDate || endDate)) {
      const dueDateStr = formatDateToInput(nextDueDate);
      const isAfterStart = startDate === "" || dueDateStr >= startDate;
      const isBeforeEnd = endDate === "" || dueDateStr <= endDate;
      matchesDate = isAfterStart && isBeforeEnd;
    }

    const matchesText =
      searchText === "" ||
      item.client.toLowerCase().includes(searchText.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchText.toLowerCase());

    return matchesDate && matchesText;
  });
  //Saves the data of the selected row
  const selectedRow = filteredData.find((row) => row.id === rowID);

  /* UTILS */
  //

  const contextMenuOption: MenuOption<Loan>[] = [
    {
      name: "Detalles",
      icon: PaperclipIcon,
      onAction: (item) => navigate(`/loans/${item?.id}`),
    },
  ] as const;

  return (
    <>
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <h2 className="text-2xl font-bold text-slate-500">Prestamos</h2>
        <Button
          onPress={createLoanDialog.open}
          color="success"
          className="rounded-md text-white"
        >
          Nuevo prestamo
        </Button>
      </div>
      {/* LOAN'S CONTAINER */}
      <section className="h-full w-full" ref={loansSection}>
        {/* FILTERS'S CONTAINER */}
        <div className="flex h-fit w-full flex-col gap-4 px-6 py-4 text-sm text-slate-400">
          {/* SEARCH FILTER CONTAINER */}
          <div className="flex w-full gap-16">
            <label className="flex w-full basis-1/3 flex-col gap-1 text-slate-500 focus-within:text-green-600">
              Buscar por cliente o vendedor
              <input
                value={searchText}
                onChange={handleSearchTextChange}
                list="clientsList"
                placeholder="Nombre del cliente.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <div className="flex w-full basis-2/3 flex-col gap-1 focus-within:text-green-600">
              <p className="text-slate-500">
                Buscar por fecha de proximo vencimiento
              </p>
              <div className="4 flex w-full flex-row gap-8">
                <label className="flex w-full flex-row items-center gap-2">
                  Desde
                  <input
                    value={startDate}
                    onChange={handleStartDateChange}
                    type="date"
                    className="w-full rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                  />
                </label>
                <label className="flex w-full flex-row items-center gap-2">
                  Hasta
                  <input
                    value={endDate}
                    onChange={handleEndDateChange}
                    type="date"
                    className="w-full rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                  />
                </label>
              </div>
            </div>
          </div>
          {/* TOTALS CONTAINER */}
          <div className="flex w-1/2 gap-4">
            {/* NUEVO: Total capital impago */}
            <label className="flex w-full flex-col gap-1 text-slate-500 focus-within:text-green-600">
              <div className="flex items-center gap-2">
                <span>Capital total:</span>
                {selectedCurrency && (
                  <span className="font-semibold">
                    $
                    {getTotalUnpaidCapitalByCurrency(filteredData)[
                      selectedCurrency
                    ]?.toLocaleString() || 0}
                  </span>
                )}
              </div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              >
                <option value="">Seleccionar moneda</option>
                {getAvailableCurrencies(filteredData).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency.charAt(0).toUpperCase() + currency.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            {/* NUEVO: Total capital a cobrar */}
            <label className="flex w-full flex-col gap-1 text-slate-500 focus-within:text-green-600">
              <div className="flex items-center gap-2">
                <span>Capital total a cobrar:</span>
                {selectedCurrencyReceivable && (
                  <span className="font-semibold">
                    $
                    {getTotalReceivableCapitalByCurrency(filteredData)[
                      selectedCurrencyReceivable
                    ]?.toLocaleString() || 0}
                  </span>
                )}
              </div>
              <select
                value={selectedCurrencyReceivable}
                onChange={(e) => setSelectedCurrencyReceivable(e.target.value)}
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              >
                <option value="">Seleccionar moneda</option>
                {getAvailableCurrencies(filteredData).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency.charAt(0).toUpperCase() + currency.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {/* TABLE'S CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={COLUMNS}
            loading={loansQuery.isLoading || loansQuery.isFetching}
            error={false}
            searchInput={""}
            data={loans}
            openModal={setModalState}
            optionsMenu={contextMenuOption}
            selectRowID={setRowID}
          />
        </div>
      </section>
      {/* ADD LOAN MODAL */}
      <CreateLoanModal
        dialogRef={createLoanDialog.dialogRef}
        closeModal={createLoanDialog.close}
      />
      {/* LOAN DETAIL MODAL */}
      <dialog
        ref={dialogLoanDetail}
        className="h-fit w-1/2 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex h-full w-full justify-center">
          <p className="w-full items-center border-b pb-4 text-center text-xl font-semibold">
            Detalles del prestamo
          </p>
        </div>
        {/* INFO CONTAINER */}
        <div className="m-2 rounded-xl border p-2 shadow-sm">
          <div className="flex flex-row justify-between pb-1 text-[13px]">
            <p>Capital: ${selectedRow?.principal.toLocaleString("es-ES")}</p>
            <p>
              Ganancia: $
              {selectedRow?.installment && selectedRow?.numberOfInstallments
                ? (
                    selectedRow.installment * selectedRow.numberOfInstallments -
                    selectedRow.principal
                  ).toLocaleString("es-ES")
                : 0}
            </p>
            <p>Divisa: {selectedRow?.currency}</p>
            <p>
              Total pagado:
              {selectedRow?.totalPaid
                ? `$${selectedRow?.totalPaid.toLocaleString("es-ES")}`
                : "-"}
            </p>
          </div>
          <div className="flex flex-row justify-between text-[13px]">
            <p>Cliente: {selectedRow?.client}</p>
            <p>Vendedor: {selectedRow?.seller}</p>
            <p>Comision: ${selectedRow?.commission.toLocaleString("es-ES")}</p>
            <p>Frecuencia de pago: {selectedRow?.paymentFrecuency}</p>
          </div>
        </div>
        {/* DETAIL TABLE CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={LOAN_DETAIL_COLUMNS}
            loading={false}
            error={false}
            searchInput={""}
            data={selectedRow?.installments || []}
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
      <dialog
        ref={dialogPayLoan}
        className="h-fit w-1/3 rounded-lg px-8 py-4 text-slate-600"
      >
        <div className="flex h-full w-full items-center justify-center">
          <p className="w-full border-b pb-4 text-center text-xl font-semibold">
            Cargar pago
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex w-full flex-col items-center justify-center gap-8 pt-8"
        >
          <label className="flex w-2/3 flex-col gap-1 text-sm focus-within:text-green-600">
            Ingrese el monto del pago
            <input
              required
              type="number"
              placeholder="Ej: 15000"
              className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              value={paymentInput}
              onChange={(e) => {
                setPaymentInput(Number(e.target.value));
              }}
            />
          </label>
          <label className="flex w-2/3 flex-col gap-1 text-sm focus-within:text-green-600">
            Fecha de pago
            <input
              required
              value={paymentDate}
              onChange={handlePaymentDateChange}
              type="date"
              className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          <div className="flex w-full justify-evenly text-center">
            <Button
              type="submit"
              onPress={() => {
                handleRegisterPayment();
                closeDialog(dialogPayLoan);
              }}
              color="success"
              className="rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => {
                closeDialog(dialogPayLoan);
              }}
              color="danger"
              className="rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
