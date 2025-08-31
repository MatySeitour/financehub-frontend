import { cn } from "@renderer/utils";
import { useQuery } from "react-query";
import { BaseResponseServer } from "@renderer/utils/types";
import { Select, SelectItem, Tooltip } from "@heroui/react";

import { useEffect, useRef, useState } from "react";
import { DollarSignIcon, SearchIcon, Undo2Icon } from "lucide-react";
import { useMediaQueryElement } from "@renderer/hooks/useMediaQueries";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { getOperationsHistory } from "@renderer/hooks/operations";

const filters = [
  { label: "Operaciones", name: "operations" },
  { label: "Préstamos", name: "loans" },
] as const;
type CashboxFilters = (typeof filters)[number];

export function HistorySection() {
  const { id, historyID } = useParams();
  const navigate = useNavigate();

  const isValidCashbox = z.string().catch("").parse(historyID);
  const historyIDValid = +isValidCashbox;

  const sectionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const mqSection = useMediaQueryElement(sectionRef);

  const [selected, setSelected] = useState<CashboxFilters>(filters[0]);
  const [search, setSearch] = useState("");

  const historyOperationsQuery = useQuery<
    Awaited<ReturnType<typeof getOperationsHistory>>,
    BaseResponseServer
  >({
    queryKey: ["history-operations", historyIDValid],
    queryFn: () => getOperationsHistory(historyIDValid ?? -1),
    retry: false,
    enabled: !!historyIDValid && selected.name === "operations",
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

  return (
    <section ref={sectionRef} className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-6">
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
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
              <DollarSignIcon className="size-5 min-w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-500">
              Historial #{historyID} de caha ejemplo
            </h1>
          </div>
        </div>
      </div>

      <article className="flex h-full w-full flex-col gap-6 overflow-hidden p-6">
        <div className="flex min-h-10 items-center gap-2">
          {/* Filter */}
          <Select
            isDisabled={
              historyOperationsQuery.isLoading ||
              historyOperationsQuery.isFetching
            }
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
            className="min-h-9 max-w-44 rounded-md outline-none"
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
              disabled={historyOperationsQuery.isFetching}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full text-sm text-slate-500 outline-none"
              type="text"
              placeholder="Buscar caja..."
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
        </div>
      </article>
    </section>
  );
}
