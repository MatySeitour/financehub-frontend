import { cn, strNormalize } from "@renderer/utils";
import {
  Cashbox,
  getCashboxes,
  getHistoryCashboxOperations,
} from "@renderer/hooks/cashboxes";
import { useQuery } from "react-query";
import { BaseResponseServer } from "@renderer/utils/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Accordion,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  ChangeStateCashboxModal,
  CreateCashboxModal,
  DeleteCashboxModal,
  UpdateCashboxModal,
} from "../modals/cashboxes";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  CalendarArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleDollarSignIcon,
  DollarSignIcon,
  EllipsisVerticalIcon,
  HandshakeIcon,
  Package2Icon,
  PackageIcon,
  PackageOpenIcon,
  PackageSearchIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  Undo2Icon,
  WalletIcon,
} from "lucide-react";
import { Button } from "../Button";
import { useMediaQueryElement } from "@renderer/hooks/useMediaQueries";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorMessage } from "../ErrorMessage";
import { useParams } from "react-router";
import { z } from "zod";

const filters = [
  { label: "Operaciones", name: "operations" },
  { label: "Préstamos", name: "loans" },
] as const;
type CashboxFilters = (typeof filters)[number];

export function CashBoxHistorySection() {
  const { id } = useParams();

  const isValidCashbox = z.string().catch("").parse(id);
  const cashboxID = +isValidCashbox;

  const sectionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const mqSection = useMediaQueryElement(sectionRef);

  const [selected, setSelected] = useState<CashboxFilters>(filters[0]);
  const [cashboxToChangeState, setCashboxToChangeState] = useState<Cashbox>();
  const [cashboxToUpdate, setCashboxToUpdate] = useState<Cashbox>();
  const [cashboxToDelete, setCashboxToDelete] = useState<Cashbox>();
  const [search, setSearch] = useState("");

  const cashboxHistoryOperationsQuery = useQuery<
    Awaited<ReturnType<typeof getHistoryCashboxOperations>>,
    BaseResponseServer
  >({
    queryKey: ["history-operations", cashboxID],
    queryFn: () => getHistoryCashboxOperations(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID && selected.name === "operations",
  });

  console.log(cashboxHistoryOperationsQuery.data);

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
    <section
      ref={sectionRef}
      className="flex h-full w-full flex-col bg-gradient-to-b from-white to-primary/10"
    >
      {/* Header */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-6">
        <div className="flex items-center gap-2">
          <Tooltip
            closeDelay={0}
            className="rounded-md border-slate-400 text-xs text-slate-400"
            content="Volver"
          >
            <div className="p-1.5 text-slate-300 transition-all hover:text-slate-400">
              <Undo2Icon className="size-5 min-w-5" />
            </div>
          </Tooltip>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
              <DollarSignIcon className="size-5 min-w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-500">
              Historial de caha ejemplo
            </h1>
          </div>
        </div>
      </div>

      <article className="flex h-full w-full flex-col gap-6 overflow-hidden p-6">
        <div className="flex min-h-10 items-center gap-2">
          {/* Filter */}
          <Select
            isDisabled={
              cashboxHistoryOperationsQuery.isLoading ||
              cashboxHistoryOperationsQuery.isFetching
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
              cashboxHistoryOperationsQuery.isFetching && "opacity-60",
              "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
            )}
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />

            <input
              ref={searchRef}
              disabled={cashboxHistoryOperationsQuery.isFetching}
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

        <ul className="flex h-auto w-full flex-col gap-2 overflow-y-auto">
          {cashboxHistoryOperationsQuery?.data?.map((history) => (
            <div
              className="flex h-auto w-full flex-col gap-2 rounded-md border border-slate-300/70 bg-white"
              key={history.id}
            >
              {/* Dates */}
              <div className="borde flex w-full items-center justify-between rounded-t-md bg-slate-300/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <CalendarArrowUpIcon className="size-4 min-w-4 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      {format(
                        history.openingDateTime ?? "",
                        "dd 'de' MMM, HH:mm aaaa",
                        { locale: es },
                      )}
                    </p>
                  </div>
                  <span className="h-5 w-[1px] bg-slate-300" />
                  <div className="flex items-center gap-1">
                    <CalendarArrowUpIcon className="size-4 min-w-4 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      {format(
                        history.openingDateTime ?? "",
                        "dd 'de' MMM, HH:mm aaaa",
                        { locale: es },
                      )}
                    </p>
                  </div>
                </div>
                <ChevronDownIcon className="size-5 min-w-5 text-slate-400" />
              </div>

              <div className="flex h-full items-center justify-between gap-5 p-4">
                <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                  <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                    <p className="text-xs font-medium">Valor de apertura</p>
                  </div>

                  <div className="flex w-full items-center justify-between">
                    <p className="font-mono text-xl font-medium text-primary">
                      ${history.openingValue.toFixed(2)}
                    </p>
                    <BanknoteArrowUpIcon className="size-8 min-w-8 text-slate-500/70" />
                  </div>
                </div>
                <span className="h-20 w-[1px] bg-slate-300/70" />

                <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                  <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                    <p className="text-xs font-medium">Valor de cierre</p>
                  </div>

                  <div className="flex w-full items-center justify-between">
                    <p className="font-mono text-xl font-medium text-primary">
                      ${history.lastValue.toFixed(2)}
                    </p>
                    <BanknoteArrowDownIcon className="size-8 min-w-8 text-slate-500/70" />
                  </div>
                </div>
                <span className="h-16 w-[1px] bg-slate-300/70" />

                <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                  <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                    <p className="text-xs font-medium">Operaciones</p>
                  </div>

                  <div className="flex w-full items-center justify-between">
                    <p className="font-mono text-xl font-medium text-slate-500">
                      #{history.operationsCount}
                    </p>
                    <HandshakeIcon className="size-8 min-w-8 text-slate-500/70" />
                  </div>
                </div>

                <span className="h-16 w-[1px] bg-slate-300/70" />

                <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                  <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                    <p className="text-xs font-medium">Ganancia/Perdida</p>
                  </div>

                  <div className="flex w-full items-center justify-between">
                    <p
                      className={cn(
                        history.profit > 0 ? "text-primary" : "text-danger",
                        "font-mono text-xl font-medium",
                      )}
                    >
                      $
                      {((history.profit * history.openingValue) / 100).toFixed(
                        2,
                      )}
                    </p>
                    {history.profit > 0 ? (
                      <TrendingUpIcon className="size-8 min-w-8 text-slate-500/70" />
                    ) : (
                      <TrendingDownIcon className="size-8 min-w-8 text-slate-500/70" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ul>
      </article>
    </section>
  );
}
