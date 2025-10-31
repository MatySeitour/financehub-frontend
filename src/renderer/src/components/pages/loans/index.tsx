/* IMPORTS */
import { Button } from "../../Button";
import { Progress, Tooltip, useDisclosure } from "@heroui/react";
import { DataPerPage, TableWork } from "../../Table";
import {
  CalendarOffIcon,
  CircleCheckIcon,
  LandmarkIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { getLoans, Loan, paymentFrequencies } from "@renderer/hooks/loans";
import { useQuery } from "react-query";
import { MenuOption, ServerError } from "@renderer/utils/types";
import {
  cn,
  getDaysRemaingStatusSyles,
  getInstallmentStatusSyles,
  strNormalize,
  withCbk,
} from "@renderer/utils";
import { useMemo, useRef, useState } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { getClients } from "@renderer/hooks/clients";
import { getSellers } from "@renderer/hooks/sellers";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { CreateLoanModal, DeleteLoanModal } from "../../modals/loans";
import { useNavigate } from "react-router";
import { ErrorMessage } from "@renderer/components/ErrorMessage";

//Component starts here
export function LoansSection() {
  /* REFs */
  const searchRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  /* STATES */
  //
  const [search, setSearch] = useState("");
  //
  const [page, setPage] = useState<number>(1);
  //
  const [from, setFrom] = useState<Date>();
  //
  const [to, setTo] = useState<Date>();
  //
  const [limit, setLimit] = useState<DataPerPage>(10);
  //
  const [loanToDelete, setLoanToDelete] = useState<Loan>();
  //
  // const [clientToUpdate, setLoanToUpdate] = useState<Loan>();

  /* HOOKS */
  //
  const navigate = useNavigate();

  /* QUERIES */
  //
  const loansQuery = useQuery<
    Awaited<ReturnType<typeof getLoans>>,
    ServerError
  >({
    queryKey: ["loans", "all", { page, limit, from, to }],
    queryFn: withCbk({
      queryFn: () => getLoans(from, to, page, limit),
      onSuccess: (data) => {
        if (page !== 1 && data.loans.length === 0) {
          setPage((prev) => --prev);
        }
      },
    }),
    keepPreviousData: true,
  });
  //
  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryKey: ["clients", "all"],
    queryFn: getClients,
  });
  //
  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryKey: ["sellers", "all"],
    queryFn: getSellers,
  });
  //
  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  /* DISCLOSURES */
  //
  const { isOpen: isCreateLoanOpenModal, onOpenChange: onOpenCreateLoanModal } =
    useDisclosure();

  /* REFs */

  /* USE EFFECT */

  /* EVENT HANDLERS */

  /* UTILS */
  //Loans table's columns
  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha generada",
        key: "dateGenerated",
        render: (item: Loan) => format(item.dateGenerated, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Monto",
        key: "principal",
        render: (item: Loan) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-500">
              ${item.principal}
            </span>
            <span className="text-[0.7rem] font-medium text-slate-400/70">
              Ganancia: ${item.expected_profit}
            </span>
          </div>
        ),
      },
      {
        label: "Cliente",
        key: "client.name",
        render: (item: Loan) => item.client.name,
      },
      {
        label: "Valor por cuota",
        key: "installmentValue",
        render: (item: Loan) => (
          <span className="text-primary">${item.installmentValue}</span>
        ),
      },
      {
        label: "Cuotas",
        key: "numberOfInstallments",
        render: (item: Loan) => {
          const currentInstallment =
            Math.floor(item.totalPaid / item.installmentValue) + 1;

          return (
            <div className="flex flex-col">
              <div className="w-fit rounded-lg border border-primary/10 bg-primary/5 px-1.5 py-0.5 text-[0.6rem] text-primary">
                {paymentFrequencies[item.paymentFrequency]}
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  size="sm"
                  aria-label="Loading..."
                  className="max-w-md"
                  value={currentInstallment}
                  maxValue={item.numberOfInstallments}
                />
                {currentInstallment}/{item.numberOfInstallments}
              </div>
            </div>
          );
        },
      },
      {
        label: "Total pagado",
        key: "totalPaid",
        render: (item: Loan) => {
          const currentInstallment =
            Math.floor(item.totalPaid / item.installmentValue) + 1;

          const textColorStatus = getInstallmentStatusSyles(
            currentInstallment,
            item.numberOfInstallments,
          );

          if (currentInstallment === item.numberOfInstallments)
            return (
              <div className="flex items-center gap-1 text-primary">
                <CircleCheckIcon className="size-4 min-w-4" />
                <span>Pagado</span>
              </div>
            );
          return (
            <>
              <span className={cn(textColorStatus)}> ${item.totalPaid}</span> de{" "}
              <span className={cn(textColorStatus)}>
                {" "}
                ${item.installmentValue * item.numberOfInstallments}
              </span>
            </>
          );
        },
      },

      {
        label: "Fecha de sig. cuota",
        key: "firstDueDate",
        render: (item: Loan) => {
          const remainingDate = differenceInDays(item.firstDueDate, new Date());
          const statusStyles = getDaysRemaingStatusSyles(remainingDate);

          return (
            <div className="flex items-center gap-3 pl-1">
              <Tooltip
                closeDelay={0}
                className={cn(
                  statusStyles.tooltipClass,
                  "rounded-md border-slate-400 text-xs font-light",
                )}
                content={
                  remainingDate > 0
                    ? `Faltan ${Math.abs(remainingDate)} días`
                    : remainingDate < 0
                      ? `La fecha de pago se atrasó ${Math.abs(remainingDate)} días`
                      : "Es hoy"
                }
              >
                <span
                  className={cn(
                    statusStyles.circleClass,
                    "inline-block size-2 rounded-full shadow-[0_0px_6px_1px]",
                  )}
                />
              </Tooltip>
              {format(item.firstDueDate, "dd/MM/yyyy")}
            </div>
          );
        },
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Loan) => item.seller.name,
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Loan) => (
          <span>${item.commission.toLocaleString("es-AR")}</span>
        ),
      },
    ];
  }, []);

  const actionOptions: MenuOption<Loan>[] = [
    {
      name: "Detalles",
      icon: PaperclipIcon,
      onAction: (loan) => navigate(`/loans/${loan?.id}/details`),
    },
    // {
    //   name: "Editar",
    //   icon: SquarePenIcon,
    //   onAction: (loan) => setLoanToUpdate(loan),
    // },
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: (loan) => setLoanToDelete(loan),
    },
  ];

  /* FUNCTIONS */
  const filteredLoans = useMemo(() => {
    if (!loansQuery?.data?.loans) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return loansQuery?.data?.loans?.filter((loan) => {
      let searched = `${loan.client.name}${loan.seller.name}${loan.cashboxID}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [loansQuery.data?.loans, search]);

  //
  function currency(id: number) {
    const matchedCashbox = cashboxesQuery.data?.find(
      (cashbox) => id === cashbox.id,
    );

    return matchedCashbox?.currency.name;
  }

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <LandmarkIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Préstamos</h1>
        </div>
        <Button
          onClick={onOpenCreateLoanModal}
          disabled={loansQuery.isLoading || loansQuery.isError}
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar préstamo
        </Button>
      </div>
      {/* LOAN'S CONTAINER */}
      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        {/* SEARCH FILTER CONTAINER */}
        <div
          className={cn(
            loansQuery.isFetching && "opacity-60",
            "flex w-full gap-16",
          )}
        >
          <div
            className="flex h-9 min-h-8 w-full max-w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />
            <input
              ref={searchRef}
              disabled={loansQuery.isFetching}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full text-sm text-slate-500 outline-none"
              type="text"
              placeholder="Buscar cliente o vendedor..."
            />
            <div className="flex items-center gap-1">
              <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
                Ctrl
              </div>
              <p className="text-xs text-slate-500">+</p>
              <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
                F
              </div>
            </div>
          </div>
          {/* DATE CONTAINER */}
          <div className="flex w-full items-center justify-end gap-2">
            {/* From date */}
            <label className="relative h-9 min-w-44 rounded-md border p-2 text-sm text-slate-400 transition-all focus-within:border-primary disabled:opacity-60">
              <span className="absolute -top-2.5 left-1.5 w-12 bg-white pl-1 text-xs text-slate-400/70">
                Desde
              </span>

              <input
                ref={fromRef}
                onFocus={() => {
                  // if input disabled, dont show datepicker
                  if (!loansQuery.isFetching) {
                    fromRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansQuery.isFetching}
                onChange={(e) => {
                  if (e.target.value === "") return setFrom(undefined);
                  setFrom(parseISO(e.target.value));
                }}
                type="date"
                className="w-full"
              />
            </label>

            {/* To date */}
            <label className="relative h-9 min-w-44 rounded-md border p-2 text-sm text-slate-400 transition-all focus-within:border-primary disabled:opacity-60">
              <span className="absolute -top-2.5 left-1.5 w-12 bg-white pl-1 text-xs text-slate-400/70">
                Hasta
              </span>

              <input
                ref={toRef}
                onFocus={() => {
                  // if input disabled, dont show datepicker
                  if (!loansQuery.isFetching) {
                    toRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansQuery.isFetching}
                onChange={(e) => {
                  if (e.target.value === "") return setTo(undefined);
                  setTo(parseISO(e.target.value));
                }}
                type="date"
                className="w-full"
              />
            </label>
          </div>
        </div>

        {/* TABLE'S CONTAINER */}

        {loansQuery.isError ? (
          <ErrorMessage error={loansQuery.error} />
        ) : (from || to) &&
          filteredLoans.length === 0 &&
          !loansQuery.isFetching ? (
          <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
            <CalendarOffIcon className="size-16 text-slate-400" />
            <p className="text-slate-400">
              No hay resultados de préstamos durante esa fecha
            </p>
          </div>
        ) : (
          <TableWork
            columns={COLUMNS}
            loading={loansQuery.isFetching}
            error={loansQuery.isError}
            searchInput={""}
            data={filteredLoans}
            openModal={onOpenCreateLoanModal}
            optionsMenu={actionOptions}
            pagination={{
              page: page,
              limit: limit,
              total: loansQuery.data?.total ?? 0,
              nextPage: setPage,
              prevPage: setPage,
              changeLimit: setLimit,
            }}
          />
        )}
      </div>

      {isCreateLoanOpenModal &&
        loansQuery.data &&
        clientsQuery.data &&
        sellersQuery.data &&
        cashboxesQuery.data && (
          <CreateLoanModal
            isOpen={isCreateLoanOpenModal}
            onClose={onOpenCreateLoanModal}
            clients={clientsQuery.data}
            sellers={sellersQuery.data}
            cashboxes={cashboxesQuery.data}
          />
        )}
      {loanToDelete && loansQuery.data && (
        <DeleteLoanModal
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(undefined)}
          loan={loanToDelete}
        />
      )}
      {/* {operationToDelete && loansQuery.data && (
              <DeleteLoanModal
                isOpen={!!loanToDelete}
                onClose={() => setLoanToDelete(undefined)}
                operation={loanToDelete}
              />
            )} */}

      {/* <section className="h-full w-full" ref={loansSection}>
        <div className="flex h-fit w-full flex-col gap-4 px-6 py-4 text-sm text-slate-400">
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
          <div className="flex w-1/2 gap-4">
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
      </section> */}
      {/* ADD LOAN MODAL */}
      {/* <CreateLoanModal
        dialogRef={createLoanDialog.dialogRef}
        closeModal={createLoanDialog.close}
      /> */}
      {/* LOAN DETAIL MODAL */}
      {/* 
      <dialog
        ref={dialogLoanDetail}
        className="h-fit w-1/2 rounded-lg px-8 py-4 text-slate-600"
      >
        <div className="flex h-full w-full justify-center">
          <p className="w-full items-center border-b pb-4 text-center text-xl font-semibold">
            Detalles del prestamo
          </p>
        </div>
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
       */}
      {/* DIALOG ADD PAY TO LOAN */}
      {/*       
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
      </dialog> */}
    </section>
  );
}
