import { cn } from "@renderer/utils";
import { getCashbox, getHistoryCashbox } from "@renderer/hooks/cashboxes";
import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";
import { format, isWithinInterval, min, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DatePicker, Tooltip } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightIcon,
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BanknoteIcon,
  CalendarArrowDownIcon,
  CalendarArrowUpIcon,
  CircleAlert,
  TrendingDownIcon,
  TrendingUpIcon,
  Undo2Icon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { ErrorMessage } from "@renderer/components/ErrorMessage";
import { I18nProvider } from "@react-aria/i18n";
import { fromDate, now } from "@internationalized/date";

export function CashBoxHistorySection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isValidCashbox = z.string().catch("").parse(id);
  const cashboxID = +isValidCashbox;

  const sectionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>(new Date());

  const cashboxQuery = useQuery<
    Awaited<ReturnType<typeof getCashbox>>,
    ServerError
  >({
    queryKey: ["cashbox", cashboxID],
    queryFn: () => getCashbox(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
  });

  const cashboxHistoryQuery = useQuery<
    Awaited<ReturnType<typeof getHistoryCashbox>>,
    ServerError
  >({
    queryKey: ["cashbox-history", cashboxID],
    queryFn: () => getHistoryCashbox(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID,
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

  const filteredHistories = useMemo(() => {
    if (!cashboxHistoryQuery.data) return [];

    return cashboxHistoryQuery.data.records.filter((history) => {
      if (!history.openingDateTime) return false;

      const openingDate = parseISO(history.openingDateTime);

      return isWithinInterval(openingDate, {
        start: from ?? new Date("2020-09-09"),
        end: to ?? new Date(),
      });
    });
  }, [cashboxHistoryQuery.data, to, from]);

  const emptyHistory =
    cashboxHistoryQuery.data?.current === null &&
    filteredHistories.length === 0;

  // min date for from default value
  const minDateHistory = useMemo(() => {
    if (
      !cashboxHistoryQuery.data ||
      cashboxHistoryQuery.data.records.length === 0
    )
      return now("America/Argentina/Buenos_Aires");

    return cashboxHistoryQuery.data
      ? fromDate(
          min(
            cashboxHistoryQuery?.data?.records?.map((history) =>
              parseISO(history.openingDateTime ?? ""),
            ),
          ),
          "America/Argentina/Buenos_Aires",
        )
      : now("America/Argentina/Buenos_Aires");
  }, [cashboxHistoryQuery.data]);

  return (
    <section ref={sectionRef} className="flex h-full w-full flex-col">
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
          {cashboxHistoryQuery.isLoading ? (
            <span className="size-8 w-44 min-w-8 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <h1 className="text-xl font-semibold text-slate-500">
              {cashboxQuery.data?.name}
            </h1>
          )}
        </div>
      </div>

      <article className="flex h-full w-full flex-col gap-6 overflow-hidden p-4">
        <div className="flex min-h-10 items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-3">
            {/* From date */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">Desde</label>
              <I18nProvider locale="es-AR">
                <DatePicker
                  key={minDateHistory?.toString()}
                  aria-label="from"
                  onChange={(dateValue) => {
                    if (dateValue) {
                      const jsDate = dateValue.toDate();
                      setFrom(jsDate);
                    }
                  }}
                  className="rounded-md border border-slate-300/70"
                  granularity="minute"
                  isDisabled={cashboxHistoryQuery.isFetching}
                  maxValue={now("America/Argentina/Buenos_Aires")}
                  defaultValue={
                    cashboxHistoryQuery.isLoading ? undefined : minDateHistory
                  }
                  hideTimeZone
                  hourCycle={24}
                  selectorButtonPlacement="start"
                  classNames={{
                    innerWrapper: "rounded-md",
                    base: "rounded-md bg-white",
                    errorMessage: "hidden",
                    inputWrapper:
                      "hover:!bg-white/80 border-none bg-white !h-8 min-h-7 !text-slate-400 group-data-[invalid=true]:!bg-transparent",
                    popoverContent: "rounded-md text-slate-400 font-normal",
                    selectorIcon: "text-slate-400 size-4",
                    selectorButton: "!h-7  rounded-none pb-0.5",
                    segment:
                      "rounded-sm focus:bg-slate-300/40 !text-slate-400 text-xs font-medium",
                    calendarContent: "bg-white",
                    timeInputLabel: "!text-slate-400",
                  }}
                />
              </I18nProvider>
            </div>

            {/* To date */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-400">Hasta</label>
              <I18nProvider locale="es-AR">
                <DatePicker
                  aria-label="to"
                  onChange={(dateValue) => {
                    if (dateValue) {
                      const jsDate = dateValue.toDate();
                      setTo(jsDate);
                    }
                  }}
                  hideTimeZone
                  isDisabled={cashboxHistoryQuery.isFetching}
                  hourCycle={24}
                  maxValue={now("America/Argentina/Buenos_Aires")}
                  className="rounded-md border border-slate-300/70"
                  granularity="minute"
                  selectorButtonPlacement="start"
                  defaultValue={minDateHistory}
                  classNames={{
                    innerWrapper: "rounded-md",
                    base: "rounded-md bg-white",
                    inputWrapper:
                      "hover:!bg-white/80 border-none bg-white !h-8 min-h-7 !text-slate-400 group-data-[invalid=true]:!bg-transparent",
                    popoverContent: "rounded-md text-slate-400 font-normal",
                    selectorIcon: "text-slate-400 size-4",
                    selectorButton: "!h-7 rounded-none pb-0.5",
                    errorMessage: "hidden",
                    segment:
                      "rounded-sm focus:bg-slate-300/40 !text-slate-400 text-xs font-medium",
                    calendarContent: "bg-white",
                    timeInputLabel: "!text-slate-400",
                  }}
                />
              </I18nProvider>
            </div>
          </div>
        </div>

        {/* Body */}
        <ul className="flex w-full flex-col gap-4 overflow-y-auto">
          {/* Loading */}
          {cashboxHistoryQuery.isFetching ? (
            Array.from({ length: 4 }).map((_, index) => (
              <li
                className="h-32 w-full animate-pulse rounded-md bg-slate-100"
                key={index}
              />
            ))
          ) : cashboxHistoryQuery.isError ? (
            <ErrorMessage error={cashboxHistoryQuery.error} />
          ) : emptyHistory ? (
            <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
              <CircleAlert className="size-20 text-slate-600" />
              <p className="text-slate-600">
                No hay historial registrado de esta caja
              </p>
            </div>
          ) : (
            <>
              {/* Current cashbox active */}
              {cashboxHistoryQuery.data?.current && (
                <li
                  className="flex h-auto w-full cursor-pointer flex-col gap-2 rounded-md border border-primary/50 bg-white transition-all hover:bg-slate-100/30"
                  key={cashboxHistoryQuery.data?.current.id}
                >
                  {/* Dates */}
                  <div
                    onClick={() =>
                      navigate(`/boxes/${cashboxID}/history/current`)
                    }
                    className="flex w-full items-center gap-4 rounded-t-md p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CalendarArrowUpIcon className="size-4 min-w-4 text-slate-400" />
                        <p className="text-xs text-slate-400">
                          {format(
                            cashboxHistoryQuery.data?.current.openingDateTime ??
                              "",
                            "dd 'de' MMM, HH:mm aaaa",
                            { locale: es },
                          )}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="size-4 min-w-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-primary shadow-[0_0px_6px_1px] shadow-primary" />
                      <span className="text-xs text-primary">Actual</span>
                    </div>
                  </div>

                  <div className="flex h-auto items-center justify-between gap-5 px-4 pb-4">
                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Valor de apertura</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-primary">
                          $
                          {cashboxHistoryQuery.data?.current.openingValue.toLocaleString(
                            "es-AR",
                          )}
                        </p>
                        <BanknoteArrowUpIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>
                    <span className="h-20 w-px bg-slate-300/70" />

                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Valor de cierre</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-primary">
                          $
                          {cashboxHistoryQuery.data?.current.lastValue.toLocaleString(
                            "es-AR",
                          )}
                        </p>
                        <BanknoteArrowDownIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>
                    <span className="h-16 w-px bg-slate-300/70" />

                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Movimientos</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-slate-500">
                          {cashboxHistoryQuery.data?.current.movementsCount}
                        </p>
                        <BanknoteIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>

                    <span className="h-16 w-px bg-slate-300/70" />

                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      {/* Profit */}
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <span className="text-xs font-medium">Rendimiento</span>
                        <div
                          className={cn(
                            cashboxHistoryQuery.data?.current.profit === 0
                              ? "bg-slate-300/40 text-slate-400"
                              : cashboxHistoryQuery.data?.current.profit > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-danger/10 text-danger",
                            "flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[0.6rem] font-medium",
                          )}
                        >
                          {cashboxHistoryQuery.data?.current.profit > 0 && (
                            <span className="pb-0.5">+</span>
                          )}
                          {cashboxHistoryQuery.data?.current.profit.toLocaleString(
                            "es-AR",
                          )}
                          <span className="pb-0.5 text-[0.55rem]">%</span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              cashboxHistoryQuery.data?.current.profit > 0
                                ? "text-primary"
                                : cashboxHistoryQuery.data?.current.profit === 0
                                  ? "text-slate-500"
                                  : "text-danger",
                              "text-xl font-medium",
                            )}
                          >
                            $
                            {(
                              (cashboxHistoryQuery.data?.current.profit *
                                cashboxHistoryQuery.data?.current
                                  .openingValue) /
                              100
                            ).toLocaleString("es-AR")}
                          </p>
                        </div>
                        {cashboxHistoryQuery.data?.current.profit > 0 ? (
                          <TrendingUpIcon className="size-8 min-w-8 text-slate-500/70" />
                        ) : (
                          <TrendingDownIcon className="size-8 min-w-8 text-slate-500/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )}

              {/* Current cashbox active */}
              {filteredHistories.map((history) => (
                <li
                  className="flex h-auto w-full cursor-pointer flex-col gap-2 rounded-md border border-slate-300/70 bg-white transition-all hover:bg-slate-100/30"
                  key={history.id}
                >
                  {/* Dates */}
                  <div
                    onClick={() =>
                      navigate(`/boxes/${cashboxID}/history/${history.id}`)
                    }
                    className="flex w-full items-center justify-between rounded-t-md p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CalendarArrowUpIcon className="size-4 min-w-4 text-slate-400" />
                        <p className="text-xs text-slate-400">
                          {format(
                            history.openingDateTime ?? "",
                            "dd 'de' MMM, HH:mm aaaa",
                            { locale: es },
                          )}
                        </p>
                      </div>
                      <ArrowRightIcon className="size-4 min-w-4 text-slate-400" />
                      <div className="flex items-center gap-1">
                        <CalendarArrowDownIcon className="size-4 min-w-4 text-slate-400" />
                        <p className="text-xs text-slate-400">
                          {format(
                            history.closeDateTime ?? "",
                            "dd 'de' MMM, HH:mm aaaa",
                            { locale: es },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-auto items-center justify-between gap-5 px-4 pb-4">
                    {/* Opening value */}
                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Valor de apertura</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-slate-500">
                          ${history.openingValue.toLocaleString("es-AR")}
                        </p>
                        <BanknoteArrowUpIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>

                    <span className="h-20 w-px bg-slate-300/70" />

                    {/* Closed value */}
                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Valor de cierre</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-slate-500">
                          ${history.lastValue.toLocaleString("es-AR")}
                        </p>
                        <BanknoteArrowDownIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>

                    <span className="h-16 w-px bg-slate-300/70" />

                    {/* Moviments */}
                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <p className="text-xs font-medium">Movimientos</p>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <p className="text-xl font-medium text-slate-500">
                          {history.movementsCount}
                        </p>
                        <BanknoteIcon className="size-8 min-w-8 text-slate-500/70" />
                      </div>
                    </div>

                    <span className="h-16 w-px bg-slate-300/70" />

                    {/* Profit */}
                    <div className="flex h-auto w-full flex-col items-center gap-2 rounded-md border border-slate-300/70 bg-gradient-to-t from-slate-50 to-white p-3">
                      <div className="flex w-full items-center justify-start gap-1 text-slate-500/70">
                        <span className="text-xs font-medium">Rendimiento</span>

                        <div
                          className={cn(
                            history.profit === 0
                              ? "bg-slate-300/40 text-slate-400"
                              : history.profit > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-danger/10 text-danger",
                            "flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[0.6rem] font-medium",
                          )}
                        >
                          {history.profit > 0 && (
                            <span className="pb-0.5">+</span>
                          )}
                          {history.profit.toLocaleString("es-AR")}
                          <span className="pb-0.5 text-[0.55rem]">%</span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              history.profit > 0
                                ? "text-primary"
                                : history.profit === 0
                                  ? "text-slate-500"
                                  : "text-danger",
                              "text-xl font-medium",
                            )}
                          >
                            $
                            {(
                              (history.profit * history.openingValue) /
                              100
                            ).toLocaleString("es-AR")}
                          </p>
                        </div>
                        {history.profit > 0 ? (
                          <TrendingUpIcon className="size-8 min-w-8 text-slate-500/70" />
                        ) : (
                          <TrendingDownIcon className="size-8 min-w-8 text-slate-500/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </>
          )}
        </ul>
      </article>
    </section>
  );
}
