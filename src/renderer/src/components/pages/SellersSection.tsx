/* IMPORTS */
import { Button } from "@heroui/react";
import { useRef, useState, useEffect } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import {
  BaseResponseServer,
  MenuOption,
  ServerError,
  User,
} from "@renderer/utils/types";
import {
  ModalStateSeller,
  OperationsExample,
} from "@renderer/utils/types/seller.types";

import {
  COLUMNS,
  OPERATIONS_COLUMNS,
} from "@renderer/utils/data/sellerColumns";
import {
  calculateNetProfitTotal,
  filterOperationsByCurrencyAndDate,
} from "@renderer/utils/functions/operationUtils";
import { LinkIcon, UsersRoundIcon, XIcon } from "lucide-react";
import { useDialog } from "@renderer/hooks/useDialog";
import { useOutletContext } from "react-router";
import {
  CreateSellerModal,
  DeleteSellerModal,
  EditSellerModal,
} from "../modals/sellers";
import { getSellers, Seller } from "@renderer/hooks/seller";
import { useQuery } from "react-query";

/* UTILS */
//Custom menu options
const contextMenuOption: MenuOption[] = [
  {
    name: "Detalles",
    icon: LinkIcon,
    route: undefined,
  },
] as const;

//Component starts here
export function SellersSection() {
  /* STATES */
  //Filter loans based on their currency
  const [loanCurrencyFilter, setLoanCurrencyFilter] = useState<string>("");
  //Filter loans based on their start date
  const [loanStartDate, setLoanStartDate] = useState<string>("");
  //Filter loans based on their end date
  const [loanEndDate, setLoanEndDate] = useState<string>("");
  //Filter ¿operations? based on their start date
  const [startDate, setStartDate] = useState<string>("");
  //Filter ¿operations? based on their end date
  const [endDate, setEndDate] = useState<string>("");
  //Manipulate the filter that search for seller
  const [searchText, setSearchText] = useState("");
  //Save the id of the selected row
  const [rowID, setRowID] = useState<number>();
  //Save the total of the profits
  const [netProfitTotal, setNetProfitTotal] = useState<number>(0);
  //Filter the total amount of each currency to the sellers detail modal
  const [selectedCurrency, setSelectedCurrency] = useState("");
  //Open or close the details seller modal
  const [modalState, setModalState] = useState<ModalStateSeller>("");
  //Control what info will show the table on the details modal (operations/loans)
  const [detailsTableType, setDetailsTableType] = useState<
    "operations" | "loans"
  >("operations");
  //Store operations data for selected seller
  const [sellerOperations, setSellerOperations] = useState<OperationsExample[]>(
    [],
  );
  const [sellers, setSellers] = useState<Seller[]>([]);

  /* HOOKS */
  //
  const createSellerDialog = useDialog();
  //
  const deleteSellerDialog = useDialog();
  //
  const editSellerDialog = useDialog();

  /* QUERIES */
  //
  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryFn: () => getSellers(orgID),
    queryKey: ["sellers", "all"],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
        setSellers(data);
      }
    },
  });

  /* REFs */
  //sellers details container ref
  const dialogSellerDetail = useRef<HTMLDialogElement>(null);

  /* FUNCTIONS */
  //Filter operations table based on their currency and on their dates
  const filteredOperationsByCurrency = filterOperationsByCurrencyAndDate(
    sellerOperations,
    selectedCurrency,
    startDate,
    endDate,
  );

  //Filter sellers based on their name
  const filteredSellers = sellers.filter((item) => {
    if (!searchText.trim()) {
      return true;
    }

    return item.name.toLowerCase().includes(searchText.toLowerCase().trim());
  });
  //Save the info of the selected seller
  const selectedRow = filteredSellers.find((row) => row.id === rowID);
  /*
  //Put only the available currencies into a select element (operations)
  const availableCurrencies = Array.from(
    new Set(selectedRow?.operations.map((op) => op.currency.toLowerCase())),
  );
  //Filter loans table based on their date and their currency
  const filteredLoans = filterLoansByCurrencyAndDueDate(
    selectedRow?.loans ?? [],
    loanCurrencyFilter,
    loanStartDate,
    loanEndDate,
  );
<<<<<<< HEAD
=======
  
>>>>>>> b5b3e22 (refactor(sellers): edit, delete and add sellers are now components. Those components are consuming the API successfully. Have to do details modal.)

  //Put only the available currencies into a select element (loans)
  const availableLoanCurrencies = Array.from(
    new Set(selectedRow?.loans?.map((loan) => loan.currency.toLowerCase())),
  );
  */

  /* USE EFFECT */
  //Open the seller details modal and set the info of the selected seller on it
  useEffect(() => {
    if (modalState === "detalles") {
      const selectedSeller = filteredSellers.find((c) => c.id === rowID);
      if (selectedSeller) {
        //setSellerOperations(selectedSeller.operations || []);
      }
      openDialog(dialogSellerDetail);
    } else if (modalState === "eliminar") {
      deleteSellerDialog.open();
    } else if (modalState === "editar") {
      editSellerDialog.open();
    }
  }, [modalState]);
  //Refresh the filters when a new seller is selected
  useEffect(() => {
    setSelectedCurrency("");
    setStartDate("");
    setEndDate("");
  }, [rowID]);
  //Set the net profit of a seller (operations)
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
  //Handle the input that searches seller based on their names
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  //
  function handleCloseDeleteModal() {
    setModalState("");
    deleteSellerDialog.close();
  }

  /* UTILS */
  //
  const user: BaseResponseServer & { data: User } = useOutletContext();
  //
  const orgID: number = user.data.organization.id;

  return (
    <>
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <div className="flex gap-4 text-slate-500">
          {/* SELLER ICON */}
          <UsersRoundIcon className="size-7" />
          {/* TITLE */}
          <h2 className="text-2xl font-bold">VENDEDORES</h2>
        </div>
        {/* BUTTON THAT OPEN THE MODAL TO CREATE A NEW SELLER */}
        <Button
          onPress={createSellerDialog.open}
          color="success"
          className="rounded-md text-white"
        >
          Nuevo vendedor
        </Button>
      </div>
      {/* SELLERS'S SECTION CONTAINER */}
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
                list="sellersList"
                placeholder="Nombre del vendedor.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
        </div>
        {/* TABLE'S CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={COLUMNS}
            loading={sellersQuery.isLoading || sellersQuery.isFetching}
            error={sellersQuery.isError}
            searchInput={""}
            data={filteredSellers}
            openModal={setModalState}
            optionsMenu={[...contextMenuOption, ...contextMenuBasicOptions]}
            selectRowID={setRowID}
          />
        </div>
      </section>
      {/* ADD SELLER MODAL */}
      <CreateSellerModal
        orgID={orgID}
        dialogRef={createSellerDialog.dialogRef}
        closeModal={createSellerDialog.close}
      />
      {/* DELETE SELLER MODAL */}
      <DeleteSellerModal
        orgID={orgID}
        dialogRef={deleteSellerDialog.dialogRef}
        closeModal={handleCloseDeleteModal}
        sellerID={selectedRow?.id!}
        sellerName={selectedRow?.name!}
      />
      {selectedRow && (
        <EditSellerModal
          orgID={orgID}
          seller={selectedRow!}
          dialogRef={editSellerDialog.dialogRef}
          closeModal={() => {
            setModalState("");
            editSellerDialog.close();
          }}
        />
      )}
      {/* EDIT SELLER MODAL */}
      {/* SELLERS DETAIL MODAL */}
      <dialog
        ref={dialogSellerDetail}
        className="h-full w-2/3 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex gap-4 border-b pb-3">
          {/* SELLER'S ICON */}
          <UsersRoundIcon className="size-7 min-w-7" />
          {/* TITLE */}
          <p className="w-full text-xl font-semibold">
            Detalles de {selectedRow?.name}
          </p>
          {/* CLOSE THE MODAL BUTTON */}
          <button
            onClick={() => {
              setModalState("");
              closeDialog(dialogSellerDetail);
            }}
            className="text-slate-500 transition-colors hover:text-red-500"
            aria-label="Cerrar"
          >
            <XIcon className="size-6 min-w-6" />
          </button>
        </div>
        {/* INFO CONTAINER */}
        <div className="flex w-full items-center gap-8 pt-4 text-sm">
          <div className="w-full rounded-md border px-4 py-2 shadow-sm">
            {/* SELLER´S PHONE NUMBER */}
            <p>Telefono: {selectedRow?.phone}</p>
            {/* SELLER´S INFO */}
            <p>Informacion adicional: {selectedRow?.info}</p>
            <div className="mt-1 border-t pt-1">
              {/* SELLER´S NET PROFIT */}
              <span className="text-lg font-semibold text-slate-500">
                Ganancia neta: $
                {/*detailsTableType === "operations"
                  ? netProfitTotal.toLocaleString("es-AR")
                  : calculateNetProfitForLoans(filteredLoans).toLocaleString(
                      "es-AR",
                    )*/}
              </span>
            </div>
            {/* SELLER´S TOTAL COMMISSION */}
            <span className="text-lg font-semibold text-slate-500">
              Comisión total: $
              {/*detailsTableType === "operations"
                ? calculateTotalCommissionFromOperations(
                    filteredOperationsByCurrency,
                  )
                : calculateTotalCommissionFromLoans(filteredLoans)*/}
            </span>
          </div>
        </div>
        {/* FILTERS */}
        <div className="flex flex-row gap-4 pt-4 text-sm text-slate-500">
          {/* OPERATION OR LOAN FILTER */}
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
          {/* OPERATION FILTERS */}
          {detailsTableType === "operations" && (
            <>
              {/* AVAILABLE CURRENCY FILTER */}
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
              {/* START DATE AND END DATE FILTER */}
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
          {/* LOAN FILTERS */}
          {detailsTableType === "loans" && (
            <>
              {/* AVAILABLE CURRENCY FILTER */}
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
              {/* START AND END OF THE NEXT DUE DATE FILTER */}
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
        {/* TABLES CONTAINER */}
        <div className="relative flex-grow overflow-hidden py-8">
          {/* OPERATIONS TABLE */}
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
          {/* LOANS TABLE */}
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
