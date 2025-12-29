import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarX2Icon,
  CheckIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  CircleDotIcon,
  SearchIcon,
} from "lucide-react";
import { TableWork } from "@renderer/components/Table";
import { differenceInDays, format } from "date-fns";
import { getCashboxHistoryInstallments } from "@renderer/hooks/cashboxes";
import { InstallmentHistory } from "@renderer/hooks/installments";
import { ServerError } from "@renderer/utils/types";

export function InstallmentsHistoryCashbox({
  cashboxID,
  historyID,
}: {
  cashboxID: number;
  historyID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const historyInstallmentsQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxHistoryInstallments>>,
    ServerError
  >({
    queryKey: ["history-installments", historyID],
    queryFn: () =>
      getCashboxHistoryInstallments(cashboxID ?? -1, historyID ?? -1),
    retry: false,
    enabled: !!cashboxID && !!historyID,
  });

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha de pago",
        key: "movimentDateTime",
        render: (item: InstallmentHistory) =>
          format(item.movimentDateTime, "dd/MM/yyyy"),
      },
      {
        label: "Monto acumulado",
        key: "amount",
        render: (item: InstallmentHistory) => (
          <div
            className={cn(
              item.paymentAmount === item.value
                ? "text-primary"
                : "text-slate-400",
              "flex items-center gap-2",
            )}
          >
            <span>${item.paymentAmount}</span>
            <ChevronRightIcon className="size-4 min-w-4 text-slate-400" />
            <span>${item.value}</span>
          </div>
        ),
      },
      {
        label: "Número de cuota",
        key: "number_of_installments",
        wrapContent: true,
        render: (item: InstallmentHistory) => (
          <ul className="flex w-full flex-wrap items-center gap-0.5 py-1">
            {Array.from({ length: item.number_of_installments }).map(
              (_, index) => (
                <li
                  key={index}
                  className={cn(
                    index + 1 === item.number
                      ? "border-blue-100 bg-blue-100/70 text-blue-300"
                      : index + 1 < item.number
                        ? "border-primary/15 bg-primary/10 text-primary/60"
                        : "border-slate-100 bg-slate-100/70 text-slate-400",
                    "flex size-6 min-w-6 items-center justify-center rounded-md border p-1 text-xs",
                  )}
                >
                  {index + 1 < item.number ? (
                    <CheckIcon className="size-3.5 min-w-3.5" />
                  ) : (
                    index + 1
                  )}
                </li>
              ),
            )}
          </ul>
        ),
      },
      {
        label: "Valor de cuota",
        key: "value",
        render: (item: InstallmentHistory) => `$${item.value}`,
      },
      {
        label: "Estado de cuota",
        key: "paymentAmount",
        render: (item: InstallmentHistory) => (
          <div className="flex items-center gap-2">
            {item.paymentAmount === item.value ? (
              <>
                <CircleCheckBigIcon className="size-4 min-w-4 text-primary" />
                <span className="text-primary">Pagada</span>
              </>
            ) : (
              <>
                <CircleDotIcon className="size-4 min-w-4 text-warning" />
                <span className="text-warning">Pendiente</span>
              </>
            )}
          </div>
        ),
      },
      {
        label: "Tiempo de pago",
        key: "payment_date",
        render: (item: InstallmentHistory) => {
          const remainingDate = differenceInDays(
            item.dueDate,
            item.paymentDate ?? new Date(),
          );

          return (
            <div className="flex items-center gap-2">
              {item.paymentAmount === item.value &&
              remainingDate >= 0 &&
              item.paymentDate ? (
                <>
                  <CalendarCheck2Icon className="size-4 min-w-4 text-primary" />
                  <span className="text-primary">A tiempo</span>
                </>
              ) : item.paymentAmount !== item.value && remainingDate > 0 ? (
                <>
                  <CalendarClockIcon className="size-4 min-w-4 text-warning" />
                  <span className="text-warning">
                    Quedan {remainingDate} días
                  </span>
                </>
              ) : (
                <>
                  <CalendarX2Icon className="size-4 min-w-4 text-danger" />
                  <span className="text-danger">
                    Atrasado {remainingDate * -1} días
                  </span>
                </>
              )}
            </div>
          );
        },
      },
      {
        label: "Cliente",
        key: "clientName",
        render: (item: InstallmentHistory) => item.clientName,
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: InstallmentHistory) => item.sellerName,
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

  const filteredInstallments = useMemo(() => {
    if (!historyInstallmentsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyInstallmentsQuery?.data?.filter((installment) => {
      let searched = `${installment.amount}${installment.value}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyInstallmentsQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyInstallmentsQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={
            historyInstallmentsQuery.isFetching ||
            !historyInstallmentsQuery.data
          }
          onChange={(e) => setSearch(e.target.value)}
          className="h-full w-full text-sm text-slate-500 outline-none"
          type="text"
          placeholder="Buscar cuota..."
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
      {historyInstallmentsQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlertIcon className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay cuotas en este historial</p>
        </div>
      ) : (
        <TableWork
          withButtonCreate={false}
          columns={COLUMNS}
          error={historyInstallmentsQuery.error}
          loading={historyInstallmentsQuery.isFetching}
          searchInput={search}
          data={filteredInstallments}
          openModal={() => console.log()}
        />
      )}
    </>
  );
}
