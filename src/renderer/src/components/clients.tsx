/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";

import {
  BanknoteIcon,
  CalendarOffIcon,
  CircleCheckIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import {
  cn,
  getDaysRemaingStatusSyles,
  getInstallmentStatusSyles,
  strNormalize,
} from "@renderer/utils";
import { TableWork } from "@renderer/components/Table";
import { getClientOperations, Operation } from "@renderer/hooks/operations";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  getClientLoans,
  Loan,
  paymentFrequencies,
} from "@renderer/hooks/loans";
import { Progress, Tooltip } from "@heroui/react";

export function ClientDetailsOperation({ clientID }: { clientID: number }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();

  const operationsClientQuery = useQuery<
    Awaited<ReturnType<typeof getClientOperations>>,
    ServerError
  >({
    queryFn: () => getClientOperations(clientID ?? -1, from, to),
    queryKey: ["operations-client", clientID, { from, to }],
    enabled: !!clientID,
  });

  /// Focus search with Ctrl + f
  useEffect(() => {
    const handleFocusSearch = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleFocusSearch);
    return () => window.removeEventListener("keydown", handleFocusSearch);
  }, []);

  const COLUMNS_OPERATIONS = useMemo(() => {
    return [
      {
        label: "Fecha",
        key: "date",
        render: (item: Operation) => format(item.date, "dd/MM/yyyy HH:mm"),
      },

      {
        label: "Caja entrada",
        key: "cashboxIncrement.name",
        render: (item: Operation) => item.cashboxIncrement.name,
      },
      {
        label: "Caja salida",
        key: "cashboxDecrement.name",
        render: (item: Operation) => item.cashboxDecrement.name,
      },
      {
        label: "Tipo de operación",
        key: "type",
        render: (item: Operation) =>
          item.type === "buys" ? (
            <div className="w-fit rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-500">
              Compra
            </div>
          ) : (
            <div className="flex w-fit justify-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">
              Venta
            </div>
          ),
      },
      {
        label: "Cantidad",
        key: "amount",
        render: (item: Operation) => (
          <span
            className={cn(
              item.type === "buys" ? "text-blue-500" : "text-primary",
              "",
            )}
          >
            ${item.amount.toFixed(2)}
          </span>
        ),
      },
      {
        label: "Precio",
        key: "price",
        render: (item: Operation) => (
          <span className="font-medium text-slate-500">
            ${item.price.toFixed(2)}
          </span>
        ),
      },
      {
        label: "Precio de mercado",
        key: "marketPrice",
        render: (item: Operation) => (
          <span>${item.marketPrice.toFixed(2)}</span>
        ),
      },
      {
        label: "Rendimiento",
        key: "profit",
        render: (item: Operation) =>
          item.profit > 0 ? (
            <div className="flex items-center gap-2 font-medium">
              ${item.profit}
              <div className="flex min-w-10 items-center justify-center gap-1 rounded-lg bg-success/10 px-1.5 py-0.5 text-xs text-success">
                {((item.profit / (item.amount * item.price)) * 100).toFixed(2)}%
                <TrendingUpIcon className="size-3 min-w-3" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-medium">
              ${item.profit}
              <div className="flex min-w-10 items-center justify-center gap-1 rounded-lg bg-danger/10 px-1.5 py-0.5 text-xs text-danger">
                {((item.profit / (item.amount * item.price)) * 100).toFixed(2)}%
                <TrendingDownIcon className="size-3 min-w-3" />
              </div>
            </div>
          ),
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Operation) => item.sellerName,
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Operation) => <span>${item.commission.toFixed(2)}</span>,
      },
    ];
  }, [operationsClientQuery.data]);

  const filteredOperations = useMemo(() => {
    if (!operationsClientQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return operationsClientQuery?.data?.filter((operation) => {
      let searched = `${operation.amount}${operation.sellerName}${operation.cashboxDecrement.name}${operation.cashboxIncrement.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [operationsClientQuery.data, search]);

  const totalAmount = useMemo(() => {
    if (!operationsClientQuery.data) return 0;

    return operationsClientQuery.data.reduce((acc, curr) => {
      return acc + curr.amount;
    }, 0);
  }, [operationsClientQuery.data]);

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden px-6">
      <div className="flex min-h-11 items-end justify-between gap-4">
        <div className="flex items-end gap-2">
          <div
            className={cn(
              operationsClientQuery.isFetching && "opacity-60",
              "flex h-9 min-h-8 w-full max-w-72 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
            )}
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />
            <input
              ref={searchRef}
              disabled={operationsClientQuery.isFetching}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full text-sm text-slate-500 outline-none disabled:opacity-60"
              type="text"
              placeholder="Buscar..."
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
                  if (!operationsClientQuery.isFetching) {
                    fromRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={operationsClientQuery.isFetching}
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
                  if (!operationsClientQuery.isFetching) {
                    toRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={operationsClientQuery.isFetching}
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

        {operationsClientQuery.data && (
          <div className="flex h-full items-end gap-4">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-nowrap text-xs text-slate-400/80">
                <BanknoteIcon className="size-4 min-w-4" />
                Total operaciones
              </span>
              <span className="text-right text-lg font-medium text-slate-500">
                ${totalAmount.toLocaleString("es")}
              </span>
            </div>
            <span className="h-[80%] w-px bg-slate-300" />
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-nowrap text-xs text-slate-400/80">
                <WalletCardsIcon className="size-4 min-w-4" />
                Cantidad de operaciones
              </span>
              <span className="text-right text-lg font-medium text-slate-500">
                {operationsClientQuery.data?.length ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {(from || to) &&
      filteredOperations.length === 0 &&
      !operationsClientQuery.isFetching ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CalendarOffIcon className="size-16 text-slate-400" />
          <p className="text-slate-400">
            No hay resultados de operaciones durante esa fecha
          </p>
        </div>
      ) : (
        <TableWork
          columns={COLUMNS_OPERATIONS}
          loading={operationsClientQuery.isFetching}
          error={operationsClientQuery.error}
          searchInput={search}
          data={filteredOperations}
          openModal={() => console.log()}
        />
      )}
    </div>
  );
}

export function ClientDetailsLoan({ clientID }: { clientID: number }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();

  const loansClientQuery = useQuery<
    Awaited<ReturnType<typeof getClientLoans>>,
    ServerError
  >({
    queryFn: () => getClientLoans(clientID ?? -1, from, to),
    queryKey: ["loans-client", clientID, { from, to }],
    enabled: !!clientID,
  });

  /// Focus search with Ctrl + f
  useEffect(() => {
    const handleFocusSearch = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleFocusSearch);
    return () => window.removeEventListener("keydown", handleFocusSearch);
  }, []);

  const COLUMNS_LOANS = useMemo(() => {
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
            <span className="text-[0.7rem] font-medium text-slate-400">
              Ganancia:{" "}
              <span className="text-primary">+${item.expected_profit}</span>
            </span>
          </div>
        ),
      },

      {
        label: "Valor por cuota",
        key: "installmentValue",
        render: (item: Loan) => (
          <span className="text-slate-400">${item.installmentValue}</span>
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
                {currentInstallment > item.numberOfInstallments
                  ? item.numberOfInstallments
                  : currentInstallment}
                /{item.numberOfInstallments}
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

          if (currentInstallment >= item.numberOfInstallments)
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
          if (
            item.totalPaid >=
            item.numberOfInstallments * item.installmentValue
          )
            return "-";
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
        render: (item: Loan) => <span>${item.commission.toFixed(2)}</span>,
      },
    ];
  }, []);

  const filteredLoans = useMemo(() => {
    if (!loansClientQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return loansClientQuery?.data?.filter((loan) => {
      let searched = `${loan.principal}${loan.retainedEarnings}${loan.seller.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [loansClientQuery.data, search]);

  const totalAmount = useMemo(() => {
    if (!loansClientQuery.data) return 0;

    return loansClientQuery.data.reduce((acc, curr) => {
      return acc + curr.principal;
    }, 0);
  }, [loansClientQuery.data]);

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden px-6">
      <div className="flex min-h-11 items-end justify-between gap-4">
        <div className="flex items-end gap-2">
          {/* Search */}
          <div
            className={cn(
              loansClientQuery.isFetching && "opacity-60",
              "flex h-9 min-h-8 w-full max-w-72 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
            )}
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />
            <input
              ref={searchRef}
              disabled={loansClientQuery.isFetching}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full text-sm text-slate-500 outline-none"
              type="text"
              placeholder="Buscar..."
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
                  if (!loansClientQuery.isFetching) {
                    fromRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansClientQuery.isFetching}
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
                  if (!loansClientQuery.isFetching) {
                    toRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansClientQuery.isFetching}
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

        {loansClientQuery.data && (
          <div className="flex h-full items-end gap-4">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-nowrap text-xs text-slate-400/80">
                <BanknoteIcon className="size-4 min-w-4" />
                Total préstamos
              </span>
              <span className="text-right text-lg font-medium text-slate-500">
                ${totalAmount.toLocaleString("es")}
              </span>
            </div>
            <span className="h-[80%] w-px bg-slate-300" />
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-nowrap text-xs text-slate-400/80">
                <WalletCardsIcon className="size-4 min-w-4" />
                Cantidad de préstamos
              </span>
              <span className="text-right text-lg font-medium text-slate-500">
                {loansClientQuery.data?.length ?? 0}
              </span>
            </div>
          </div>
        )}

        {/* {loansClientQuery.data && (
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-start border-l-3 border-primary pl-2">
              <span className="text-nowrap text-xs text-slate-400/80">
                Total préstamos
              </span>
              <span className="font-medium text-slate-500">
                ${totalAmount.toLocaleString("es")}
              </span>
            </div>
            <div className="flex flex-col items-start border-l-3 border-primary pl-2">
              <span className="text-nowrap text-xs text-slate-400/80">
                Cantidad de préstamos
              </span>
              <span className="font-medium text-slate-500">
                {loansClientQuery.data?.length ?? 0}
              </span>
            </div>
          </div>
        )} */}
      </div>

      {(from || to) &&
      filteredLoans.length === 0 &&
      !loansClientQuery.isFetching ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CalendarOffIcon className="size-16 text-slate-400" />
          <p className="text-slate-400">
            No hay resultados de préstamos durante esa fecha
          </p>
        </div>
      ) : (
        <TableWork
          columns={COLUMNS_LOANS}
          loading={loansClientQuery.isFetching}
          error={loansClientQuery.error}
          searchInput={search}
          data={filteredLoans}
          openModal={() => console.log()}
        />
      )}
    </div>
  );
}
