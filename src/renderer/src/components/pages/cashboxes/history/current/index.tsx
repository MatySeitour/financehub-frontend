import { useQuery } from "react-query";
import { BaseResponseServer } from "@renderer/utils/types";
import { Select, SelectItem, Tooltip } from "@heroui/react";
import { useState } from "react";
import { Undo2Icon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { getCashbox } from "@renderer/hooks/cashboxes";
import { CurrentOperationsHistoryCashbox } from "@renderer/components/cashboxes/histories/current/operations";
import { CurrentLoansHistoryCashbox } from "@renderer/components/cashboxes/histories/current/loans";
import { CurrentExpensesHistoryCashbox } from "@renderer/components/cashboxes/histories/current/expenses";
import { CurrentInstallmentsHistoryCashbox } from "@renderer/components/cashboxes/histories/current/installments";

const filters = [
  { label: "Operaciones", name: "operations" },
  { label: "Préstamos", name: "loans" },
  { label: "Gastos", name: "expenses" },
  { label: "Cuotas", name: "installments" },
] as const;
type CashboxFilters = (typeof filters)[number];

export function HistoryCurrentSection() {
  const params = useParams();
  const navigate = useNavigate();

  const isValidCashbox = z.string().catch("").parse(params.id);
  const cashboxID = +isValidCashbox;

  const [selected, setSelected] = useState<CashboxFilters>(filters[0]);

  const cashboxQuery = useQuery<
    Awaited<ReturnType<typeof getCashbox>>,
    BaseResponseServer
  >({
    queryKey: ["cashboxes", cashboxID],
    queryFn: () => getCashbox(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
  });

  return (
    <section className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Tooltip
            closeDelay={0}
            className="rounded-md border-slate-400 text-xs text-slate-400"
            content="Volver"
          >
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer p-1.5 text-slate-300 transition-all hover:text-slate-400"
            >
              <Undo2Icon className="size-5 min-w-5" />
            </div>
          </Tooltip>

          <h1 className="text-xl font-semibold text-slate-500">
            Historial actual de {cashboxQuery.data?.name}
          </h1>
        </div>
      </div>

      <article className="flex h-auto w-full flex-col gap-4 overflow-hidden p-4">
        <div className="flex min-h-10 items-center gap-2">
          {/* Filter */}
          <Select
            aria-label="filters"
            defaultSelectedKeys={selected.name}
            classNames={{
              innerWrapper: "rounded-md",
              mainWrapper: "rounded-md",
              popoverContent: "rounded-md text-slate-400 font-normal",
              trigger:
                "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7 border border-slate-300/70",
              listbox: "text-slate-400",
              value: "!text-slate-400",
            }}
            className="min-h-9 max-w-64 rounded-md outline-none"
            selectedKeys={new Set([selected.name])}
            onSelectionChange={(e) => {
              const key = typeof e === "string" ? e : e?.currentKey;
              const filter = filters.find((f) => f.name === key);
              if (filter) setSelected(filter);
            }}
          >
            {filters.map((filter) => (
              <SelectItem
                classNames={{
                  base: "hover:!bg-black/5 rounded-md hover:!text-slate-500 data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2",
                }}
                className="flex items-center gap-1"
                onSelect={() => setSelected(filter)}
                key={filter.name}
              >
                {filter.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {selected.name === "operations" && (
          <CurrentOperationsHistoryCashbox cashboxID={cashboxID} />
        )}

        {selected.name === "loans" && (
          <CurrentLoansHistoryCashbox cashboxID={cashboxID} />
        )}

        {selected.name === "expenses" && (
          <CurrentExpensesHistoryCashbox cashboxID={cashboxID} />
        )}

        {selected.name === "installments" && (
          <CurrentInstallmentsHistoryCashbox cashboxID={cashboxID} />
        )}
      </article>
    </section>
  );
}
