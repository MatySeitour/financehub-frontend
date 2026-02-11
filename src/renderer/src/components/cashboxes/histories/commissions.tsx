import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BanknoteArrowUpIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  LandmarkIcon,
  SearchIcon,
} from "lucide-react";
import { TableWork } from "@renderer/components/Table";
import { format } from "date-fns";
import { getCashboxHistoryCommissions } from "@renderer/hooks/cashboxes";
import { CommissionHistory } from "@renderer/hooks/commissions";
import { es } from "date-fns/locale";
import { ServerError } from "@renderer/utils/types";

export function CommissionsHistoryCashbox({
  cashboxID,
  historyID,
}: {
  cashboxID: number;
  historyID: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const historyCommissionsQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxHistoryCommissions>>,
    ServerError
  >({
    queryKey: ["history-commissions", historyID],
    queryFn: () =>
      getCashboxHistoryCommissions(cashboxID ?? -1, historyID ?? -1),
    retry: false,
    enabled: !!cashboxID && !!historyID,
  });

  const COLUMNS = [
    {
      label: "Vendedor",
      key: "seller.name",
      render: (item: CommissionHistory) => item.seller.name,
    },
    {
      label: "Monto",
      key: "value",
      render: (item: CommissionHistory) => (
        <span className="font-medium text-slate-500">
          $ {item.value.toLocaleString("es")}
        </span>
      ),
    },
    {
      label: "Movimiento",
      key: "operation_id",
      render: (item: CommissionHistory) =>
        item.operation_id ? (
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-2 py-1 text-primary/80">
            <BanknoteArrowUpIcon className="size-3.5 min-w-3.5" />
            Operación
          </div>
        ) : (
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-warning/10 bg-warning/5 px-2 py-1 text-warning/80">
            <LandmarkIcon className="size-3.5 min-w-3.5" />
            Préstamo
          </div>
        ),
    },
    {
      label: "Fecha de movimiento",
      key: "date",
      render: (item: CommissionHistory) =>
        format(item.date, "d 'de' MMMM 'del' yyyy", { locale: es }),
    },

    {
      label: "Estado",
      key: "state",
      render: (item: CommissionHistory) =>
        item.state ? (
          <div className="flex items-center gap-1.5 text-success">
            <CircleCheckBigIcon className="size-4 min-w-4" />
            Pagado
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-danger">
            <CircleAlertIcon className="size-4 min-w-4" />
            Sin pagar
          </div>
        ),
    },
  ];

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

  const filteredCommissions = useMemo(() => {
    if (!historyCommissionsQuery?.data) return [];
    if (!search) return historyCommissionsQuery.data;

    const normalizedFilter = strNormalize(search).toLowerCase();

    return historyCommissionsQuery.data?.filter((commission) => {
      let searched = `${commission.seller.name}${commission.seller.name}${commission.value}${format(commission.date, "d 'de' MMMM 'del' yyyy", { locale: es })}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [historyCommissionsQuery.data, search]);

  return (
    <>
      {/* Search */}
      <div
        className={cn(
          historyCommissionsQuery.isFetching && "opacity-60",
          "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
        )}
      >
        <SearchIcon className="size-4 min-w-4 text-slate-400" />

        <input
          ref={searchRef}
          disabled={
            historyCommissionsQuery.isFetching || !historyCommissionsQuery.data
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
      {historyCommissionsQuery.data?.length === 0 ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
          <CircleAlertIcon className="size-20 text-slate-600" />
          <p className="text-slate-600">No hay comisiones en este historial</p>
        </div>
      ) : (
        <TableWork
          withButtonCreate={false}
          columns={COLUMNS}
          error={historyCommissionsQuery.error}
          loading={historyCommissionsQuery.isFetching}
          searchInput={search}
          data={filteredCommissions}
          openModal={() => console.log()}
        />
      )}
    </>
  );
}
