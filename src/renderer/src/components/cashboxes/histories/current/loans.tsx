import {
  cn,
  getDaysRemaingStatusSyles,
  getInstallmentStatusSyles,
  strNormalize,
} from "@renderer/utils";
import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";
import { Progress, Tooltip } from "@heroui/react";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleOffIcon,
  SearchIcon,
} from "lucide-react";
import { getCashboxCurrentHistoryLoans } from "@renderer/hooks/cashboxes";
import { TableWork } from "@renderer/components/Table";
import { differenceInDays, format, parseISO } from "date-fns";
import { Loan, paymentFrequencies } from "@renderer/hooks/loans";

export function CurrentLoansHistoryCashbox({
  cashboxID,
}: {
  cashboxID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const historyLoansQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxCurrentHistoryLoans>>,
    ServerError
  >({
    queryKey: ["history-loans-current", cashboxID],
    queryFn: () => getCashboxCurrentHistoryLoans(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
  });

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha generada",
        key: "dateGenerated",
        render: (item: Loan) => format(parseISO(item.dateGenerated), "dd/MM/yyyy HH:mm"),
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
              {format(parseISO(item.firstDueDate), "dd/MM/yyyy")}
            </div>
          );
        },
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Loan) => (item.seller ? item.seller.name : "-"),
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Loan) =>
          item.commission === 0 ? (
            <div className="flex items-center gap-1.5 text-slate-300">
              <CircleOffIcon className="size-4 min-w-4" />
              Sin comisión
            </div>
          ) : (
            <span className="">${item.commission.toLocaleString("es-AR")}</span>
          ),
      },
    ];
  }, []);

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

  const filteredLoans = useMemo(() => {
    if (!historyLoansQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyLoansQuery?.data?.filter((loan) => {
      let searched = `${loan.client.name}${loan.seller?.name}${loan.principal}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyLoansQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyLoansQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={historyLoansQuery.isFetching || !historyLoansQuery.data}
          onChange={(e) => setSearch(e.target.value)}
          className="h-full w-full text-sm text-slate-500 outline-none"
          type="text"
          placeholder="Buscar préstamo..."
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

      {/* Body */}
      {historyLoansQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlertIcon className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay préstamos en este historial</p>
        </div>
      ) : (
        <TableWork
          withButtonCreate={false}
          columns={COLUMNS}
          loading={historyLoansQuery.isLoading}
          error={historyLoansQuery.error}
          searchInput={search}
          data={filteredLoans}
          openModal={() => console.log()}
        />
      )}
    </>
  );
}
