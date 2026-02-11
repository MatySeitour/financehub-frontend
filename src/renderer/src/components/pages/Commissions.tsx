/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";

import {
  BanknoteArrowUpIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  CoinsIcon,
  HandCoinsIcon,
  LandmarkIcon,
  SearchIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { DataPerPage, TableWork } from "@renderer/components/Table";
import { Commission, getCommissions } from "@renderer/hooks/commissions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectItem } from "@heroui/select";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { PayCommissionModal } from "../modals/commission";

const filters = [
  { label: "Todas", name: "all" },
  { label: "Operaciones", name: "operation" },
  { label: "Préstamos", name: "loan" },
] as const;
type MovimentsType = (typeof filters)[number];

export function CommissionsSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MovimentsType>(filters[0]);
  const [page, _] = useState<number>(1);
  const [from, __] = useState<Date>();
  const [to, ___] = useState<Date>();
  const [limit, ____] = useState<DataPerPage>(20);
  const [commissionToPay, setCommissionToPay] = useState<Commission>();

  const commissionsQuery = useQuery<
    Awaited<ReturnType<typeof getCommissions>>,
    ServerError
  >({
    queryFn: () => getCommissions(from, to, page, limit, selected.name),
    queryKey: ["commissions", "all", selected.name],
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  const allCashboxes = useMemo(() => {
    const cashboxes: Record<number, string> = {};

    cashboxesQuery.data?.forEach((cashbox) => {
      return (cashboxes[cashbox.id] = cashbox.name);
    });
    return cashboxes;
  }, [cashboxesQuery.data]);

  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Vendedor",
        key: "seller.name",
        render: (item: Commission) => item.seller.name,
      },
      {
        label: "Monto",
        key: "commission",
        render: (item: Commission) => (
          <span className="font-medium text-slate-500">
            $ {item.commission.toLocaleString("es")}
          </span>
        ),
      },
      {
        label: "Movimiento",
        key: "movimentType",
        render: (item: Commission) =>
          item.type === "operation" ? (
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
        render: (item: Commission) =>
          format(item.date, "d 'de' MMMM 'del' yyyy", { locale: es }),
      },
      {
        label: "Caja de pago",
        key: "cashboxID",
        render: (item: Commission) =>
          item.state ? (
            <span className="font-semibold">
              {allCashboxes[item.cashboxID]}
            </span>
          ) : (
            "-"
          ),
      },
      {
        label: "Estado",
        key: "state",
        render: (item: Commission) =>
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
  }, [commissionsQuery.data, cashboxesQuery.data]);
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
    if (!commissionsQuery?.data?.moviments) return [];
    if (!search) return commissionsQuery.data.moviments;

    const normalizedFilter = strNormalize(search).toLowerCase();

    return commissionsQuery.data?.moviments.filter((commission) => {
      let searched = `${commission.seller.name}${commission.seller.name}${commission.commission}${format(commission.date, "d 'de' MMMM 'del' yyyy", { locale: es })}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [commissionsQuery.data, search]);

  /* UTILS */
  const options: MenuOption<Commission>[] = [
    {
      name: "Pagar",
      icon: HandCoinsIcon,
      onAction: (item) => setCommissionToPay(item),
      isDisabled: (item) => !item?.state,
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
      <div className="flex h-16 w-full items-center gap-2 border-b border-slate-200 p-4">
        <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
          <CoinsIcon className="size-5 min-w-5" />
        </div>
        <h1 className="text-xl font-semibold text-slate-500">Comisiones</h1>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        <div className="flex items-center gap-2">
          <Select
            isDisabled={
              commissionsQuery.isLoading || commissionsQuery.isFetching
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

          <div
            className={cn(
              commissionsQuery.isFetching && "opacity-60",
              "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
            )}
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />
            <input
              ref={searchRef}
              disabled={commissionsQuery.isFetching}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full text-sm text-slate-500 outline-none"
              type="text"
              placeholder="Buscar..."
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

        {/* TABLE'S CONTAINER */}
        <TableWork
          columns={COLUMNS}
          loading={commissionsQuery.isFetching}
          error={commissionsQuery.error}
          searchInput={search}
          data={filteredCommissions}
          openModal={() => console.log()}
          optionsMenu={options}
        />

        {commissionToPay && cashboxesQuery.data && (
          <PayCommissionModal
            isOpen={!!commissionToPay}
            onClose={() => setCommissionToPay(undefined)}
            commission={commissionToPay}
            cashboxes={cashboxesQuery.data}
          />
        )}
      </div>
    </section>
  );
}
