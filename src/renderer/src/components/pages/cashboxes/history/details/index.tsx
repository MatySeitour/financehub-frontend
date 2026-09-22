import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";
import { Tooltip } from "@heroui/react";
import { useMemo, useRef, useState } from "react";
import {
  AppWindowIcon,
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  InfoIcon,
  SearchIcon,
  SearchXIcon,
  TableIcon,
  Undo2Icon,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { z } from "zod";
import { getCashbox } from "@renderer/hooks/cashboxes";
import { OperationsHistoryCashbox } from "@renderer/components/cashboxes/histories/operations";
import { LoansHistoryCashbox } from "@renderer/components/cashboxes/histories/loans";
import { InstallmentsHistoryCashbox } from "@renderer/components/cashboxes/histories/installments";
import {
  cn,
  strNormalize,
  TabMovimentsNames,
  tabsMoviments,
} from "@renderer/utils";
import { MovimentsHistoryCashbox } from "@renderer/components/cashboxes/histories/expenses";
import { CommissionsHistoryCashbox } from "@renderer/components/cashboxes/histories/commissions";
import { getSummary } from "@renderer/hooks/summary";
import { format } from "date-fns";
import { ErrorMessage } from "@renderer/components/ErrorMessage";
import { es } from "date-fns/locale";

export function HistorySection() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const openingDateTime = searchParams.get("openingDateTime");
  const closeDateTime = searchParams.get("closeDateTime");

  const isValidCashbox = z.string().catch("").parse(params.id);
  const cashboxID = +isValidCashbox;

  const isValidHistory = z.string().catch("").parse(params.historyID);
  const historyID = +isValidHistory;

  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [tabActive, setTabActive] = useState<TabMovimentsNames>("operations");
  const [isTableShowHistorialType, setIsTableShowHistorialType] =
    useState(false);

  const summaryQuery = useQuery<
    Awaited<ReturnType<typeof getSummary>>,
    ServerError
  >({
    queryKey: ["summary"],
    queryFn: () =>
      getSummary(
        openingDateTime ? new Date(openingDateTime) : new Date(),
        closeDateTime ? new Date(closeDateTime) : new Date(),
      ),
    enabled: !!openingDateTime && !!closeDateTime,
  });
  const cashboxQuery = useQuery<
    Awaited<ReturnType<typeof getCashbox>>,
    ServerError
  >({
    queryKey: ["cashboxes", cashboxID],
    queryFn: () => getCashbox(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID && !!historyID,
  });

  const filteredSummary = useMemo(() => {
    if (summaryQuery.data?.length === 0) return [];

    if (cashboxID !== 0) {
      if (search === "")
        return summaryQuery.data?.filter(
          (summary) => summary.cashboxID === cashboxID,
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
  }, [summaryQuery.data, cashboxID, search]);

  return (
    <section className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4 pr-4">
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

          {cashboxQuery.isLoading ? (
            <span className="size-8 w-44 min-w-8 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <h1 className="text-xl font-semibold text-slate-500">
              Historial #{historyID} de {cashboxQuery.data?.name}
            </h1>
          )}
        </div>

        <div className="flex items-center rounded-md border border-slate-100 text-slate-400">
          <div
            onClick={() => setIsTableShowHistorialType(true)}
            className={cn(
              isTableShowHistorialType
                ? "bg-primary text-white hover:bg-primary/90"
                : "hover:bg-[#FAFAFA]",
              "cursor-pointer rounded-l-md p-2 transition-all",
            )}
          >
            <TableIcon className="size-5 min-w-5" />
          </div>

          <div
            onClick={() => setIsTableShowHistorialType(false)}
            className={cn(
              !isTableShowHistorialType
                ? "bg-primary text-white hover:bg-primary/90"
                : "hover:bg-[#FEFEFE]",
              "cursor-pointer rounded-r-md p-2 transition-all",
            )}
          >
            <AppWindowIcon className="size-5 min-w-5" />
          </div>
        </div>
      </div>

      {isTableShowHistorialType ? (
        <div className="flex h-full min-h-0 w-full flex-col items-center gap-2 p-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex w-full max-w-fit flex-col gap-2">
              {/* Details date and records */}
              {summaryQuery.isFetching || cashboxQuery.isFetching ? (
                <div className="h-6 w-44 translate-x-4 animate-pulse rounded-md bg-slate-200/70" />
              ) : (
                !summaryQuery.isError && (
                  <div className="flex flex-col gap-px pl-4">
                    <span className="text-lg font-semibold tracking-tighter text-slate-500">
                      {format(
                        openingDateTime ?? new Date(),
                        "EEEE, d 'de' MMMM, yyyy. 'Desde las ' HH:mm '",
                        {
                          locale: es,
                        },
                      )}

                      {format(
                        closeDateTime ?? new Date(),
                        "'hasta las 'HH:mm",
                        {
                          locale: es,
                        },
                      )}
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

            {cashboxID !== 0 && (
              <div className="scroll_horizontal flex items-center gap-2 overflow-x-auto pb-1 pr-4 text-sm">
                <div className="flex items-center gap-1 rounded-lg p-2">
                  <span className="flex items-center gap-2 text-nowrap text-slate-400">
                    Saldo inicial:{" "}
                    <b className="font-medium text-primary">
                      {" "}
                      ${cashboxQuery.data?.openingValue.toLocaleString("es")}
                    </b>
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-lg p-2">
                  <span className="flex items-center gap-2 text-nowrap text-slate-400">
                    Saldo actual:{" "}
                    <b className="font-medium text-primary">
                      {" "}
                      ${cashboxQuery.data?.value.toLocaleString("es")}
                    </b>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full items-center gap-2 px-4">
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
            </div>
          </div>

          {/* Moviments list */}
          {summaryQuery.isFetching || cashboxQuery.isFetching ? (
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
          ) : cashboxQuery.isError ? (
            <ErrorMessage error={cashboxQuery.error} />
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
            <div className="h-full min-h-0 w-full px-4 pb-2">
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
                      "justify-staret col-span-4 flex min-h-10 w-full items-center border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
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
                      "col-span-2 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                    )}
                  >
                    Entrada
                  </li>
                  <li
                    className={cn(
                      "col-span-2 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400",
                    )}
                  >
                    Salida
                  </li>
                  {/* <li
                    className={cn(
                      "col-span-3 flex min-h-10 w-full items-center justify-start border-b border-slate-300/70 px-3 py-2 text-xs font-medium italic text-slate-400 xl:pl-10",
                    )}
                  >
                    Caja/Divisa
                  </li> */}
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
                      <div className="relative col-span-4 flex h-full w-full min-w-72 items-center pl-3 text-xs">
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
                      <div className="relative col-span-2 flex h-full w-full min-w-32 items-center pl-3 text-xs">
                        {summary.income ? (
                          <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-primary">
                            <CircleArrowUpIcon className="size-3.5 min-w-3.5" />
                            ${summary.income}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      {/* Exit */}
                      <div className="relative col-span-2 flex h-full w-full min-w-32 items-center pl-3 text-xs">
                        {summary.exit ? (
                          <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-red-500">
                            <CircleArrowDownIcon className="size-3.5 min-w-3.5" />
                            ${summary.exit}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      {/* Cashbox name */}
                      {/* <div className="relative col-span-3 flex h-full w-full min-w-40 items-center pl-10 text-xs">
                        {" "}
                        <strong className="text-xs font-medium text-slate-500">
                          {cashboxQuery.data?.name}
                        </strong>
                      </div> */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col gap-4 overflow-hidden py-2">
          <ul className="flex items-center gap-2 border-b pl-4">
            {tabsMoviments.map((tab) => (
              <li
                onClick={() => setTabActive(tab.name)}
                className={cn(
                  tabActive === tab.name
                    ? "text-primary"
                    : "text-slate-400/70 hover:text-slate-400",
                  "relative flex cursor-pointer items-center gap-1.5 p-2 text-sm transition-all",
                )}
                key={tab.label}
              >
                <tab.icon className="size-3.5 min-w-3.5" />
                {tab.label}

                {tabActive === tab.name && (
                  <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-lg bg-primary/50" />
                )}
              </li>
            ))}
          </ul>

          <div className="flex h-auto min-h-0 flex-col gap-4 px-4">
            {tabActive === "operations" && (
              <OperationsHistoryCashbox
                cashboxID={cashboxID}
                historyID={historyID}
              />
            )}

            {tabActive === "loans" && (
              <LoansHistoryCashbox
                cashboxID={cashboxID}
                historyID={historyID}
              />
            )}

            {tabActive === "moviments" && (
              <MovimentsHistoryCashbox
                cashboxID={cashboxID}
                historyID={historyID}
              />
            )}

            {tabActive === "installments" && (
              <InstallmentsHistoryCashbox
                cashboxID={cashboxID}
                historyID={historyID}
              />
            )}

            {tabActive === "commissions" && (
              <CommissionsHistoryCashbox
                cashboxID={cashboxID}
                historyID={historyID}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
