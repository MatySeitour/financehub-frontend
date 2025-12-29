import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleAlertIcon,
  SearchIcon,
} from "lucide-react";
import { TableWork } from "@renderer/components/Table";
import { format } from "date-fns";
import { getCashboxCurrentHistoryMoviments } from "@renderer/hooks/cashboxes";
import { Moviment } from "@renderer/hooks/moviments";

export function CurrentMovimentsHistoryCashbox({
  cashboxID,
}: {
  cashboxID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const historyMovimentsQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxCurrentHistoryMoviments>>,
    ServerError
  >({
    queryKey: ["history-moviments", cashboxID],
    queryFn: () => getCashboxCurrentHistoryMoviments(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
  });

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha generado",
        key: "date",
        render: (item: Moviment) => format(item.date, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Fecha generado",
        key: "date",
        render: (item: Moviment) =>
          item.moviment_type === "income" ? (
            <div className="flex items-center gap-1.5 text-success">
              <ArrowUpIcon className="size-3.5 min-w-3.5" />
              Ingreso
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-danger">
              <ArrowDownIcon className="size-3.5 min-w-3.5" />
              Egreso
            </div>
          ),
      },
      {
        label: "Monto",
        key: "amount",
        render: (item: Moviment) =>
          item.moviment_type === "income" ? (
            <span className="font-medium text-success">${item.amount}</span>
          ) : (
            <span className="font-medium text-danger">$ -{item.amount}</span>
          ),
      },
      {
        label: "Descripción",
        key: "description",
        render: (item: Moviment) => item.description,
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

  const filteredMoviments = useMemo(() => {
    if (!historyMovimentsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyMovimentsQuery?.data?.filter((moviment) => {
      let searched = `${moviment.amount}${moviment.description}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyMovimentsQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyMovimentsQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={
            historyMovimentsQuery.isFetching || !historyMovimentsQuery.data
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
      {historyMovimentsQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlertIcon className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay gastos en este historial</p>
        </div>
      ) : (
        <TableWork
          withButtonCreate={false}
          columns={COLUMNS}
          error={historyMovimentsQuery.error}
          loading={historyMovimentsQuery.isFetching}
          searchInput={search}
          data={filteredMoviments}
          openModal={() => console.log()}
        />
      )}
    </>
  );
}
