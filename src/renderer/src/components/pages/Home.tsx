import { Progress, Tooltip } from "@heroui/react";
import {
  cn,
  getDaysRemaingStatusSyles,
  getErrorMessage,
  getInstallmentStatusSyles,
  strNormalize,
  TabMovimentsNames,
  tabsMoviments,
} from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";

import { useQuery } from "react-query";
import { useNavigate } from "react-router";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowDownRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CalendarX2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleOffIcon,
  ClipboardListIcon,
  ClockIcon,
  DollarSignIcon,
  HandCoinsIcon,
  InfoIcon,
  PackageIcon,
  SearchIcon,
  SquareArrowOutUpRight,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlert,
} from "lucide-react";
import { getCronistaCurrencies } from "@renderer/hooks/currencies";
import { Button } from "../Button";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  parse,
  startOfDay,
  subDays,
} from "date-fns";
import Chart from "react-apexcharts";
import {
  getOperations,
  getOperationsCount,
  Operation,
} from "@renderer/hooks/operations";
import { es } from "date-fns/locale";
import { TableWork } from "../Table";
import { getLoans, Loan, paymentFrequencies } from "@renderer/hooks/loans";
import { getInstallments, TInstallment } from "@renderer/hooks/installments";
import { getCashboxesActive } from "@renderer/hooks/cashboxes";
import { getMoviments, Moviment } from "@renderer/hooks/moviments";

type DataPoint = {
  count: number;
  date: string;
  profit: number;
};

interface Props {
  data: DataPoint[];
}

const PeaksChart: React.FC<Props> = ({ data }) => {
  const series = [
    {
      name: "Cantidad",
      data: data.map((d) => ({
        x: d.date,
        y: d.count,
        profit: d.profit,
      })),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      height: 256,
      zoom: { enabled: false },
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: 2,
      colors: ["#17C964"],
    },
    markers: {
      size: 4,
      colors: ["#17C964"],
    },
    xaxis: {
      type: "category",
      categories: data.map((d) => d.date),
      labels: {
        style: { colors: "#94a3b8" },
        offsetY: 4,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        style: {
          colors: "#94a3b8",
        },
        offsetX: -6,
      },
    },
    tooltip: {
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const point = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const date = parse(point.x, "dd/MM/yyyy", new Date());
        const cantidad = point.y;
        const profit: number = point.profit.toLocaleString();

        return `
      <div style="padding:4px 7px; border:2px; border-color:#94a3b8; color:#fff; border-radius:6px; display: flex; flex-direction: column; width: 100%">
        <span style="color:rgb(148 163 184 / 0.7); font-weight:400; font-size: 0.7rem"><span style="color:#94a3b8;">${format(date, "d 'de' MMMM", { locale: es })}</span></span>
        <div style="color:rgb(148 163 184 / 0.7); font-weight:400; font-size: 0.7rem; display: flex; align-items: center; justify-content: space-between; min-width: 140px; height: 100%; padding: 2px 0px;">
         <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
            <span style="width: 4px; height: 14px; background-color:#94a3b8; border-radius: 1px; display: inline-block;"></span>
            <span>Cantidad:</span>
          </div>
          <b style="color:#94a3b8; font-weight:500">${cantidad}</b>
        </div>
        
         <div style="color:rgb(148 163 184 / 0.7); font-weight:400; font-size: 0.7rem; display: flex; align-items: center; justify-content: space-between; min-width: 140px; height: 100%; padding: 2px 0px;">
         <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
            <span style="width: 4px; height: 14px; background-color:${profit > 0 ? "#17C964" : profit < 0 ? "#ef4444" : "#94a3b8"}; border-radius: 1px; display: inline-block;"></span>
            <span>Rendimiento:</span>
          </div>
          <b style="color:${profit > 0 ? "#17C964" : profit < 0 ? "#ef4444" : "#94a3b8"};font-weight:500">${profit > 0 ? `+$${profit}` : profit < 0 ? `-$${profit * -1}` : 0}</b>
        </div>
      </div>
    `;
      },
      marker: {
        fillColors: ["#17C964"],
      },
      x: { show: undefined },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      width="100%"
      height="100%"
    />
  );
};

export function Home() {
  const navigate = useNavigate();

  const [from, setFrom] = useState(subDays(new Date(), 7));
  const [to, setTo] = useState(new Date());
  const [tabActive, setTabActive] = useState<TabMovimentsNames>("operations");
  const [search, setSearch] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  const now = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(new Date(), 1));

  const operationsCountQuery = useQuery<
    Awaited<ReturnType<typeof getOperationsCount>>,
    ServerError
  >({
    queryFn: () => getOperationsCount(from, to),
    // queryFn: () => getOperationsCount(new Date("2025-09-06"), to),
    queryKey: ["operations-count", "all", { from, to }],
    enabled: !!from && !!to,
  });

  const cronistaCurrenciesQuery = useQuery<
    Awaited<ReturnType<typeof getCronistaCurrencies>>,
    ServerError
  >({
    queryFn: () => getCronistaCurrencies(),
    queryKey: ["cronista-currencies", "all"],
    staleTime: 3 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });

  const operationsQuery = useQuery<
    Awaited<ReturnType<typeof getOperations>>,
    ServerError
  >({
    // queryFn: () => getOperations(new Date("2025-10-17"), to),
    queryFn: () => getOperations(now, tomorrow),
    queryKey: ["operations", "all"],
    enabled: tabActive === "operations",
  });

  const movimentsQuery = useQuery<
    Awaited<ReturnType<typeof getMoviments>>,
    ServerError
  >({
    queryFn: () => getMoviments(now, tomorrow),
    // queryFn: () => getMoviments(new Date("2025-08-06"), tomorrow),
    queryKey: ["moviments", "all"],
    enabled: tabActive === "moviments",
  });

  const loansQuery = useQuery<
    Awaited<ReturnType<typeof getLoans>>,
    ServerError
  >({
    queryFn: () => getLoans(now, tomorrow),
    // queryFn: () => getLoans(new Date("2025-08-06"), tomorrow),
    queryKey: ["loans", "all"],
    enabled: tabActive === "loans",
  });

  const installmentsQuery = useQuery<
    Awaited<ReturnType<typeof getInstallments>>,
    ServerError
  >({
    // queryFn: () => getInstallments(now, tomorrow),
    queryFn: () => getInstallments(new Date("2025-05-06"), tomorrow),
    queryKey: ["installments", "all"],
    enabled: tabActive === "installments",
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxesActive>>,
    ServerError
  >({
    queryFn: getCashboxesActive,
    queryKey: ["cashboxes-active", "all"],
  });

  const operationsPerWeek = useMemo(() => {
    if (!operationsCountQuery.data || operationsCountQuery.data.length === 0)
      return [];

    return operationsCountQuery.data?.map((operation) => {
      return {
        count: operation.count,
        date: format(operation.date, "dd/MM/yyyy"),
        profit: operation.profit,
      };
    });
  }, [operationsCountQuery.data, from, to]);

  const profitPerWeek = useMemo(() => {
    if (!operationsCountQuery.data || operationsCountQuery.data.length === 0)
      return 0;

    return operationsCountQuery.data.reduce(
      (acc, current) => acc + current.profit,
      0,
    );
  }, [operationsCountQuery.data, from, to]);

  const emptyOpearationsPerWeek = operationsPerWeek.every(
    (operation) => operation.count === 0,
  );

  const COLUMNS_OPERATIONS = useMemo(() => {
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
        render: (item: Operation) => (
          <div className="flex items-center gap-1 text-primary">
            <ArrowUpIcon className="size-4 min-w-4" />
            {item.cashboxIncrement.name}
          </div>
        ),
      },
      {
        label: "Caja salida",
        key: "cashboxDecrement.name",
        render: (item: Operation) => (
          <div className="flex items-center gap-1 font-medium text-danger">
            <ArrowDownIcon className="size-4 min-w-4" />
            {item.cashboxDecrement.name}
          </div>
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
        label: "Cantidad",
        key: "amount",
        render: (item: Operation) => (
          <span
            className={cn(
              item.type === "buys" ? "text-blue-500" : "text-primary",
              "font-mono",
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
          <span className="font-mono font-medium text-slate-500">
            ${item.price.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Precio de mercado",
        key: "marketPrice",
        render: (item: Operation) => (
          <span>${item.marketPrice.toLocaleString("es-AR")}</span>
        ),
      },
      {
        label: "Rendimiento",
        key: "profit",
        render: (item: Operation) =>
          item.profit > 0 ? (
            <div className="flex items-center gap-2 font-mono font-medium">
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
            <div className="flex items-center gap-2 font-mono font-medium">
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

  const COLUMNS_LOANS = useMemo(() => {
    return [
      {
        label: "Fecha generada",
        key: "dateGenerated",
        render: (item: Loan) => format(item.dateGenerated, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Monto",
        key: "principal",
        render: (item: Loan) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-500">
              ${item.principal}
            </span>
            <span className="text-[0.7rem] font-medium text-slate-400">
              Ganancia:{" "}
              <span className="text-primary">+${item.expected_profit}</span>
            </span>
          </div>
        ),
      },
      {
        label: "Cliente",
        key: "client.name",
        render: (item: Loan) => item.client.name,
      },
      {
        label: "Valor por cuota",
        key: "installmentValue",
        render: (item: Loan) => (
          <span className="text-slate-400">${item.installmentValue}</span>
        ),
      },
      {
        label: "Cuotas",
        key: "numberOfInstallments",
        render: (item: Loan) => {
          const currentInstallment =
            Math.floor(item.totalPaid / item.installmentValue) + 1;

          return (
            <div className="flex flex-col">
              <div className="w-fit rounded-lg border border-primary/10 bg-primary/5 px-1.5 py-0.5 text-[0.6rem] text-primary">
                {paymentFrequencies[item.paymentFrequency]}
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  size="sm"
                  aria-label="Loading..."
                  className="max-w-md"
                  value={currentInstallment}
                  maxValue={item.numberOfInstallments}
                />
                {currentInstallment > item.numberOfInstallments
                  ? item.numberOfInstallments
                  : currentInstallment}
                /{item.numberOfInstallments}
              </div>
            </div>
          );
        },
      },
      {
        label: "Total pagado",
        key: "totalPaid",
        render: (item: Loan) => {
          const currentInstallment =
            Math.floor(item.totalPaid / item.installmentValue) + 1;

          const textColorStatus = getInstallmentStatusSyles(
            currentInstallment,
            item.numberOfInstallments,
          );

          if (currentInstallment >= item.numberOfInstallments)
            return (
              <div className="flex items-center gap-1 text-primary">
                <CircleCheckIcon className="size-4 min-w-4" />
                <span>
                  Pagado (${item.installmentValue * item.numberOfInstallments}{" "}
                  de ${item.installmentValue * item.numberOfInstallments})
                </span>
              </div>
            );
          return (
            <>
              <span className={cn(textColorStatus)}> ${item.totalPaid}</span> de{" "}
              <span className={cn(textColorStatus)}>
                {" "}
                ${item.installmentValue * item.numberOfInstallments}
              </span>
            </>
          );
        },
      },

      {
        label: "Fecha de sig. cuota",
        key: "firstDueDate",
        render: (item: Loan) => {
          const remainingDate = differenceInDays(item.firstDueDate, new Date());
          const statusStyles = getDaysRemaingStatusSyles(remainingDate);

          return (
            <div className="flex items-center gap-3 pl-1">
              <Tooltip
                closeDelay={0}
                className={cn(
                  statusStyles.tooltipClass,
                  "rounded-md border-slate-400 text-xs font-light",
                )}
                content={
                  remainingDate > 0
                    ? `Faltan ${Math.abs(remainingDate)} días`
                    : remainingDate < 0
                      ? `La fecha de pago se atrasó ${Math.abs(remainingDate)} días`
                      : "Es hoy"
                }
              >
                <span
                  className={cn(
                    statusStyles.circleClass,
                    "inline-block size-2 rounded-full shadow-[0_0px_6px_1px]",
                  )}
                />
              </Tooltip>
              {format(item.firstDueDate, "dd/MM/yyyy")}
            </div>
          );
        },
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Loan) => (item.seller ? item.seller.name : "-"),
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Loan) =>
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

  const COLUMNS_MOVIMENTS = useMemo(() => {
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

  const COLUMNS_INSTALLMENTS = useMemo(() => {
    return [
      {
        label: "Monto acumulado",
        key: "amount",
        render: (item: TInstallment) => (
          <div
            className={cn(
              item.paymentAmount === item.value
                ? "text-primary"
                : "text-slate-400",
              "flex items-center gap-2",
            )}
          >
            <span>${item.paymentAmount}</span>
            <ChevronRightIcon className="size-4 min-w-4 text-slate-400" />
            <span>${item.value}</span>
          </div>
        ),
      },
      {
        label: "Número de cuota",
        key: "number_of_installments",
        wrapContent: true,
        render: (item: TInstallment) => (
          <ul className="flex w-full flex-wrap items-center gap-0.5 py-1">
            {Array.from({ length: item.number_of_installments }).map(
              (_, index) => (
                <li
                  key={index}
                  className={cn(
                    index + 1 === item.number
                      ? "border-blue-100 bg-blue-100/70 text-blue-300"
                      : index + 1 < item.number
                        ? "border-primary/15 bg-primary/10 text-primary/60"
                        : "border-slate-100 bg-slate-100/70 text-slate-400",
                    "flex size-6 min-w-6 items-center justify-center rounded-md border p-1 text-xs",
                  )}
                >
                  {index + 1 < item.number ? (
                    <CheckIcon className="size-3.5 min-w-3.5" />
                  ) : (
                    index + 1
                  )}
                </li>
              ),
            )}
          </ul>
        ),
      },
      {
        label: "Valor de cuota",
        key: "value",
        render: (item: TInstallment) => `$${item.value}`,
      },
      {
        label: "Estado de cuota",
        key: "paymentAmount",
        render: (item: TInstallment) => (
          <div className="flex items-center gap-2">
            {item.paymentAmount === item.value ? (
              <>
                <CircleCheckBigIcon className="size-4 min-w-4 text-primary" />
                <span className="text-primary">Pagada</span>
              </>
            ) : (
              <>
                <CircleDotIcon className="size-4 min-w-4 text-warning" />
                <span className="text-warning">Pendiente</span>
              </>
            )}
          </div>
        ),
      },
      {
        label: "Tiempo de pago",
        key: "payment_date",
        render: (item: TInstallment) => {
          const remainingDate = differenceInDays(
            item.dueDate,
            item.paymentDate ?? new Date(),
          );

          return (
            <div className="flex items-center gap-2">
              {item.paymentAmount === item.value &&
              remainingDate >= 0 &&
              item.paymentDate ? (
                <>
                  <CalendarCheck2Icon className="size-4 min-w-4 text-primary" />
                  <span className="text-primary">A tiempo</span>
                </>
              ) : item.paymentAmount !== item.value && remainingDate > 0 ? (
                <>
                  <CalendarClockIcon className="size-4 min-w-4 text-warning" />
                  <span className="text-warning">
                    Quedan {remainingDate} días
                  </span>
                </>
              ) : (
                <>
                  <CalendarX2Icon className="size-4 min-w-4 text-danger" />
                  <span className="text-danger">
                    Atrasado {remainingDate * -1} días
                  </span>
                </>
              )}
            </div>
          );
        },
      },
      {
        label: "Cliente",
        key: "clientName",
        render: (item: TInstallment) => item.clientName,
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: TInstallment) => item.sellerName,
      },
    ];
  }, []);

  const filteredOperations = useMemo(() => {
    if (!operationsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return operationsQuery?.data?.operations.filter((operation) => {
      let searched = `${operation.amount}${operation.clientName}${operation.sellerName}${operation.cashboxDecrement.name}${operation.cashboxIncrement.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [operationsQuery.data, search]);

  const filteredLoans = useMemo(() => {
    if (!loansQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return loansQuery?.data?.loans?.filter((loan) => {
      let searched = `${loan.client.name}${loan.principal}${loan.retainedEarnings}${loan.seller?.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [loansQuery.data, search]);

  const filteredMoviments = useMemo(() => {
    if (!movimentsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return movimentsQuery?.data?.filter((moviment) => {
      let searched = `${moviment.amount}${moviment.description}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [movimentsQuery.data, search]);

  const filteredInstallments = useMemo(() => {
    if (!installmentsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return installmentsQuery?.data?.filter((installment) => {
      let searched = `${installment.amount}${installment.currency}${installment.clientName}${installment.sellerName}${installment.number}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [installmentsQuery.data, search]);

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

  const subWeeks = () => {
    setFrom((prev) => subDays(prev, 7));
    setTo((prev) => subDays(prev, 7));
  };

  const addWeeks = () => {
    setFrom((prev) => addDays(prev, 7));
    setTo((prev) => addDays(prev, 7));
  };

  const placeholder = tabsMoviments.find(
    (tab) => tab.name === tabActive,
  )?.label;

  const allLoadingsMovimentsPerDay =
    operationsQuery.isFetching ||
    loansQuery.isFetching ||
    installmentsQuery.isFetching ||
    movimentsQuery.isFetching;

  return (
    <section className="flex h-screen w-full flex-col bg-[#FEFEFE]">
      {/* Slider prices */}
      <div className="relative h-16 w-full bg-[#FAFAFA]">
        <div className="relative z-10 flex h-16 overflow-hidden border-b">
          {/* Loadings */}
          {cronistaCurrenciesQuery?.isLoading ? (
            <ul className="flex w-full items-center justify-between gap-2 px-4 py-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <li
                  className="flex h-10 w-72 animate-pulse items-center justify-center gap-2.5 rounded-md bg-slate-200"
                  key={index}
                />
              ))}
            </ul>
          ) : !cronistaCurrenciesQuery?.isError ? (
            // Loadings
            <ul
              className={cn(
                "hover:pause flex animate-scroll items-center",
                cronistaCurrenciesQuery?.isFetching && "opacity-50",
              )}
            >
              {[
                ...(cronistaCurrenciesQuery?.data ?? []),
                ...(cronistaCurrenciesQuery?.data ?? []),
              ].map((currency, index) => (
                <li
                  key={`${currency?.id}-${index}`}
                  className="relative flex h-full w-80 items-center justify-center gap-2.5 after:absolute after:left-0 after:h-6 after:w-[0.5px] after:bg-slate-300 2xl:w-96"
                >
                  <p className="text-sm font-medium text-slate-500">
                    {currency?.name}
                  </p>
                  <p className="text-sm font-light text-slate-400">
                    ${currency?.buys_value}
                  </p>
                  <ChevronUpIcon className="size-3 min-w-3 text-green-500" />
                  <p className="text-sm font-light text-slate-400">
                    ${currency?.sale_value}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      currency?.variation > 0
                        ? "text-green-500"
                        : currency?.variation === 0
                          ? "text-slate-500/70"
                          : "text-red-500",
                    )}
                  >
                    {currency?.variation}%
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2 text-red-500">
              <CircleAlertIcon className="size-5 min-w-5" />
              <span className="font-medium">
                {getErrorMessage(cronistaCurrenciesQuery.error)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      {/* <div className="flex h-12 w-full items-center justify-end gap-2">
          <div className="flex items-center gap-1">
            <CalendarClockIcon className="justi size-4 min-w-4 text-slate-400/70" />
            <span className="text-sm text-slate-400/70">
              Ultima actualización:{" "}
              <b className="font-medium text-slate-400">
                Hace {lastUpdatedMinutes} minutos
              </b>
            </span>
          </div>

          <Button variant="success" className="size-8 min-w-0">
            <RotateCcwIcon className="size-3.5 min-w-3.5" />
          </Button>
        </div> */}

      <div className="flex h-full max-h-96 min-h-0 w-full gap-4 p-4">
        {/* Graphic cashbox history */}
        <div className="flex h-full max-h-96 w-full flex-col rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-md border border-slate-200 bg-gradient-to-b from-slate-200/60 to-white p-2 shadow">
                <HandCoinsIcon className="size-3.5 min-w-3.5 text-slate-400/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg text-slate-400">
                  Operaciones por dias
                </span>
                {operationsCountQuery.isLoading ? (
                  <div className="h-4 w-16 animate-pulse bg-slate-100" />
                ) : profitPerWeek === 0 ? (
                  <span className="text-xs text-slate-400/70">
                    Sin movimientos en esta semana
                  </span>
                ) : profitPerWeek > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400/50">
                    <TrendingUpIcon className="size-3.5 min-w-3.5 text-primary" />
                    <span className="font-semibold text-primary">
                      +${profitPerWeek.toLocaleString()}
                    </span>
                    esta semana
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400/50">
                    <TrendingDownIcon className="size-3.5 min-w-3.5 text-danger" />
                    <span className="font-semibold text-danger">
                      ${profitPerWeek.toLocaleString()}
                    </span>
                    esta semana
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <Button
                disabled={
                  operationsCountQuery.isLoading || operationsCountQuery.isError
                }
                variant="outline"
                className="flex h-8 max-w-fit items-center gap-1 px-0 shadow-none hover:bg-inherit"
              >
                <Tooltip
                  closeDelay={0}
                  className="rounded-md border-slate-400 text-xs text-slate-400"
                  content="Semana anterior"
                >
                  <div
                    onClick={subWeeks}
                    className="p-2 transition-all hover:bg-black/5"
                  >
                    <ChevronLeftIcon className="size-4 min-w-4" />
                  </div>
                </Tooltip>
                <div className="flex items-center gap-1.5 text-xs">
                  <CalendarDaysIcon className="size-4 min-w-4 pb-0.5" />
                  <div className="flex items-center gap-1 font-medium">
                    <span>{format(from, "dd/MM/yyyy")}</span>|
                    <span>{format(to, "dd/MM/yyyy")}</span>
                  </div>
                </div>
                <Tooltip
                  closeDelay={0}
                  className="rounded-md border-slate-400 text-xs text-slate-400"
                  content="Semana siguiente"
                >
                  <div
                    onClick={addWeeks}
                    className="p-2 transition-all hover:bg-black/5"
                  >
                    <ChevronRightIcon className="size-4 min-w-4" />
                  </div>
                </Tooltip>
              </Button>
            </div>
          </div>

          {operationsCountQuery.isLoading ? (
            <div className="h-full w-full animate-pulse bg-slate-100" />
          ) : operationsCountQuery.isError ? (
            <div className="flex h-full min-h-64 w-full items-center justify-center gap-2 text-danger backdrop-blur-[3px]">
              <CircleAlertIcon className="size-6 min-w-6" />
              <span className="text-lg">
                {operationsCountQuery.error.message}
              </span>
            </div>
          ) : (
            <div className="relative h-full w-full px-3 pb-3 2xl:h-full">
              {emptyOpearationsPerWeek && (
                <div className="absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center gap-2 text-slate-400 backdrop-blur-[3px]">
                  <InfoIcon className="size-6 min-w-6" />
                  <span className="text-lg">
                    No hubo operaciones durante esta semana
                  </span>
                </div>
              )}

              <PeaksChart data={operationsPerWeek} />
            </div>
          )}
        </div>

        {/* Active cashboxes */}
        <div className="flex h-full w-full max-w-sm flex-col gap-4 rounded-md border border-slate-200 py-2 pl-4 2xl:max-w-full">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md border border-slate-200 bg-gradient-to-b from-slate-200/60 to-white p-2 shadow">
              <DollarSignIcon className="size-4 min-w-4 text-slate-400/80" />
            </div>
            <div className="flex w-full flex-col">
              <div className="flex w-full items-center justify-between pr-2">
                <span className="text-lg text-slate-400">Cajas abiertas</span>
                <div
                  onClick={() => navigate(`/boxes`)}
                  className="flex w-fit cursor-pointer items-center gap-1 p-2 text-slate-300 underline underline-offset-2 transition-all hover:text-slate-500"
                >
                  <SquareArrowOutUpRight className="size-3.5 min-w-3.5" />
                  <span className="text-nowrap text-xs">Ver cajas</span>
                </div>
              </div>
              <span className="text-slate-400/70 xl:text-xs">
                Cajas que perteneces a tu organización.
              </span>
            </div>
          </div>

          <div className="h-full w-full overflow-y-auto pr-3">
            {cashboxesQuery.isFetching ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 w-full animate-pulse bg-slate-100"
                  />
                ))}
              </div>
            ) : cashboxesQuery.isError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-danger">
                <AlertCircleIcon className="size-10 min-w-10" />

                <span>{cashboxesQuery.error.message}</span>
              </div>
            ) : cashboxesQuery.data?.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                <InfoIcon className="size-10 min-w-10" />

                <span>No hay cajas abiertas en este momento</span>
              </div>
            ) : (
              <ul className="flex h-auto w-full flex-col gap-4 2xl:grid 2xl:grid-cols-2">
                {cashboxesQuery.data?.map((cashbox) => {
                  const minutes = Math.abs(
                    differenceInMinutes(
                      cashbox.openingDateTime ?? "",
                      new Date(),
                    ),
                  );
                  const hours = Math.abs(
                    differenceInHours(
                      cashbox.openingDateTime ?? "",
                      new Date(),
                    ),
                  );
                  return (
                    <li
                      onClick={() => navigate(`/boxes/${cashbox.id}/history`)}
                      className="flex h-auto w-full cursor-pointer flex-col gap-4 rounded-md border border-b-4 border-r-4 border-slate-200/80 bg-gradient-to-br from-white via-transparent to-slate-200/20 p-3 transition-all hover:border-slate-300"
                      key={cashbox.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <PackageIcon className="size-4 min-w-4" />
                          <span>{cashbox.name}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          {hours < 1 ? (
                            <>
                              <ClockIcon className="size-3 min-w-3 text-success/70" />
                              <span className="text-success/70">
                                Hace {minutes} minuto(s)
                              </span>
                            </>
                          ) : hours <= 24 ? (
                            <>
                              <ClockIcon className="size-3 min-w-3 text-success/70" />
                              <span className="text-success/70">
                                Hace {hours} hora(s)
                              </span>
                            </>
                          ) : (
                            <>
                              <TriangleAlert className="size-3 min-w-3 text-warning/70" />
                              <span className="text-warning/70">
                                Hace más de un día
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400/70">
                        <BanknoteIcon className="size-3.5 min-w-3.5" />
                        <span className="text-xs">
                          {cashbox.currency.name} (
                          {cashbox.currency.nomenclature})
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400/80">
                          Valor actual
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-slate-500">
                            ${cashbox.value.toLocaleString("es-AR")}
                          </span>

                          {cashbox.profit < 0 ? (
                            <div className="flex items-center justify-center rounded-full bg-red-500/10 px-2 py-0.5">
                              <span className="flex items-center gap-0.5 text-[0.65rem] text-red-500">
                                <ArrowDownRightIcon className="size-3 min-w-3" />{" "}
                                {cashbox.profit.toLocaleString("es-AR")}%
                              </span>
                            </div>
                          ) : cashbox.profit === 0 ? (
                            <div className="flex items-center justify-center rounded-full bg-slate-100/60 px-2 py-0.5">
                              <span className="text-[0.65rem] text-slate-400">
                                Sin movimientos
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center rounded-full bg-primary/5 px-2 py-0.5">
                              <span className="flex items-center gap-0.5 text-[0.65rem] text-primary/70">
                                <ArrowUpRightIcon className="size-3 min-w-3" />{" "}
                                +{cashbox.profit.toLocaleString("es-AR")}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex h-full min-h-0 w-full items-center p-4">
        <div className="flex h-full w-full flex-col rounded-md border border-slate-200 bg-white px-3">
          <div className="flex w-full justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-md border border-slate-200 bg-gradient-to-b from-slate-200/60 to-white p-2 shadow">
                <ClipboardListIcon className="size-4 min-w-4 text-slate-400/80" />
              </div>
              <span className="text-lg text-slate-400">
                Movimientos por día
              </span>
            </div>

            <div
              className={cn(
                allLoadingsMovimentsPerDay && "opacity-60",
                "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
              )}
            >
              <SearchIcon className="size-4 min-w-4 text-slate-400" />

              <input
                ref={searchRef}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full w-full text-sm text-slate-500 outline-none"
                type="text"
                disabled={allLoadingsMovimentsPerDay}
                placeholder={`Buscar ${placeholder}...`}
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

          <ul className="mb-4 flex items-center gap-2 border-b">
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
                  <span className="absolute -bottom-px left-0 h-0.5 w-full bg-primary/50" />
                )}
              </li>
            ))}
          </ul>

          {tabActive === "operations" ? (
            <TableWork
              withButtonCreate={false}
              columns={COLUMNS_OPERATIONS}
              error={operationsQuery.error}
              loading={operationsQuery.isFetching}
              searchInput={search}
              data={filteredOperations}
              openModal={() => console.log()}
            />
          ) : tabActive === "moviments" ? (
            <TableWork
              withButtonCreate={false}
              columns={COLUMNS_MOVIMENTS}
              error={movimentsQuery.error}
              loading={movimentsQuery.isFetching}
              searchInput={search}
              data={filteredMoviments}
              openModal={() => console.log()}
            />
          ) : tabActive === "loans" ? (
            <TableWork
              withButtonCreate={false}
              columns={COLUMNS_LOANS}
              error={loansQuery.error}
              loading={loansQuery.isFetching}
              searchInput={search}
              data={filteredLoans}
              openModal={() => console.log()}
            />
          ) : (
            <TableWork
              withButtonCreate={false}
              columns={COLUMNS_INSTALLMENTS}
              error={installmentsQuery.error}
              loading={installmentsQuery.isFetching}
              searchInput={search}
              data={filteredInstallments}
              openModal={() => console.log()}
            />
          )}
        </div>
      </div>
    </section>
  );
}
