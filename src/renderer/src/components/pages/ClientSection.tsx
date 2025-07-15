/* IMPORTS */
import { Button } from "@heroui/react";
import { useRef, useState, useEffect } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import { BaseResponseServer, MenuOption, ModalState, ServerError, User } from "@renderer/utils/types";
import { GoPaperclip } from "react-icons/go";
import { IoPeople } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useOutletContext } from "react-router";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Client, createClient, createClientSchema, deleteClient, editClient, editClientSchema, getClients } from "@renderer/hooks/client";
import z from "zod";
import {
  FaRegTrashAlt,
} from "react-icons/fa";

/* DATA TYPES */
//Modals to open
type ModalStateClients = ModalState | "detalles" | "eliminar" | "editar";

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
    render: (item: Client) => item.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Direccion",
    key: "address",
    render: (item: Client) => item.address,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Numero de telefono",
    key: "phone",
    render: (item: Client) => item.phone,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  /*
  {
    label: "Referido por",
    key: "referredBy",
    render: (item: Client) => item.referredBy,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  */
  {
    label: "Informacion adicional",
    key: "info",
    render: (item: Client) => item.info,
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
      //const { dateString } = getNextDueDate(item);
      //return dateString;
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
/* FUNCTIONS */
/*
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
*/
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
  const [clients, setClients] = useState<Client[]>([]);

  /* QUERIES */
  //
  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryFn: () => getClients(orgID),
    queryKey: ["clients", "all"],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
      setClients(data);
    }
    }
  });
//
const createClientMutation = useMutation({
  mutationFn: ({ orgID, clientData }: { orgID: number; clientData: z.infer<typeof createClientSchema> }) => 
    createClient(orgID, clientData),
  onSuccess: (newClient) => {
    console.log("Cliente creado correctamente:", newClient);
    
    //
    queryClient.refetchQueries({ queryKey: ["clients", "all"] });
  
   // Cerrar el modal
  closeDialog(dialogAddClient);

  // Resetear formulario
    formRef.current?.reset();
  },
  onError: (error) => {
    console.error("Error al crear cliente:", error);
  },
});
//
const deleteClientMutation = useMutation({
  mutationFn: ({ orgID, clientID }: { orgID: number; clientID: number }) =>
    deleteClient(orgID, clientID),
  onSuccess: () => {
    // Refetch de la lista de clientes
    clientsQuery.refetch();
    closeDialog(dialogDeleteClient);
    setModalState("")
  },
});
//
const editClientMutation = useMutation({
  mutationFn: ({ orgID, clientID, clientData }: { orgID: number; clientID: number; clientData: z.infer<typeof editClientSchema> }) =>
    editClient(orgID, clientID, clientData),
  onSuccess: (updatedClient) => {
    console.log("Cliente creado correctamente:", updatedClient);
    closeDialog(dialogEditClient);
    setModalState("");
    clientsQuery.refetch();
  },
  onError: (error) => {
    console.error("Error al editar un cliente:", error);

  },
})

  /* REFs */
  //add loans container ref
  const dialogAddClient = useRef<HTMLDialogElement>(null);
  //clients details container ref
  const dialogClientDetail = useRef<HTMLDialogElement>(null);
  //
  const dialogDeleteClient = useRef<HTMLDialogElement>(null);
  //
  const formRef = useRef<HTMLFormElement>(null);
  //
  const editClientformRef = useRef<HTMLFormElement>(null);
  //
  const dialogEditClient = useRef<HTMLDialogElement>(null);

  /* FUNCTIONS */
  //
  const calculateNetProfitTotal = (operations: OperationsExample[]) => {
    const total = operations.reduce((acc, op) => acc + (op.netProfit ?? 0), 0);
    return total;
  };
//
  const filteredOperationsByCurrency = clientOperations.filter((op) => {
    const currencyMatch =
      selectedCurrency === "" ||
      op.currency.toLowerCase() === selectedCurrency.toLowerCase();

    const startMatch = startDate === "" || op.date >= new Date(startDate);

    const endMatch = endDate === "" || op.date <= new Date(endDate);

    return currencyMatch && startMatch && endMatch;
  });
  //Recieves all filters and returns the filtered data
  const filteredClients = clients.filter((client) => {
  if (!searchText.trim()) return true;

  return client.name.toLowerCase().includes(searchText.toLowerCase().trim());
});

//
  const selectedRow = filteredClients.find((row) => row.id === rowID);
/*
  //
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
*/
  /* USE EFFECT */
  //Opens the client details modal
  useEffect(() => {
    if (modalState === "detalles") {
      const selectedClient = filteredClients.find((c) => c.id === rowID);
      if (selectedClient) {
        //setClientOperations(selectedClient.operations || []);
      }
      openDialog(dialogClientDetail);
    } else if (modalState === "eliminar") {
      openDialog(dialogDeleteClient);
    } else if(modalState === "editar"){
      openDialog(dialogEditClient)
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
  // Función para manejar el submit del formulario
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  const formData = new FormData(e.currentTarget);
  const clientData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    info: formData.get('info') as string || null,
  };
  
  createClientMutation.mutate({ 
    orgID: orgID, // Reemplaza con tu orgID
    clientData 
  });
};

const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!selectedRow) return;

  const formData = new FormData(e.currentTarget);
  const clientData = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string || "",
    info: formData.get("info") as string || "",
  };

  editClientMutation.mutate({
    orgID,
    clientID: selectedRow.id,
    clientData,
  });
};


  /* UTILS */
  //
  const queryClient = useQueryClient(); 
const user: BaseResponseServer & {data: User} = useOutletContext();
//
const orgID: number = user.data.organization.id;

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
            loading={clientsQuery.isLoading || clientsQuery.isFetching}
            error={clientsQuery.isError}
            searchInput={""}
            data={filteredClients}
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
        ref={formRef}
          onSubmit={handleSubmit}
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
              name="name"
                required
                placeholder="Ej: Eduardo Perez"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Direccion
              <input
                name="address"
                placeholder="Ej: Juncal 262"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
              name="phone"
              type="tel"
                placeholder="Ej: +5491134865214"
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
            name="info"
              placeholder="Por ejemplo: Casa de rejas verdes"
              className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
            <Button
              isLoading = {createClientMutation.isLoading}
              type="submit"
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
      {/* DELETE CLIENT MODAL */}
      <dialog
        ref={dialogDeleteClient}
        className="h-fit w-1/3 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex gap-4 border-b pb-3">
          <FaRegTrashAlt className="size-7" />
          <p className="w-full text-xl font-semibold">
            Eliminar cliente
          </p>
          <button
            onClick={() => {
              setModalState("");
              closeDialog(dialogDeleteClient);
            }}
            className="text-slate-500 transition-colors hover:text-red-500"
            aria-label="Cerrar"
          >
            <IoClose className="size-6" />
          </button>
        </div>
        <div className="flex flex-col justify-center pt-4">
        <p className="font-semibold">¿Estas seguro de eliminar al cliente {selectedRow?.name}?</p>
        <p className="pb-4">Una vez eliminado, no podras volver a recuperarlo.</p>
        <Button
        type="button"
        color="danger"
          isLoading={deleteClientMutation.isLoading}
          onPress={()=>{
            if (rowID) {
              deleteClientMutation.mutate({ orgID, clientID: rowID })}}
            }
        >
          Eliminar
        </Button>
        </div>
      </dialog>
      {/* DETAIL CLIENT MODAL */}
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
            <p>Telefono: {selectedRow?.phone}</p>
            {/*<p>Referido por: {selectedRow?.referredBy}</p>*/}
            <p>Informacion adicional: {selectedRow?.info}</p>
            <div className="mt-1 border-t pt-1">
              <span className="text-lg font-semibold text-slate-500">
                Ganancia neta: $
                {detailsTableType/* === "operations"
                  ? netProfitTotal.toLocaleString("es-AR")
                  : calculateNetProfitForLoans(filteredLoans).toLocaleString(
                      "es-AR",
                    )*/}
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
                  {/*availableCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency.charAt(0).toUpperCase() + currency.slice(1)}
                    </option>
                  ))*/}
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
                  {/*availableLoanCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency.charAt(0).toUpperCase() + currency.slice(1)}
                    </option>
                  ))*/}
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

          {/*detailsTableType === "loans" && (
            <TableWork
              columns={LOANS_COLUMNS}
              data={filteredLoans}
              loading={false}
              error={false}
              searchInput={""}
              openModal={null}
              optionsMenu={[]}
            />
          )*/}
        </div>
      </dialog>
      {/* EDIT CLIENT MODAL */}
      <dialog
        ref={dialogEditClient}
        className="h-fit w-1/2 rounded-lg shadow-lg"
      >
        {/* FORM'S CONTAINER */}
        <form
        ref={editClientformRef}
          onSubmit={handleSubmitEdit}
          className="flex h-full w-full flex-col px-8 py-4 text-slate-500"
        >
          {/* TITLE'S CONTAINER */}
          <div className="flex gap-4 border-b pb-4">
            <IoPeople className="size-7" />
            <h3 className="w-full text-xl font-semibold">
              Editar cliente
            </h3>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Nombre
              <input
              defaultValue={selectedRow?.name}
              name="name"
                required
                placeholder="Ej: Eduardo Perez"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Direccion
              <input
                defaultValue={selectedRow?.address}
                name="address"
                placeholder="Ej: Juncal 262"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
              defaultValue={selectedRow?.phone}
              name="phone"
              type="tel"
                placeholder="Ej: +5491134865214"
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
            defaultValue={selectedRow?.info ?? ""}
            name="info"
              placeholder="Por ejemplo: Casa de rejas verdes"
              className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
            <Button
              isLoading = {editClientMutation.isLoading}
              type="submit"
              color="success"
              className="w-full rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => closeDialog(dialogEditClient)}
              color="danger"
              className="w-full rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
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
