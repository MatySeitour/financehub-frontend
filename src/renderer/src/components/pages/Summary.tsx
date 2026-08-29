/* IMPORTS */
import { ServerError } from "@renderer/utils/types";
import {
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  InfoIcon,
  NotebookTabsIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { format, parseISO } from "date-fns";
import { cn, strNormalize } from "@renderer/utils";
import { useQuery } from "react-query";
import { Cashbox, getCashboxes } from "@renderer/hooks/cashboxes";
import { getSummary } from "@renderer/hooks/summary";
import { Select, SelectItem } from "@heroui/select";
import { es } from "date-fns/locale";
import { ErrorMessage } from "../ErrorMessage";

//Component starts here
export function SummarySection() {
  const searchRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filterCashboxID, setFilterCashboxID] = useState<number>(0);

  const summaryQuery = useQuery<
    Awaited<ReturnType<typeof getSummary>>,
    ServerError
  >({
    queryKey: ["summary", date],
    queryFn: () => getSummary(date ?? new Date()),
    enabled: !!date,
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  const allCashboxes = useMemo(() => {
    const cashboxes: Record<number, Cashbox> = {};

    cashboxesQuery.data?.forEach((cashbox) => {
      return (cashboxes[cashbox.id] = cashbox);
    });
    return cashboxes;
  }, [cashboxesQuery.data]);

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

  const filteredSummary = useMemo(() => {
    if (summaryQuery.data?.length === 0) return [];

    if (filterCashboxID !== 0) {
      if (search === "")
        return summaryQuery.data?.filter(
          (summary) => summary.cashboxID === filterCashboxID,
        );

      const filterNormalize = strNormalize(search).toLowerCase();

      return summaryQuery.data?.filter((summary) => {
        const value = `${summary.client}${summary.income}${summary.exit}${summary.date}`;

        return strNormalize(value).toLowerCase().includes(filterNormalize);
      });
    } else {
      const filterNormalize = strNormalize(search).toLowerCase();

      return summaryQuery.data?.filter((summary) => {
        const value = `${summary.client}${summary.income}${summary.exit}${summary.date}`;

        return strNormalize(value).toLowerCase().includes(filterNormalize);
      });
    }
  }, [summaryQuery.data, filterCashboxID, search]);

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <NotebookTabsIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">
            Resumen diario
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex min-h-0 w-full flex-col gap-4 overflow-hidden p-4">
          {/* SEARCH FILTER CONTAINER */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                summaryQuery.isFetching && "opacity-60",
                "flex w-full gap-4",
              )}
            >
              <div
                className="flex h-9 min-h-8 w-full max-w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
              >
                <SearchIcon className="size-4 min-w-4 text-slate-400" />
                <input
                  ref={searchRef}
                  disabled={summaryQuery.isFetching}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-full w-full text-sm text-slate-500 outline-none"
                  type="text"
                  placeholder="Buscar por cliente, monto, hora..."
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

              {/* DATE CONTAINER */}
              <div className="flex items-center gap-2">
                <label className="relative h-9 min-w-44 rounded-md border border-slate-300 p-2 text-sm text-slate-400 transition-all focus-within:border-primary disabled:opacity-60">
                  <span className="absolute -top-2.5 left-1.5 w-12 bg-white pl-1 text-xs text-slate-400/70">
                    Fecha
                  </span>

                  <input
                    ref={fromRef}
                    onFocus={() => {
                      // if input disabled, dont show datepicker
                      if (!summaryQuery.isFetching) {
                        fromRef.current?.showPicker?.();
                      }
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    onChange={(e) => {
                      if (e.target.value === "") return setDate(undefined);
                      setDate(parseISO(e.target.value));
                    }}
                    onPaste={(e) => e.preventDefault()}
                    disabled={summaryQuery.isFetching}
                    type="date"
                    className="w-full"
                  />
                </label>
              </div>

              <div className="flex w-auto min-w-64 items-start gap-4">
                {/* cashbox */}
                <Select
                  selectedKeys={new Set([String(filterCashboxID)])}
                  placeholder="Selecciona una caja"
                  aria-label="filters"
                  classNames={{
                    innerWrapper: "rounded-md !text-slate-400 !font-medium",
                    mainWrapper: "rounded-md !text-slate-400 !font-medium",
                    popoverContent:
                      "rounded-md font-normal !text-slate-400 !font-medium",
                    trigger:
                      "hover:!bg-white hover:!border-primary rounded-md bg-white !h-8 min-h-8 !font-medium",
                    value: "!text-slate-500 !font-medium",
                  }}
                  className={cn(
                    "min-h-9 rounded-md border border-slate-300 !font-medium !text-slate-400 outline-none",
                  )}
                  //  selectedKeys={new Set([selected.name])}
                  onSelectionChange={(key) => {
                    if (key.currentKey) {
                      setFilterCashboxID(Number(key.currentKey));
                    }
                  }}
                >
                  <>
                    <SelectItem
                      textValue="Todas"
                      classNames={{
                        base: "hover:!bg-black/5 rounded-md data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                      }}
                      className="flex items-center gap-1"
                      key={0}
                    >
                      <span className="text-sm">Todas</span>
                      {"  "}
                    </SelectItem>

                    {(cashboxesQuery?.data ?? [])?.map((filter) => (
                      <SelectItem
                        textValue={`${filter.name}`}
                        classNames={{
                          base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                        }}
                        className="flex items-center gap-1"
                        key={filter.id}
                      >
                        <span className="text-sm">{filter.name}</span>
                        {"  "}
                        {filter.state === 0 ? (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[0.63rem] text-danger">
                            Cerrada
                          </span>
                        ) : (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.63rem] text-primary">
                            Abierta
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Details date and records */}
        {summaryQuery.isFetching || cashboxesQuery.isFetching ? (
          <div className="h-6 w-44 translate-x-4 animate-pulse rounded-md bg-slate-200/70" />
        ) : (
          !summaryQuery.isError &&
          !summaryQuery.isError && (
            <div className="flex flex-col gap-px pl-4">
              <span className="text-lg font-semibold tracking-tighter text-slate-500">
                {format(date ?? new Date(), "EEEE, d 'de' MMMM, yyyy", {
                  locale: es,
                })}
              </span>

              <span className="text-sm tracking-tighter text-slate-400">
                {summaryQuery.data?.length !== 0
                  ? `${filteredSummary?.length} movimientos encontrados`
                  : "No se encontraron movimientos"}
              </span>
            </div>
          )
        )}
      </div>

      {/* Moviments list */}
      {summaryQuery.isFetching || cashboxesQuery.isFetching ? (
        <div className="grid w-full grid-cols-5 gap-4 px-4 py-2">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-md bg-slate-200/70"
            />
          ))}
        </div>
      ) : summaryQuery.isError ? (
        <ErrorMessage error={summaryQuery.error} />
      ) : cashboxesQuery.isError ? (
        <ErrorMessage error={cashboxesQuery.error} />
      ) : summaryQuery.data?.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
          <InfoIcon className="size-16 min-w-16" />
          No se encontraron registros
        </div>
      ) : filteredSummary?.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
          <SearchXIcon className="size-16 min-w-16" />
          No hay resultados para los filtros aplicados...
        </div>
      ) : (
        <div className="h-full min-h-0 px-4 py-2">
          <div className="flex h-auto max-h-full min-h-0 w-full flex-col rounded-lg border border-slate-300/70 bg-[#FBFBFB]">
            {/* Headers */}
            <ul className="grid grid-cols-12 rounded-t-lg bg-[#FAFAFA]">
              <li
                className={cn(
                  "col-span-1 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Horario
              </li>
              <li
                className={cn(
                  "col-span-1 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Movimiento
              </li>
              <li
                className={cn(
                  "justify-staret col-span-3 flex min-h-10 w-full items-center border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Descripción
              </li>
              <li
                className={cn(
                  "col-span-2 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Cliente
              </li>
              <li
                className={cn(
                  "col-span-1 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Entrada
              </li>
              <li
                className={cn(
                  "col-span-1 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                )}
              >
                Salida
              </li>
              <li
                className={cn(
                  "col-span-3 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400 xl:pl-10",
                )}
              >
                Caja/Divisa
              </li>
            </ul>

            {/* Rows */}
            <ul className="flex min-h-0 w-full flex-col items-center overflow-y-auto rounded-b-lg">
              {filteredSummary?.map((summary, index) => (
                <li
                  key={`${summary.date}-${index}`}
                  className="grid min-h-16 w-full grid-cols-12 border-b border-slate-300/70 last:border-0 odd:bg-slate-100/60"
                >
                  {/* Date */}
                  <div className="relative col-span-1 flex h-full w-full items-center pl-3 text-xs font-bold tabular-nums text-slate-500">
                    {format(summary.date, "HH:mm")}

                    <span className="absolute -left-[0.20rem] top-0 h-full w-1.5 scale-y-75 rounded-lg bg-slate-400"></span>
                  </div>

                  {/* Moviment type */}
                  <div className="relative col-span-1 flex h-full w-full min-w-32 items-center pl-3 text-xs">
                    {summary.operationType === "operation" ? (
                      <div className="flex items-center justify-center rounded-lg border border-blue-500/15 bg-blue-500/10 px-1.5 py-1 font-medium tracking-tighter text-blue-500">
                        Operación
                      </div>
                    ) : summary.operationType === "loan" ? (
                      <div className="flex items-center justify-center rounded-lg border border-yellow-500/15 bg-yellow-500/10 px-1.5 py-1 font-medium tracking-tighter text-yellow-500">
                        Préstamo
                      </div>
                    ) : summary.operationType === "installment" ? (
                      <div className="flex items-center justify-center rounded-lg border border-primary/15 bg-primary/10 px-1.5 py-1 font-medium tracking-tighter text-primary">
                        Cuota
                      </div>
                    ) : summary.operationType === "bill" ? (
                      <div className="flex items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10 px-1.5 py-1 font-medium tracking-tighter text-red-500">
                        Otros
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-purple-500/15 bg-purple-500/10 px-1.5 py-1 font-medium tracking-tighter text-purple-500">
                        Comisión
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="relative col-span-3 flex h-full w-full min-w-72 items-center pl-3 text-xs">
                    {summary.operationType === "operation" ? (
                      <span className="font-medium text-slate-400">
                        {summary.message} por{" "}
                        <strong className="font-bold tabular-nums text-slate-500">
                          ${summary.exit ?? summary.income}
                        </strong>
                      </span>
                    ) : summary.operationType === "commission" ? (
                      <span className="font-medium text-slate-400">
                        Pago de comisión por{" "}
                        <strong className="font-bold tabular-nums text-slate-500">
                          ${summary.exit}
                        </strong>
                      </span>
                    ) : summary.operationType === "loan" ? (
                      <span className="font-medium text-slate-400">
                        Préstamo por{" "}
                        <strong className="font-bold tabular-nums text-slate-500">
                          ${summary.exit}
                        </strong>
                      </span>
                    ) : summary.operationType === "installment" ? (
                      <span className="font-medium text-slate-400">
                        Pago de cuota por{" "}
                        <strong className="tabular-nums text-slate-500">
                          ${summary.income}
                        </strong>
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">
                        {summary.message} por{" "}
                        <strong className="tabular-nums text-slate-500">
                          ${summary.exit ?? summary.income}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Cliente */}
                  <div className="relative col-span-2 flex h-full w-full min-w-40 items-center pl-3 text-xs">
                    <strong className="text-sm font-medium text-slate-500">
                      {summary.client ?? "-"}
                    </strong>
                  </div>

                  {/* Income */}
                  <div className="relative col-span-1 flex h-full w-full min-w-32 items-center pl-3 text-xs">
                    {summary.income ? (
                      <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-primary">
                        <CircleArrowUpIcon className="size-3.5 min-w-3.5" />$
                        {summary.income}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>

                  {/* Exit */}
                  <div className="relative col-span-1 flex h-full w-full min-w-32 items-center pl-3 text-xs">
                    {summary.exit ? (
                      <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-red-500">
                        <CircleArrowDownIcon className="size-3.5 min-w-3.5" />$
                        {summary.exit}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>

                  {/* Cashbox name */}
                  <div className="relative col-span-3 flex h-full w-full min-w-40 items-center pl-10 text-xs">
                    {" "}
                    <strong className="text-xs font-medium text-slate-500">
                      {allCashboxes[summary.cashboxID].name}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
