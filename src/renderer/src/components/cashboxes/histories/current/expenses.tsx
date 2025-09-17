import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";
import { BaseResponseServer } from "@renderer/utils/types";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlertIcon, SearchIcon } from "lucide-react";
import { getCashboxCurrentHistoryExpenses } from "@renderer/hooks/cashboxes";
import { TableWork } from "@renderer/components/Table";
import { format } from "date-fns";
import { Expense } from "@renderer/hooks/expenses";

export function CurrentExpensesHistoryCashbox({
  cashboxID,
}: {
  cashboxID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const historyExpensesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxCurrentHistoryExpenses>>,
    BaseResponseServer
  >({
    queryKey: ["history-expenses", cashboxID],
    queryFn: () => getCashboxCurrentHistoryExpenses(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
  });

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha generado",
        key: "date",
        render: (item: Expense) => format(item.date, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Monto",
        key: "amount",
        render: (item: Expense) => (
          <span className="font-medium text-danger">-${item.amount}</span>
        ),
      },
      {
        label: "Descripción",
        key: "description",
        render: (item: Expense) => item.description,
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

  const filteredExpenses = useMemo(() => {
    if (!historyExpensesQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyExpensesQuery?.data?.filter((expense) => {
      let searched = `${expense.amount}${expense.description}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyExpensesQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyExpensesQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={
            historyExpensesQuery.isFetching || !historyExpensesQuery.data
          }
          onChange={(e) => setSearch(e.target.value)}
          className="h-full w-full text-sm text-slate-500 outline-none"
          type="text"
          placeholder="Buscar gasto..."
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
      {historyExpensesQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlertIcon className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay gastos en este historial</p>
        </div>
      ) : (
        <div className="relative flex-grow overflow-hidden">
          <TableWork
            columns={COLUMNS}
            error={historyExpensesQuery.error}
            loading={historyExpensesQuery.isFetching}
            searchInput={search}
            data={filteredExpenses}
            openModal={() => console.log()}
          />
        </div>
      )}
    </>
  );
}
