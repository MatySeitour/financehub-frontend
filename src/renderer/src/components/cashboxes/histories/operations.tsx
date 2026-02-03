import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleAlert,
  CircleOffIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { getCashboxHistoryOperations } from "@renderer/hooks/cashboxes";
import { TableWork } from "@renderer/components/Table";
import { Operation } from "@renderer/hooks/operations";
import { format } from "date-fns";

export function OperationsHistoryCashbox({
  cashboxID,
  historyID,
}: {
  cashboxID: number;
  historyID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const historyOperationsQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxHistoryOperations>>,
    ServerError
  >({
    queryKey: ["history-operations", historyID],
    queryFn: () =>
      getCashboxHistoryOperations(cashboxID ?? -1, historyID ?? -1),
    retry: false,
    enabled: !!cashboxID && !!historyID,
  });

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Número",
        key: "id",
        render: (item: Operation) => `#${item.id}`,
      },
      {
        label: "Fecha",
        key: "date",
        render: (item: Operation) => format(item.date, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Cliente",
        key: "clientName",
        render: (item: Operation) => item.clientName,
      },
      {
        label: "Caja entrada",
        key: "cashboxIncrement.name",
        render: (item: Operation) =>
          item.cashboxIncrement.id === cashboxID ? (
            <div className="flex items-center gap-1 text-primary">
              <ArrowUpIcon className="size-4 min-w-4" />
              {item.cashboxIncrement.name}
            </div>
          ) : (
            item.cashboxIncrement.name
          ),
      },
      {
        label: "Caja salida",
        key: "cashboxDecrement.name",
        render: (item: Operation) =>
          item.cashboxDecrement.id === cashboxID ? (
            <div className="flex items-center gap-1 font-medium text-danger">
              <ArrowDownIcon className="size-4 min-w-4" />
              {item.cashboxDecrement.name}
            </div>
          ) : (
            item.cashboxDecrement.name
          ),
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
        label: "Total",
        key: "price",
        render: (item: Operation) => (
          <span className="font-semibold text-slate-500">
            ${(item.amount * item.price).toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Cantidad",
        key: "amount",
        render: (item: Operation) => (
          <span
            className={cn(
              item.type === "buys" ? "text-blue-500" : "text-primary",
            )}
          >
            ${item.amount.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Precio",
        key: "price",
        render: (item: Operation) => (
          <span className="font-medium text-slate-400">
            ${item.price.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Precio de mercado",
        key: "marketPrice",
        render: (item: Operation) => (
          <span className="">${item.marketPrice.toLocaleString("es-AR")}</span>
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
                {(
                  (item.profit / (item.amount * item.price)) *
                  100
                ).toLocaleString("es-AR")}
                %
                <TrendingUpIcon className="size-3 min-w-3" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-medium">
              ${item.profit}
              <div className="flex min-w-10 items-center justify-center gap-1 rounded-lg bg-danger/10 px-1.5 py-0.5 text-xs text-danger">
                {(
                  (item.profit / (item.amount * item.price)) *
                  100
                ).toLocaleString("es-AR")}
                %
                <TrendingDownIcon className="size-3 min-w-3" />
              </div>
            </div>
          ),
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Operation) => item.sellerName ?? "-",
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Operation) =>
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

  const filteredOperations = useMemo(() => {
    if (!historyOperationsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyOperationsQuery?.data?.filter((operation) => {
      let searched = `${operation.amount}${operation.clientName}${operation.sellerName}${operation.cashboxDecrement.name}${operation.cashboxIncrement.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyOperationsQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyOperationsQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={
            historyOperationsQuery.isFetching || !historyOperationsQuery.data
          }
          onChange={(e) => setSearch(e.target.value)}
          className="h-full w-full text-sm text-slate-500 outline-none"
          type="text"
          placeholder="Buscar operación..."
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
      {historyOperationsQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlert className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay operaciones en este historial</p>
        </div>
      ) : (
        <TableWork
          withButtonCreate={false}
          columns={COLUMNS}
          loading={historyOperationsQuery.isLoading}
          error={historyOperationsQuery.error}
          searchInput={search}
          data={filteredOperations}
          openModal={() => console.log()}
        />
      )}
    </>
  );
}
